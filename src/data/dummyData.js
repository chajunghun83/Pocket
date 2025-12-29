// 더미 데이터 - 개발 및 디자인 확인용

export const currentMonth = '2025년 1월'

// 가계부 - 수입
export const incomeData = [
  { id: 1, name: '월급', amount: 4500000, date: '2025-01-25', completed: true },
  { id: 2, name: '부업 수입', amount: 500000, date: '2025-01-15', completed: true },
  { id: 3, name: '이자 수익', amount: 12500, date: '2025-01-20', completed: true },
]

// 가계부 - 고정 지출
export const fixedExpenseData = [
  { id: 1, name: '월세', amount: 800000, date: '2025-01-05', completed: true },
  { id: 2, name: '관리비', amount: 150000, date: '2025-01-10', completed: true },
  { id: 3, name: '통신비 (휴대폰)', amount: 65000, date: '2025-01-08', completed: true },
  { id: 4, name: '인터넷', amount: 35000, date: '2025-01-15', completed: false },
  { id: 5, name: '보험료', amount: 200000, date: '2025-01-20', completed: false },
  { id: 6, name: '넷플릭스', amount: 17000, date: '2025-01-10', completed: true },
  { id: 7, name: '유튜브 프리미엄', amount: 14900, date: '2025-01-12', completed: true },
]

// 가계부 - 변동 지출 (카드)
export const variableExpenseData = [
  { id: 1, name: '신한카드', amount: 523000, date: '2025-01-15', completed: true },
  { id: 2, name: '현대카드', amount: 312000, date: '2025-01-18', completed: false },
  { id: 3, name: '삼성카드', amount: 189000, date: '2025-01-22', completed: false },
]

// 부채 관리 - 마이너스 통장
export const debtData = [
  { id: 1, type: 'borrow', amount: 3000000, date: '2024-06-15', description: '자동차 수리비' },
  { id: 2, type: 'repay', amount: 500000, date: '2024-07-25', description: '7월 상환' },
  { id: 3, type: 'repay', amount: 500000, date: '2024-08-25', description: '8월 상환' },
  { id: 4, type: 'borrow', amount: 1000000, date: '2024-09-10', description: '의료비' },
  { id: 5, type: 'repay', amount: 500000, date: '2024-09-25', description: '9월 상환' },
  { id: 6, type: 'repay', amount: 500000, date: '2024-10-25', description: '10월 상환' },
  { id: 7, type: 'repay', amount: 500000, date: '2024-11-25', description: '11월 상환' },
  { id: 8, type: 'repay', amount: 500000, date: '2024-12-25', description: '12월 상환' },
  { id: 9, type: 'repay', amount: 500000, date: '2025-01-10', description: '1월 상환' },
]

// 주식 - 국장 (한국)
export const koreanStocks = [
  { 
    id: 1, 
    name: '삼성전자', 
    code: '005930', 
    market: 'KR',
    quantity: 50, 
    avgPrice: 72000, 
    currentPrice: 71300,
    currency: 'KRW'
  },
  { 
    id: 2, 
    name: 'NAVER', 
    code: '035420', 
    market: 'KR',
    quantity: 10, 
    avgPrice: 195000, 
    currentPrice: 182500,
    currency: 'KRW'
  },
  { 
    id: 3, 
    name: '카카오', 
    code: '035720', 
    market: 'KR',
    quantity: 30, 
    avgPrice: 52000, 
    currentPrice: 48500,
    currency: 'KRW'
  },
  { 
    id: 4, 
    name: 'SK하이닉스', 
    code: '000660', 
    market: 'KR',
    quantity: 15, 
    avgPrice: 135000, 
    currentPrice: 142000,
    currency: 'KRW'
  },
]

// 주식 - 미장 (미국)
export const usStocks = [
  { 
    id: 5, 
    name: 'Apple', 
    code: 'AAPL', 
    market: 'US',
    quantity: 10, 
    avgPrice: 178.50, 
    currentPrice: 185.92,
    currency: 'USD'
  },
  { 
    id: 6, 
    name: 'Tesla', 
    code: 'TSLA', 
    market: 'US',
    quantity: 5, 
    avgPrice: 265.00, 
    currentPrice: 242.84,
    currency: 'USD'
  },
  { 
    id: 7, 
    name: 'NVIDIA', 
    code: 'NVDA', 
    market: 'US',
    quantity: 3, 
    avgPrice: 450.00, 
    currentPrice: 495.22,
    currency: 'USD'
  },
  { 
    id: 8, 
    name: 'Microsoft', 
    code: 'MSFT', 
    market: 'US',
    quantity: 8, 
    avgPrice: 380.00, 
    currentPrice: 425.18,
    currency: 'USD'
  },
]

// 환율
export const exchangeRate = {
  USDKRW: 1337.50,
  lastUpdated: '2025-01-29 15:30'
}

// 월별 통계 데이터
export const monthlyStats = [
  { month: '8월', income: 4800000, expense: 3200000, balance: 1600000 },
  { month: '9월', income: 5200000, expense: 3800000, balance: 1400000 },
  { month: '10월', income: 4500000, expense: 3100000, balance: 1400000 },
  { month: '11월', income: 5100000, expense: 4200000, balance: 900000 },
  { month: '12월', income: 6500000, expense: 5800000, balance: 700000 },
  { month: '1월', income: 5012500, expense: 2306900, balance: 2705600 },
]

// 부채 잔액 추이
export const debtHistory = [
  { month: '6월', balance: 3000000 },
  { month: '7월', balance: 2500000 },
  { month: '8월', balance: 2000000 },
  { month: '9월', balance: 2500000 },
  { month: '10월', balance: 2000000 },
  { month: '11월', balance: 1500000 },
  { month: '12월', balance: 1000000 },
  { month: '1월', balance: 500000 },
]

// 유틸리티 함수들
export const formatCurrency = (amount, currency = 'KRW') => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatPercent = (value) => {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// 계산 함수들
export const calculateTotalIncome = () => {
  return incomeData.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTotalFixedExpense = () => {
  return fixedExpenseData.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTotalVariableExpense = () => {
  return variableExpenseData.reduce((sum, item) => sum + item.amount, 0)
}

export const calculateTotalExpense = () => {
  return calculateTotalFixedExpense() + calculateTotalVariableExpense()
}

export const calculateBalance = () => {
  return calculateTotalIncome() - calculateTotalExpense()
}

export const calculateDebtBalance = () => {
  return debtData.reduce((balance, item) => {
    return item.type === 'borrow' ? balance + item.amount : balance - item.amount
  }, 0)
}

export const calculateStockProfit = (stock) => {
  const profit = (stock.currentPrice - stock.avgPrice) * stock.quantity
  const profitRate = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100
  return { profit, profitRate }
}

export const calculateTotalStockValue = (stocks, exchangeRate = 1) => {
  return stocks.reduce((total, stock) => {
    const value = stock.currentPrice * stock.quantity
    return total + (stock.currency === 'USD' ? value * exchangeRate : value)
  }, 0)
}

export const calculateTotalStockInvestment = (stocks, exchangeRate = 1) => {
  return stocks.reduce((total, stock) => {
    const value = stock.avgPrice * stock.quantity
    return total + (stock.currency === 'USD' ? value * exchangeRate : value)
  }, 0)
}

