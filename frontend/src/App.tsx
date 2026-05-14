import { Routes, Route, Navigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AgentMarket from './pages/AgentMarket'
import AgentDetail from './pages/AgentDetail'
import AgentChat from './pages/AgentChat'
import AgentPublish from './pages/AgentPublish'
import MyAgents from './pages/MyAgents'
import AppNav from './pages/AppNav'
import Admin from './pages/Admin'
import ChangePassword from './pages/ChangePassword'

/** 判断路径是否为管理后台 /admin-{salt} */
function isAdminPath(pathname: string): boolean {
  return /^\/admin-[a-zA-Z0-9]+/.test(pathname)
}

function CatchAll() {
  const { pathname } = useLocation()
  if (isAdminPath(pathname)) {
    return <Admin />
  }
  return <Navigate to="/" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agent-market" element={<AgentMarket />} />
      <Route path="/agent/:id" element={<AgentDetail />} />
      <Route path="/agent/:id/chat" element={<AgentChat />} />
      <Route path="/agent/publish" element={<AgentPublish />} />
      <Route path="/agent/publish/:id" element={<AgentPublish />} />
      <Route path="/my/agents" element={<MyAgents />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/apps" element={<AppNav />} />
      <Route path="*" element={<CatchAll />} />
    </Routes>
  )
}
