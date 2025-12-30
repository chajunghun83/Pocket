import { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, Target, X, FileText, Plus, Trash2, Edit3 } from 'lucide-react'
import {
  incomeData,
  fixedExpenseData,
  variableExpenseData,
  formatCurrency,
} from '../data/dummyData'
import { useSettings } from '../context/SettingsContext'

function Budget() {
  const { settings } = useSettings()
  const [selectedItem, setSelectedItem] = useState(null) // 상세 팝업에 표시할 항목
  
  // 수정 팝업 state
  const [editModal, setEditModal] = useState(null) // 'income' | 'fixed' | 'variable' | null
  const [editMode, setEditMode] = useState('list') // 'list' | 'add' | 'edit'
  const [editingItem, setEditingItem] = useState(null) // 수정 중인 항목
  const [editList, setEditList] = useState([]) // 수정 중인 목록
  
  // 새 항목 폼 state
  const [newItem, setNewItem] = useState({
    day: '',
    name: '',
    amount: '',
    memo: ''
  })
  
  // 월 선택 state (기본: 2025년 12월)
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonthNum, setCurrentMonthNum] = useState(12)
  
  // 현재 선택된 월 문자열
  const currentMonthStr = `${currentYear}년 ${currentMonthNum}월`
  
  // 데이터가 있는 월인지 확인 (2025년 12월만 데이터 있음)
  const hasData = currentYear === 2025 && currentMonthNum === 12
  
  // 월 이동 함수
  const goToPrevMonth = () => {
    if (currentMonthNum === 1) {
      setCurrentYear(currentYear - 1)
      setCurrentMonthNum(12)
    } else {
      setCurrentMonthNum(currentMonthNum - 1)
    }
  }
  
  const goToNextMonth = () => {
    if (currentMonthNum === 12) {
      setCurrentYear(currentYear + 1)
      setCurrentMonthNum(1)
    } else {
      setCurrentMonthNum(currentMonthNum + 1)
    }
  }
  
  // 데이터 계산 (데이터가 있는 달만)
  const totalIncome = hasData ? incomeData.reduce((sum, item) => sum + item.amount, 0) : 0
  const totalFixed = fixedExpenseData.reduce((sum, item) => sum + item.amount, 0)
  const totalVariable = hasData ? variableExpenseData.reduce((sum, item) => sum + item.amount, 0) : 0
  const balance = totalIncome - totalFixed - totalVariable

  // 수정 모달 열기
  const openEditModal = (type) => {
    let data = []
    if (type === 'income') data = [...incomeData]
    else if (type === 'fixed') data = [...fixedExpenseData]
    else if (type === 'variable') data = [...variableExpenseData]
    
    setEditList(data)
    setEditModal(type)
    setEditMode('list')
    setEditingItem(null)
    setNewItem({ date: '', name: '', amount: '', memo: '' })
  }

  // 수정 모달 닫기
  const closeEditModal = () => {
    setEditModal(null)
    setEditMode('list')
    setEditingItem(null)
    setNewItem({ date: '', name: '', amount: '', memo: '' })
  }

  // 항목 추가 화면으로 전환
  const goToAddMode = () => {
    setEditMode('add')
    setNewItem({ 
      day: '1', 
      name: '', 
      amount: '', 
      memo: '' 
    })
  }

  // 항목 수정 화면으로 전환
  const goToEditMode = (item) => {
    setEditMode('edit')
    setEditingItem(item)
    const day = item.date.split('-')[2] // YYYY-MM-DD에서 DD 추출
    setNewItem({
      day: parseInt(day).toString(), // 앞자리 0 제거
      name: item.name,
      amount: item.amount.toString(),
      memo: item.memo || ''
    })
  }

  // 목록으로 돌아가기
  const goBackToList = () => {
    setEditMode('list')
    setEditingItem(null)
    setNewItem({ day: '', name: '', amount: '', memo: '' })
  }

  // 새 항목 저장
  const saveNewItem = () => {
    if (!newItem.name || !newItem.day) return
    
    const newId = Math.max(...editList.map(i => i.id), 0) + 1
    const fullDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(newItem.day).padStart(2, '0')}`
    const itemToAdd = {
      id: newId,
      name: newItem.name,
      amount: parseInt(newItem.amount) || 0,
      date: fullDate,
      completed: false,
      memo: newItem.memo
    }
    setEditList([...editList, itemToAdd])
    goBackToList()
  }

  // 항목 수정 저장
  const saveEditItem = () => {
    if (!editingItem || !newItem.name || !newItem.day) return
    
    const fullDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(newItem.day).padStart(2, '0')}`
    const updatedList = editList.map(item => 
      item.id === editingItem.id 
        ? { ...item, name: newItem.name, amount: parseInt(newItem.amount) || 0, date: fullDate, memo: newItem.memo }
        : item
    )
    setEditList(updatedList)
    goBackToList()
  }

  // 항목 삭제
  const deleteItem = (id) => {
    setEditList(editList.filter(item => item.id !== id))
  }

  // 전체 저장 (실제로는 서버에 저장해야 함)
  const saveAllChanges = () => {
    console.log('저장할 데이터:', editList)
    // TODO: Supabase에 저장
    alert('저장되었습니다. (현재는 더미 데이터라 실제 저장은 안 됩니다)')
    closeEditModal()
  }

  // 모달 타이틀 가져오기
  const getModalTitle = () => {
    if (editModal === 'income') return '수입'
    if (editModal === 'fixed') return '고정 지출'
    if (editModal === 'variable') return '변동 지출'
    return ''
  }

  // 날짜 라벨 가져오기
  const getDateLabel = () => {
    return editModal === 'income' ? '입금일' : '출금일'
  }
  
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

  // 다음 달 날짜 포맷 (선택된 월 기준)
  const formatFutureDate = (day) => {
    return `${currentMonthNum}/${day}`
  }

  // 수입 테이블 (다음 달: 입금일, 항목 계승 / 금액 비움 / 비고 초기화)
  const renderIncomeTable = () => {
    const sortedData = [...incomeData].sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2])
      const dayB = parseInt(b.date.split('-')[2])
      return dayA - dayB
    })
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '6%' }}></th>
            <th style={{ width: '14%', textAlign: 'center' }}>입금일</th>
            <th style={{ width: '35%' }}>항목</th>
            <th style={{ width: '28%', textAlign: 'right' }}>금액</th>
            <th style={{ width: '17%', textAlign: 'center' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const day = parseInt(item.date.split('-')[2])
            const isCompleted = hasData && item.completed
            return (
              <tr key={item.id}>
                <td>
                  <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
                    {isCompleted && <Check size={9} />}
                  </div>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {hasData ? formatDate(item.date) : formatFutureDate(day)}
                </td>
                <td style={{ fontWeight: '500' }}>{item.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {hasData ? (
                    <span className="amount income">+{formatCurrency(item.amount)}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedItem({ 
                      ...item, 
                      type: 'income',
                      memo: hasData ? item.memo : '' // 다음 달은 비고 초기화
                    })}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <FileText size={10} />
                    상세
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // 고정 지출 테이블 (다음 달: 출금일, 항목, 금액, 비고 모두 계승 / 체크박스만 해제)
  const renderFixedExpenseTable = () => {
    const sortedData = [...fixedExpenseData].sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2])
      const dayB = parseInt(b.date.split('-')[2])
      return dayA - dayB
    })
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '6%' }}></th>
            <th style={{ width: '14%', textAlign: 'center' }}>출금일</th>
            <th style={{ width: '35%' }}>항목</th>
            <th style={{ width: '28%', textAlign: 'right' }}>금액</th>
            <th style={{ width: '17%', textAlign: 'center' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const day = parseInt(item.date.split('-')[2])
            const isCompleted = hasData && item.completed
            return (
              <tr key={item.id}>
                <td>
                  <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
                    {isCompleted && <Check size={9} />}
                  </div>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {hasData ? formatDate(item.date) : formatFutureDate(day)}
                </td>
                <td style={{ fontWeight: '500' }}>{item.name}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="amount expense">-{formatCurrency(item.amount)}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedItem({ ...item, type: 'expense' })}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <FileText size={10} />
                    상세
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // 변동 지출 테이블 (다음 달: 출금일, 항목 계승 / 금액 비움 / 비고 초기화)
  const renderVariableExpenseTable = () => {
    const sortedData = [...variableExpenseData].sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2])
      const dayB = parseInt(b.date.split('-')[2])
      return dayA - dayB
    })
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '6%' }}></th>
            <th style={{ width: '14%', textAlign: 'center' }}>출금일</th>
            <th style={{ width: '35%' }}>항목</th>
            <th style={{ width: '28%', textAlign: 'right' }}>금액</th>
            <th style={{ width: '17%', textAlign: 'center' }}>비고</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => {
            const day = parseInt(item.date.split('-')[2])
            const isCompleted = hasData && item.completed
            return (
              <tr key={item.id}>
                <td>
                  <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
                    {isCompleted && <Check size={9} />}
                  </div>
                </td>
                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {hasData ? formatDate(item.date) : formatFutureDate(day)}
                </td>
                <td style={{ fontWeight: '500' }}>{item.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {hasData ? (
                    <span className="amount expense">-{formatCurrency(item.amount)}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedItem({ 
                      ...item, 
                      type: 'expense',
                      memo: hasData ? item.memo : '' // 다음 달은 비고 초기화
                    })}
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <FileText size={10} />
                    상세
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">가계부</h1>
          <p className="page-subtitle">수입과 지출 관리</p>
        </div>
        <div className="month-selector">
          <button className="month-btn" onClick={goToPrevMonth}><ChevronLeft size={14} /></button>
          <span className="month-display">{currentMonthStr}</span>
          <button className="month-btn" onClick={goToNextMonth}><ChevronRight size={14} /></button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards" style={{ gridTemplateColumns: settings.useBudgetGoal ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
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
        {settings.useBudgetGoal && (
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
        )}
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
                {hasData ? formatCurrency(totalIncome) : '-'}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--income)' }}
                onClick={() => openEditModal('income')}
              >
                추가/수정
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderIncomeTable()}
          </div>
        </div>

        {/* 고정 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              📌 고정 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hasData && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fixedCompleted}/{fixedTotal}</span>}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {formatCurrency(totalFixed)}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}
                onClick={() => openEditModal('fixed')}
              >
                추가/수정
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderFixedExpenseTable()}
          </div>
        </div>

        {/* 변동 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              💳 변동 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {hasData && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{variableCompleted}/{variableTotal}</span>}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {hasData ? formatCurrency(totalVariable) : '-'}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}
                onClick={() => openEditModal('variable')}
              >
                추가/수정
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderVariableExpenseTable()}
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

      {/* 수정 팝업 모달 */}
      {editModal && (
        <>
          {/* 오버레이 */}
          <div 
            onClick={closeEditModal}
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
            width: '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: editModal === 'income' ? 'var(--income-light)' : 'var(--expense-light)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editMode !== 'list' && (
                  <button
                    onClick={goBackToList}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: editModal === 'income' ? 'var(--income)' : 'var(--expense)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: editModal === 'income' ? 'var(--income)' : 'var(--expense)'
                  }}>
                    {getModalTitle()} {editMode === 'list' ? '관리' : editMode === 'add' ? '추가' : '수정'}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {editMode === 'list' ? '항목을 추가, 수정, 삭제할 수 있습니다' : '정보를 입력하세요'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
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
            
            {/* 컨텐츠 영역 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {editMode === 'list' ? (
                /* 목록 화면 */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editList.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                      등록된 항목이 없습니다.
                    </p>
                  ) : (
                    editList.map((item) => (
                      <div 
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              color: 'var(--text-muted)',
                              minWidth: '45px'
                            }}>
                              {item.date.slice(5).replace('-', '/')}
                            </span>
                            <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{item.name}</span>
                          </div>
                          <div style={{ marginTop: '4px', paddingLeft: '57px' }}>
                            <span style={{ 
                              fontWeight: '600', 
                              color: editModal === 'income' ? 'var(--income)' : 'var(--expense)',
                              fontSize: '0.85rem'
                            }}>
                              {editModal === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => goToEditMode(item)}
                            style={{
                              background: 'var(--accent)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          >
                            <Edit3 size={12} />
                            수정
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            style={{
                              background: 'var(--expense)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'white',
                              fontSize: '0.7rem'
                            }}
                          >
                            <Trash2 size={12} />
                            삭제
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* 추가/수정 폼 화면 */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* 날짜 입력 (월/일) */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.8rem', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: 'var(--text-primary)'
                    }}>
                      {getDateLabel()}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {currentMonthNum}월
                      </span>
                      <select
                        value={newItem.day}
                        onChange={(e) => setNewItem({ ...newItem, day: e.target.value })}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          minWidth: '80px'
                        }}
                      >
                        <option value="">일 선택</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 항목 입력 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.8rem', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: 'var(--text-primary)'
                    }}>
                      항목
                    </label>
                    <input
                      type="text"
                      placeholder="항목명을 입력하세요"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  {/* 금액 입력 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.8rem', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: 'var(--text-primary)'
                    }}>
                      금액
                    </label>
                    <input
                      type="text"
                      placeholder="금액을 입력하세요"
                      value={newItem.amount ? parseInt(newItem.amount).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                        setNewItem({ ...newItem, amount: value })
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, amount: String((parseInt(newItem.amount) || 0) + 10000) })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        +1만원
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, amount: String((parseInt(newItem.amount) || 0) + 100000) })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        +10만원
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, amount: String((parseInt(newItem.amount) || 0) + 1000000) })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: 'var(--text-primary)'
                        }}
                      >
                        +100만원
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItem({ ...newItem, amount: '' })}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--expense)',
                          background: 'transparent',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          color: 'var(--expense)'
                        }}
                      >
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* 비고 입력 */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.8rem', 
                      fontWeight: '500', 
                      marginBottom: '6px',
                      color: 'var(--text-primary)'
                    }}>
                      비고 (메모)
                    </label>
                    <textarea
                      placeholder="상세 내용을 입력하세요"
                      value={newItem.memo}
                      onChange={(e) => setNewItem({ ...newItem, memo: e.target.value })}
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                        resize: 'vertical',
                        minHeight: '120px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* 하단 버튼 영역 */}
            <div style={{ 
              padding: '16px 20px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px'
            }}>
              {editMode === 'list' ? (
                <>
                  <button
                    onClick={goToAddMode}
                    className="btn btn-secondary"
                    style={{ 
                      flex: 1, 
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} />
                    추가
                  </button>
                  <button
                    onClick={saveAllChanges}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    저장
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={goBackToList}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={editMode === 'add' ? saveNewItem : saveEditItem}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px' }}
                  >
                    {editMode === 'add' ? '추가' : '수정'} 완료
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Budget
