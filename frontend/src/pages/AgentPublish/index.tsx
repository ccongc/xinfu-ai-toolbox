import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout, Card, Form, Input, Select, Button, message, Typography, Switch, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { agentApi, templateApi } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'

const { Title } = Typography
const { TextArea } = Input

export default function AgentPublish() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])

  if (!isLoggedIn()) {
    navigate('/login')
    return null
  }

  // 加载模板列表
  useState(() => {
    templateApi.adminList().then((res: any) => {
      setTemplates((res?.data || res) || [])
    }).catch(() => {})
  })

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await agentApi.publish(values)
      message.success('Agent发布成功，等待管理员审核')
      navigate('/my/agents')
    } catch (e: any) {
      message.error(e.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16, paddingLeft: 0 }}
        >
          返回
        </Button>
        <Card>
          <Title level={3} style={{ marginBottom: 24 }}>发布Agent</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ embed_type: 'api', tags: [] }}
          >
            <Form.Item name="name" label="Agent名称" rules={[{ required: true, message: '请输入Agent名称' }]}>
              <Input placeholder="为你的Agent起个名字" size="large" />
            </Form.Item>
            <Form.Item name="description" label="简要描述" rules={[{ required: true, message: '请输入描述' }]}>
              <TextArea rows={2} placeholder="简短描述Agent功能" />
            </Form.Item>
            <Form.Item name="detail" label="功能详细介绍">
              <TextArea rows={4} placeholder="详细介绍Agent的功能特点" />
            </Form.Item>
            <Form.Item name="scenarios" label="解决场景">
              <TextArea rows={3} placeholder="描述Agent可以解决的业务场景" />
            </Form.Item>
            <Form.Item name="design_idea" label="设计思路">
              <TextArea rows={3} placeholder="描述Agent的设计思路和架构" />
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Select placeholder="选择分类" allowClear options={[
                { label: '智能客服', value: '智能客服' },
                { label: '知识问答', value: '知识问答' },
                { label: '数据分析', value: '数据分析' },
                { label: '流程自动化', value: '流程自动化' },
                { label: '内容生成', value: '内容生成' },
                { label: '其他', value: '其他' },
              ]} />
            </Form.Item>
            <Form.Item name="embed_type" label="嵌入方式" rules={[{ required: true }]}>
              <Select options={[
                { label: 'API调用（自定义对话界面）', value: 'api' },
                { label: 'iframe嵌入（FastGPT/Coze/Dify/n8n）', value: 'iframe' },
              ]} />
            </Form.Item>
            <Form.Item name="embed_code" label="iframe嵌入代码">
              <TextArea rows={4} placeholder="粘贴FastGPT/Coze/Dify/n8n的iframe嵌入代码" />
            </Form.Item>
            <Form.Item name="api_endpoint" label="API端点地址">
              <Input placeholder="https://api.example.com/v1/chat/completions" />
            </Form.Item>
            <Form.Item name="template_id" label="对话界面模板">
              <Select placeholder="选择对话界面模板" allowClear options={templates.map((t: any) => ({
                label: t.name, value: t.id,
              }))} />
            </Form.Item>
            <Form.Item name="icon_url" label="图标URL">
              <Input placeholder="Agent图标URL（可选）" />
            </Form.Item>
            <Form.Item name="cover_url" label="封面图URL">
              <Input placeholder="封面图URL（可选）" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                提交发布
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
