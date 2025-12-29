import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

// 기본 설정값
const defaultSettings = {
  darkMode: true, // 다크모드 기본값
  defaultCurrency: 'all', // 'all', 'KR', 'US'
  budgetGoal: 2000000, // 월 예산 목표 (원)
  startPage: '/', // 시작 페이지 ('/', '/budget', '/debt', '/stock', '/settings')
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    // localStorage에서 설정 불러오기
    const saved = localStorage.getItem('pocket-settings')
    return saved ? JSON.parse(saved) : defaultSettings
  })

  // 설정 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('pocket-settings', JSON.stringify(settings))
  }, [settings])

  // 다크모드 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  // 개별 설정 업데이트 함수
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  // 다크모드 토글
  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, toggleDarkMode }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

