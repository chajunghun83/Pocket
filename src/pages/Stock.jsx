import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Plus, Edit2, BarChart3, Loader2, X, Trash2, ZoomIn, ZoomOut, Database, GripVertical, Download } from 'lucide-react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  koreanStocks as initialKoreanStocks,
  usStocks as initialUsStocks,
  exchangeRate as initialExchangeRate,
  formatCurrency,
  formatPercent,
  calculateStockProfit,
  calculateTotalStockValue,
  calculateTotalStockInvestment,
} from '../data/dummyData'
import { useSettings } from '../context/SettingsContext'
import { fetchMultipleStockPrices, fetchExchangeRate, fetchChartData } from '../services/yahooFinance'
import {
  getStocks,
  addStock,
  updateStock,
  deleteStock as deleteStockDB,
  migrateStocks,
  updateStockOrders,
} from '../services/stockService'

// 포트폴리오 비중 색상 팔레트
const portfolioColors = [
  '#6366F1', // 인디고
  '#F59E0B', // 앰버 (노란색 계열)
  '#EC4899', // 핑크
  '#10B981', // 에메랄드
  '#EF4444', // 레드
  '#3B82F6', // 블루
  '#8B5CF6', // 바이올렛
  '#14B8A6', // 틸
  '#F97316', // 오렌지
  '#84CC16', // 라임
]

// 이동평균선 색상
const MA_COLORS = {
  ma5: '#10B981',   // 초록 (5일)
  ma20: '#F59E0B',  // 주황 (20일)
  ma60: '#EF4444',  // 빨강 (60일)
  ma120: '#8B5CF6', // 보라 (120일)
}

