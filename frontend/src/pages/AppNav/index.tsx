import { useEffect, useState } from 'react'
import { Layout, Card, Row, Col, Typography, Spin } from 'antd'
import { AppstoreOutlined, LinkOutlined } from '@ant-design/icons'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { navLinkApi } from '../../services/api'

const { Title, Paragraph, Text } = Typography

export default function AppNav() {
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navLinkApi.list().then((res: any) => {
      setLinks(res?.data || res || [])
    }).finally(() => setLoading(false))
  }, [])

  // 按分类分组
  const grouped = links.reduce((acc: any, link: any) => {
    const cat = link.category || '其他'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(link)
    return acc
  }, {})

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Title level={2} style={{ marginBottom: 32 }}>应用导航</Title>

        {loading ? (
          <div className="page-loading"><Spin size="large" /></div>
        ) : links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <AppstoreOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} type="secondary" style={{ marginTop: 16 }}>暂无应用</Title>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]: [string, any]) => (
            <div key={category} style={{ marginBottom: 32 }}>
              <Title level={4} style={{ marginBottom: 16, color: '#1677ff' }}>{category}</Title>
              <Row gutter={[24, 24]}>
                {items.map((link: any) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={link.id}>
                    <Card
                      hoverable
                      onClick={() => {
                        if (link.is_external) {
                          window.open(link.url, '_blank')
                        } else {
                          window.location.href = link.url
                        }
                      }}
                      style={{ height: '100%' }}
                    >
                      <Card.Meta
                        avatar={
                          link.icon_url ? (
                            <img src={link.icon_url} style={{ width: 40, height: 40 }} alt={link.name} />
                          ) : (
                            <AppstoreOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                          )
                        }
                        title={
                          <span>
                            {link.name}
                            {link.is_external && <LinkOutlined style={{ marginLeft: 8, fontSize: 12, color: '#999' }} />}
                          </span>
                        }
                        description={link.description || link.url}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))
        )}
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
