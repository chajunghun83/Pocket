import { Outlet, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Settings,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '대시보드' },
  { path: '/budget', icon: Wallet, label: '가계부' },
  { path: '/debt', icon: CreditCard, label: '부채 관리' },
  { path: '/stock', icon: TrendingUp, label: '주식 관리' },
  { path: '/settings', icon: Settings, label: '설정' },
]

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-container">
      {/* 모바일 메뉴 버튼 */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 사이드바 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">
            <span className="logo-icon">P</span>
            <span className="logo-text">Pocket</span>
          </h1>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="version">v0.1.0</p>
        </div>
      </aside>

      {/* 오버레이 (모바일) */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

