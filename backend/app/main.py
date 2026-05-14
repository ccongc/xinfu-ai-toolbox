"""信服AI工具箱 - FastAPI主入口"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.router import api_router
from .middleware.logging import LoggingMiddleware
from .middleware.rate_limit import RateLimitMiddleware
from .database import async_engine, Base


async def _get_admin_salt() -> str:
    """获取管理路径salt值"""
    from sqlalchemy import select
    from .database import async_session_factory
    from .models.system_config import SystemConfig
    try:
        async with async_session_factory() as session:
            result = await session.execute(select(SystemConfig).where(SystemConfig.config_key == "admin_path_salt"))
            config = result.scalar_one_or_none()
            return config.config_value if config else ""
    except Exception:
        return ""


_initialized = False


async def _ensure_initialized():
    """确保数据库和种子数据已初始化（延迟初始化）"""
    global _initialized
    if _initialized:
        return
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await _init_seed_data()
        _initialized = True
    except Exception as e:
        print(f"⚠️ 数据库初始化失败: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    # 启动时尝试初始化（失败不崩溃，首次请求时重试）
    await _ensure_initialized()

    yield

    # 关闭
    await async_engine.dispose()


async def _init_seed_data():
    """初始化种子数据"""
    from sqlalchemy import select
    from .database import async_session_factory
    from .models.role import Role
    from .models.user import User
    from .models.system_config import SystemConfig
    from .models.chat_template import ChatTemplate
    from .models.homepage_section import HomepageSection
    from .core.security import hash_password
    from .core.admin_path import generate_admin_salt
    import json

    async with async_session_factory() as session:
        # 检查是否已初始化
        result = await session.execute(select(Role))
        if result.scalar_one_or_none():
            return

        # 创建角色
        admin_role = Role(name="admin", description="系统管理员")
        user_role = Role(name="user", description="普通用户")
        session.add_all([admin_role, user_role])
        await session.flush()

        # 创建管理员
        admin = User(
            username="admin",
            display_name="系统管理员",
            hashed_password=hash_password("admin123"),
            role_id=admin_role.id,
            status="active",
        )
        session.add(admin)
        await session.flush()

        # 系统配置
        salt = generate_admin_salt()
        configs = [
            SystemConfig(config_key="admin_path_salt", config_value=salt, value_type="string", description="管理路径随机值"),
            SystemConfig(config_key="wecom_corp_id", config_value="", value_type="string", description="企业微信CorpID"),
            SystemConfig(config_key="wecom_agent_id", config_value="", value_type="string", description="企业微信AgentID"),
            SystemConfig(config_key="wecom_secret", config_value="", value_type="string", description="企业微信Secret"),
            SystemConfig(config_key="site_name", config_value="信服AI工具箱", value_type="string", description="站点名称"),
            SystemConfig(config_key="site_logo", config_value="", value_type="string", description="站点Logo"),
        ]
        session.add_all(configs)

        # 默认对话模板
        default_style = {
            "primaryColor": "#1677ff",
            "backgroundColor": "#ffffff",
            "chatBubbleUser": "#1677ff",
            "chatBubbleBot": "#f0f0f0",
            "fontFamily": "system-ui",
            "fontSize": 14,
            "borderRadius": 8,
            "headerVisible": True,
            "headerTitle": "AI助手",
            "inputPlaceholder": "请输入您的问题...",
            "sendButtonColor": "#1677ff",
            "welcomeMessage": "您好，请问有什么可以帮助您的？",
        }
        default_layout = {
            "showSidebar": False,
            "maxWidth": 800,
            "messageMaxWidth": "70%",
            "showTimestamp": True,
            "showAvatar": True,
            "markdownRender": True,
            "codeHighlight": True,
        }
        template = ChatTemplate(
            name="默认科技蓝",
            description="信服品牌主色调，适合通用场景",
            style_config=json.dumps(default_style, ensure_ascii=False),
            layout_config=json.dumps(default_layout, ensure_ascii=False),
            is_default=True,
            is_active=True,
        )
        session.add(template)

        # 首页默认内容
        homepage_data = [
            HomepageSection(
                section_key="hero", title="信服AI工具箱",
                subtitle="赋能企业智能化转型",
                content=json.dumps({
                    "backgroundImage": "",
                    "ctaText": "立即体验",
                    "ctaLink": "/agent-market",
                    "description": "一站式AI Agent管理平台，汇聚智能工具，驱动业务创新",
                }, ensure_ascii=False),
                sort_order=0, is_visible=True,
            ),
            HomepageSection(
                section_key="capability", title="核心能力",
                subtitle="全方位AI能力支撑",
                content=json.dumps({
                    "items": [
                        {"icon": "robot", "title": "智能Agent", "description": "集成多种AI Agent，按需调用"},
                        {"icon": "safety", "title": "安全可靠", "description": "企业级安全保障，数据隐私保护"},
                        {"icon": "integration", "title": "灵活集成", "description": "对接FastGPT/Coze/Dify/n8n等平台"},
                        {"icon": "management", "title": "统一管理", "description": "集中管理Agent生命周期"},
                    ]
                }, ensure_ascii=False),
                sort_order=1, is_visible=True,
            ),
            HomepageSection(
                section_key="solution", title="解决方案",
                subtitle="覆盖多个业务场景",
                content=json.dumps({
                    "items": [
                        {"title": "智能客服", "description": "7×24小时AI客服，提升服务效率"},
                        {"title": "知识管理", "description": "企业知识库智能问答，快速获取信息"},
                        {"title": "流程自动化", "description": "AI驱动的业务流程自动化"},
                        {"title": "数据分析", "description": "智能数据洞察，辅助决策"},
                    ]
                }, ensure_ascii=False),
                sort_order=2, is_visible=True,
            ),
            HomepageSection(
                section_key="partner", title="合作伙伴",
                subtitle="携手行业伙伴共创价值",
                content=json.dumps({"items": []}, ensure_ascii=False),
                sort_order=3, is_visible=True,
            ),
        ]
        session.add_all(homepage_data)

        await session.commit()

        # 打印管理路径
        print(f"\n{'='*50}")
        print(f"  管理后台地址: /admin-{salt}")
        print(f"  默认管理员: admin / admin123")
        print(f"{'='*50}\n")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 延迟初始化中间件
from starlette.middleware.base import BaseHTTPMiddleware


class InitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        await _ensure_initialized()
        return await call_next(request)


app.add_middleware(InitMiddleware)

# 自定义中间件
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

# 注册路由
app.include_router(api_router)


@app.get("/health")
async def health_check():
    """健康检查（不依赖数据库）"""
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/v1/config/site")
async def get_site_config():
    """获取站点公开配置"""
    from sqlalchemy import select
    from .database import async_session_factory
    from .models.system_config import SystemConfig
    async with async_session_factory() as session:
        result = await session.execute(
            select(SystemConfig).where(SystemConfig.config_key.in_(["site_name", "site_logo"]))
        )
        configs = {c.config_key: c.config_value for c in result.scalars()}
        return {
            "siteName": configs.get("site_name", settings.APP_NAME),
            "siteLogo": configs.get("site_logo", ""),
        }


# 静态文件服务（前端构建产物）- 必须放在所有路由之后
from fastapi.staticfiles import StaticFiles
from pathlib import Path

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
