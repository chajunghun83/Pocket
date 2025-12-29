import { ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react'
import {
  currentMonth,
  incomeData,
  fixedExpenseData,
  variableExpenseData,
  formatCurrency,
  calculateTotalIncome,
  calculateTotalFixedExpense,
  calculateTotalVariableExpense,
  calculateBalance,
} from '../data/dummyData'

function Budget() {
  const totalIncome = calculateTotalIncome()
  const totalFixed = calculateTotalFixedExpense()
  const totalVariable = calculateTotalVariableExpense()
  const balance = calculateBalance()

  const fixedCompleted = fixedExpenseData.filter(i => i.completed).length
  const fixedTotal = fixedExpenseData.length
  const variableCompleted = variableExpenseData.filter(i => i.completed).length
  const variableTotal = variableExpenseData.length

  const renderTable = (data, type) => (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '28px' }}></th>
          <th>항목</th>
          <th style={{ textAlign: 'right' }}>금액</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr key={item.id}>
            <td>
              <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                {item.completed && <Check size={9} />}
              </div>
            </td>
            <td style={{ fontWeight: '500' }}>{item.name}</td>
            <td style={{ textAlign: 'right' }}>
              <span className={`amount ${type}`}>
                {type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">가계부</h1>
          <p className="page-subtitle">수입과 지출 관리</p>
        </div>
        <div className="month-selector">
          <button className="month-btn"><ChevronLeft size={14} /></button>
          <span className="month-display">{currentMonth}</span>
          <button className="month-btn"><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="summary-card primary">
          <p className="summary-label">잔액</p>
          <p className="summary-value">{formatCurrency(balance)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">수입</p>
          <p className="summary-value amount income">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">고정 지출</p>
          <p className="summary-value amount expense">{formatCurrency(totalFixed)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">변동 지출</p>
          <p className="summary-value amount expense">{formatCurrency(totalVariable)}</p>
        </div>
      </div>

      {/* 3열 그리드: 수입 / 고정지출 / 변동지출 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px', 
        flex: 1, 
        minHeight: 0 
      }}>
        {/* 수입 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--income-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--income)' }}>
              💰 수입
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--income)' }}>
                {formatCurrency(totalIncome)}
              </span>
              <button className="btn btn-primary" style={{ padding: '4px 8px', background: 'var(--income)' }}>
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(incomeData, 'income')}
          </div>
        </div>

        {/* 고정 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              📌 고정 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fixedCompleted}/{fixedTotal}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {formatCurrency(totalFixed)}
              </span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(fixedExpenseData, 'expense')}
          </div>
        </div>

        {/* 변동 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              💳 변동 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{variableCompleted}/{variableTotal}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {formatCurrency(totalVariable)}
              </span>
              <button className="btn btn-primary" style={{ padding: '4px 8px', background: 'var(--expense)' }}>
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(variableExpenseData, 'expense')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Budget
