# 信服AI工具箱

一站式AI Agent管理平台，汇聚智能工具，驱动业务创新。

## 功能特性

- **Agent市场** - 浏览和使用公开发布的AI Agent应用
- **Agent发布** - 用户可发布自己的Agent，支持iframe嵌入和API调用两种方式
- **审核机制** - 用户发布的Agent需管理员审核，管理员发布的自动标记为官方
- **对话界面模板** - 可自定义对话界面样式，支持多种风格
- **企业微信登录** - 支持企业微信扫码登录
- **应用导航** - 发布非Agent的业务系统入口
- **管理后台** - 用户管理、Agent管理、大模型管理、日志、系统配置
- **安全防护** - 管理路径随机化，防止URL扫描

## 技术栈

- 后端：FastAPI + SQLAlchemy + PostgreSQL + Redis
- 前端：React + Ant Design + TypeScript + Vite
- 部署：Docker Compose / Railway

## 快速开始

### 本地开发（Docker Compose）

```bash
# 克隆项目
git clone <repo-url>
cd 信服AI工具箱

# 复制环境变量
cp .env.example .env

# 启动所有服务
docker-compose up -d

# 访问
# 前端：http://localhost:3000
# 后端API文档：http://localhost:8000/docs
```

首次启动会自动初始化数据库和种子数据，控制台会打印管理路径和默认管理员账号。

### 一键部署到 Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy)

1. 点击上方按钮或在Railway中导入GitHub仓库
2. 添加PostgreSQL和Redis插件
3. 配置环境变量（参考 `.env.example`）
4. 部署完成后访问分配的域名

### 环境变量

| 变量 | 说明 | 必填 |
|------|------|------|
| DATABASE_URL | PostgreSQL连接字符串 | 是 |
| REDIS_URL | Redis连接字符串 | 是 |
| JWT_SECRET_KEY | JWT密钥（至少32位） | 是 |
| ENCRYPTION_KEY | API Key加密密钥（32位） | 是 |
| WECOM_CORP_ID | 企业微信CorpID | 否 |
| WECOM_AGENT_ID | 企业微信AgentID | 否 |
| WECOM_SECRET | 企业微信Secret | 否 |
| CORS_ORIGINS | 允许的前端域名 | 否 |

## 默认账号

- 管理员：`admin / admin123`
- 管理路径：首次启动时在控制台输出（格式：`/admin-xxxxxxxx`）

## 项目结构

```
信服AI工具箱/
├── backend/          # FastAPI后端
│   ├── app/
│   │   ├── api/v1/   # API路由
│   │   ├── core/     # 核心配置、安全、依赖注入
│   │   ├── models/   # 数据库模型
│   │   ├── schemas/  # 请求/响应Schema
│   │   ├── middleware/ # 中间件
│   │   └── main.py   # 应用入口
│   └── Dockerfile
├── frontend/         # React前端
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   ├── services/ # API调用
│   │   ├── components/ # 共享组件
│   │   └── utils/    # 工具函数
│   └── Dockerfile
├── nginx/            # Nginx配置
└── docker-compose.yml
```

## License

MIT
