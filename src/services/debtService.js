/**
 * 부채관리(Debts) Supabase 서비스
 * - 마이너스 통장 대출/상환 관리
 */
import { supabase } from '../lib/supabase'

/**
 * 모든 부채 내역 조회
 * @param {string} yearMonth - 년월 필터 (예: '2025-12')
 */
export const getDebts = async (yearMonth = null) => {
  try {
    let query = supabase
      .from('debts')
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
    console.error('부채 내역 조회 실패:', error)
    return { data: null, error }
  }
}

/**
 * 부채 내역 추가
 * @param {Object} debt - 부채 정보
 */
export const addDebt = async (debt) => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .insert([{
        type: debt.type,
        amount: debt.amount,
        date: debt.date,
        description: debt.description || ''
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('부채 내역 추가 실패:', error)
    return { data: null, error }
  }
}

/**
 * 부채 내역 수정
 * @param {string} id - 부채 ID
 * @param {Object} updates - 수정할 정보
 */
export const updateDebt = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('debts')
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
    console.error('부채 내역 수정 실패:', error)
    return { data: null, error }
  }
}

/**
 * 부채 내역 삭제
 * @param {string} id - 부채 ID
 */
export const deleteDebt = async (id) => {
  try {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('부채 내역 삭제 실패:', error)
    return { error }
  }
}

/**
 * 부채 잔액 계산
 */
export const calculateBalance = async () => {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('type, amount')

    if (error) throw error

    const balance = data.reduce((sum, item) => {
      return item.type === 'borrow' 
        ? sum + Number(item.amount) 
        : sum - Number(item.amount)
    }, 0)

    return { balance, error: null }
  } catch (error) {
    console.error('부채 잔액 계산 실패:', error)
    return { balance: 0, error }
  }
}

/**
 * 초기 데이터 마이그레이션 (더미 데이터 → Supabase)
 * @param {Array} debtData - 부채 데이터
 */
export const migrateDebts = async (debtData) => {
  try {
    // 기존 데이터 확인
    const { data: existing } = await supabase
      .from('debts')
      .select('id')
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('이미 부채 데이터가 존재합니다. 마이그레이션을 건너뜁니다.')
      return { success: false, message: '이미 데이터가 존재합니다.' }
    }

    // 데이터 변환
    const items = debtData.map(item => ({
      type: item.type,
      amount: item.amount,
      date: item.date,
      description: item.description || ''
    }))

    const { error } = await supabase
      .from('debts')
      .insert(items)

    if (error) throw error
    
    console.log(`부채 마이그레이션 완료: ${items.length}건`)
    return { success: true, count: items.length }
  } catch (error) {
    console.error('부채 마이그레이션 실패:', error)
    return { success: false, error }
  }
}





