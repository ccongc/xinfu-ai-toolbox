import { Layout } from 'antd'

const { Footer: AntFooter } = Layout

export default function Footer() {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#001529', color: 'rgba(255,255,255,0.65)' }}>
      <p style={{ margin: 0 }}>信服AI工具箱 &copy; {new Date().getFullYear()} - 赋能企业智能化转型</p>
    </AntFooter>
  )
}