// 증권사 정보
const BROKERS = {
  namu: {
    name: '나무',
    icon: '🌳',
    color: '#22C55E',
    bgColor: '#DCFCE7',
  },
  toss: {
    name: '토스',
    icon: '💙',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  isa: {
    name: 'ISA',
    icon: '🏦',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
}



function Stock() {
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState('namu') // 증권사별 탭: namu, isa, toss
  const [hoveredStock, setHoveredStock] = useState(null)
  const [selectedStock, setSelectedStock] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('1D')
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1) // 1: 100%, 2: 50%, 3: 25%
  
  // 드래그 앤 드롭 상태
  const [draggedStock, setDraggedStock] = useState(null)
  const [dragOverStock, setDragOverStock] = useState(null)
  
  // 주식 데이터 state (야후 파이낸스에서 현재가 업데이트)
  const [koreanStocks, setKoreanStocks] = useState([])
  const [usStocks, setUsStocks] = useState([])
  const [exchangeRate, setExchangeRate] = useState(initialExchangeRate)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [priceErrors, setPriceErrors] = useState([])
  
  // Supabase 로딩 state
  const [isLoadingStocks, setIsLoadingStocks] = useState(true)
  const [useSupabase, setUseSupabase] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // 마이그레이션 중복 실행 방지
  const isMigratingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  
  // 종목 추가/수정 모달 state
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState('add') // 'add' | 'edit'
  const [formData, setFormData] = useState({
    broker: 'namu',
    market: 'KR',
    name: '',
    code: '',
    currency: 'KRW',
    avgPrice: '',
    quantity: '',
    memo: ''
  })
  
  const allStocks = [...koreanStocks, ...usStocks]
  
  // 현재 탭의 종목들
  const currentTabStocks = useMemo(() => {
    return allStocks.filter(stock => stock.broker === activeTab)
  }, [allStocks, activeTab])
  
  // 포트폴리오 비중순 정렬 (평가금액 기준 내림차순) - 현재 탭 기준
  const stocksByWeight = useMemo(() => {
    return [...currentTabStocks].sort((a, b) => {
      const valueA = a.currentPrice * a.quantity * (a.currency === 'USD' ? exchangeRate.USDKRW : 1)
      const valueB = b.currentPrice * b.quantity * (b.currency === 'USD' ? exchangeRate.USDKRW : 1)
      return valueB - valueA // 내림차순
    })
  }, [currentTabStocks, exchangeRate.USDKRW])
  
  // 현재 탭의 총 평가금액
  const currentTabTotalValue = useMemo(() => {
    return currentTabStocks.reduce((sum, stock) => {
      return sum + stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
    }, 0)
  }, [currentTabStocks, exchangeRate.USDKRW])
  
  // 줌 레벨에 따른 차트 데이터 (최근 N개만 표시)
  const zoomedChartData = useMemo(() => {
    if (!chartData.length) return []
    
    // 줌 레벨별 표시할 데이터 비율
    const zoomRatios = {
      1: 1,      // 100% - 전체
      2: 0.5,    // 50%
      3: 0.25,   // 25%
      4: 0.125   // 12.5%
    }
    
    const ratio = zoomRatios[zoomLevel] || 1
    const visibleCount = Math.max(Math.floor(chartData.length * ratio), 10) // 최소 10개
    
    return chartData.slice(-visibleCount)
  }, [chartData, zoomLevel])
  
  // Supabase에서 주식 목록 로드
  const loadStocksFromDB = useCallback(async () => {
    // 이미 로드 중이면 무시 (React Strict Mode 중복 호출 방지)
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    setIsLoadingStocks(true)
    try {
      const { data, error } = await getStocks()
      
      if (error) {
        console.error('Supabase 로드 실패, 더미 데이터 사용:', error)
        setUseSupabase(false)
        setKoreanStocks([...initialKoreanStocks])
        setUsStocks([...initialUsStocks])
        return
      }
      
      if (!data || data.length === 0) {
        // 마이그레이션 중복 실행 방지
        if (isMigratingRef.current) {
          console.log('마이그레이션이 이미 진행 중입니다.')
          return
        }
        isMigratingRef.current = true
        
        // 데이터가 없으면 마이그레이션 실행
        console.log('주식 데이터가 없습니다. 마이그레이션을 실행합니다...')
        const result = await migrateStocks(initialKoreanStocks, initialUsStocks)
        
        if (result.success) {
          // 마이그레이션 후 다시 로드
          const { data: newData } = await getStocks()
          if (newData) {
            setKoreanStocks(newData.filter(s => s.market === 'KR'))
            setUsStocks(newData.filter(s => s.market === 'US'))
          }
        } else {
          // 마이그레이션 실패 시 더미 데이터 사용
          setUseSupabase(false)
          setKoreanStocks([...initialKoreanStocks])
          setUsStocks([...initialUsStocks])
        }
      } else {
        // 데이터 설정
        setKoreanStocks(data.filter(s => s.market === 'KR'))
        setUsStocks(data.filter(s => s.market === 'US'))
      }
    } catch (err) {
      console.error('주식 데이터 로드 오류:', err)
      setUseSupabase(false)
      setKoreanStocks([...initialKoreanStocks])
      setUsStocks([...initialUsStocks])
    } finally {
      setIsLoadingStocks(false)
    }
  }, [])

  // 야후 파이낸스에서 현재가 조회
  const refreshPrices = useCallback(async () => {
    setIsLoadingPrices(true)
    setPriceErrors([])
    
    try {
      // 모든 주식 현재가 조회
      const allStocksToFetch = [...koreanStocks, ...usStocks]
      if (allStocksToFetch.length === 0) {
        setIsLoadingPrices(false)
        return
      }
      const results = await fetchMultipleStockPrices(allStocksToFetch)
      
      // 성공한 결과로 현재가 업데이트
      const priceMap = {}
      const errors = []
      
      results.forEach(result => {
        if (result.success) {
          priceMap[result.stockId] = result.currentPrice
        } else {
          errors.push(`${result.originalStock?.name || result.symbol}: ${result.error}`)
        }
      })
      
      // 한국 주식 업데이트
      setKoreanStocks(prev => prev.map(stock => ({
        ...stock,
        currentPrice: priceMap[stock.id] ?? stock.currentPrice
      })))
      
      // 미국 주식 업데이트
      setUsStocks(prev => prev.map(stock => ({
        ...stock,
        currentPrice: priceMap[stock.id] ?? stock.currentPrice
      })))
      
      // 환율 조회
      const rateResult = await fetchExchangeRate()
      if (rateResult.success) {
        setExchangeRate({
          USDKRW: rateResult.rate,
          lastUpdated: new Date().toLocaleString('ko-KR')
        })
      }
      
      setLastUpdated(new Date().toLocaleString('ko-KR'))
      if (errors.length > 0) {
        setPriceErrors(errors)
      }
      
    } catch (error) {
      console.error('Error refreshing prices:', error)
      setPriceErrors([`가격 조회 실패: ${error.message}`])
    } finally {
      setIsLoadingPrices(false)
    }
  }, [koreanStocks, usStocks])
  
  // 컴포넌트 마운트 시 Supabase에서 주식 목록 로드
  useEffect(() => {
    loadStocksFromDB()
  }, [loadStocksFromDB])
  
  // 주식 목록 로드 완료 후 현재가 조회
  useEffect(() => {
    if (!isLoadingStocks && (koreanStocks.length > 0 || usStocks.length > 0)) {
      refreshPrices()
    }
  }, [isLoadingStocks])

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showModal])
  
  // MD 파일 다운로드
  const downloadAsMD = () => {
    const brokerNames = {
      namu: '🌳 나무증권',
      isa: '🏦 ISA',
      toss: '💙 토스'
    }
    
    const brokerOrder = ['namu', 'isa', 'toss']
    const today = new Date().toISOString().split('T')[0]
    
    let mdContent = `# 주식 포트폴리오\n\n`
    mdContent += `> 작성일: ${today}\n\n`
    
    brokerOrder.forEach(broker => {
      const stocks = allStocks
        .filter(s => s.broker === broker)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      
      if (stocks.length === 0) return
      
      mdContent += `## ${brokerNames[broker]}\n\n`
      mdContent += `| 종목명 | 매입가 | 수량 | 투자원금 | 현재가 | 등락률 |\n`
      mdContent += `|:------:|:------:|:----:|:--------:|:------:|:------:|\n`
      
      stocks.forEach(stock => {
        const { profitRate } = calculateStockProfit(stock)
        const investmentAmount = stock.avgPrice * stock.quantity
        const flag = stock.market === 'KR' ? '🇰🇷' : '🇺🇸'
        const profitStr = profitRate >= 0 ? `+${profitRate.toFixed(2)}%` : `${profitRate.toFixed(2)}%`
        
        mdContent += `| ${flag} ${stock.name} | ${formatCurrency(stock.avgPrice, stock.currency)} | ${stock.quantity} | ${formatCurrency(investmentAmount, stock.currency)} | ${formatCurrency(stock.currentPrice, stock.currency)} | ${profitStr} |\n`
      })
      
      mdContent += `\n`
    })
    
    // 파일 다운로드
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stock_portfolio_${today}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 종목 추가 팝업 열기
  const openAddModal = () => {
    setEditMode('add')
    setFormData({
      broker: activeTab, // 현재 탭의 증권사
      market: 'KR',
      name: '',
      code: '',
      currency: 'KRW',
      avgPrice: '',
      quantity: '',
      memo: ''
    })
    setShowModal(true)
  }
  
  // 종목 수정 팝업 열기
  const openEditModal = (stock) => {
    setEditMode('edit')
    setFormData({
      broker: stock.broker,
      market: stock.market,
      name: stock.name,
      code: stock.code,
      currency: stock.currency,
      avgPrice: stock.avgPrice.toString(),
      quantity: stock.quantity.toString(),
      memo: stock.memo || ''
    })
    setShowModal(true)
  }
  
  // 종목 삭제
  const handleDelete = async () => {
    if (!window.confirm(`'${selectedStock.name}' 종목을 삭제하시겠습니까?`)) return
    
    try {
      if (useSupabase) {
        const { error } = await deleteStockDB(selectedStock.id)
        if (error) throw error
      }
      
      // 로컬 상태에서 삭제
      if (selectedStock.market === 'KR') {
        setKoreanStocks(prev => prev.filter(s => s.id !== selectedStock.id))
      } else {
        setUsStocks(prev => prev.filter(s => s.id !== selectedStock.id))
      }
      
      setSelectedStock(null)
    } catch (err) {
      console.error('삭제 실패:', err)
      alert('삭제에 실패했습니다.')
    }
  }
  
  // 종목 저장
  const handleSave = async () => {
    if (!formData.name || !formData.code || !formData.avgPrice || !formData.quantity) {
      alert('모든 항목을 입력해주세요.')
      return
    }
    
    setIsSaving(true)
    const avgPrice = parseFloat(formData.avgPrice) || 0
    const quantity = parseFloat(formData.quantity) || 0
    
    try {
      if (editMode === 'add') {
        // 새 종목 추가
        if (useSupabase) {
          const { data, error } = await addStock({
            market: formData.market,
            broker: formData.broker,
            name: formData.name,
            code: formData.code,
            currency: formData.currency,
            avgPrice,
            quantity,
            memo: formData.memo || ''
          })
          
          if (error) throw error
          
          // 로컬 상태에 추가
          if (data.market === 'KR') {
            setKoreanStocks(prev => [...prev, data])
          } else {
            setUsStocks(prev => [...prev, data])
          }
        } else {
          // 더미 데이터 모드
          const newStock = {
            id: Date.now(),
            market: formData.market,
            broker: formData.broker,
            name: formData.name,
            code: formData.code,
            currency: formData.currency,
            avgPrice,
            quantity,
            currentPrice: avgPrice,
            memo: formData.memo || ''
          }
          
          if (newStock.market === 'KR') {
            setKoreanStocks(prev => [...prev, newStock])
          } else {
            setUsStocks(prev => [...prev, newStock])
          }
        }
      } else {
        // 기존 종목 수정
        if (useSupabase) {
          const { data, error } = await updateStock(selectedStock.id, {
            market: formData.market,
            broker: formData.broker,
            name: formData.name,
            code: formData.code,
            currency: formData.currency,
            avgPrice,
            quantity,
            memo: formData.memo || ''
          })
          
          if (error) throw error
          
          // 로컬 상태 업데이트 (시장이 변경될 수 있음)
          const oldMarket = selectedStock.market
          const newMarket = data.market
          
          // 이전 시장에서 제거
          if (oldMarket === 'KR') {
            setKoreanStocks(prev => prev.filter(s => s.id !== selectedStock.id))
          } else {
            setUsStocks(prev => prev.filter(s => s.id !== selectedStock.id))
          }
          
          // 새 시장에 추가
          if (newMarket === 'KR') {
            setKoreanStocks(prev => [...prev, { ...data, currentPrice: selectedStock.currentPrice }])
          } else {
            setUsStocks(prev => [...prev, { ...data, currentPrice: selectedStock.currentPrice }])
          }
          
          setSelectedStock({ ...data, currentPrice: selectedStock.currentPrice })
        } else {
          // 더미 데이터 모드
          const updateFn = (stocks) => stocks.map(s => 
            s.id === selectedStock.id 
              ? { ...s, ...formData, avgPrice, quantity, memo: formData.memo || '', currentPrice: s.currentPrice }
              : s
          )
          
          if (selectedStock.market === 'KR') {
            setKoreanStocks(updateFn)
          } else {
            setUsStocks(updateFn)
          }
        }
      }
      
      setShowModal(false)
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }
  
  const totalValue = calculateTotalStockValue(allStocks, exchangeRate.USDKRW)
  const totalInvestment = calculateTotalStockInvestment(allStocks, exchangeRate.USDKRW)
  const totalProfit = totalValue - totalInvestment
  const totalProfitRate = (totalProfit / totalInvestment) * 100

  const krValue = calculateTotalStockValue(koreanStocks, 1)
  const krProfit = krValue - calculateTotalStockInvestment(koreanStocks, 1)

  const usValue = calculateTotalStockValue(usStocks, 1)
  const usProfit = usValue - calculateTotalStockInvestment(usStocks, 1)

  const getStocksToShow = () => {
    // 증권사별 필터링
    return allStocks.filter(stock => stock.broker === activeTab)
  }

  // 정렬된 종목 목록 (sortOrder 기준)
  const sortedStocks = useMemo(() => {
    const stocks = [...getStocksToShow()]
    return stocks.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
  }, [activeTab, koreanStocks, usStocks])
  
  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e, stock) => {
    setDraggedStock(stock)
    e.dataTransfer.effectAllowed = 'move'
    // 드래그 중인 요소 스타일
    e.currentTarget.style.opacity = '0.5'
  }
  
  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedStock(null)
    setDragOverStock(null)
  }
  
  const handleDragOver = (e, stock) => {
    e.preventDefault()
    if (draggedStock && draggedStock.id !== stock.id) {
      setDragOverStock(stock)
    }
  }
  
  const handleDragLeave = () => {
    setDragOverStock(null)
  }
  
  const handleDrop = async (e, targetStock) => {
    e.preventDefault()
    if (!draggedStock || draggedStock.id === targetStock.id) return
    
    // 새로운 순서 계산
    const currentStocks = [...sortedStocks]
    const draggedIndex = currentStocks.findIndex(s => s.id === draggedStock.id)
    const targetIndex = currentStocks.findIndex(s => s.id === targetStock.id)
    
    // 배열에서 드래그된 항목 제거 후 타겟 위치에 삽입
    currentStocks.splice(draggedIndex, 1)
    currentStocks.splice(targetIndex, 0, draggedStock)
    
    // 새 순서로 업데이트
    const newOrders = currentStocks.map((stock, index) => ({
      id: stock.id,
      sort_order: index
    }))
    
    // 로컬 상태 먼저 업데이트 (즉각적인 UI 반영)
    const updateLocalState = (prev) => {
      return prev.map(stock => {
        const newOrder = newOrders.find(o => o.id === stock.id)
        return newOrder ? { ...stock, sortOrder: newOrder.sort_order } : stock
      })
    }
    
    setKoreanStocks(updateLocalState)
    setUsStocks(updateLocalState)
    
    // DB에 저장
    if (useSupabase) {
      const { error } = await updateStockOrders(newOrders)
      if (error) {
        console.error('순서 저장 실패:', error)
      }
    }
    
    setDraggedStock(null)
    setDragOverStock(null)
  }

  // 선택된 종목이 변경되면 차트 데이터 로드 (야후 파이낸스에서 실제 데이터 조회)
  useEffect(() => {
    if (selectedStock) {
      setIsLoadingChart(true)
      
      const loadChartData = async () => {
        try {
          const result = await fetchChartData(selectedStock, chartPeriod)
          
          if (result.success && result.data.length > 0) {
            setChartData(result.data)
          } else {
            // 실패 시 빈 배열 설정
            console.warn('차트 데이터 조회 실패:', result.error)
            setChartData([])
          }
        } catch (error) {
          console.error('차트 데이터 로드 에러:', error)
          setChartData([])
        } finally {
          setIsLoadingChart(false)
        }
      }
      
      loadChartData()
    }
  }, [selectedStock, chartPeriod])

  // 종목 클릭 핸들러
  const handleStockClick = (stock) => {
    setSelectedStock(stock)
  }

  // 캔들스틱 차트 툴팁
  const CandlestickTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload
      const isUp = data.close >= data.open
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '10px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '0.75rem',
        }}>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--text-primary)' }}>{label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px' }}>
            <span style={{ color: 'var(--text-muted)' }}>시가</span>
            <span style={{ fontWeight: '500' }}>{formatCurrency(data.open, selectedStock?.currency)}</span>
            <span style={{ color: 'var(--text-muted)' }}>고가</span>
            <span style={{ fontWeight: '500', color: '#EF4444' }}>{formatCurrency(data.high, selectedStock?.currency)}</span>
            <span style={{ color: 'var(--text-muted)' }}>저가</span>
            <span style={{ fontWeight: '500', color: '#3B82F6' }}>{formatCurrency(data.low, selectedStock?.currency)}</span>
            <span style={{ color: 'var(--text-muted)' }}>종가</span>
            <span style={{ fontWeight: '600', color: isUp ? '#3B82F6' : '#EF4444' }}>
              {formatCurrency(data.close, selectedStock?.currency)}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>거래량</span>
            <span style={{ fontWeight: '500' }}>{data.volume?.toLocaleString()}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // 최대 거래량 계산
  const maxVolume = zoomedChartData.length > 0 ? Math.max(...zoomedChartData.map(d => d.volume || 0)) : 1

  // 로딩 중 표시
  if (isLoadingStocks) {
    return (
      <div className="fade-in page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>주식 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">주식 관리</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            보유 주식 현황
            {useSupabase ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.65rem', 
                color: 'var(--income)',
                background: 'var(--income-light)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                <Database size={10} />
                DB 연결됨
              </span>
            ) : (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '0.65rem', 
                color: 'var(--text-muted)',
                background: 'var(--bg-secondary)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                로컬 모드
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={12} />
            종목 추가
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={downloadAsMD}
            title="MD 파일로 내려받기"
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <p className="summary-label">총 평가금액</p>
          <p className="summary-value">{formatCurrency(totalValue)}</p>
          <div className={`summary-change ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
            {totalProfit >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{formatPercent(totalProfitRate)}</span>
          </div>
        </div>
        <div className="summary-card">
          <p className="summary-label">투자금액</p>
          <p className="summary-value">{formatCurrency(totalInvestment)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">평가손익</p>
          <p className={`summary-value amount ${totalProfit >= 0 ? 'profit' : 'loss'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
        </div>
        <div className="summary-card">
          <p className="summary-label">🇰🇷 국내</p>
          <p className="summary-value">{formatCurrency(krValue)}</p>
          <div className={`summary-change ${krProfit >= 0 ? 'positive' : 'negative'}`}>
            <span>{krProfit >= 0 ? '+' : ''}{formatCurrency(krProfit)}</span>
          </div>
        </div>
        <div className="summary-card">
          <p className="summary-label">🇺🇸 미국</p>
          <p className="summary-value">{formatCurrency(usValue, 'USD')}</p>
          <div className={`summary-change ${usProfit >= 0 ? 'positive' : 'negative'}`}>
            <span>{usProfit >= 0 ? '+' : ''}{formatCurrency(usProfit, 'USD')}</span>
          </div>
        </div>
      </div>

      {/* 탭 + 환율 */}
      <div className="stock-header">
        <div className="tabs">
          <button className={`tab ${activeTab === 'namu' ? 'active' : ''}`} onClick={() => setActiveTab('namu')}>🌳 나무</button>
          <button className={`tab ${activeTab === 'isa' ? 'active' : ''}`} onClick={() => setActiveTab('isa')}>🏦 ISA</button>
          <button className={`tab ${activeTab === 'toss' ? 'active' : ''}`} onClick={() => setActiveTab('toss')}>💙 토스</button>
        </div>
        <div className="stock-exchange-info">
          <span className="exchange-rate">₩{exchangeRate.USDKRW.toLocaleString()}/USD</span>
          <button 
            onClick={refreshPrices}
            disabled={isLoadingPrices}
            title="현재가 새로고침"
            style={{ 
              width: '28px', 
              height: '28px',
              borderRadius: '6px',
              border: '1px solid var(--accent)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} style={{ 
              animation: isLoadingPrices ? 'spin 1s linear infinite' : 'none' 
            }} />
          </button>
        </div>
      </div>
      
      {/* 에러 메시지 표시 */}
      {priceErrors.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '0.7rem',
          color: '#EF4444'
        }}>
          ⚠️ 일부 종목 가격 조회 실패: {priceErrors.slice(0, 3).join(', ')}
          {priceErrors.length > 3 && ` 외 ${priceErrors.length - 3}건`}
        </div>
      )}

      {/* 포트폴리오 비중 - 단일 바 (테이블 위에 배치) */}
      <div className="portfolio-section">
        <div className="portfolio-header">
          <h3 className="portfolio-title">포트폴리오 비중</h3>
          {/* 범례 (비중 높은 순) - PC에서만 표시 */}
          <div className="portfolio-legend">
            {stocksByWeight.slice(0, 6).map((stock, index) => {
              const value = stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
              const percentage = currentTabTotalValue > 0 ? (value / currentTabTotalValue) * 100 : 0
              const color = portfolioColors[index % portfolioColors.length]
              
              return (
                <div 
                  key={stock.id}
                  className="legend-item"
                  style={{ 
                    opacity: hoveredStock && hoveredStock !== stock.id ? 0.5 : 1,
                  }}
                  onMouseEnter={() => setHoveredStock(stock.id)}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <span 
                    className="legend-color"
                    style={{ backgroundColor: color }} 
                  />
                  <span className="legend-name">{stock.name}</span>
                  <span className="legend-percent">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
            {stocksByWeight.length > 6 && (
              <span className="legend-more">+{stocksByWeight.length - 6}</span>
            )}
          </div>
        </div>
        
        {/* 단일 수평 바 (비중 높은 순) */}
        <div 
          style={{ 
            display: 'flex', 
            height: '24px', 
            borderRadius: '6px', 
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {currentTabTotalValue > 0 ? stocksByWeight.map((stock, index) => {
            const value = stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
            const percentage = (value / currentTabTotalValue) * 100
            const color = portfolioColors[index % portfolioColors.length]
            
            return (
              <div
                key={stock.id}
                style={{
                  width: `${percentage}%`,
                  backgroundColor: color,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s, transform 0.2s',
                  opacity: hoveredStock && hoveredStock !== stock.id ? 0.5 : 1,
                  transform: hoveredStock === stock.id ? 'scaleY(1.15)' : 'scaleY(1)',
                }}
                onMouseEnter={() => setHoveredStock(stock.id)}
                onMouseLeave={() => setHoveredStock(null)}
              >
                {/* 툴팁 */}
                {hoveredStock === stock.id && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '8px',
                      padding: '6px 10px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap',
                      zIndex: 100,
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '2px', 
                          backgroundColor: color,
                          flexShrink: 0
                        }} 
                      />
                      <span style={{ fontWeight: '600' }}>
                        {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'} {stock.name}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: '700', 
                      color: 'var(--accent)',
                      textAlign: 'center'
                    }}>
                      {percentage.toFixed(1)}%
                    </div>
                    {/* 툴팁 화살표 */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-5px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '8px',
                        height: '8px',
                        background: 'var(--bg-card)',
                        borderRight: '1px solid var(--border)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          }) : (
            <div style={{ 
              width: '100%', 
              background: 'var(--bg-secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.75rem'
            }}>
              종목이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 - 종목 목록 + 차트 */}
      <div className="content-area stock-content">
        {/* 종목 목록 */}
        <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            
            {/* 모바일용 카드 리스트 */}
            <div className="stock-card-list">
              {sortedStocks.map((stock) => {
                const { profit, profitRate } = calculateStockProfit(stock)
                const isSelected = selectedStock?.id === stock.id
                const isDragOver = dragOverStock?.id === stock.id
                
                return (
                  <div 
                    key={stock.id}
                    className={`stock-card ${isSelected ? 'selected' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, stock)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, stock)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stock)}
                    onClick={() => handleStockClick(stock)}
                    style={{
                      borderTop: isDragOver ? '2px solid var(--accent)' : 'none',
                      background: isDragOver ? 'var(--accent-light)' : undefined
                    }}
                  >
                    <div className="stock-card-header">
                      <div className="stock-card-info">
                        <GripVertical size={14} style={{ color: 'var(--text-muted)', cursor: 'grab', marginRight: '4px' }} />
                        <span className="stock-card-market" style={{ 
                          color: stock.market === 'KR' ? '#EF4444' : '#3B82F6',
                          background: stock.market === 'KR' ? '#FEE2E2' : '#DBEAFE'
                        }}>
                          {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                        </span>
                        <span className="stock-card-name">{stock.name}</span>
                      </div>
                      <div className={`stock-card-profit ${profit >= 0 ? 'profit' : 'loss'}`}>
                        {formatPercent(profitRate)}
                      </div>
                    </div>
                    <div className="stock-card-body">
                      <div className="stock-card-row">
                        <span className="stock-card-label">현재가</span>
                        <span className="stock-card-value">{formatCurrency(stock.currentPrice, stock.currency)}</span>
                      </div>
                      <div className="stock-card-row">
                        <span className="stock-card-label">평단가</span>
                        <span className="stock-card-value" style={{ color: 'var(--text-muted)' }}>{formatCurrency(stock.avgPrice, stock.currency)}</span>
                      </div>
                      <div className="stock-card-row">
                        <span className="stock-card-label">보유</span>
                        <span className="stock-card-value">{stock.quantity}주</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* PC용 테이블 */}
            <table className="data-table stock-table-pc">
              <thead>
                <tr>
                  <th style={{ width: '30px', textAlign: 'center' }}></th>
                  <th style={{ width: '30%', textAlign: 'center' }}>종목명</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>매입가</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>수량</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>투자원금</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>현재가</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>등락률</th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const { profit, profitRate } = calculateStockProfit(stock)
                  const isSelected = selectedStock?.id === stock.id
                  const isDragOver = dragOverStock?.id === stock.id
                  const investmentAmount = stock.avgPrice * stock.quantity // 투자원금

                  return (
                    <tr 
                      key={stock.id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, stock)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, stock)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, stock)}
                      onClick={() => handleStockClick(stock)}
                      style={{ 
                        cursor: 'pointer',
                        background: isDragOver ? 'var(--accent-light)' : isSelected ? 'var(--accent-light)' : 'transparent',
                        borderTop: isDragOver ? '2px solid var(--accent)' : 'none',
                      }}
                    >
                      <td style={{ textAlign: 'center', cursor: 'grab' }}>
                        <GripVertical size={14} style={{ color: 'var(--text-muted)' }} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ 
                              fontSize: '0.65rem',
                              color: stock.market === 'KR' ? '#EF4444' : '#3B82F6',
                            }}>
                              {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                            </span>
                            <span style={{ fontWeight: '600', color: isSelected ? 'var(--accent)' : 'inherit' }}>{stock.name}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stock.code}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {formatCurrency(stock.avgPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{stock.quantity}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {formatCurrency(investmentAmount, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {formatCurrency(stock.currentPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className={`amount ${profit >= 0 ? 'profit' : 'loss'}`}>
                          {formatPercent(profitRate)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 오른쪽: 차트 영역 */}
        <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {selectedStock ? (
            <>
              {/* 차트 헤더 */}
              <div className="chart-header">
                {/* 종목 정보 */}
                <div className="chart-stock-info">
                  <div className="chart-stock-name">
                    <span className="chart-market-flag">{selectedStock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                    <span className="chart-name">{selectedStock.name}</span>
                    <span className="chart-code">{selectedStock.code}</span>
                  </div>
                  <div className="chart-price-info">
                    <span className="chart-price">
                      {formatCurrency(selectedStock.currentPrice, selectedStock.currency)}
                    </span>
                    {(() => {
                      const { profit, profitRate } = calculateStockProfit(selectedStock)
                      return (
                        <span className={`chart-profit ${profit >= 0 ? 'profit' : 'loss'}`}>
                          {profit >= 0 ? '+' : ''}{formatPercent(profitRate)}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                
                {/* 수정/삭제 버튼 */}
                <div className="chart-actions">
                  <button
                    onClick={() => openEditModal(selectedStock)}
                    className="btn-action btn-edit"
                    title="수정"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="btn-action btn-delete"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              
              {/* 기간 선택 + 줌 */}
              <div className="chart-controls">
                <div className="tabs chart-period-tabs">
                  {[
                    { key: '30M', label: '30분' },
                    { key: '1D', label: '1일' },
                    { key: '1W', label: '1주' },
                    { key: '1M', label: '1달' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`tab ${chartPeriod === key ? 'active' : ''}`}
                      onClick={() => {
                        setChartPeriod(key)
                        setZoomLevel(1)
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="chart-zoom">
                  <span className="zoom-level">{Math.round(100 / zoomLevel)}%</span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(prev + 1, 4))}
                    disabled={zoomLevel >= 4}
                    className="zoom-btn"
                    title="확대"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(prev - 1, 1))}
                    disabled={zoomLevel <= 1}
                    className="zoom-btn"
                    title="축소"
                  >
                    <ZoomOut size={14} />
                  </button>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="card-body" style={{ flex: 1, padding: '8px 12px', minHeight: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isLoadingChart ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: 'var(--text-muted)'
                  }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '8px', fontSize: '0.8rem' }}>차트 데이터 로딩 중...</span>
                  </div>
                ) : zoomedChartData.length === 0 ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    color: 'var(--text-muted)',
                    gap: '8px'
                  }}>
                    <BarChart3 size={32} strokeWidth={1} />
                    <span style={{ fontSize: '0.8rem' }}>차트 데이터를 불러올 수 없습니다</span>
                    <span style={{ fontSize: '0.7rem' }}>야후 파이낸스에서 해당 종목을 지원하지 않을 수 있습니다</span>
                  </div>
                ) : (
                  <>
                    {/* 이동평균선 범례 */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', fontSize: '0.65rem', flexShrink: 0 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', background: MA_COLORS.ma5 }}></span>
                        <span style={{ color: 'var(--text-muted)' }}>5</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', background: MA_COLORS.ma20 }}></span>
                        <span style={{ color: 'var(--text-muted)' }}>20</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', background: MA_COLORS.ma60 }}></span>
                        <span style={{ color: 'var(--text-muted)' }}>60</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '2px', background: MA_COLORS.ma120 }}></span>
                        <span style={{ color: 'var(--text-muted)' }}>120</span>
                      </span>
                    </div>

                    {/* 캔들스틱 차트 */}
                    <div style={{ flex: 3, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={zoomedChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                            interval="preserveStartEnd"
                            hide
                          />
                          <YAxis 
                            domain={[
                              () => {
                                if (!zoomedChartData.length) return 0
                                const minVal = Math.min(...zoomedChartData.filter(d => d.low).map(d => d.low))
                                const maxVal = Math.max(...zoomedChartData.filter(d => d.high).map(d => d.high))
                                const padding = (maxVal - minVal) * 0.05
                                return Math.floor(minVal - padding)
                              },
                              () => {
                                if (!zoomedChartData.length) return 100
                                const minVal = Math.min(...zoomedChartData.filter(d => d.low).map(d => d.low))
                                const maxVal = Math.max(...zoomedChartData.filter(d => d.high).map(d => d.high))
                                const padding = (maxVal - minVal) * 0.05
                                return Math.ceil(maxVal + padding)
                              }
                            ]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                            width={45}
                            tickFormatter={(value) => {
                              if (selectedStock?.currency === 'USD') {
                                return `$${value.toFixed(0)}`
                              }
                              return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0)
                            }}
                            orientation="right"
                          />
                          <Tooltip content={<CandlestickTooltip />} />
                          
                          {/* 캔들스틱 - Stacked Bar 방식으로 정확한 Y축 위치 구현 */}
                          {/* 1. 투명한 베이스 바 (0 ~ low) */}
                          <Bar 
                            dataKey="low" 
                            stackId="candle"
                            fill="transparent"
                          />
                          {/* 2. 캔들 바 (low ~ high) - shape로 캔들 모양 그림 */}
                          <Bar 
                            dataKey="candleRange"
                            stackId="candle"
                            fill="transparent"
                            shape={(props) => {
                              const { x, y, width, height, payload } = props
                              if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) return null
                              if (height <= 0 || isNaN(height)) return null
                              
                              const isUp = payload.close >= payload.open
                              const color = isUp ? '#3B82F6' : '#EF4444'
                              const candleWidth = Math.max(width * 0.7, 4)
                              const xCenter = x + width / 2
                              
                              // 가격 범위 (high - low)
                              const priceRange = payload.high - payload.low
                              if (priceRange === 0) {
                                return (
                                  <line
                                    x1={x}
                                    x2={x + width}
                                    y1={y}
                                    y2={y}
                                    stroke={color}
                                    strokeWidth={2}
                                  />
                                )
                              }
                              
                              // 픽셀당 가격 비율
                              const pixelPerPrice = height / priceRange
                              
                              // 꼬리 위치 (y는 high 위치, y+height는 low 위치)
                              const wickTop = y
                              const wickBottom = y + height
                              
                              // 몸통 위치 계산
                              const bodyTop = y + (payload.high - Math.max(payload.open, payload.close)) * pixelPerPrice
                              const bodyBottom = y + (payload.high - Math.min(payload.open, payload.close)) * pixelPerPrice
                              const bodyHeight = Math.max(bodyBottom - bodyTop, 2)
                              
                              return (
                                <g>
                                  {/* 꼬리 (위) - high부터 몸통 상단까지 */}
                                  <line
                                    x1={xCenter}
                                    y1={wickTop}
                                    x2={xCenter}
                                    y2={bodyTop}
                                    stroke={color}
                                    strokeWidth={1}
                                  />
                                  {/* 꼬리 (아래) - 몸통 하단부터 low까지 */}
                                  <line
                                    x1={xCenter}
                                    y1={bodyBottom}
                                    x2={xCenter}
                                    y2={wickBottom}
                                    stroke={color}
                                    strokeWidth={1}
                                  />
                                  {/* 몸통 */}
                                  <rect
                                    x={xCenter - candleWidth / 2}
                                    y={bodyTop}
                                    width={candleWidth}
                                    height={bodyHeight}
                                    fill={color}
                                    rx={1}
                                  />
                                </g>
                              )
                            }}
                          />
                          
                          {/* 이동평균선 */}
                          <Line 
                            type="monotone" 
                            dataKey="ma5" 
                            stroke={MA_COLORS.ma5} 
                            dot={false} 
                            strokeWidth={1}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma20" 
                            stroke={MA_COLORS.ma20} 
                            dot={false} 
                            strokeWidth={1}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma60" 
                            stroke={MA_COLORS.ma60} 
                            dot={false} 
                            strokeWidth={1}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ma120" 
                            stroke={MA_COLORS.ma120} 
                            dot={false} 
                            strokeWidth={1}
                            connectNulls
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* 거래량 차트 */}
                    <div style={{ flex: 1, minHeight: 0, borderTop: '1px solid var(--border-light)', paddingTop: '4px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={zoomedChartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                            interval="preserveStartEnd"
                          />
                          <YAxis 
                            domain={[0, maxVolume * 1.1]}
                            axisLine={false}
                            tickLine={false}
                            tick={false}
                            width={45}
                            orientation="right"
                          />
                          <Bar dataKey="volume" maxBarSize={8}>
                            {zoomedChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isUp ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)'} 
                              />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>

              {/* 종목 상세 정보 */}
              <div style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>평균단가</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                    {formatCurrency(selectedStock.avgPrice, selectedStock.currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>보유수량</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{selectedStock.quantity}주</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>평가금액</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                    {formatCurrency(selectedStock.currentPrice * selectedStock.quantity, selectedStock.currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '2px' }}>평가손익</div>
                  {(() => {
                    const { profit } = calculateStockProfit(selectedStock)
                    return (
                      <div className={`amount ${profit >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: '0.8rem' }}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit, selectedStock.currency)}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </>
          ) : (
            /* 종목 미선택 시 안내 메시지 */
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              gap: '12px'
            }}>
              <BarChart3 size={48} strokeWidth={1} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>종목을 선택하세요</div>
                <div style={{ fontSize: '0.75rem' }}>왼쪽 목록에서 종목을 클릭하면<br/>차트가 표시됩니다</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 종목 추가/수정 모달 */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, animation: 'fadeIn 0.2s ease'
            }}
          />
          <div className="modal-container">
            {/* 헤더 */}
            <div className="modal-header" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--accent-light)', borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent)' }}>
                  {editMode === 'add' ? '종목 추가' : '종목 수정'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  보유 주식 정보를 입력하세요
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* 폼 내용 */}
            <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 종목명 */}
              <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                    종목명
                  </label>
                  <input
                    type="text"
                    placeholder="예) 삼성전자"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      fontSize: '0.9rem', color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                    종목코드 / 티커
                  </label>
                  <input
                    type="text"
                    placeholder="예) 005930 또는 AAPL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      fontSize: '0.9rem', color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* 국가 선택 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  국가
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="market"
                      value="KR"
                      checked={formData.market === 'KR'}
                      onChange={(e) => setFormData({ ...formData, market: e.target.value, currency: 'KRW' })}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>🇰🇷 국내 (KRW)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="market"
                      value="US"
                      checked={formData.market === 'US'}
                      onChange={(e) => setFormData({ ...formData, market: e.target.value, currency: 'USD' })}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>🇺🇸 미국 (USD)</span>
                  </label>
                </div>
              </div>

              {/* 매입가 & 수량 */}
              <div className="modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                    매입가 ({formData.market === 'KR' ? '₩' : '$'})
                  </label>
                  <input
                    type="text"
                    placeholder="매입가"
                    value={formData.avgPrice ? (
                      formData.market === 'US' 
                        ? formData.avgPrice 
                        : parseInt(formData.avgPrice).toLocaleString()
                    ) : ''}
                    onChange={(e) => {
                      if (formData.market === 'US') {
                        // 미국 주식: 소수점 허용
                        const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        setFormData({ ...formData, avgPrice: value })
                      } else {
                        // 한국 주식: 정수만
                        const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                        setFormData({ ...formData, avgPrice: value })
                      }
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      fontSize: '0.9rem', color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                    수량 (주)
                  </label>
                  <input
                    type="text"
                    placeholder="수량"
                    value={formData.quantity ? (
                      formData.market === 'US'
                        ? formData.quantity
                        : parseInt(formData.quantity).toLocaleString()
                    ) : ''}
                    onChange={(e) => {
                      if (formData.market === 'US') {
                        // 미국 주식: 소수점 허용 (소수점 매매 가능)
                        const value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
                        setFormData({ ...formData, quantity: value })
                      } else {
                        // 한국 주식: 정수만
                        const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                        setFormData({ ...formData, quantity: value })
                      }
                    }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid var(--border)', background: 'var(--bg-primary)',
                      fontSize: '0.9rem', color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* 투자원금 (계산값 표시) */}
              {formData.avgPrice && formData.quantity && (
                <div style={{ 
                  padding: '12px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>투자원금</span>
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {formatCurrency(parseFloat(formData.avgPrice) * parseFloat(formData.quantity), formData.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="modal-footer" style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                닫기
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                ) : `${editMode === 'add' ? '추가' : '수정'} 완료`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Stock
