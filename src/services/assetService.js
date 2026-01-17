/**
 * 자산관리(Assets) Supabase 서비스
 * - CMA 통장 입출금 관리
 */
import { supabase } from '../lib/supabase'

/**
 * 모든 자산 내역 조회
 * @param {string} yearMonth - 년월 필터 (예: '2025-12')
 */
export const getAssets = async (yearMonth = null) => {
  try {
    let query = supabase
      .from('assets')
      .select('*')
      .order('date', { ascending: true })

    if (yearMonth) {
      const startDate = `${yearMonth}-01`
      const [year, month] = yearMonth.split('-').map(Number)
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`
      
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('자산 내역 조회 실패:', error)
    return { data: null, error }
  }
}

/**
 * 자산 내역 추가
 * @param {Object} asset - 자산 정보
 */
export const addAsset = async (asset) => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .insert([{
        type: asset.type,
        amount: asset.amount,
        date: asset.date,
        description: asset.description || ''
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('자산 내역 추가 실패:', error)
    return { data: null, error }
  }
}

/**
 * 자산 내역 수정
 * @param {string} id - 자산 ID
 * @param {Object} updates - 수정할 정보
 */
export const updateAsset = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .update({
        type: updates.type,
        amount: updates.amount,
        date: updates.date,
        description: updates.description
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('자산 내역 수정 실패:', error)
    return { data: null, error }
  }
}

/**
 * 자산 내역 삭제
 * @param {string} id - 자산 ID
 */
export const deleteAsset = async (id) => {
  try {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('자산 내역 삭제 실패:', error)
    return { error }
  }
}

/**
 * 자산 잔액 계산
 */
export const calculateBalance = async () => {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('type, amount')

    if (error) throw error

    const balance = data.reduce((sum, item) => {
      return item.type === 'deposit' 
        ? sum + Number(item.amount) 
        : sum - Number(item.amount)
    }, 0)

    return { balance, error: null }
  } catch (error) {
    console.error('잔액 계산 실패:', error)
    return { balance: 0, error }
  }
}

/**
 * 초기 데이터 마이그레이션 (더미 데이터 → Supabase)
 * @param {Array} assetData - 자산 데이터
 */
export const migrateAssets = async (assetData) => {
  try {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('assets')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('이미 자산 데이터가 존재합니다. 마이그레이션을 건너뜁니다.')
      return { success: false, message: '이미 데이터가 존재합니다.' }
    }

    // 데이터 변환
    const items = assetData.map(item => ({
      type: item.type,
      amount: item.amount,
      date: item.date,
      description: item.description || ''
    }))

    const { error } = await supabase
      .from('assets')
      .insert(items)

    if (error) throw error
    
    console.log(`자산 마이그레이션 완료: ${items.length}건`)
    return { success: true, count: items.length }
  } catch (error) {
    console.error('자산 마이그레이션 실패:', error)
    return { success: false, error }
  }
}






