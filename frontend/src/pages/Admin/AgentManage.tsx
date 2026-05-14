import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, Tabs, message, Space, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { agentApi, adminAgentApi } from '../../services/api'

const { TextArea } = Input

const statusMap: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  pending: { color: 'processing', label: '待审核' },
  approved: { color: 'success', label: '已通过' },
  rejected: { color: 'error', label: '已拒绝' },
  offline: { color: 'warning', label: '已下架' },
}

export default function AgentManage() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [publishModal, setPublishModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [reviewAgent, setReviewAgent] = useState<any>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComment, setReviewComment] = useState('')
  const [form] = Form.useForm()

  const fetchAgents = () => {
    setLoading(true)
    adminAgentApi.list({ page, page_size: 20, status_filter: statusFilter }).then((res: any) => {
      const data = res?.data || res
      setAgents(data?.items || [])
      setTotal(data?.total || 0)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAgents() }, [page, statusFilter])

  const handlePublish = async () => {
    try {
      const values = await form.validateFields()
      await adminAgentApi.publish(values)
      message.success('发布成功')
      setPublishModal(false)
      form.resetFields()
      fetchAgents()
    } catch (e: any) {
      message.error(e.message || '发布失败')
    }
  }

  const handleReview = async () => {
    try {
      if (reviewAction === 'approve') {
        await adminAgentApi.approve(reviewAgent.id, { comment: reviewComment })
        message.success('审核通过')
      } else {
        await adminAgentApi.reject(reviewAgent.id, { comment: reviewComment })
        message.success('已拒绝')
      }
      setReviewModal(false)
      setReviewComment('')
      fetchAgents()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  const handleOffline = async (id: number) => {
    try {
      await adminAgentApi.offline(id)
      message.success('已下架')
      fetchAgents()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await adminAgentApi.delete(id)
      message.success('已删除')
      fetchAgents()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => v || '-' },
    {
      title: '类型',
      key: 'type',
      render: (_: any, record: any) => (
        <Space>
          <Tag>{record.embed_type}</Tag>
          {record.is_official && <Tag color="blue">官方</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = statusMap[v] || { color: 'default', label: v }
        return <Tag color={s.color}>{s.label}</Tag>
      },
    },
    { title: '发布者', dataIndex: 'publisher_name', key: 'publisher_name', render: (v: string) => v || '-' },
    { title: '浏览', dataIndex: 'view_count', key: 'view_count', width: 70 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={() => { setReviewAgent(record); setReviewAction('approve'); setReviewModal(true) }}>通过</Button>
              <Button type="link" size="small" danger onClick={() => { setReviewAgent(record); setReviewAction('reject'); setReviewModal(true) }}>拒绝</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Popconfirm title="确定下架？" onConfirm={() => handleOffline(record.id)}>
              <Button type="link" size="small">下架</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={setStatusFilter}
          options={Object.entries(statusMap).map(([k, v]) => ({ label: v.label, value: k }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setPublishModal(true)}>
          发布官方Agent
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={agents}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
      />

      {/* 发布官方Agent */}
      <Modal
        title="发布官方Agent"
        open={publishModal}
        onOk={handlePublish}
        onCancel={() => setPublishModal(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="detail" label="功能介绍">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="scenarios" label="解决场景">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="design_idea" label="设计思路">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select options={[
              { label: '智能客服', value: '智能客服' },
              { label: '知识问答', value: '知识问答' },
              { label: '数据分析', value: '数据分析' },
              { label: '流程自动化', value: '流程自动化' },
              { label: '内容生成', value: '内容生成' },
              { label: '其他', value: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="embed_type" label="嵌入方式" rules={[{ required: true }]} initialValue="api">
            <Select options={[
              { label: 'API调用', value: 'api' },
              { label: 'iframe嵌入', value: 'iframe' },
            ]} />
          </Form.Item>
          <Form.Item name="embed_code" label="iframe代码">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="api_endpoint" label="API端点">
            <Input placeholder="https://api.example.com/v1/chat/completions" />
          </Form.Item>
          <Form.Item name="icon_url" label="图标URL">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核弹窗 */}
      <Modal
        title={reviewAction === 'approve' ? '审核通过' : '审核拒绝'}
        open={reviewModal}
        onOk={handleReview}
        onCancel={() => { setReviewModal(false); setReviewComment('') }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Agent：</strong>{reviewAgent?.name}
        </div>
        <TextArea
          rows={3}
          placeholder="审核意见（可选）"
          value={reviewComment}
          onChange={e => setReviewComment(e.target.value)}
        />
      </Modal>
    </div>
  )
}
