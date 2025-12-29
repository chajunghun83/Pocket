import { useState } from 'react'
import { RefreshCw, TrendingUp, TrendingDown, Plus, Edit2 } from 'lucide-react'
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

function Stock() {
  const [activeTab, setActiveTab] = useState('all')
  
  const allStocks = [...koreanStocks, ...usStocks]
  
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

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">주식 관리</h1>
          <p className="page-subtitle">보유 주식 현황</p>
        </div>
        <button className="btn btn-primary">
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

      {/* 콘텐츠 영역 */}
      <div className="content-area">
        {/* 주식 목록 */}
        <div className="card" style={{ flex: 2, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>종목</th>
                  <th style={{ textAlign: 'right' }}>수량</th>
                  <th style={{ textAlign: 'right' }}>평균단가</th>
                  <th style={{ textAlign: 'right' }}>현재가</th>
                  <th style={{ textAlign: 'right' }}>평가금액</th>
                  <th style={{ textAlign: 'right' }}>수익</th>
                  <th style={{ width: '36px' }}></th>
                </tr>
              </thead>
              <tbody>
                {getStocksToShow().map((stock) => {
                  const { profit, profitRate } = calculateStockProfit(stock)
                  const currentValue = stock.currentPrice * stock.quantity

                  return (
                    <tr key={stock.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                          <div>
                            <div style={{ fontWeight: '600' }}>{stock.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stock.code}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{stock.quantity}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                        {formatCurrency(stock.avgPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(stock.currentPrice, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>
                        {formatCurrency(currentValue, stock.currency)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className={`amount ${profit >= 0 ? 'profit' : 'loss'}`}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit, stock.currency)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: profit >= 0 ? 'var(--profit)' : 'var(--loss)' }}>
                          {formatPercent(profitRate)}
                        </div>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-icon" style={{ width: '24px', height: '24px' }}>
                          <Edit2 size={10} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 포트폴리오 비중 */}
        <div className="card" style={{ flex: 1, minHeight: 0 }}>
          <div className="card-header">
            <h3 className="card-title">포트폴리오 비중</h3>
          </div>
          <div className="card-body" style={{ overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {allStocks.map((stock) => {
                const value = stock.currentPrice * stock.quantity * (stock.currency === 'USD' ? exchangeRate.USDKRW : 1)
                const percentage = (value / totalValue) * 100
                
                return (
                  <div key={stock.id} style={{ padding: '8px', background: 'var(--bg-hover)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                        {stock.market === 'KR' ? '🇰🇷' : '🇺🇸'} {stock.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent)' }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill accent" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stock
