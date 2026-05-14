import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Form, Input, Button, Card, message, Typography } from 'antd'
import Header from '../../components/Header'
import { authApi } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'

const { Title } = Typography

export default function ChangePassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  if (!isLoggedIn()) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功，请重新登录')
      localStorage.clear()
      navigate('/login')
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '修改失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 80, background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
        <Card style={{ width: 420 }}>
          <Title level={4} style={{ textAlign: 'center', marginBottom: 32 }}>修改密码</Title>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="old_password"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="确认新密码"
              dependencies={['new_password']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                确认修改
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" block onClick={() => navigate(-1)}>
                返回
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Layout>
  )
}
