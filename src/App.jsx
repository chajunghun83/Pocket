import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Budget from './pages/Budget'
import Asset from './pages/Asset'
import Debt from './pages/Debt'
import Stock from './pages/Stock'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="budget" element={<Budget />} />
        <Route path="asset" element={<Asset />} />
        <Route path="debt" element={<Debt />} />
        <Route path="stock" element={<Stock />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App

