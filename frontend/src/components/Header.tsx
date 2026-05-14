import { Layout, Menu, Button, Dropdown, Avatar } from 'antd'
import {
  HomeOutlined,
  AppstoreOutlined,
  RocketOutlined,
  MenuOutlined,
  ExportOutlined,
  UserOutlined,
  LoginOutlined,
  UnorderedListOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn, getUserInfo, logout, isAdmin } from '../utils/auth'
import { authApi } from '../services/api'

const { Header: AntHeader } = Layout

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const user = getUserInfo()

  const navItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    { key: '/agent-market', label: 'Agent市场', icon: <AppstoreOutlined /> },
    { key: '/apps', label: '应用导航', icon: <MenuOutlined /> },
  ]

  const currentKey = navItems.find(m => location.pathname.startsWith(m.key) && m.key !== '/')?.key || '/'

  const handleGoAdmin = async () => {
    try {
      const res = await authApi.adminPathInfo()
      const data = (res as any)?.data || res
      if (data?.admin_path) {
        window.location.href = data.admin_path
      }
    } catch {
      // 非管理员，忽略
    }
  }

  const userMenuItems = [
    ...(isAdmin() ? [{ key: 'admin', label: '管理后台', icon: <SettingOutlined /> }] : []),
    ...(loggedIn ? [
      { key: '/my/agents', label: '我的Agent', icon: <RocketOutlined /> },
      { key: 'logout', label: '退出登录', icon: <ExportOutlined /> },
    ] : []),
  ]

  const handleUserMenu = (e: { key: string }) => {
    if (e.key === 'logout') {
      logout()
    } else if (e.key === 'admin') {
      handleGoAdmin()
    } else {
      navigate(e.key)
    }
  }

  return (
    <AntHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{ color: '#fff', fontSize: 18, fontWeight: 600, cursor: 'pointer', marginRight: 40, whiteSpace: 'nowrap' }}
          onClick={() => navigate('/')}
        >
          信服AI工具箱
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[currentKey]}
          items={navItems}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
      </div>
      <div>
        {loggedIn ? (
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }} placement="bottomRight">
            <Button type="text" style={{ color: '#fff' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.display_name || user?.username || '用户'}
            </Button>
          </Dropdown>
        ) : (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={() => navigate('/login')}
          >
            登录
          </Button>
        )}
      </div>
    </AntHeader>
  )
}
