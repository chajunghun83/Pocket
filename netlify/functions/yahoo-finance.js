// Netlify Function: 야후 파이낸스 API 프록시
// CORS 문제를 해결하기 위한 서버리스 함수
// Node.js 18+ 에서는 fetch가 기본 제공됨

exports.handler = async function(event, context) {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // 쿼리 파라미터에서 심볼 및 옵션 가져오기
    const { symbol, type, interval, range } = event.queryStringParameters || {}

    if (!symbol && type !== 'exchange') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Symbol is required' })
      }
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
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Yahoo API error: ${response.status}` })
      }
    }

    const data = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Yahoo Finance API error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}
