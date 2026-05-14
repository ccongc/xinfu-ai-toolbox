import { useState } from 'react'
import { Layout, Card, Form, Input, Button, Tabs, message, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { authApi } from '../../services/api'
import { saveLoginData, isLoggedIn } from '../../utils/auth'

const { Title, Text } = Typography

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/agent-market'
  const [loading, setLoading] = useState(false)
  const [wecomUrl, setWecomUrl] = useState<string | null>(null)

  const handleLogin = async (values: any) => {
    setLoading(true)
    try {
      const res = await authApi.login(values)
      const data = (res as any)?.data || res
      saveLoginData(data)
      message.success('登录成功')
      navigate(redirect)
    } catch (e: any) {
      message.error(e.message || '用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: any) => {
    setLoading(true)
    try {
      const res = await authApi.register(values)
      const data = (res as any)?.data || res
      saveLoginData(data)
      message.success('注册成功')
      navigate(redirect)
    } catch (e: any) {
      message.error(e.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleWecomLogin = async () => {
    try {
      const res = await authApi.wecomQrUrl()
      const url = (res as any)?.data || res
      if (url) {
        setWecomUrl(url)
        window.open(url, '_blank', 'width=600,height=500')
      }
    } catch (e: any) {
      message.error(e.message || '获取企微登录链接失败')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Card style={{ width: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>信服AI工具箱</Title>
          <Tabs
            centered
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <Form onFinish={handleLogin} layout="vertical">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                      <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        登录
                      </Button>
                    </Form.Item>
                    <Space direction="vertical" style={{ width: '100%' }} align="center">
                      <Text type="secondary">或</Text>
                      <Button block size="large" onClick={handleWecomLogin}>
                        企业微信扫码登录
                      </Button>
                    </Space>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <Form onFinish={handleRegister} layout="vertical">
                    <Form.Item name="username" rules={[{ required: true, min: 3, message: '用户名至少3个字符' }]}>
                      <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, min: 6, message: '密码至少6个字符' }]}>
                      <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                    </Form.Item>
                    <Form.Item name="display_name">
                      <Input prefix={<UserOutlined />} placeholder="显示姓名（可选）" size="large" />
                    </Form.Item>
                    <Form.Item name="email">
                      <Input prefix={<MailOutlined />} placeholder="邮箱（可选）" size="large" />
                    </Form.Item>
                    <Form.Item name="phone">
                      <Input prefix={<PhoneOutlined />} placeholder="手机号（可选）" size="large" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        注册
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        </Card>
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
