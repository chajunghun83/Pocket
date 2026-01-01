// Vercel Function: 야후 파이낸스 API 프록시
// CORS 문제를 해결하기 위한 서버리스 함수

export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Content-Type', 'application/json')

  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // 쿼리 파라미터에서 심볼 및 옵션 가져오기
    const { symbol, type, interval, range } = req.query

    if (!symbol && type !== 'exchange') {
      return res.status(400).json({ error: 'Symbol is required' })
    }

    let url
    if (type === 'exchange') {
      // 환율 조회
      url = `https://query1.finance.yahoo.com/v8/finance/chart/USDKRW=X?interval=1d&range=1d`
    } else {
      // 주식 가격 또는 차트 데이터 조회
      const chartInterval = interval || '1d'
      const chartRange = range || '1d'
      url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${chartInterval}&range=${chartRange}`
    }

    console.log('Fetching URL:', url)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.log('Yahoo API error:', response.status, response.statusText)
      return res.status(response.status).json({ error: `Yahoo API error: ${response.status}` })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Yahoo Finance API error:', error)
    return res.status(500).json({ error: error.message })
  }
}

