import { User, Lock, Database, Bell, Info, ExternalLink } from 'lucide-react'

function Settings() {
  return (
    <div className="fade-in page-container">
      <div className="page-header">
        <h1 className="page-title">설정</h1>
        <p className="page-subtitle">앱 설정 관리</p>
      </div>

      <div className="content-area">
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
                  U
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '0.85rem' }}>사용자</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>user@example.com</p>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <Lock size={12} />
                비밀번호 변경
              </button>
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

        {/* 알림 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={14} style={{ color: 'var(--accent)' }} />
              알림
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontWeight: '500', fontSize: '0.8rem' }}>지출 알림</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>예정된 지출 전 알림</p>
              </div>
              <div style={{ 
                width: '36px', height: '20px', background: 'var(--accent)', borderRadius: '10px',
                position: 'relative', cursor: 'pointer'
              }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                  position: 'absolute', right: '2px', top: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
              <div>
                <p style={{ fontWeight: '500', fontSize: '0.8rem' }}>월간 리포트</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>매월 말 재무 리포트</p>
              </div>
              <div style={{ 
                width: '36px', height: '20px', background: 'var(--border)', borderRadius: '10px',
                position: 'relative', cursor: 'pointer'
              }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%',
                  position: 'absolute', left: '2px', top: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
              </div>
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
