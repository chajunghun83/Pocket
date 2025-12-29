import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Target, X, FileText } from 'lucide-react'
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
import { useSettings } from '../context/SettingsContext'

function Budget() {
  const { settings } = useSettings()
  const [selectedItem, setSelectedItem] = useState(null) // 팝업에 표시할 항목
  const totalIncome = calculateTotalIncome()
  const totalFixed = calculateTotalFixedExpense()
  const totalVariable = calculateTotalVariableExpense()
  const balance = calculateBalance()
  
  // 예산 목표 계산
  const totalExpense = totalFixed + totalVariable
  const budgetGoal = settings.budgetGoal
  const budgetProgress = Math.min((totalExpense / budgetGoal) * 100, 100)
  const budgetRemaining = budgetGoal - totalExpense
  const isOverBudget = totalExpense > budgetGoal

  const fixedCompleted = fixedExpenseData.filter(i => i.completed).length
  const fixedTotal = fixedExpenseData.length
  const variableCompleted = variableExpenseData.filter(i => i.completed).length
  const variableTotal = variableExpenseData.length

  // 날짜 포맷 (MM/DD)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const renderTable = (data, type) => {
    // 날짜 오름차순 정렬 (빠른 날짜가 위로)
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '6%' }}></th>
          <th style={{ width: '14%', textAlign: 'center' }}>{type === 'income' ? '입금일' : '출금일'}</th>
          <th style={{ width: '35%' }}>항목</th>
          <th style={{ width: '28%', textAlign: 'right' }}>금액</th>
          <th style={{ width: '17%', textAlign: 'center' }}>비고</th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((item) => (
          <tr key={item.id}>
            <td>
              <div className={`checkbox ${item.completed ? 'checked' : ''}`}>
                {item.completed && <Check size={9} />}
              </div>
            </td>
            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {formatDate(item.date)}
            </td>
            <td style={{ fontWeight: '500' }}>{item.name}</td>
            <td style={{ textAlign: 'right' }}>
              <span className={`amount ${type}`}>
                {type === 'expense' ? '-' : '+'}{formatCurrency(item.amount)}
              </span>
            </td>
            <td style={{ textAlign: 'center' }}>
              <button
                onClick={() => setSelectedItem({ ...item, type })}
                className="btn btn-secondary"
                style={{ 
                  padding: '2px 8px', 
                  fontSize: '0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <FileText size={10} />
                상세
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}

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
      <div className="summary-cards" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
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
        <div className="summary-card">
          <p className="summary-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Target size={12} />
            예산 목표
          </p>
          <p className="summary-value" style={{ 
            color: isOverBudget ? 'var(--expense)' : 'var(--income)',
            fontSize: '0.9rem'
          }}>
            {isOverBudget ? '초과 ' : '남은 '}{formatCurrency(Math.abs(budgetRemaining))}
          </p>
          <div style={{ marginTop: '6px' }}>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${isOverBudget ? 'expense' : 'accent'}`} 
                style={{ 
                  width: `${budgetProgress}%`,
                  background: isOverBudget ? 'var(--expense)' : 'var(--accent)'
                }} 
              />
            </div>
            <p style={{ 
              fontSize: '0.6rem', 
              color: 'var(--text-muted)', 
              marginTop: '2px',
              textAlign: 'right'
            }}>
              {formatCurrency(totalExpense)} / {formatCurrency(budgetGoal)}
            </p>
          </div>
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
              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--income)' }}>
                수정
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
              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}>
                수정
              </button>
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
              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}>
                수정
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(variableExpenseData, 'expense')}
          </div>
        </div>
      </div>

      {/* 상세 팝업 모달 */}
      {selectedItem && (
        <>
          {/* 오버레이 */}
          <div 
            onClick={() => setSelectedItem(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}
          />
          {/* 모달 */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 1001,
            minWidth: '320px',
            maxWidth: '450px',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: selectedItem.type === 'income' ? 'var(--income-light)' : 'var(--expense-light)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h3 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: selectedItem.type === 'income' ? 'var(--income)' : 'var(--expense)'
                }}>
                  {selectedItem.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {selectedItem.type === 'income' ? '수입' : '지출'} 상세 내역
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text-muted)',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* 요약 정보 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {selectedItem.type === 'income' ? '입금일' : '출금일'}
                </span>
                <span style={{ fontWeight: '500', fontSize: '0.85rem' }}>
                  {formatDate(selectedItem.date)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>금액</span>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  color: selectedItem.type === 'income' ? 'var(--income)' : 'var(--expense)'
                }}>
                  {selectedItem.type === 'income' ? '+' : '-'}{formatCurrency(selectedItem.amount)}
                </span>
              </div>
            </div>
            
            {/* 메모 내용 */}
            <div style={{ padding: '16px 20px' }}>
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                marginBottom: '8px',
                fontWeight: '500'
              }}>
                📝 메모
              </p>
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.85rem',
                lineHeight: '1.6',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedItem.memo || '등록된 메모가 없습니다.'}
              </div>
            </div>
            
            {/* 닫기 버튼 */}
            <div style={{ padding: '12px 20px 20px' }}>
              <button
                onClick={() => setSelectedItem(null)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Budget
