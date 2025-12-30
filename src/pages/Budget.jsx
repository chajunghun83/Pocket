import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Check, Target, X, Plus, Trash2, Loader2, Database } from 'lucide-react'
import {
  incomeData as initialIncomeData,
  fixedExpenseData as initialFixedData,
  variableExpenseData as initialVariableData,
  formatCurrency,
} from '../data/dummyData'
import { useSettings } from '../context/SettingsContext'
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  toggleCompleted as toggleCompletedDB,
  migrateTransactions,
} from '../services/transactionService'

function Budget() {
  const { settings } = useSettings()
  
  // 데이터 state
  const [incomeList, setIncomeList] = useState([])
  const [fixedList, setFixedList] = useState([])
  const [variableList, setVariableList] = useState([])
  
  // 로딩 state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [useSupabase, setUseSupabase] = useState(true) // Supabase 사용 여부
  
  // 마이그레이션 중복 실행 방지
  const isMigratingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  
  // 수정/추가 모달 state
  const [editModal, setEditModal] = useState(null) // { type: 'income'|'fixed'|'variable', item: object|null, isNew: boolean }
  const [formData, setFormData] = useState({ day: '', name: '', amount: '', memo: '' })

  // Supabase에서 데이터 로드
  const loadData = useCallback(async () => {
    // 이미 로드 중이면 무시 (React Strict Mode 중복 호출 방지)
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    setIsLoading(true)
    try {
      const { data, error } = await getTransactions()
      
      if (error) {
        console.error('Supabase 로드 실패, 더미 데이터 사용:', error)
        setUseSupabase(false)
        setIncomeList([...initialIncomeData])
        setFixedList([...initialFixedData])
        setVariableList([...initialVariableData])
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
        console.log('데이터가 없습니다. 마이그레이션을 실행합니다...')
        const result = await migrateTransactions(initialIncomeData, initialFixedData, initialVariableData)
        
        if (result.success) {
          // 마이그레이션 후 다시 로드
          const { data: newData } = await getTransactions()
          if (newData) {
            setIncomeList(newData.filter(t => t.type === 'income').map(transformData))
            setFixedList(newData.filter(t => t.type === 'fixed').map(transformData))
            setVariableList(newData.filter(t => t.type === 'variable').map(transformData))
          }
        } else {
          // 마이그레이션 실패 시 더미 데이터 사용
          setUseSupabase(false)
          setIncomeList([...initialIncomeData])
          setFixedList([...initialFixedData])
          setVariableList([...initialVariableData])
        }
      } else {
        // 데이터 변환 및 설정
        setIncomeList(data.filter(t => t.type === 'income').map(transformData))
        setFixedList(data.filter(t => t.type === 'fixed').map(transformData))
        setVariableList(data.filter(t => t.type === 'variable').map(transformData))
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setUseSupabase(false)
      setIncomeList([...initialIncomeData])
      setFixedList([...initialFixedData])
      setVariableList([...initialVariableData])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // DB 데이터 → 프론트엔드 형식 변환
  const transformData = (item) => ({
    id: item.id,
    name: item.name,
    amount: Number(item.amount),
    date: item.date,
    completed: item.is_completed,
    memo: item.memo || ''
  })

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData()
  }, [loadData])

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editModal) {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editModal])
  
  // 월 선택 state (기본: 2025년 12월)
  const [currentYear, setCurrentYear] = useState(2025)
  const [currentMonthNum, setCurrentMonthNum] = useState(12)
  
  // 현재 선택된 월 문자열
  const currentMonthStr = `${currentYear}년 ${currentMonthNum}월`
  
  // 현재 월에 해당하는 데이터 필터링
  const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`
  
  const filteredIncome = incomeList.filter(item => item.date.startsWith(currentMonthKey))
  const filteredFixed = fixedList.filter(item => item.date.startsWith(currentMonthKey))
  const filteredVariable = variableList.filter(item => item.date.startsWith(currentMonthKey))
  
  // 체크박스 토글 함수
  const handleToggleCompleted = async (type, id, e) => {
    e.stopPropagation() // 더블클릭 이벤트 방지
    
    // 현재 상태 찾기
    const list = type === 'income' ? incomeList : type === 'fixed' ? fixedList : variableList
    const item = list.find(i => i.id === id)
    if (!item) return
    
    const newCompleted = !item.completed
    
    // 낙관적 업데이트 (UI 먼저 변경)
    const updateList = (items) => items.map(i => i.id === id ? { ...i, completed: newCompleted } : i)
    
    if (type === 'income') {
      setIncomeList(updateList)
    } else if (type === 'fixed') {
      setFixedList(updateList)
    } else {
      setVariableList(updateList)
    }
    
    // Supabase 업데이트
    if (useSupabase) {
      const { error } = await toggleCompletedDB(id, newCompleted)
      if (error) {
        console.error('완료 상태 변경 실패:', error)
        // 실패 시 롤백
        const rollback = (items) => items.map(i => i.id === id ? { ...i, completed: !newCompleted } : i)
        if (type === 'income') setIncomeList(rollback)
        else if (type === 'fixed') setFixedList(rollback)
        else setVariableList(rollback)
      }
    }
  }
  
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
  
  // 데이터 계산
  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0)
  const totalFixed = filteredFixed.reduce((sum, item) => sum + item.amount, 0)
  const totalVariable = filteredVariable.reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalFixed - totalVariable

  // 추가 모달 열기
  const openAddModal = (type) => {
    setFormData({ day: '1', name: '', amount: '', memo: '' })
    setEditModal({ type, item: null, isNew: true })
  }

  // 수정 모달 열기 (더블클릭)
  const openEditModal = (type, item) => {
    const day = item.date.split('-')[2]
    setFormData({
      day: parseInt(day).toString(),
      name: item.name,
      amount: item.amount.toString(),
      memo: item.memo || ''
    })
    setEditModal({ type, item, isNew: false })
  }

  // 모달 닫기
  const closeModal = () => {
    setEditModal(null)
    setFormData({ day: '', name: '', amount: '', memo: '' })
  }

  // 저장
  const handleSave = async () => {
    if (!formData.name || !formData.day) return
    
    setIsSaving(true)
    const fullDate = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(formData.day).padStart(2, '0')}`
    const amount = parseInt(formData.amount) || 0
    
    try {
      if (editModal.isNew) {
        // 새 항목 추가
        if (useSupabase) {
          const { data, error } = await addTransaction({
            type: editModal.type,
            name: formData.name,
            amount,
            date: fullDate,
            is_completed: false,
            memo: formData.memo
          })
          
          if (error) throw error
          
          const newItem = transformData(data)
          if (editModal.type === 'income') {
            setIncomeList([...incomeList, newItem])
          } else if (editModal.type === 'fixed') {
            setFixedList([...fixedList, newItem])
          } else {
            setVariableList([...variableList, newItem])
          }
        } else {
          // 더미 데이터 모드
          const list = editModal.type === 'income' ? incomeList : editModal.type === 'fixed' ? fixedList : variableList
          const newId = Math.max(...list.map(i => typeof i.id === 'number' ? i.id : 0), 0) + 1
          const newItem = {
            id: newId,
            name: formData.name,
            amount,
            date: fullDate,
            completed: false,
            memo: formData.memo
          }
          
          if (editModal.type === 'income') {
            setIncomeList([...incomeList, newItem])
          } else if (editModal.type === 'fixed') {
            setFixedList([...fixedList, newItem])
          } else {
            setVariableList([...variableList, newItem])
          }
        }
      } else {
        // 기존 항목 수정
        if (useSupabase) {
          const { data, error } = await updateTransaction(editModal.item.id, {
            name: formData.name,
            amount,
            date: fullDate,
            is_completed: editModal.item.completed,
            memo: formData.memo
          })
          
          if (error) throw error
          
          const updatedItem = transformData(data)
          const updateList = (items) => items.map(item => 
            item.id === editModal.item.id ? updatedItem : item
          )
          
          if (editModal.type === 'income') {
            setIncomeList(updateList)
          } else if (editModal.type === 'fixed') {
            setFixedList(updateList)
          } else {
            setVariableList(updateList)
          }
        } else {
          // 더미 데이터 모드
          const updateItem = (item) => 
            item.id === editModal.item.id 
              ? { ...item, name: formData.name, amount, date: fullDate, memo: formData.memo }
              : item
          
          if (editModal.type === 'income') {
            setIncomeList(incomeList.map(updateItem))
          } else if (editModal.type === 'fixed') {
            setFixedList(fixedList.map(updateItem))
          } else {
            setVariableList(variableList.map(updateItem))
          }
        }
      }
      
      closeModal()
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!editModal.item) return
    if (!window.confirm('이 항목을 삭제하시겠습니까?')) return
    
    setIsSaving(true)
    try {
      if (useSupabase) {
        const { error } = await deleteTransaction(editModal.item.id)
        if (error) throw error
      }
      
      if (editModal.type === 'income') {
        setIncomeList(incomeList.filter(item => item.id !== editModal.item.id))
      } else if (editModal.type === 'fixed') {
        setFixedList(fixedList.filter(item => item.id !== editModal.item.id))
      } else {
        setVariableList(variableList.filter(item => item.id !== editModal.item.id))
      }
      
      closeModal()
    } catch (err) {
      console.error('삭제 실패:', err)
      alert('삭제에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 모달 정보
  const getModalInfo = () => {
    if (!editModal) return {}
    const isIncome = editModal.type === 'income'
    return {
      title: editModal.type === 'income' ? '수입' : editModal.type === 'fixed' ? '고정 지출' : '변동 지출',
      dateLabel: isIncome ? '입금일' : '출금일',
      color: isIncome ? 'var(--income)' : 'var(--expense)',
      bgColor: isIncome ? 'var(--income-light)' : 'var(--expense-light)'
    }
  }
  
  // 예산 목표 계산
  const totalExpense = totalFixed + totalVariable
  const budgetGoal = settings.budgetGoal
  const budgetProgress = Math.min((totalExpense / budgetGoal) * 100, 100)
  const budgetRemaining = budgetGoal - totalExpense
  const isOverBudget = totalExpense > budgetGoal

  const fixedCompleted = filteredFixed.filter(i => i.completed).length
  const fixedTotal = filteredFixed.length
  const variableCompleted = filteredVariable.filter(i => i.completed).length
  const variableTotal = filteredVariable.length

  // 날짜 포맷 (MM/DD)
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 테이블 렌더링 함수
  const renderTable = (data, type, dateLabel) => {
    const sortedData = [...data].sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2])
      const dayB = parseInt(b.date.split('-')[2])
      return dayA - dayB
    })
    const isIncome = type === 'income'
    
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '8%' }}></th>
            <th style={{ width: '18%', textAlign: 'center' }}>{dateLabel}</th>
            <th style={{ width: '44%' }}>항목</th>
            <th style={{ width: '30%', textAlign: 'right' }}>금액</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr 
              key={item.id} 
              onDoubleClick={() => openEditModal(type, item)}
              style={{ cursor: 'pointer' }}
              title="더블클릭하여 수정"
            >
              <td>
                <div 
                  className={`checkbox ${item.completed ? 'checked' : ''}`}
                  onClick={(e) => handleToggleCompleted(type, item.id, e)}
                  style={{ cursor: 'pointer' }}
                >
                  {item.completed && <Check size={9} />}
                </div>
              </td>
              <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {formatDate(item.date)}
              </td>
              <td style={{ fontWeight: '500' }}>
                {item.name}
                {item.memo && <span style={{ marginLeft: '6px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>📝</span>}
              </td>
              <td style={{ textAlign: 'right' }}>
                {item.amount > 0 ? (
                  <span className={`amount ${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const modalInfo = getModalInfo()

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="fade-in page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in page-container">
      {/* 헤더 */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">가계부</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            수입과 지출 관리
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
                {formatCurrency(totalIncome)}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--income)' }}
                onClick={() => openAddModal('income')}
              >
                <Plus size={12} />
                추가
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(filteredIncome, 'income', '입금일')}
          </div>
        </div>

        {/* 고정 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              📌 고정 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {filteredFixed.length > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{fixedCompleted}/{fixedTotal}</span>}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {formatCurrency(totalFixed)}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}
                onClick={() => openAddModal('fixed')}
              >
                <Plus size={12} />
                추가
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(filteredFixed, 'fixed', '출금일')}
          </div>
        </div>

        {/* 변동 지출 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-header" style={{ background: 'var(--expense-light)' }}>
            <h3 className="card-title" style={{ color: 'var(--expense)' }}>
              💳 변동 지출
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {filteredVariable.length > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{variableCompleted}/{variableTotal}</span>}
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--expense)' }}>
                {formatCurrency(totalVariable)}
              </span>
              <button 
                className="btn btn-primary" 
                style={{ padding: '4px 12px', fontSize: '0.7rem', background: 'var(--expense)' }}
                onClick={() => openAddModal('variable')}
              >
                <Plus size={12} />
                추가
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {renderTable(filteredVariable, 'variable', '출금일')}
          </div>
        </div>
      </div>

      {/* 수정/추가 모달 */}
      {editModal && (
        <>
          {/* 오버레이 */}
          <div 
            onClick={closeModal}
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
            width: '420px',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: modalInfo.bgColor,
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: modalInfo.color }}>
                  {modalInfo.title} {editModal.isNew ? '추가' : '수정'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {editModal.isNew ? '새 항목을 추가합니다' : '항목을 수정합니다'}
                </p>
              </div>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* 폼 */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 날짜 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  {modalInfo.dateLabel}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {currentMonthNum}월
                  </span>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
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

              {/* 항목 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  항목
                </label>
                <input
                  type="text"
                  placeholder="항목명을 입력하세요"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

              {/* 금액 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  금액
                </label>
                <input
                  type="text"
                  placeholder="금액을 입력하세요"
                  value={formData.amount ? parseInt(formData.amount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '')
                    setFormData({ ...formData, amount: value })
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
                  {[10000, 100000, 1000000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: String((parseInt(formData.amount) || 0) + amount) })}
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
                      +{amount / 10000}만원
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: '' })}
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

              {/* 비고 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  비고 (메모)
                </label>
                <textarea
                  placeholder="상세 내용을 입력하세요"
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-primary)',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
            
            {/* 하단 버튼 */}
            <div style={{ 
              padding: '16px 20px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px'
            }}>
              {!editModal.isNew && (
                <button
                  onClick={handleDelete}
                  className="btn"
                  style={{ 
                    padding: '12px 16px',
                    background: 'transparent',
                    border: '1px solid var(--expense)',
                    color: 'var(--expense)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              )}
              <button
                onClick={closeModal}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px' }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> 저장 중...</>
                ) : '저장'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Budget
