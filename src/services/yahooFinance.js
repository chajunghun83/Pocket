/**
 * 야후 파이낸스 API 서비스
 * - 국장/미장 주식 현재가 조회
 * - 환율 정보 조회
 */

// 야후 파이낸스 API 기본 URL (Vite 프록시를 통해 접근)
const YAHOO_API_BASE = '/api/yahoo'

/**
 * 야후 파이낸스 심볼 변환
 * - 국장: 종목코드.KS (KOSPI) 또는 종목코드.KQ (KOSDAQ)
 * - 미장: 티커 심볼 그대로
 */
export const getYahooSymbol = (stock) => {
  if (stock.market === 'KR') {
    // 한국 주식: ETF는 대부분 KOSPI(.KS)
    // TODO: KOSDAQ 종목은 .KQ 사용 필요
    return `${stock.code}.KS`
  }
  // 미국 주식: 티커 그대로
  return stock.code
}

/**
 * 단일 종목 현재가 조회
 */
export const fetchStockPrice = async (symbol) => {
  try {
    const url = `${YAHOO_API_BASE}/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta
      return {
        symbol,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        regularMarketTime: meta.regularMarketTime,
        success: true
      }
    }
    
    return { symbol, success: false, error: 'No data' }
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return { symbol, success: false, error: error.message }
  }
}

/**
 * 여러 종목 현재가 일괄 조회
 */
export const fetchMultipleStockPrices = async (stocks) => {
  const promises = stocks.map(stock => {
    const symbol = getYahooSymbol(stock)
    return fetchStockPrice(symbol).then(result => ({
      ...result,
      stockId: stock.id,
      originalStock: stock
    }))
  })
  
  const results = await Promise.all(promises)
  return results
}

/**
 * 환율 조회 (USD/KRW)
 */
export const fetchExchangeRate = async () => {
  try {
    const symbol = 'USDKRW=X'
    const url = `${YAHOO_API_BASE}/v8/finance/chart/${symbol}?interval=1d&range=1d`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta
      return {
        rate: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        timestamp: new Date().toISOString(),
        success: true
      }
    }
    
    return { success: false, error: 'No data' }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 모든 주식 데이터 업데이트
 * - 현재가 조회 후 기존 데이터와 병합
 */
export const updateStockPrices = async (koreanStocks, usStocks) => {
  const allStocks = [...koreanStocks, ...usStocks]
  const results = await fetchMultipleStockPrices(allStocks)
  
  // 결과를 stock ID로 매핑
  const priceMap = {}
  results.forEach(result => {
    if (result.success) {
      priceMap[result.stockId] = result.currentPrice
    }
  })
  
  // 기존 데이터에 현재가 업데이트
  const updatedKorean = koreanStocks.map(stock => ({
    ...stock,
    currentPrice: priceMap[stock.id] ?? stock.currentPrice
  }))
  
  const updatedUS = usStocks.map(stock => ({
    ...stock,
    currentPrice: priceMap[stock.id] ?? stock.currentPrice
  }))
  
  return { koreanStocks: updatedKorean, usStocks: updatedUS }
}

/**
 * 차트 기간 설정 매핑
 * - 30M: 30분봉 → 1일 범위, 5분 간격 (약 78개 봉)
 * - 1D: 일봉 → 3개월 범위, 1일 간격 (약 60개 봉)
 * - 1W: 주봉 → 6개월 범위, 1일 간격 (약 120개 봉)
 * - 1M: 월봉 → 2년 범위, 1일 간격 (약 480개 봉)
 */
const CHART_PERIODS = {
  '30M': { interval: '5m', range: '1d' },
  '1D': { interval: '1d', range: '3mo' },
  '1W': { interval: '1d', range: '6mo' },
  '1M': { interval: '1d', range: '2y' }
}

/**
 * 차트 데이터 조회 (OHLCV)
 * @param {Object} stock - 종목 정보
 * @param {string} period - 기간 ('30M', '1D', '1W', '1M')
 */
export const fetchChartData = async (stock, period = '1D') => {
  try {
    const symbol = getYahooSymbol(stock)
    const { interval, range } = CHART_PERIODS[period] || CHART_PERIODS['1D']
    
    const url = `${YAHOO_API_BASE}/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0]
      const timestamps = result.timestamp || []
      const quotes = result.indicators?.quote?.[0] || {}
      
      const { open, high, low, close, volume } = quotes
      
      // 차트 데이터 배열 생성
      const chartData = timestamps.map((timestamp, index) => {
        const date = new Date(timestamp * 1000)
        const dateStr = period === '30M' 
          ? `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
          : `${date.getMonth() + 1}/${date.getDate()}`
        
        const openPrice = open?.[index]
        const closePrice = close?.[index]
        const highPrice = high?.[index]
        const lowPrice = low?.[index]
        const vol = volume?.[index]
        
        // 유효한 데이터만 반환
        if (openPrice == null || closePrice == null) {
          return null
        }
        
        const roundedHigh = Math.round(highPrice * 100) / 100
        const roundedLow = Math.round(lowPrice * 100) / 100
        
        return {
          date: dateStr,
          timestamp,
          open: Math.round(openPrice * 100) / 100,
          high: roundedHigh,
          low: roundedLow,
          close: Math.round(closePrice * 100) / 100,
          candleRange: roundedHigh - roundedLow, // 캔들 높이 (stacked bar용)
          volume: vol || 0,
          isUp: closePrice >= openPrice
        }
      }).filter(item => item !== null)
      
      // 이동평균선 계산
      for (let i = 0; i < chartData.length; i++) {
        // 5일 이동평균
        if (i >= 4) {
          const sum5 = chartData.slice(i - 4, i + 1).reduce((acc, d) => acc + d.close, 0)
          chartData[i].ma5 = Math.round(sum5 / 5 * 100) / 100
        }
        // 20일 이동평균
        if (i >= 19) {
          const sum20 = chartData.slice(i - 19, i + 1).reduce((acc, d) => acc + d.close, 0)
          chartData[i].ma20 = Math.round(sum20 / 20 * 100) / 100
        }
        // 60일 이동평균
        if (i >= 59) {
          const sum60 = chartData.slice(i - 59, i + 1).reduce((acc, d) => acc + d.close, 0)
          chartData[i].ma60 = Math.round(sum60 / 60 * 100) / 100
        }
        // 120일 이동평균
        if (i >= 119) {
          const sum120 = chartData.slice(i - 119, i + 1).reduce((acc, d) => acc + d.close, 0)
          chartData[i].ma120 = Math.round(sum120 / 120 * 100) / 100
        }
      }
      
      return {
        success: true,
        data: chartData,
        symbol,
        period
      }
    }
    
    return { success: false, error: 'No chart data', data: [] }
  } catch (error) {
    console.error(`Error fetching chart for ${stock.name}:`, error)
    return { success: false, error: error.message, data: [] }
  }
}

