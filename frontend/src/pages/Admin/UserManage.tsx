import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space, Popconfirm } from 'antd'
import { userApi } from '../../services/api'

export default function UserManage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [resetModal, setResetModal] = useState(false)
  const [resetUser, setResetUser] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [resetForm] = Form.useForm()
  const [form] = Form.useForm()

  useEffect(() => {
    userApi.roles().then((res: any) => {
      setRoles(res?.data || res || [])
    }).catch(() => {})
  }, [])

  const fetchUsers = () => {
    setLoading(true)
    userApi.list({ page, page_size: 20, keyword: keyword || undefined }).then((res: any) => {
      const data = res?.data || res
      setUsers(data?.items || [])
      setTotal(data?.total || 0)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, keyword])

  const handleEdit = (user: any) => {
    setEditUser(user)
    form.setFieldsValue({
      display_name: user.display_name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      status: user.status,
    })
    setEditModal(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await userApi.update(editUser.id, values)
      message.success('更新成功')
      setEditModal(false)
      fetchUsers()
    } catch (e: any) {
      message.error(e.message || '更新失败')
    }
  }

  const handleDelete = async (userId: number) => {
    try {
      await userApi.delete(userId)
      message.success('删除成功')
      fetchUsers()
    } catch (e: any) {
      message.error(e.message || '删除失败')
    }
  }

  const handleResetPassword = (user: any) => {
    setResetUser(user)
    resetForm.resetFields()
    setResetModal(true)
  }

  const handleResetSave = async () => {
    try {
      const values = await resetForm.validateFields()
      await userApi.resetPassword(resetUser.id, { new_password: values.new_password })
      message.success('密码重置成功')
      setResetModal(false)
    } catch (e: any) {
      message.error(e.message || '重置失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'display_name', key: 'display_name', render: (v: string) => v || '-' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v: string) => v || '-' },
    { title: '角色', dataIndex: 'role_name', key: 'role_name', render: (v: string) => <Tag color={v === 'admin' ? 'red' : 'blue'}>{v || 'user'}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '正常' : '禁用'}</Tag>,
    },
    { title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', render: (v: string) => v ? new Date(v).toLocaleString() : '-', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleResetPassword(record)}>重置密码</Button>
          <Popconfirm
            title="确定删除该用户？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input.Search
          placeholder="搜索用户名/姓名/邮箱"
          allowClear
          onSearch={setKeyword}
          style={{ maxWidth: 320 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
      />
      <Modal
        title="编辑用户"
        open={editModal}
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="display_name" label="显示姓名">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="role_id" label="角色">
            <Select options={roles.map((r: any) => ({
              label: r.name === 'admin' ? '管理员' : r.name === 'user' ? '普通用户' : r.name,
              value: r.id,
            }))} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[
              { label: '正常', value: 'active' },
              { label: '禁用', value: 'disabled' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={`重置密码 - ${resetUser?.username || ''}`}
        open={resetModal}
        onOk={handleResetSave}
        onCancel={() => setResetModal(false)}
      >
        <Form form={resetForm} layout="vertical">
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
            label="确认密码"
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
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
