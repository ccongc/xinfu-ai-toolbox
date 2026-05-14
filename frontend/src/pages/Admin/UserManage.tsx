import { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space } from 'antd'
import { userApi } from '../../services/api'

export default function UserManage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form] = Form.useForm()

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
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
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
            <Select options={[
              { label: '管理员', value: 1 },
              { label: '普通用户', value: 2 },
            ]} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[
              { label: '正常', value: 'active' },
              { label: '禁用', value: 'disabled' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
