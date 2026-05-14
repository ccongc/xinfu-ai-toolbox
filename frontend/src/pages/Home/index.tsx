import { useEffect, useState } from 'react'
import { Layout, Button, Card, Row, Col, Typography, Spin } from 'antd'
import {
  RobotOutlined,
  SafetyOutlined,
  ApiOutlined,
  ControlOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { homepageApi } from '../../services/api'

const { Title, Paragraph } = Typography

const iconMap: Record<string, any> = {
  robot: <RobotOutlined style={{ fontSize: 36, color: '#1677ff' }} />,
  safety: <SafetyOutlined style={{ fontSize: 36, color: '#1677ff' }} />,
  integration: <ApiOutlined style={{ fontSize: 36, color: '#1677ff' }} />,
  management: <ControlOutlined style={{ fontSize: 36, color: '#1677ff' }} />,
}

export default function Home() {
  const navigate = useNavigate()
  const [sections, setSections] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    homepageApi.get().then((res: any) => {
      const data = res?.data || res
      const map: any = {}
      ;(data?.sections || []).forEach((s: any) => {
        map[s.section_key] = s
      })
      setSections(map)
    }).finally(() => setLoading(false))
  }, [])

  const hero = sections.hero
  const capability = sections.capability
  const solution = sections.solution

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Layout.Content>
        {/* Hero */}
        <div className="home-hero">
          <div className="home-hero-content">
            <Title level={1} style={{ color: '#fff', marginBottom: 16 }}>
              {hero?.title || '信服AI工具箱'}
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 20, marginBottom: 32 }}>
              {hero?.subtitle || hero?.content?.description || '一站式AI Agent管理平台，汇聚智能工具，驱动业务创新'}
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/agent-market')}
              style={{ height: 48, paddingInline: 32, fontSize: 16 }}
            >
              {hero?.content?.ctaText || '立即体验'}
            </Button>
          </div>
        </div>

        {loading && <div className="page-loading"><Spin size="large" /></div>}

        {/* 核心能力 */}
        {capability && (
          <div className="section">
            <div className="section-title">
              <Title level={2}>{capability.title || '核心能力'}</Title>
              <Paragraph>{capability.subtitle || ''}</Paragraph>
            </div>
            <Row gutter={[24, 24]}>
              {(capability.content?.items || []).map((item: any, idx: number) => (
                <Col xs={24} sm={12} md={6} key={idx}>
                  <Card hoverable style={{ textAlign: 'center', height: '100%' }} bordered={false}>
                    <div style={{ marginBottom: 16 }}>{iconMap[item.icon] || <RobotOutlined style={{ fontSize: 36, color: '#1677ff' }} />}</div>
                    <Title level={4}>{item.title}</Title>
                    <Paragraph type="secondary">{item.description}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 解决方案 */}
        {solution && (
          <div className="section" style={{ background: '#f0f2f5' }}>
            <div className="section-title">
              <Title level={2}>{solution.title || '解决方案'}</Title>
              <Paragraph>{solution.subtitle || ''}</Paragraph>
            </div>
            <Row gutter={[24, 24]}>
              {(solution.content?.items || []).map((item: any, idx: number) => (
                <Col xs={24} sm={12} md={12} key={idx}>
                  <Card hoverable style={{ height: '100%' }} bordered={false}>
                    <Title level={4}>{item.title}</Title>
                    <Paragraph type="secondary">{item.description}</Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* 合作伙伴 */}
        {sections.partner && (
          <div className="section">
            <div className="section-title">
              <Title level={2}>{sections.partner.title || '合作伙伴'}</Title>
              <Paragraph>{sections.partner.subtitle || ''}</Paragraph>
            </div>
          </div>
        )}
      </Layout.Content>
      <Footer />
    </Layout>
  )
}
