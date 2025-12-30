import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Plus, Edit2, BarChart3, Loader2, ChevronUp, ChevronDown, X, Trash2 } from 'lucide-react'
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
  koreanStocks,
  usStocks,
  exchangeRate,
  formatCurrency,
  formatPercent,
  calculateStockProfit,
  calculateTotalStockValue,
  calculateTotalStockInvestment,
} from '../data/dummyData'
import { useSettings } from '../context/SettingsContext'

// 포트폴리오 비중 색상 팔레트
const portfolioColors = [
  '#6366F1', // 인디고
  '#8B5CF6', // 바이올렛
  '#EC4899', // 핑크
  '#F59E0B', // 앰버
  '#10B981', // 에메랄드
  '#3B82F6', // 블루
  '#EF4444', // 레드
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

// 더미 OHLC 차트 데이터 생성 함수
const generateChartData = (stock, days = 30) => {
  const data = []
  const basePrice = stock.avgPrice
  const volatility = stock.market === 'US' ? 0.025 : 0.02
  let closePrice = basePrice * 0.92
  
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // OHLC 데이터 생성
    const change = (Math.random() - 0.48) * volatility * closePrice
    const open = closePrice
    const close = Math.max(closePrice + change, basePrice * 0.7)
    const high = Math.max(open, close) * (1 + Math.random() * 0.015)
    const low = Math.min(open, close) * (1 - Math.random() * 0.015)
    
    // 거래량 (상승일에 더 많은 거래량)
    const baseVolume = Math.floor(Math.random() * 800000) + 200000
    const volume = close > open ? baseVolume * 1.3 : baseVolume
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(volume),
      isUp: close >= open,
    })
    
    closePrice = close
  }
  
  // 마지막 가격을 현재가로 맞춤
  const lastIdx = data.length - 1
  data[lastIdx].close = stock.currentPrice
  data[lastIdx].high = Math.max(data[lastIdx].high, stock.currentPrice)
  data[lastIdx].isUp = data[lastIdx].close >= data[lastIdx].open
  
  // 이동평균선 계산
  for (let i = 0; i < data.length; i++) {
    // 5일 이동평균
    if (i >= 4) {
      const sum5 = data.slice(i - 4, i + 1).reduce((acc, d) => acc + d.close, 0)
      data[i].ma5 = Math.round(sum5 / 5 * 100) / 100
    }
    // 20일 이동평균
    if (i >= 19) {
      const sum20 = data.slice(i - 19, i + 1).reduce((acc, d) => acc + d.close, 0)
      data[i].ma20 = Math.round(sum20 / 20 * 100) / 100
    }
    // 60일 이동평균 (데이터가 충분할 때만)
    if (i >= 59) {
      const sum60 = data.slice(i - 59, i + 1).reduce((acc, d) => acc + d.close, 0)
      data[i].ma60 = Math.round(sum60 / 60 * 100) / 100
    }
    // 120일 이동평균 (데이터가 충분할 때만)
    if (i >= 119) {
      const sum120 = data.slice(i - 119, i + 1).reduce((acc, d) => acc + d.close, 0)
      data[i].ma120 = Math.round(sum120 / 120 * 100) / 100
    }
  }
  
  return data
}


