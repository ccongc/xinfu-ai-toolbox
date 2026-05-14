import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AgentMarket from './pages/AgentMarket'
import AgentDetail from './pages/AgentDetail'
import AgentChat from './pages/AgentChat'
import AgentPublish from './pages/AgentPublish'
import MyAgents from './pages/MyAgents'
import AppNav from './pages/AppNav'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      {/* 用户界面 */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agent-market" element={<AgentMarket />} />
      <Route path="/agent/:id" element={<AgentDetail />} />
      <Route path="/agent/:id/chat" element={<AgentChat />} />
      <Route path="/agent/publish" element={<AgentPublish />} />
      <Route path="/agent/publish/:id" element={<AgentPublish />} />
      <Route path="/my/agents" element={<MyAgents />} />
      <Route path="/apps" element={<AppNav />} />

      {/* 管理界面 - 匹配 /admin-{salt} 及其子路径 */}
      <Route path="/admin-*" element={<Admin />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
