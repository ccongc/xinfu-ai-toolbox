import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import AgentMarket from './pages/AgentMarket'
import AgentDetail from './pages/AgentDetail'
import AgentChat from './pages/AgentChat'
import AgentPublish from './pages/AgentPublish'
import MyAgents from './pages/MyAgents'
import AppNav from './pages/AppNav'
import Admin from './pages/Admin'
import { getToken } from './utils/auth'

function App() {
  const [adminSalt, setAdminSalt] = useState<string>('')

  useEffect(() => {
    // 尝试获取管理路径salt（仅管理员登录后有效）
    const fetchAdminPath = async () => {
      const token = getToken()
      if (token) {
        try {
          const res = await fetch('/api/v1/auth/admin-path-info', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data?.data?.salt) {
              setAdminSalt(data.data.salt)
            }
          }
        } catch {
          // 非管理员，忽略
        }
      }
    }
    fetchAdminPath()
  }, [])

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

      {/* 管理界面 - 动态路径 */}
      {adminSalt && (
        <Route path={`/admin-${adminSalt}/*`} element={<Admin salt={adminSalt} />} />
      )}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
