import { useEffect, useState } from 'react'
import { Layout, Table, Tag, Button, Typography, message, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { agentApi } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'

const { Title } = Typography

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  pending: { color: 'processing', label: '待审核' },
  approved: { color: 'success', label: '已通过' },
  rejected: { color: 'error', label: '已拒绝' },
  offline: { color: 'warning', label: '已下架' },
}

export default function MyAgents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }
    agentApi.myAgents().then((res: any) => {
      const data = res?.data || res
      setAgents(data?.items || [])
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    {
      title: '审核意见',
      dataIndex: 'review_comment',
      key: 'review_comment',
      render: (v: string) => v || '-',
    },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count' },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>我的Agent</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/agent/publish')}>
            发布Agent
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
