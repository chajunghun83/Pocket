import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  debtData,
  debtHistory,
  formatCurrency,
  calculateDebtBalance,
} from '../data/dummyData'

function Debt() {
  const currentBalance = calculateDebtBalance()
  const totalBorrowed = debtData.filter(d => d.type === 'borrow').reduce((sum, d) => sum + d.amount, 0)
  const totalRepaid = debtData.filter(d => d.type === 'repay').reduce((sum, d) => sum + d.amount, 0)
  const repaymentRate = (totalRepaid / totalBorrowed) * 100

  const MiniTooltip = ({ active, payload, label }) => {
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
          <div style={{ color: '#94A3B8' }}>{label}</div>
          <div style={{ color: '#F43F5E', fontWeight: '600' }}>{formatCurrency(payload[0].value)}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">부채 관리</h1>
          <p className="page-subtitle">마이너스 통장 내역</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={12} />
          추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card primary">
          <p className="summary-label">현재 잔액</p>
          <p className="summary-value">{formatCurrency(currentBalance)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">총 대출</p>
          <p className="summary-value amount expense">{formatCurrency(totalBorrowed)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">총 상환</p>
          <p className="summary-value amount income">{formatCurrency(totalRepaid)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">상환률</p>
          <p className="summary-value" style={{ color: 'var(--accent)' }}>{repaymentRate.toFixed(1)}%</p>
          <div style={{ marginTop: '6px' }}>
            <div className="progress-bar">
              <div className="progress-fill accent" style={{ width: `${repaymentRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="content-area">
        {/* 차트 + 요약 */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">잔액 추이</h3>
            </div>
            <div className="card-body" style={{ padding: '8px 12px' }}>
              <div className="chart-mini">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={debtHistory}>
                    <defs>
                      <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="balance" stroke="#F43F5E" strokeWidth={1.5} fill="url(#debtGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">요약</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>대출 횟수</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{debtData.filter(d => d.type === 'borrow').length}회</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>상환 횟수</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{debtData.filter(d => d.type === 'repay').length}회</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>월평균 상환</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--income)' }}>{formatCurrency(500000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>예상 완납일</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--accent)' }}>2025년 2월</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 거래 내역 - 나머지 공간 */}
        <div className="card" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">거래 내역</h3>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '15%', textAlign: 'center' }}>날짜</th>
                  <th style={{ width: '15%', textAlign: 'center' }}>구분</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>금액</th>
                  <th style={{ width: '50%', textAlign: 'center' }}>내용</th>
                </tr>
              </thead>
              <tbody>
                {[...debtData].reverse().map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {item.date.slice(2).replace(/-/g, '/')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '3px',
                        color: item.type === 'borrow' ? 'var(--expense)' : 'var(--income)',
                        fontWeight: '500'
                      }}>
                        {item.type === 'borrow' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                        {item.type === 'borrow' ? '대출' : '상환'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`amount ${item.type === 'borrow' ? 'expense' : 'income'}`}>
                        {item.type === 'borrow' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Debt
