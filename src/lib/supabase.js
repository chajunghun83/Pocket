/**
 * Supabase 클라이언트 설정
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('transactions').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // 테이블이 없는 경우 제외
      console.error('Supabase 연결 테스트 실패:', error)
      return false
    }
    console.log('Supabase 연결 성공!')
    return true
  } catch (err) {
    console.error('Supabase 연결 오류:', err)
    return false
  }
}




