import { useEffect, useState } from 'react'
import { Tabs, Card, Form, Input, Button, Table, message, Popconfirm, Typography, Tag, Modal, Switch, Space, Image } from 'antd'
import { systemApi, homepageApi, templateApi, navLinkApi } from '../../services/api'

const { TextArea } = Input
const { Title } = Typography

export default function SystemManage() {
  return (
    <Tabs items={[
      { key: 'config', label: '系统配置', children: <ConfigTab /> },
      { key: 'homepage', label: '首页管理', children: <HomepageTab /> },
      { key: 'templates', label: '模板管理', children: <TemplateTab /> },
      { key: 'navlinks', label: '导航管理', children: <NavLinkTab /> },
      { key: 'adminpath', label: '管理路径', children: <AdminPathTab /> },
    ]} />
  )
}

function ConfigTab() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(false)
  const [editConfig, setEditConfig] = useState<any>(null)
  const [editValue, setEditValue] = useState('')

  const fetchConfigs = () => {
    setLoading(true)
    systemApi.configs().then((res: any) => {
      setConfigs(res?.data || res || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchConfigs() }, [])

  const handleUpdate = async (key: string, value: string) => {
    try {
      await systemApi.updateConfig(key, { config_value: value })
      message.success('更新成功')
      setEditModal(false)
      fetchConfigs()
    } catch (e: any) {
      message.error(e.message || '更新失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditConfig(record)
    setEditValue(record.config_value === '***' ? '' : (record.config_value || ''))
    setEditModal(true)
  }

  const renderConfigValue = (key: string, value: string) => {
    if (key === 'site_logo' && value && !value.startsWith('***')) {
      if (value.startsWith('data:image') || value.startsWith('http')) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image src={value} alt="logo" width={32} height={32} style={{ objectFit: 'contain' }} />
            <span style={{ color: '#999', fontSize: 12 }}>已配置</span>
          </div>
        )
      }
    }
    if (value && value.length > 50) {
      return <span style={{ color: '#999', fontSize: 12 }}>{value.slice(0, 30)}...({value.length}字符)</span>
    }
    return value
  }

  const columns = [
    { title: '配置键', dataIndex: 'config_key', key: 'config_key', width: 160 },
    { title: '配置值', dataIndex: 'config_value', key: 'config_value', render: (v: string, record: any) => renderConfigValue(record.config_key, v) },
    { title: '类型', dataIndex: 'value_type', key: 'value_type', width: 80, render: (v: string) => <Tag>{v}</Tag> },
    { title: '说明', dataIndex: 'description', key: 'description', width: 180 },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
      ),
    },
  ]

  return (
    <div>
      <Table columns={columns} dataSource={configs} rowKey="id" loading={loading} pagination={false} />
      <Modal
        title={`编辑 ${editConfig?.config_key || ''}`}
        open={editModal}
        onOk={() => handleUpdate(editConfig.config_key, editValue)}
        onCancel={() => setEditModal(false)}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <Input.TextArea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            rows={editConfig?.config_key === 'site_logo' ? 6 : 3}
            placeholder="请输入配置值"
          />
        </div>
        {editConfig?.config_key === 'site_logo' && editValue && (editValue.startsWith('data:image') || editValue.startsWith('http')) && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#999', marginRight: 8 }}>预览：</span>
            <Image src={editValue} alt="logo" width={80} height={80} style={{ objectFit: 'contain' }} />
          </div>
        )}
        {editConfig?.config_key === 'site_logo' && (
          <div>
            <Button size="small" onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (e: any) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  setEditValue(ev.target?.result as string)
                }
                reader.readAsDataURL(file)
              }
              input.click()
            }}>上传图片转Base64</Button>
          </div>
        )}
      </Modal>
    </div>
  )
}

