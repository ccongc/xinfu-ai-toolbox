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
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn, getUserInfo, logout, isAdmin } from '../utils/auth'

const { Header: AntHeader } = Layout

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const user = getUserInfo()

  const menuItems = [
    { key: '/', label: '首页', icon: <HomeOutlined /> },
    { key: '/agent-market', label: 'Agent市场', icon: <AppstoreOutlined /> },
    { key: '/apps', label: '应用导航', icon: <MenuOutlined /> },
  ]

  const currentKey = menuItems.find(m => location.pathname.startsWith(m.key) && m.key !== '/')?.key || '/'

  const userMenuItems = [
    ...(isAdmin() ? [{ key: 'admin', label: '管理后台', icon: <UnorderedListOutlined /> }] : []),
    ...(loggedIn ? [
      { key: '/my/agents', label: '我的Agent', icon: <RocketOutlined /> },
      { key: 'logout', label: '退出登录', icon: <ExportOutlined /> },
    ] : []),
  ]

  const handleUserMenu = (e: { key: string }) => {
    if (e.key === 'logout') {
      logout()
    } else if (e.key === 'admin') {
      // 管理员跳转管理后台
      const salt = localStorage.getItem('xinfu_admin_salt')
      if (salt) {
        window.location.href = `/admin-${salt}`
      }
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
          items={menuItems}
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
