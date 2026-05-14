import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Card, Typography, Tag, Button, Tabs, Spin, Space, Descriptions } from 'antd'
import {
  ArrowLeftOutlined,
  RobotOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { agentApi } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'

const { Title, Paragraph, Text } = Typography

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    agentApi.detail(Number(id)).then((res: any) => {
      const data = res?.data || res
      setAgent(data)
      // 记录浏览
      agentApi.recordView(Number(id))
    }).catch(() => {
      // Agent不存在
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <div className="page-loading"><Spin size="large" /></div>
      </Layout>
    )
  }

  if (!agent) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Title level={4} type="secondary">Agent不存在或未上架</Title>
          <Button onClick={() => navigate('/agent-market')}>返回市场</Button>
        </div>
      </Layout>
    )
  }

  const tabItems = [
    {
      key: 'detail',
      label: '功能介绍',
      children: (
        <div style={{ padding: '24px 0' }}>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
            {agent.detail || agent.description || '暂无详细介绍'}
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'scenarios',
      label: '解决场景',
      children: (
        <div style={{ padding: '24px 0' }}>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
            {agent.scenarios || '暂无场景说明'}
          </Paragraph>
        </div>
      ),
    },
    {
      key: 'design',
      label: '设计思路',
      children: (
        <div style={{ padding: '24px 0' }}>
          <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
            {agent.design_idea || '暂无设计思路说明'}
          </Paragraph>
        </div>
      ),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ padding: '24px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/agent-market')}
          style={{ marginBottom: 16, paddingLeft: 0 }}
        >
          返回市场
        </Button>

        <Card>
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            {/* Agent图标 */}
            <div style={{ flexShrink: 0 }}>
              {agent.icon_url ? (
                <img src={agent.icon_url} style={{ width: 80, height: 80, borderRadius: 8 }} alt={agent.name} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 8, background: 'linear-gradient(135deg, #001529, #1677ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RobotOutlined style={{ fontSize: 36, color: '#fff' }} />
                </div>
              )}
            </div>
            {/* Agent信息 */}
            <div style={{ flex: 1 }}>
              <Title level={3} style={{ marginBottom: 8 }}>
                {agent.name}
                {agent.is_official && <Tag color="blue" style={{ marginLeft: 8 }}>官方</Tag>}
              </Title>
              <Paragraph type="secondary">{agent.description || ''}</Paragraph>
              <Space size={16}>
                <Text type="secondary">
                  <CheckCircleOutlined /> 发布者：{agent.publisher_name || '未知'}
                </Text>
                <Text type="secondary">
                  <EyeOutlined /> 浏览：{agent.view_count || 0}
                </Text>
                {agent.category && <Tag>{agent.category}</Tag>}
              </Space>
            </div>
            {/* 操作按钮 */}
            <div style={{ flexShrink: 0 }}>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate(`/agent/${id}/chat`)}
                disabled={!isLoggedIn()}
              >
                开始对话
              </Button>
              {!isLoggedIn() && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  请先登录后使用
                </Text>
              )}
            </div>
          </div>

          <Tabs items={tabItems} />
        </Card>
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