function HomepageTab() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    homepageApi.adminGet().then((res: any) => {
      const data = res?.data || res
      setSections(data?.sections || [])
    }).finally(() => setLoading(false))
  }, [])

  const handleSave = async (sectionKey: string, field: string, value: any) => {
    try {
      const section = sections.find(s => s.section_key === sectionKey)
      const content = section?.content || {}
      await homepageApi.update(sectionKey, { [field]: value })
      message.success('更新成功')
    } catch (e: any) {
      message.error(e.message || '更新失败')
    }
  }

  return (
    <div>
      {sections.map(s => (
        <Card key={s.section_key} title={s.section_key} style={{ marginBottom: 16 }} extra={<Tag color={s.is_visible ? 'green' : 'red'}>{s.is_visible ? '显示' : '隐藏'}</Tag>}>
          <Form layout="vertical">
            <Form.Item label="标题">
              <Input
                defaultValue={s.title}
                onBlur={e => handleSave(s.section_key, 'title', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="副标题">
              <Input
                defaultValue={s.subtitle}
                onBlur={e => handleSave(s.section_key, 'subtitle', e.target.value)}
              />
            </Form.Item>
            <Form.Item label="内容(JSON)">
              <TextArea
                rows={4}
                defaultValue={s.content ? JSON.stringify(s.content, null, 2) : ''}
                onBlur={e => {
                  try {
                    const json = JSON.parse(e.target.value)
                    handleSave(s.section_key, 'content', json)
                  } catch {
                    message.error('JSON格式错误')
                  }
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button onClick={() => handleSave(s.section_key, 'is_visible', !s.is_visible)}>
                {s.is_visible ? '隐藏' : '显示'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ))}
    </div>
  )
}

function TemplateTab() {
  const [templates, setTemplates,] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(false)
  const [editTemplate, setEditTemplate] = useState<any>(null)
  const [form] = Form.useForm()

  const fetchTemplates = () => {
    setLoading(true)
    templateApi.adminList().then((res: any) => {
      setTemplates(res?.data || res || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTemplates() }, [])

  const DEFAULT_STYLE = {
    primaryColor: '#1677ff',
    backgroundColor: '#ffffff',
    chatBubbleUser: '#1677ff',
    chatBubbleBot: '#f0f0f0',
    fontFamily: 'system-ui',
    fontSize: 14,
    borderRadius: 8,
    headerVisible: true,
    headerTitle: 'AI助手',
    inputPlaceholder: '请输入您的问题...',
    sendButtonColor: '#1677ff',
    welcomeMessage: '您好，请问有什么可以帮助您的？',
  }

  const handleAdd = () => {
    setEditTemplate(null)
    form.resetFields()
    form.setFieldsValue({
      name: '',
      description: '',
      is_default: false,
      is_active: true,
      style_config: JSON.stringify(DEFAULT_STYLE, null, 2),
      layout_config: JSON.stringify({ showSidebar: false, maxWidth: 800, messageMaxWidth: '70%', showTimestamp: true, showAvatar: true, markdownRender: true, codeHighlight: true }, null, 2),
    })
    setEditModal(true)
  }

  const handleEdit = (record: any) => {
    setEditTemplate(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      is_default: record.is_default,
      is_active: record.is_active,
      style_config: record.style_config ? JSON.stringify(record.style_config, null, 2) : JSON.stringify(DEFAULT_STYLE, null, 2),
      layout_config: record.layout_config ? JSON.stringify(record.layout_config, null, 2) : '',
    })
    setEditModal(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const styleConfig = JSON.parse(values.style_config)
      const layoutConfig = values.layout_config ? JSON.parse(values.layout_config) : null
      const payload = {
        name: values.name,
        description: values.description || null,
        style_config: styleConfig,
        layout_config: layoutConfig,
        is_default: values.is_default,
        is_active: values.is_active,
      }

      if (editTemplate) {
        await templateApi.update(editTemplate.id, payload)
        message.success('更新成功')
      } else {
        await templateApi.create(payload)
        message.success('添加成功')
      }
      setEditModal(false)
      fetchTemplates()
    } catch (e: any) {
      if (e.message) message.error(e.message)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description', render: (v: string) => v || '-' },
    { title: '默认', dataIndex: 'is_default', key: 'is_default', render: (v: boolean) => v ? <Tag color="blue">默认</Tag> : null },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => {
            try {
              await templateApi.delete(record.id)
              message.success('已删除')
              fetchTemplates()
            } catch (e: any) {
              message.error(e.message || '删除失败')
            }
          }}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>添加模板</Button>
      </div>
      <Table columns={columns} dataSource={templates} rowKey="id" loading={loading} pagination={false} />
      <Modal
        title={editTemplate ? '编辑模板' : '添加模板'}
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input />
          </Form.Item>
          <Form.Item name="is_default" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="style_config" label="样式配置(JSON)" rules={[{ required: true, message: '请输入样式配置' }]}>
            <TextArea rows={10} />
          </Form.Item>
          <Form.Item name="layout_config" label="布局配置(JSON)">
            <TextArea rows={6} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function NavLinkTab() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navLinkApi.adminList().then((res: any) => {
      setLinks(res?.data || res || [])
    }).finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: 'URL', dataIndex: 'url', key: 'url', ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => v || '-' },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 70 },
    { title: '显示', dataIndex: 'is_visible', key: 'is_visible', render: (v: boolean) => v ? <Tag color="green">显示</Tag> : <Tag>隐藏</Tag> },
    {
      title: '操作', key: 'action', width: 120,
      render: (_: any, record: any) => (
        <Popconfirm title="确定删除？" onConfirm={async () => {
          try {
            await navLinkApi.delete(record.id)
            message.success('已删除')
            setLinks(prev => prev.filter(l => l.id !== record.id))
          } catch (e: any) {
            message.error(e.message || '删除失败')
          }
        }}>
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={async () => {
          const name = prompt('应用名称:')
          const url = prompt('链接地址:')
          if (name && url) {
            try {
              await navLinkApi.create({ name, url, is_visible: true })
              message.success('添加成功')
              navLinkApi.adminList().then((res: any) => setLinks(res?.data || res || []))
            } catch (e: any) {
              message.error(e.message || '添加失败')
            }
          }
        }}>添加导航</Button>
      </div>
      <Table columns={columns} dataSource={links} rowKey="id" loading={loading} pagination={false} />
    </div>
  )
}

function AdminPathTab() {
  const [path, setPath] = useState('')
  const [salt, setSalt] = useState('')

  useEffect(() => {
    systemApi.adminPath().then((res: any) => {
      const data = res?.data || res
      setPath(data?.admin_path || '')
      setSalt(data?.salt || '')
    })
  }, [])

  const handleRegenerate = async () => {
    try {
      const res = await systemApi.regenerateAdminPath()
      const data = res?.data || res
      setPath(data?.admin_path || '')
      setSalt(data?.salt || '')
      localStorage.setItem('xinfu_admin_salt', data?.salt || '')
      message.success('管理路径已重新生成，请使用新路径访问')
    } catch (e: any) {
      message.error(e.message || '操作失败')
    }
  }

  return (
    <Card>
      <Title level={5}>当前管理路径</Title>
      <p style={{ fontSize: 18, fontFamily: 'monospace', background: '#f5f5f5', padding: '12px 16px', borderRadius: 4, margin: '16px 0' }}>
        {path || '加载中...'}
      </p>
      <p style={{ color: '#999', marginBottom: 16 }}>
        管理路径包含随机值，用于防止URL扫描。重新生成后旧路径将立即失效。
      </p>
      <Popconfirm
        title="确定重新生成管理路径？当前路径将立即失效！"
        onConfirm={handleRegenerate}
      >
        <Button type="primary" danger>重新生成管理路径</Button>
      </Popconfirm>
    </Card>
  )
}
