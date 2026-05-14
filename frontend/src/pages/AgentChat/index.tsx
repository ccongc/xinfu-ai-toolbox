import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout, Spin, Button, Input, message, Typography } from 'antd'
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import Header from '../../components/Header'
import { agentApi, templateApi } from '../../services/api'
import { isLoggedIn } from '../../utils/auth'

const { Text } = Typography

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AgentChat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
      return
    }
    if (!id) return

    const fetchData = async () => {
      try {
        const agentRes = await agentApi.detail(Number(id))
        const agentData = agentRes?.data || agentRes
        setAgent(agentData)

        // 获取模板
        const templateId = agentData.template_id
        if (templateId) {
          const tRes = await templateApi.detail(templateId)
          setTemplate(tRes?.data || tRes)
        } else {
          const tRes = await templateApi.getDefault()
          setTemplate(tRes?.data || tRes)
        }
      } catch {
        message.error('获取Agent信息失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const styleConfig = template?.style_config || {}
  const layoutConfig = template?.layout_config || {}

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return
    const userMsg = inputValue.trim()
    setInputValue('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    try {
      if (agent?.embed_type === 'api' && agent?.api_endpoint) {
        // API模式调用
        const res = await fetch(agent.api_endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(agent.api_config?.headers || {}),
          },
          body: JSON.stringify({
            message: userMsg,
            ...(agent.api_config?.params || {}),
          }),
        })
        const data = await res.json()
        const reply = data?.choices?.[0]?.message?.content || data?.response || data?.answer || data?.data || JSON.stringify(data)
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } else {
        // 无API端点，模拟回复
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '该Agent暂未配置API端点，无法进行对话。',
        }])
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `请求失败: ${e.message}`,
      }])
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <div className="page-loading"><Spin size="large" /></div>
      </Layout>
    )
  }

  // iframe模式
  if (agent?.embed_type === 'iframe' && agent?.embed_code) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <div dangerouslySetInnerHTML={{ __html: agent.embed_code }} />
        </div>
      </Layout>
    )
  }

  // API模式 - 自定义对话界面
  const primaryColor = styleConfig.primaryColor || '#1677ff'
  const bgColor = styleConfig.backgroundColor || '#ffffff'
  const userBubbleColor = styleConfig.chatBubbleUser || primaryColor
  const botBubbleColor = styleConfig.chatBubbleBot || '#f0f0f0'
  const welcomeMsg = styleConfig.welcomeMessage || '您好，请问有什么可以帮助您的？'
  const placeholder = styleConfig.inputPlaceholder || '请输入您的问题...'

  return (
    <Layout style={{ minHeight: '100vh', background: bgColor }}>
      <Header />
      <div className="chat-container">
        {/* 头部 */}
        <div style={{
          padding: '12px 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(`/agent/${id}`)}
          />
          <Text strong>{agent?.name || 'AI对话'}</Text>
        </div>

        {/* 消息区域 */}
        <div className="chat-messages" style={{ background: bgColor }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.45)' }}>
              {welcomeMsg}
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}`}
              style={{
                background: msg.role === 'user' ? userBubbleColor : botBubbleColor,
                color: msg.role === 'user' ? '#fff' : 'rgba(0,0,0,0.88)',
              }}
            >
              {msg.content}
            </div>
          ))}
          {sending && (
            <div className="chat-bubble chat-bubble-bot" style={{ background: botBubbleColor }}>
              <Spin size="small" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="chat-input-area">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              size="large"
              placeholder={placeholder}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={handleSend}
              disabled={sending}
            />
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              style={{ background: styleConfig.sendButtonColor || primaryColor }}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}
