import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import {
  currentMonth,
  formatCurrency,
  formatPercent,
  calculateTotalIncome,
  calculateTotalExpense,
  calculateBalance,
  calculateDebtBalance,
  koreanStocks,
  usStocks,
  exchangeRate,
  calculateTotalStockValue,
  calculateTotalStockInvestment,
  monthlyStats,
  fixedExpenseData,
  variableExpenseData,
  debtData,
} from '../data/dummyData'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function Dashboard() {
  const totalIncome = calculateTotalIncome()
  const totalExpense = calculateTotalExpense()
  const balance = calculateBalance()
  const debtBalance = calculateDebtBalance()
  
  const allStocks = [...koreanStocks, ...usStocks]
  const totalStockValue = calculateTotalStockValue(allStocks, exchangeRate.USDKRW)
  const totalStockInvestment = calculateTotalStockInvestment(allStocks, exchangeRate.USDKRW)
  const stockProfit = totalStockValue - totalStockInvestment
  const stockProfitRate = (stockProfit / totalStockInvestment) * 100

  const recentExpenses = [...fixedExpenseData, ...variableExpenseData]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4)

  const recentDebt = [...debtData].reverse().slice(0, 3)

  const MiniTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '0.7rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <span style={{ color: payload[0].color, fontWeight: '600' }}>
            {formatCurrency(payload[0].value)}
          </span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="fade-in page-container">
      <div className="page-header">
        <h1 className="page-title">{currentMonth}</h1>
        <p className="page-subtitle">재무 현황 요약</p>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <p className="summary-label">잔액</p>
          <p className="summary-value">{formatCurrency(balance)}</p>
          <div className={`summary-change ${balance >= 0 ? 'positive' : 'negative'}`}>
            {balance >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{balance >= 0 ? '흑자' : '적자'}</span>
          </div>
        </div>
        <div className="summary-card">
          <p className="summary-label">수입</p>
          <p className="summary-value amount income">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">지출</p>
          <p className="summary-value amount expense">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">부채</p>
          <p className="summary-value amount expense">{formatCurrency(debtBalance)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">주식</p>
          <p className="summary-value">{formatCurrency(totalStockValue)}</p>
          <div className={`summary-change ${stockProfit >= 0 ? 'positive' : 'negative'}`}>
            <span>{formatPercent(stockProfitRate)}</span>
          </div>
        </div>
        <div className="summary-card">
          <p className="summary-label">순자산</p>
          <p className="summary-value amount profit">
            {formatCurrency(balance + totalStockValue - debtBalance)}
          </p>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="content-area">
        {/* 상단: 차트 + 지출 */}
        <div className="grid-2" style={{ flex: 1, minHeight: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">수입/지출 추이</h3>
            </div>
            <div className="card-body" style={{ padding: '8px 12px', flex: 1 }}>
              <div style={{ height: '100%', minHeight: '100px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={1.5} fill="url(#incomeGrad)" />
                    <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={1.5} fill="url(#expenseGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">최근 지출</h3>
              <NavLink to="/budget" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                전체 <ArrowRight size={10} />
              </NavLink>
            </div>
            <div className="card-body" style={{ padding: 0, flex: 1, overflow: 'auto' }}>
              <table className="data-table">
                <tbody>
                  {recentExpenses.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="amount expense">-{formatCurrency(item.amount)}</span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', width: '60px' }}>
                        {item.date.slice(5).replace('-', '/')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 하단: 부채 + 주식 */}
        <div className="grid-2" style={{ flex: 1, minHeight: 0 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">부채 현황</h3>
              <NavLink to="/debt" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                전체 <ArrowRight size={10} />
              </NavLink>
            </div>
            <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>상환률</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent)' }}>87.5%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill accent" style={{ width: '87.5%' }} />
                </div>
              </div>
              <table className="data-table">
                <tbody>
                  {recentDebt.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: item.type === 'borrow' ? 'var(--expense)' : 'var(--income)', fontWeight: '500' }}>
                        {item.type === 'borrow' ? '차입' : '상환'}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.description}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`amount ${item.type === 'borrow' ? 'expense' : 'income'}`}>
                          {item.type === 'borrow' ? '+' : '-'}{formatCurrency(item.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <h3 className="card-title">주식 포트폴리오</h3>
              <NavLink to="/stock" className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.7rem' }}>
                전체 <ArrowRight size={10} />
              </NavLink>
            </div>
            <div className="card-body" style={{ padding: 0, flex: 1, overflow: 'auto' }}>
              <table className="data-table">
                <tbody>
                  {allStocks.slice(0, 4).map((stock) => {
                    const profit = (stock.currentPrice - stock.avgPrice) * stock.quantity
                    const profitRate = ((stock.currentPrice - stock.avgPrice) / stock.avgPrice) * 100
                    return (
                      <tr key={stock.id}>
                        <td>
                          <span style={{ marginRight: '6px' }}>{stock.market === 'KR' ? '🇰🇷' : '🇺🇸'}</span>
                          {stock.name}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`amount ${profit >= 0 ? 'profit' : 'loss'}`}>{formatPercent(profitRate)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`amount ${profit >= 0 ? 'profit' : 'loss'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit, stock.currency)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
