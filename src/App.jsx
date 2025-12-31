import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Asset from './pages/Asset'
import Debt from './pages/Debt'
import Stock from './pages/Stock'
import Settings from './pages/Settings'

// 로그인 필수 라우트 래퍼
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      {/* 로그인 페이지 - 공개 */}
      <Route path="/login" element={<Login />} />

      {/* 메인 앱 - 로그인 필수 */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="budget" element={<Budget />} />
        <Route path="asset" element={<Asset />} />
        <Route path="debt" element={<Debt />} />
        <Route path="stock" element={<Stock />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 기타 경로는 홈으로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
