import { User, Lock, Database, Info, ExternalLink, Moon, Sun, DollarSign, Target, Home, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../data/dummyData'

function Settings() {
  const { settings, updateSetting, toggleDarkMode } = useSettings()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // 사용자 이름 추출 (이메일에서 @ 앞부분)
  const userName = user?.email?.split('@')[0] || '사용자'
  const userEmail = user?.email || 'user@example.com'
  const userInitial = userName.charAt(0).toUpperCase()

  // 예산 목표 변경 핸들러
  const handleBudgetChange = (e) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
    updateSetting('budgetGoal', value)
  }

  // 토글 스위치 컴포넌트
  const Toggle = ({ isOn, onToggle }) => (
    <div 
      onClick={onToggle}
      style={{ 
        width: '44px', 
        height: '24px', 
        background: isOn ? 'var(--accent)' : 'var(--border)', 
        borderRadius: '12px',
        position: 'relative', 
        cursor: 'pointer',
        transition: 'background 0.2s ease'
      }}
    >
      <div style={{ 
        width: '20px', 
        height: '20px', 
        background: 'white', 
        borderRadius: '50%',
        position: 'absolute', 
        top: '2px',
        left: isOn ? '22px' : '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s ease'
      }} />
    </div>
  )

  return (
    <div className="fade-in page-container">
      <div className="page-header">
        <h1 className="page-title">설정</h1>
        <p className="page-subtitle">앱 설정 관리</p>
      </div>

      <div className="content-area">
        {/* 계정 & 데이터 */}
        <div className="grid-2">
          {/* 계정 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} style={{ color: 'var(--accent)' }} />
                계정
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '700'
                }}>
                  {userInitial}
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>{userName}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{userEmail}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }}>
                  <Lock size={12} />
                  비밀번호 변경
                </button>
                <button 
                  className="btn" 
                  style={{ 
                    flex: 1, 
                    background: 'var(--expense-light)', 
                    color: 'var(--expense)',
                    border: '1px solid var(--expense)'
                  }}
                  onClick={handleLogout}
                >
                  <LogOut size={12} />
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 데이터 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} style={{ color: 'var(--accent)' }} />
                데이터
              </h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.8rem' }}>Supabase 연결</span>
                  <span className="badge completed">연결됨</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>클라우드 자동 저장</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }}>내보내기</button>
                <button className="btn btn-secondary" style={{ flex: 1 }}>가져오기</button>
              </div>
            </div>
          </div>
        </div>

        {/* 화면 설정 & 예산 목표 */}
        <div className="grid-2">
          {/* 화면 설정 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {settings.darkMode ? <Moon size={14} style={{ color: 'var(--accent)' }} /> : <Sun size={14} style={{ color: 'var(--accent)' }} />}
                화면 설정
              </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {/* 다크모드 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem' }}>다크 모드</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>어두운 테마로 전환</p>
                </div>
                <Toggle isOn={settings.darkMode} onToggle={toggleDarkMode} />
              </div>
              
              {/* 시작 페이지 */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={12} />
                    시작 페이지
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>앱 시작 시 첫 화면</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { value: '/', label: '대시보드' },
                    { value: '/budget', label: '가계부' },
                    { value: '/debt', label: '부채' },
                    { value: '/stock', label: '주식' },
                    { value: '/settings', label: '설정' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateSetting('startPage', value)}
                      className={`btn ${settings.startPage === value ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 기본 통화 */}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={12} />
                    주식 기본 탭
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>주식 페이지 첫 화면</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { value: 'all', label: '전체' },
                    { value: 'KR', label: '한국' },
                    { value: 'US', label: '미국' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateSetting('defaultCurrency', value)}
                      className={`btn ${settings.defaultCurrency === value ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '8px 12px' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 예산 목표 */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={14} style={{ color: 'var(--accent)' }} />
                예산 목표
              </h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {/* 예산 목표 사용 여부 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)'
              }}>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem' }}>예산 목표 사용</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>가계부에서 지출 진행률 표시</p>
                </div>
                <Toggle 
                  isOn={settings.useBudgetGoal} 
                  onToggle={() => updateSetting('useBudgetGoal', !settings.useBudgetGoal)} 
                />
              </div>
              
              {/* 목표 금액 설정 (사용 시에만 표시) */}
              {settings.useBudgetGoal && (
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontWeight: '500', fontSize: '0.85rem', marginBottom: '4px' }}>월 지출 목표</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '12px' }}>
                    이 금액을 초과하면 경고가 표시됩니다
                  </p>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <input
                      type="text"
                      value={settings.budgetGoal.toLocaleString()}
                      onChange={handleBudgetChange}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        paddingRight: '40px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        textAlign: 'right',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem'
                    }}>원</span>
                  </div>
                  
                  {/* 금액 조절 버튼 */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { amount: 10000, label: '+1만' },
                      { amount: 100000, label: '+10만' },
                      { amount: 1000000, label: '+100만' }
                    ].map(({ amount, label }) => (
                      <button
                        key={amount}
                        onClick={() => updateSetting('budgetGoal', settings.budgetGoal + amount)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => updateSetting('budgetGoal', 0)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--expense)' }}
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 정보 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} style={{ color: 'var(--accent)' }} />
              정보
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>버전</span>
              <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>0.1.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>개발자</span>
              <span style={{ fontWeight: '500', fontSize: '0.8rem' }}>Pocket Team</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>GitHub</span>
              <a href="https://github.com/carro-nux/Pocket" target="_blank" rel="noopener noreferrer" 
                style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500', fontSize: '0.8rem' }}>
                carro-nux/Pocket
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
