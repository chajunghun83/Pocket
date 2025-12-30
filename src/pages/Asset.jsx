import { useState } from 'react'
import { Plus, ArrowUpCircle, ArrowDownCircle, X, Edit3, Trash2 } from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  assetData,
  assetHistory,
  formatCurrency,
  calculateAssetBalance,
} from '../data/dummyData'

function Asset() {
  // 팝업 state
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // null이면 추가, 값이 있으면 수정
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: '1',
    type: 'deposit',
    amount: '',
    description: ''
  })
  
  // 데이터 state (실제로는 서버에서 관리)
  const [dataList, setDataList] = useState([...assetData])

  const currentBalance = dataList.reduce((balance, item) => {
    return item.type === 'deposit' ? balance + item.amount : balance - item.amount
  }, 0)
  const totalDeposited = dataList.filter(d => d.type === 'deposit').reduce((sum, d) => sum + d.amount, 0)
  const totalWithdrawn = dataList.filter(d => d.type === 'withdraw').reduce((sum, d) => sum + d.amount, 0)
  const savingsRate = totalDeposited > 0 ? ((currentBalance / totalDeposited) * 100) : 0

  // 추가 팝업 열기
  const openAddModal = () => {
    setEditingItem(null)
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: '1',
      type: 'deposit',
      amount: '',
      description: ''
    })
    setShowModal(true)
  }

  // 수정 팝업 열기
  const openEditModal = (item) => {
    const [year, month, day] = item.date.split('-')
    setEditingItem(item)
    setFormData({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day).toString(),
      type: item.type,
      amount: item.amount.toString(),
      description: item.description
    })
    setShowModal(true)
  }

  // 팝업 닫기
  const closeModal = () => {
    setShowModal(false)
    setEditingItem(null)
  }

  // 저장
  const handleSave = () => {
    if (!formData.day || !formData.amount || !formData.description) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    const fullDate = `${formData.year}-${String(formData.month).padStart(2, '0')}-${String(formData.day).padStart(2, '0')}`
    
    if (editingItem) {
      // 수정
      const updatedList = dataList.map(item =>
        item.id === editingItem.id
          ? { ...item, date: fullDate, type: formData.type, amount: parseInt(formData.amount), description: formData.description }
          : item
      )
      setDataList(updatedList)
    } else {
      // 추가
      const newId = Math.max(...dataList.map(i => i.id), 0) + 1
      const newItem = {
        id: newId,
        type: formData.type,
        amount: parseInt(formData.amount),
        date: fullDate,
        description: formData.description
      }
      setDataList([...dataList, newItem])
    }
    
    closeModal()
  }

  // 삭제
  const handleDelete = (item) => {
    if (window.confirm(`"${item.description}" 항목을 삭제하시겠습니까?`)) {
      setDataList(dataList.filter(d => d.id !== item.id))
    }
  }

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
          <div style={{ color: '#10B981', fontWeight: '600' }}>{formatCurrency(payload[0].value)}</div>
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
          <h1 className="page-title">자산 관리</h1>
          <p className="page-subtitle">CMA 통장 내역</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
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
          <p className="summary-label">총 입금</p>
          <p className="summary-value amount income">{formatCurrency(totalDeposited)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">총 출금</p>
          <p className="summary-value amount expense">{formatCurrency(totalWithdrawn)}</p>
        </div>
        <div className="summary-card">
          <p className="summary-label">저축 유지율</p>
          <p className="summary-value" style={{ color: 'var(--income)' }}>{savingsRate.toFixed(1)}%</p>
          <div style={{ marginTop: '6px' }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min(savingsRate, 100)}%`, background: 'var(--income)' }} />
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
                  <AreaChart data={assetHistory}>
                    <defs>
                      <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9 }} />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={1.5} fill="url(#assetGrad)" />
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
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>입금 횟수</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{dataList.filter(d => d.type === 'deposit').length}회</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>출금 횟수</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem' }}>{dataList.filter(d => d.type === 'withdraw').length}회</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>월평균 저축</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--income)' }}>{formatCurrency(Math.round(totalDeposited / Math.max(dataList.filter(d => d.type === 'deposit').length, 1)))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>목표 달성률</span>
                  <span style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--accent)' }}>{Math.round(currentBalance / 200000)}% (2천만원)</span>
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
                  <th style={{ width: '12%', textAlign: 'center' }}>날짜</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>구분</th>
                  <th style={{ width: '18%', textAlign: 'center' }}>금액</th>
                  <th style={{ width: '38%', textAlign: 'center' }}>내용</th>
                  <th style={{ width: '20%', textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {[...dataList].reverse().map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      {item.date.slice(2).replace(/-/g, '/')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '3px',
                        color: item.type === 'deposit' ? 'var(--income)' : 'var(--expense)',
                        fontWeight: '500'
                      }}>
                        {item.type === 'deposit' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                        {item.type === 'deposit' ? '입금' : '출금'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`amount ${item.type === 'deposit' ? 'income' : 'expense'}`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.description}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => openEditModal(item)}
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
                            fontSize: '0.7rem'
                          }}
                        >
                          <Edit3 size={10} />
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
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
                            fontSize: '0.7rem'
                          }}
                        >
                          <Trash2 size={10} />
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 추가/수정 팝업 모달 */}
      {showModal && (
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
            width: '400px',
            animation: 'slideUp 0.2s ease'
          }}>
            {/* 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--income-light)',
              borderRadius: '12px 12px 0 0'
            }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--income)' }}>
                  {editingItem ? '거래 수정' : '거래 추가'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  CMA 통장 거래 내역
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
                  날짜
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}년</option>
                    ))}
                  </select>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m}월</option>
                    ))}
                  </select>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-primary)',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 구분 (라디오 버튼) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  구분
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="deposit"
                      checked={formData.type === 'deposit'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ accentColor: 'var(--income)' }}
                    />
                    <span style={{ color: 'var(--income)', fontWeight: '500' }}>입금</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="type"
                      value="withdraw"
                      checked={formData.type === 'withdraw'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      style={{ accentColor: 'var(--expense)' }}
                    />
                    <span style={{ color: 'var(--expense)', fontWeight: '500' }}>출금</span>
                  </label>
                </div>
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
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: String((parseInt(formData.amount) || 0) + 10000) })}
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
                    onClick={() => setFormData({ ...formData, amount: String((parseInt(formData.amount) || 0) + 100000) })}
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
                    onClick={() => setFormData({ ...formData, amount: String((parseInt(formData.amount) || 0) + 1000000) })}
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

              {/* 내용 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>
                  내용
                </label>
                <input
                  type="text"
                  placeholder="내용을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            </div>
            
            {/* 하단 버튼 */}
            <div style={{ 
              padding: '16px 20px', 
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={closeModal}
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
                저장
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Asset
