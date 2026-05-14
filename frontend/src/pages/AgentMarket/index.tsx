import { useEffect, useState } from 'react'
import { Layout, Card, Row, Col, Typography, Tag, Input, Select, Spin, Badge, Space } from 'antd'
import { RobotOutlined, SearchOutlined, StarOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { agentApi } from '../../services/api'

const { Title, Paragraph, Text } = Typography

export default function AgentMarket() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    agentApi.categories().then((res: any) => {
      setCategories(res?.data || [])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    agentApi.marketList({ page, page_size: 20, keyword: keyword || undefined, category }).then((res: any) => {
      const data = res?.data || res
      setAgents(data?.items || [])
      setTotal(data?.total || 0)
    }).finally(() => setLoading(false))
  }, [page, keyword, category])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* 搜索筛选 */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center' }}>
          <Input.Search
            placeholder="搜索Agent..."
            allowClear
            enterButton={<><SearchOutlined /> 搜索</>}
            size="large"
            style={{ maxWidth: 400 }}
            onSearch={setKeyword}
          />
          <Select
            placeholder="全部分类"
            allowClear
            style={{ width: 160 }}
            size="large"
            value={category}
            onChange={setCategory}
            options={categories.map(c => ({ label: c, value: c }))}
          />
          <Text type="secondary">共 {total} 个Agent</Text>
        </div>

        {/* Agent列表 */}
        {loading ? (
          <div className="page-loading"><Spin size="large" /></div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <RobotOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} type="secondary" style={{ marginTop: 16 }}>暂无Agent</Title>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {agents.map((agent) => (
              <Col xs={24} sm={12} md={8} lg={6} key={agent.id}>
                <Card
                  hoverable
                  className="agent-card"
                  onClick={() => navigate(`/agent/${agent.id}`)}
                  cover={
                    agent.cover_url ? (
                      <img alt={agent.name} src={agent.cover_url} style={{ height: 160, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: 160, background: 'linear-gradient(135deg, #001529, #1677ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RobotOutlined style={{ fontSize: 48, color: '#fff' }} />
                      </div>
                    )
                  }
                >
                  <Card.Meta
                    title={
                      <Space>
                        {agent.name}
                        {agent.is_official && <Tag color="blue">官方</Tag>}
                      </Space>
                    }
                    description={
                      <>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8, color: 'rgba(0,0,0,0.45)' }}>
                          {agent.description || '暂无描述'}
                        </Paragraph>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {agent.publisher_name || '未知'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <EyeOutlined /> {agent.view_count || 0}
                          </Text>
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
