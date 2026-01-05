/**
 * 주식관리(Stocks) Supabase 서비스
 * - 보유 주식 정보 관리
 */
import { supabase } from '../lib/supabase'

/**
 * 모든 주식 조회
 * @param {string} market - 시장 필터 ('KR' | 'US' | null)
 * @param {string} broker - 증권사 필터 ('namu' | 'toss' | 'isa' | null)
 */
export const getStocks = async (market = null, broker = null) => {
  try {
    let query = supabase
      .from('stocks')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (market) {
      query = query.eq('market', market)
    }

    if (broker) {
      query = query.eq('broker', broker)
    }

    const { data, error } = await query

    if (error) throw error
    
    // 데이터 변환 (DB 컬럼명 → 프론트엔드 형식)
    const stocks = data.map(item => ({
      id: item.id,
      market: item.market,
      broker: item.broker,
      name: item.name,
      code: item.code,
      quantity: Number(item.quantity),
      avgPrice: Number(item.avg_price),
      currentPrice: Number(item.avg_price), // 현재가는 나중에 Yahoo Finance에서 갱신
      currency: item.currency,
      memo: item.memo || '',
      sortOrder: item.sort_order ?? 999 // 정렬 순서
    }))
    
    return { data: stocks, error: null }
  } catch (error) {
    console.error('주식 조회 실패:', error)
    return { data: null, error }
  }
}

/**
 * 한국 주식 조회
 */
export const getKoreanStocks = async () => {
  return getStocks('KR')
}

/**
 * 미국 주식 조회
 */
export const getUSStocks = async () => {
  return getStocks('US')
}

/**
 * 주식 추가
 * @param {Object} stock - 주식 정보
 */
export const addStock = async (stock) => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .insert([{
        market: stock.market,
        broker: stock.broker,
        name: stock.name,
        code: stock.code,
        quantity: stock.quantity,
        avg_price: stock.avgPrice,
        currency: stock.currency,
        memo: stock.memo || ''
      }])
      .select()
      .single()

    if (error) throw error
    
    // 데이터 변환
    const result = {
      id: data.id,
      market: data.market,
      broker: data.broker,
      name: data.name,
      code: data.code,
      quantity: Number(data.quantity),
      avgPrice: Number(data.avg_price),
      currentPrice: Number(data.avg_price),
      currency: data.currency,
      memo: data.memo || ''
    }
    
    return { data: result, error: null }
  } catch (error) {
    console.error('주식 추가 실패:', error)
    return { data: null, error }
  }
}

/**
 * 주식 수정
 * @param {string} id - 주식 ID
 * @param {Object} updates - 수정할 정보
 */
export const updateStock = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .update({
        market: updates.market,
        broker: updates.broker,
        name: updates.name,
        code: updates.code,
        quantity: updates.quantity,
        avg_price: updates.avgPrice,
        currency: updates.currency,
        memo: updates.memo
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    // 데이터 변환
    const result = {
      id: data.id,
      market: data.market,
      broker: data.broker,
      name: data.name,
      code: data.code,
      quantity: Number(data.quantity),
      avgPrice: Number(data.avg_price),
      currentPrice: Number(data.avg_price),
      currency: data.currency,
      memo: data.memo || ''
    }
    
    return { data: result, error: null }
  } catch (error) {
    console.error('주식 수정 실패:', error)
    return { data: null, error }
  }
}

/**
 * 주식 삭제
 * @param {string} id - 주식 ID
 */
export const deleteStock = async (id) => {
  try {
    const { error } = await supabase
      .from('stocks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('주식 삭제 실패:', error)
    return { error }
  }
}

/**
 * 주식 순서 일괄 업데이트
 * @param {Array} stockOrders - [{ id, sort_order }, ...]
 */
export const updateStockOrders = async (stockOrders) => {
  try {
    // 각 주식의 sort_order를 업데이트
    const updates = stockOrders.map(({ id, sort_order }) => 
      supabase
        .from('stocks')
        .update({ sort_order })
        .eq('id', id)
    )
    
    await Promise.all(updates)
    return { error: null }
  } catch (error) {
    console.error('주식 순서 업데이트 실패:', error)
    return { error }
  }
}

/**
 * 초기 데이터 마이그레이션 (더미 데이터 → Supabase)
 * @param {Array} koreanStocks - 한국 주식 데이터
 * @param {Array} usStocks - 미국 주식 데이터
 */
export const migrateStocks = async (koreanStocks, usStocks) => {
  try {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('stocks')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('이미 주식 데이터가 존재합니다. 마이그레이션을 건너뜁니다.')
      return { success: false, message: '이미 데이터가 존재합니다.' }
    }

    // 데이터 변환
    const krItems = koreanStocks.map(item => ({
      market: 'KR',
      broker: item.broker,
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      avg_price: item.avgPrice,
      currency: 'KRW',
      memo: item.memo || ''
    }))

    const usItems = usStocks.map(item => ({
      market: 'US',
      broker: item.broker,
      name: item.name,
      code: item.code,
      quantity: item.quantity,
      avg_price: item.avgPrice,
      currency: 'USD',
      memo: item.memo || ''
    }))

    const allItems = [...krItems, ...usItems]

    const { error } = await supabase
      .from('stocks')
      .insert(allItems)

    if (error) throw error
    
    console.log(`주식 마이그레이션 완료: ${allItems.length}건`)
    return { success: true, count: allItems.length }
  } catch (error) {
    console.error('주식 마이그레이션 실패:', error)
    return { success: false, error }
  }
}





