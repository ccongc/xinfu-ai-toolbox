import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Card, Row, Col, Statistic, Spin, Result } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  RobotOutlined,
  ApiOutlined,
  FileTextOutlined,
  SettingOutlined,
  HomeOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { systemApi, authApi } from '../../services/api'
import { logout, getUserInfo, isLoggedIn, setAdminSalt as saveAdminSalt } from '../../utils/auth'
import UserManage from './UserManage'
import AgentManage from './AgentManage'
import ModelManage from './ModelManage'
import LogManage from './LogManage'
import SystemManage from './SystemManage'

const { Sider, Content, Header: AntHeader } = Layout
const { Title } = Typography

export default function Admin() {
  const { salt } = useParams<{ salt: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoggedIn()) {
        // 未登录，跳转到登录页，登录后回来
        window.location.href = `/login?redirect=/admin-${salt}`
        return
      }
      // 已登录，校验是否管理员 + salt是否正确
      try {
        const res = await authApi.adminPathInfo()
        const data = (res as any)?.data || res
        if (data?.salt === salt) {
          saveAdminSalt(salt!)
          setValid(true)
        } else {
          setValid(false)
        }
      } catch {
        setValid(false)
      }
      setChecking(false)
    }
    checkAccess()
  }, [salt])

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="验证管理员身份..." />
      </div>
    )
  }

  if (!valid) {
    return (
      <Result
        status="403"
        title="无权访问"
        subTitle="此管理路径无效或您没有管理员权限"
        extra={<Button type="primary" href="/">返回首页</Button>}
      />
    )
  }

  return <AdminLayout salt={salt!} />
}

function AdminLayout({ salt }: { salt: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUserInfo()
  const basePath = `/admin-${salt}`

  const menuItems = [
    { key: `${basePath}/`, label: '仪表盘', icon: <DashboardOutlined /> },
    { key: `${basePath}/users`, label: '用户管理', icon: <UserOutlined /> },
    { key: `${basePath}/agents`, label: 'Agent管理', icon: <RobotOutlined /> },
    { key: `${basePath}/models`, label: '大模型管理', icon: <ApiOutlined /> },
    { key: `${basePath}/logs`, label: '日志管理', icon: <FileTextOutlined /> },
    { key: `${basePath}/system`, label: '系统管理', icon: <SettingOutlined /> },
  ]

  const currentKey = menuItems.find(m =>
    location.pathname === m.key || (m.key !== `${basePath}/` && location.pathname.startsWith(m.key))
  )?.key || `${basePath}/`

  return (
    <Layout className="admin-layout" style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>信服AI管理后台</Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>管理员：{user?.display_name || user?.username}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<HomeOutlined />} onClick={() => window.location.href = '/'}>
              返回前台
            </Button>
            <Button onClick={() => { logout() }}>
              退出
            </Button>
          </div>
        </AntHeader>
        <Content style={{ margin: 24, padding: 24, background: '#f0f2f5', minHeight: 280 }}>
          <Routes>
            <Route path="/" element={<Dashboard salt={salt} />} />
            <Route path="/users" element={<UserManage />} />
            <Route path="/agents" element={<AgentManage />} />
            <Route path="/models" element={<ModelManage />} />
            <Route path="/logs" element={<LogManage />} />
            <Route path="/system" element={<SystemManage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function Dashboard({ salt }: { salt: string }) {
  const [stats, setStats] = useState<any>({})
  const [adminPath, setAdminPathData] = useState<string>('')

  useEffect(() => {
    systemApi.stats().then((res: any) => {
      setStats((res?.data || res) || {})
    })
    systemApi.adminPath().then((res: any) => {
      const data = res?.data || res
      setAdminPathData(data?.admin_path || '')
    })
  }, [])

  return (
    <div>
      <Title level={4}>系统概览</Title>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="用户总数" value={stats.user_count || 0} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Agent总数" value={stats.agent_count || 0} prefix={<RobotOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待审核" value={stats.pending_count || 0} prefix={<AuditOutlined />} valueStyle={{ color: stats.pending_count > 0 ? '#cf1322' : undefined }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="今日访问" value={stats.today_visits || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
      </Row>
      <Card title="管理路径">
        <p>当前管理路径：<code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>{adminPath || '加载中...'}</code></p>
        <p style={{ color: '#999', fontSize: 12 }}>请妥善保管管理路径，不要对外泄露</p>
      </Card>
    </div>
  )
}
