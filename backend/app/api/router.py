"""API路由汇总"""
from fastapi import APIRouter

from .v1 import auth, users, agents, models, templates, homepage, nav_links, logs, system

api_router = APIRouter(prefix="/api/v1")

# 用户侧接口
api_router.include_router(auth.router, prefix="/auth", tags=["认证"])
api_router.include_router(agents.user_router, prefix="/agents", tags=["Agent市场"])
api_router.include_router(homepage.public_router, prefix="/homepage", tags=["首页"])
api_router.include_router(nav_links.public_router, prefix="/nav-links", tags=["应用导航"])
api_router.include_router(templates.public_router, prefix="/templates", tags=["模板"])

# 管理侧接口
api_router.include_router(users.router, prefix="/admin/users", tags=["用户管理"])
api_router.include_router(agents.admin_router, prefix="/admin/agents", tags=["Agent管理"])
api_router.include_router(models.router, prefix="/admin/models", tags=["大模型管理"])
api_router.include_router(templates.admin_router, prefix="/admin/templates", tags=["模板管理"])
api_router.include_router(homepage.admin_router, prefix="/admin/homepage", tags=["首页管理"])
api_router.include_router(nav_links.admin_router, prefix="/admin/nav-links", tags=["导航管理"])
api_router.include_router(logs.router, prefix="/admin/logs", tags=["日志"])
api_router.include_router(system.router, prefix="/admin/system", tags=["系统管理"])
