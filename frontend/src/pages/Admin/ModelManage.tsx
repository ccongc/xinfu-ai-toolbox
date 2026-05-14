import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, message, Space, Popconfirm, Tag } from 'antd'
import { PlusOutlined, ApiOutlined } from '@ant-design/icons'
import { modelApi } from '../../services/api'

export default function ModelManage() {
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editModel, setEditModel] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchModels = () => {
    setLoading(true)
    modelApi.list().then((res: any) => {
      setModels(res?.data || res || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchModels() }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editModel) {
        await modelApi.update(editModel.id, values)
        message.success('更新成功')
      } else {
        await modelApi.create(values)
        message.success('添加成功')
      }
      setModal(false)
      form.resetFields()
      setEditModel(null)
      fetchModels()
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  const handleTest = async (id: number) => {
    try {
      const res = await modelApi.test(id)
      const data = res?.data || res
      if (data?.status === 'ok') {
        message.success(`连通成功: ${data.response_preview || ''}`)
      } else {
        message.error(`连通失败: ${data?.detail || '未知错误'}`)
      }
    } catch (e: any) {
      message.error(e.message || '测试异常')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await modelApi.delete(id)
      message.success('已删除')
      fetchModels()
    } catch (e: any) {
      message.error(e.message || '删除失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '提供商', dataIndex: 'provider', key: 'provider' },
    { title: '模型标识', dataIndex: 'model_id', key: 'model_id', render: (v: string) => v || '-' },
    { title: 'API Key', dataIndex: 'has_api_key', key: 'has_api_key', render: (v: boolean) => v ? <Tag color="green">已配置</Tag> : <Tag>未配置</Tag> },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<ApiOutlined />} onClick={() => handleTest(record.id)}>测试</Button>
          <Button type="link" size="small" onClick={() => {
            setEditModel(record)
            form.setFieldsValue({ ...record, api_key: undefined })
            setModal(true)
          }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditModel(null); form.resetFields(); setModal(true) }}>
          添加模型
        </Button>
      </div>
      <Table columns={columns} dataSource={models} rowKey="id" loading={loading} pagination={false} />
      <Modal
        title={editModel ? '编辑模型' : '添加模型'}
        open={modal}
        onOk={handleSubmit}
        onCancel={() => { setModal(false); setEditModel(null) }}
        width={560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="模型名称" rules={[{ required: true }]}>
            <Input placeholder="如：GPT-4o" />
          </Form.Item>
          <Form.Item name="provider" label="提供商" rules={[{ required: true }]}>
            <Select options={[
              { label: 'OpenAI', value: 'openai' },
              { label: '智谱AI', value: 'zhipu' },
              { label: '百度千帆', value: 'baidu' },
              { label: '阿里通义', value: 'aliyun' },
              { label: '讯飞星火', value: 'iflytek' },
              { label: 'DeepSeek', value: 'deepseek' },
              { label: '其他', value: 'other' },
            ]} />
          </Form.Item>
          <Form.Item name="model_type" label="模型类型">
            <Select allowClear options={[
              { label: '对话', value: 'chat' },
              { label: '嵌入', value: 'embedding' },
            ]} />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password placeholder={editModel ? '留空则不修改' : '输入API Key'} />
          </Form.Item>
          <Form.Item name="api_base_url" label="API Base URL">
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item name="model_id" label="模型标识">
            <Input placeholder="如：gpt-4o" />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
