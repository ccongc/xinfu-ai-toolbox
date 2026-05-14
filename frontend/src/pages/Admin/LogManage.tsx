import { useEffect, useState } from 'react'
import { Table, Tabs, DatePicker, Input, Typography } from 'antd'
import { logApi } from '../../services/api'

const { RangePicker } = DatePicker

export default function LogManage() {
  const [activeTab, setActiveTab] = useState('operations')
  const [opsLogs, setOpsLogs] = useState<any[]>([])
  const [accessLogs, setAccessLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dateRange, setDateRange] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    const params: any = { page, page_size: 20 }
    if (dateRange?.[0]) params.start_date = dateRange[0].format('YYYY-MM-DD')
    if (dateRange?.[1]) params.end_date = dateRange[1].format('YYYY-MM-DD')

    const apiCall = activeTab === 'operations' ? logApi.operations(params) : logApi.access(params)
    apiCall.then((res: any) => {
      const data = res?.data || res
      if (activeTab === 'operations') {
        setOpsLogs(data?.items || [])
      } else {
        setAccessLogs(data?.items || [])
      }
      setTotal(data?.total || 0)
    }).finally(() => setLoading(false))
  }, [activeTab, page, dateRange])

  const opColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户', dataIndex: 'username', key: 'username', render: (v: string) => v || '-' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type', render: (v: string) => v || '-' },
    { title: '资源ID', dataIndex: 'resource_id', key: 'resource_id', render: (v: number) => v || '-' },
    { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v ? new Date(v).toLocaleString() : '-', width: 170 },
  ]

  const accessColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户ID', dataIndex: 'user_id', key: 'user_id', render: (v: number) => v || '-' },
    { title: '路径', dataIndex: 'path', key: 'path' },
    { title: '方法', dataIndex: 'method', key: 'method', width: 80 },
    { title: '状态码', dataIndex: 'status_code', key: 'status_code', width: 80 },
    { title: '耗时(ms)', dataIndex: 'response_time_ms', key: 'response_time_ms', width: 90 },
    { title: 'IP', dataIndex: 'ip_address', key: 'ip_address', render: (v: string) => v || '-' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v ? new Date(v).toLocaleString() : '-', width: 170 },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <RangePicker onChange={setDateRange} />
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setPage(1) }}
        items={[
          {
            key: 'operations',
            label: '操作日志',
            children: (
              <Table
                columns={opColumns}
                dataSource={opsLogs}
                rowKey="id"
                loading={loading}
                pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
              />
            ),
          },
          {
            key: 'access',
            label: '访问日志',
            children: (
              <Table
                columns={accessColumns}
                dataSource={accessLogs}
                rowKey="id"
                loading={loading}
                pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
              />
            ),
          },
        ]}
      />
    </div>
  )
}