function Stock() {
  const { settings } = useSettings()
  const [activeTab, setActiveTab] = useState(settings.defaultCurrency)
  const [hoveredStock, setHoveredStock] = useState(null)
  const [selectedStock, setSelectedStock] = useState(null)
  const [chartData, setChartData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('1D')
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  
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
    quantity: ''
  })
  
  const allStocks = [...koreanStocks, ...usStocks]
  
  // 종목 추가 팝업 열기
  const openAddModal = () => {
    setEditMode('add')
    setFormData({
      broker: 'namu',
      market: 'KR',
      name: '',
      code: '',
      currency: 'KRW',
      avgPrice: '',
      quantity: ''
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
      quantity: stock.quantity.toString()
    })
    setShowModal(true)
  }
  
  // 종목 삭제
  const handleDelete = () => {
    if (window.confirm(`'${selectedStock.name}' 종목을 삭제하시겠습니까?`)) {
      console.log('삭제:', selectedStock)
      // TODO: Supabase에서 삭제
      alert('삭제되었습니다. (현재는 더미 데이터라 실제 삭제는 안 됩니다)')
      setSelectedStock(null)
    }
  }
  
  // 종목 저장
  const handleSave = () => {
    if (!formData.name || !formData.code || !formData.avgPrice || !formData.quantity) {
      alert('모든 항목을 입력해주세요.')
      return
    }
    
    const stockData = {
      ...formData,
      avgPrice: parseInt(formData.avgPrice),
      quantity: parseInt(formData.quantity),
      currentPrice: parseInt(formData.avgPrice) // 현재가는 임시로 매입가와 동일하게
    }
    
    console.log(editMode === 'add' ? '추가:' : '수정:', stockData)
    // TODO: Supabase에 저장
    alert(`${editMode === 'add' ? '추가' : '수정'}되었습니다. (현재는 더미 데이터라 실제 저장은 안 됩니다)`)
    setShowModal(false)
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
    switch (activeTab) {
      case 'kr': return koreanStocks
      case 'us': return usStocks
      default: return allStocks
    }
  }

  // 정렬된 종목 목록
  const sortedStocks = useMemo(() => {
    const stocks = [...getStocksToShow()]
    
    if (!sortConfig.key) return stocks
    
    return stocks.sort((a, b) => {
      let aValue, bValue
      
      switch (sortConfig.key) {
        case 'broker':
          aValue = a.broker
          bValue = b.broker
          break
        case 'market':
          aValue = a.market
          bValue = b.market
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'avgPrice':
          aValue = a.avgPrice * (a.currency === 'USD' ? exchangeRate.USDKRW : 1)
          bValue = b.avgPrice * (b.currency === 'USD' ? exchangeRate.USDKRW : 1)
          break
        case 'currentPrice':
          aValue = a.currentPrice * (a.currency === 'USD' ? exchangeRate.USDKRW : 1)
          bValue = b.currentPrice * (b.currency === 'USD' ? exchangeRate.USDKRW : 1)
          break
        case 'quantity':
          aValue = a.quantity
          bValue = b.quantity
          break
        case 'profit':
          const profitA = calculateStockProfit(a)
          const profitB = calculateStockProfit(b)
          aValue = profitA.profitRate
          bValue = profitB.profitRate
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [activeTab, sortConfig])

  // 정렬 핸들러
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey
    return (
      <span style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        marginLeft: '4px',
        opacity: isActive ? 1 : 0.3,
        transition: 'opacity 0.15s'
      }}>
        <ChevronUp 
          size={10} 
          style={{ 
            marginBottom: '-3px',
            color: isActive && sortConfig.direction === 'asc' ? 'var(--accent)' : 'inherit'
          }} 
        />
        <ChevronDown 
          size={10} 
          style={{ 
            marginTop: '-3px',
            color: isActive && sortConfig.direction === 'desc' ? 'var(--accent)' : 'inherit'
          }} 
        />
      </span>
    )
  }

  // 선택된 종목이 변경되면 차트 데이터 로드
  useEffect(() => {
    if (selectedStock) {
      setIsLoadingChart(true)
      // 실제 API 호출 시뮬레이션 (0.5초 딜레이)
      const timer = setTimeout(() => {
        // 120일 이동평균을 표시하려면 최소 120일치 데이터 필요
        const days = chartPeriod === '30M' ? 30 : chartPeriod === '1D' ? 60 : chartPeriod === '1W' ? 90 : 150
        const data = generateChartData(selectedStock, days)
        setChartData(data)
        setIsLoadingChart(false)
      }, 300)
      return () => clearTimeout(timer)
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
  const maxVolume = chartData.length > 0 ? Math.max(...chartData.map(d => d.volume || 0)) : 1

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">주식 관리</h1>
          <p className="page-subtitle">보유 주식 현황</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={12} />
          종목 추가
        </button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
        <div className="tabs">
          <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>전체</button>
          <button className={`tab ${activeTab === 'kr' ? 'active' : ''}`} onClick={() => setActiveTab('kr')}>🇰🇷 국내</button>
          <button className={`tab ${activeTab === 'us' ? 'active' : ''}`} onClick={() => setActiveTab('us')}>🇺🇸 미국</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>USD/KRW {exchangeRate.USDKRW.toLocaleString()}원</span>
          <button className="btn btn-secondary btn-icon" style={{ width: '24px', height: '24px' }}>
            <RefreshCw size={10} />
          </button>
        </div>
      </div>

      {/* 포트폴리오 비중 - 단일 바 (테이블 위에 배치) */}
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)', 
        borderRadius: '10px', 
        padding: '12px 16px',
        marginBottom: '12px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>포트폴리오 비중</h3>
          {/* 범례 */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px 12px', 
            justifyContent: 'flex-end'
          }}>
            {allStocks.map((stock, index) => {
              const value = stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
              const percentage = (value / totalValue) * 100
              const color = portfolioColors[index % portfolioColors.length]
              
              return (
                <div 
                  key={stock.id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    fontSize: '0.65rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    opacity: hoveredStock && hoveredStock !== stock.id ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={() => setHoveredStock(stock.id)}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <span 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '2px', 
                      backgroundColor: color,
                      flexShrink: 0
                    }} 
                  />
                  <span>{stock.name}</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* 단일 수평 바 */}
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
          {allStocks.map((stock, index) => {
            const value = stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
            const percentage = (value / totalValue) * 100
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
          })}
        </div>
      </div>

      {/* 콘텐츠 영역 - 종목 목록 + 차트 */}
      <div className="content-area" style={{ flexDirection: 'row', gap: '12px' }}>
        {/* 왼쪽: 종목 목록 */}
        <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => handleSort('broker')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '12%', textAlign: 'center' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      증권사
                      <SortIcon columnKey="broker" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('market')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '8%', textAlign: 'center' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      국가
                      <SortIcon columnKey="market" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('name')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '25%', textAlign: 'center' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      종목
                      <SortIcon columnKey="name" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('avgPrice')} 
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '15%' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      매입가
                      <SortIcon columnKey="avgPrice" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('currentPrice')} 
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '15%' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      현재가
                      <SortIcon columnKey="currentPrice" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('quantity')} 
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '10%' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      수량
                      <SortIcon columnKey="quantity" />
                    </span>
                  </th>
                  <th 
                    onClick={() => handleSort('profit')} 
                    style={{ textAlign: 'right', cursor: 'pointer', userSelect: 'none', width: '15%' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      수익
                      <SortIcon columnKey="profit" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock) => {
                  const { profit, profitRate } = calculateStockProfit(stock)
                  const isSelected = selectedStock?.id === stock.id

                  return (
                    <tr 
                      key={stock.id} 
                      onClick={() => handleStockClick(stock)}
                      style={{ 
                        cursor: 'pointer',
                        background: isSelected ? 'var(--accent-light)' : 'transparent',
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const broker = BROKERS[stock.broker] || BROKERS.namu
                          return (
                            <span 
                              style={{ 
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.65rem', 
                                fontWeight: '600',
                                color: broker.color,
                                background: broker.bgColor,
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                              title={broker.name}
                            >
                              <span>{broker.icon}</span>
                              <span>{broker.name}</span>
                            </span>
                          )
                        })()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: '600',
                          color: stock.market === 'KR' ? '#EF4444' : '#3B82F6',
                          background: stock.market === 'KR' ? '#FEE2E2' : '#DBEAFE',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {stock.market === 'KR' ? 'KR' : 'US'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontWeight: '600', color: isSelected ? 'var(--accent)' : 'inherit' }}>{stock.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stock.code}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(stock.avgPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(stock.currentPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{stock.quantity}</td>
                      <td style={{ textAlign: 'right' }}>
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
              <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem' }}>{selectedStock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                    <h3 className="card-title" style={{ fontSize: '0.95rem' }}>{selectedStock.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedStock.code}</span>
                    {/* 수정/삭제 버튼 */}
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                      <button
                        onClick={() => openEditModal(selectedStock)}
                        style={{
                          background: 'var(--accent)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}
                      >
                        <Edit2 size={10} />
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{
                          background: 'var(--expense)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          color: 'white',
                          fontSize: '0.65rem'
                        }}
                      >
                        <Trash2 size={10} />
                        삭제
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                      {formatCurrency(selectedStock.currentPrice, selectedStock.currency)}
                    </span>
                    {(() => {
                      const { profit, profitRate } = calculateStockProfit(selectedStock)
                      return (
                        <span className={`amount ${profit >= 0 ? 'profit' : 'loss'}`} style={{ fontSize: '0.8rem' }}>
                          {profit >= 0 ? '+' : ''}{formatPercent(profitRate)}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                {/* 기간 선택 탭 */}
                <div className="tabs" style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}>
                  {[
                    { key: '30M', label: '30분' },
                    { key: '1D', label: '1일' },
                    { key: '1W', label: '1주' },
                    { key: '1M', label: '1달' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      className={`tab ${chartPeriod === key ? 'active' : ''}`}
                      onClick={() => setChartPeriod(key)}
                    >
                      {label}
                    </button>
                  ))}
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
                        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                            interval="preserveStartEnd"
                            hide
                          />
                          <YAxis 
                            domain={['auto', 'auto']}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
                            width={45}
                            tickFormatter={(value) => {
                              if (selectedStock.currency === 'USD') {
                                return `$${value.toFixed(0)}`
                              }
                              return value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toFixed(0)
                            }}
                            orientation="right"
                          />
                          <Tooltip content={<CandlestickTooltip />} />
                          
                          {/* 캔들스틱 - Bar를 사용한 간단한 구현 */}
                          <Bar 
                            dataKey="high" 
                            fill="transparent"
                            shape={(props) => {
                              const { x, y, width, height, payload } = props
                              if (!payload.open || !payload.close) return null
                              
                              const isUp = payload.close >= payload.open
                              const color = isUp ? '#3B82F6' : '#EF4444'
                              const candleWidth = Math.max(width * 0.7, 3)
                              const xCenter = x + width / 2
                              
                              // 가격 범위 계산
                              const priceRange = payload.high - payload.low
                              if (priceRange === 0) return null
                              
                              const pixelPerPrice = height / priceRange
                              
                              // 위치 계산
                              const wickTop = y
                              const wickBottom = y + height
                              const bodyTop = y + (payload.high - Math.max(payload.open, payload.close)) * pixelPerPrice
                              const bodyBottom = y + (payload.high - Math.min(payload.open, payload.close)) * pixelPerPrice
                              
                              return (
                                <g>
                                  {/* 꼬리 */}
                                  <line
                                    x1={xCenter}
                                    y1={wickTop}
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
                                    height={Math.max(bodyBottom - bodyTop, 1)}
                                    fill={color}
                                    stroke={color}
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
                        <ComposedChart data={chartData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
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
                            {chartData.map((entry, index) => (
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
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 1001, width: '480px', maxHeight: '90vh', overflow: 'auto',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* 헤더 */}
            <div style={{
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
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 증권사 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  증권사
                </label>
                <select
                  value={formData.broker}
                  onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    fontSize: '0.9rem', color: 'var(--text-primary)'
                  }}
                >
                  <option value="namu">🌳 나무증권</option>
                  <option value="toss">💙 토스</option>
                  <option value="isa">🏦 ISA</option>
                </select>
              </div>

              {/* 국가 */}
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

              {/* 종목명 & 종목코드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

              {/* 매입가 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  매입가 ({formData.market === 'KR' ? '₩ 원화' : '$ 달러'})
                </label>
                <input
                  type="text"
                  placeholder="매입가를 입력하세요"
                  value={formData.avgPrice ? parseInt(formData.avgPrice).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                    setFormData({ ...formData, avgPrice: value })
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    fontSize: '0.9rem', color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* 수량 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  보유수량 (주)
                </label>
                <input
                  type="text"
                  placeholder="보유 수량을 입력하세요"
                  value={formData.quantity ? parseInt(formData.quantity).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                    setFormData({ ...formData, quantity: value })
                  }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-primary)',
                    fontSize: '0.9rem', color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
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
              >
                {editMode === 'add' ? '추가' : '수정'} 완료
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Stock
