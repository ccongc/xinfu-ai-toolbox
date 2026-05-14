"""系统管理接口"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, require_admin
from ...core.admin_path import generate_admin_salt, get_admin_path_prefix
from ...models.user import User
from ...models.system_config import SystemConfig
from ...schemas.system_config import SystemConfigResponse, SystemConfigUpdateRequest, AdminPathResponse
from ...utils.pagination import ApiResponse

router = APIRouter()


@router.get("/configs", response_model=ApiResponse[list[SystemConfigResponse]])
async def list_configs(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """获取系统配置"""
    result = await db.execute(select(SystemConfig).order_by(SystemConfig.config_key))
    configs = result.scalars().all()
    # 脱敏：不返回敏感配置的值
    sensitive_keys = {"admin_path_salt", "wecom_secret"}
    items = []
    for c in configs:
        value = "***" if c.config_key in sensitive_keys else c.config_value
        items.append(SystemConfigResponse(
            id=c.id, config_key=c.config_key, config_value=value,
            value_type=c.value_type, description=c.description,
        ))
    return ApiResponse(data=items)


@router.put("/configs/{config_key}", response_model=ApiResponse[SystemConfigResponse])
async def update_config(
    config_key: str, req: SystemConfigUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """更新配置项"""
    result = await db.execute(select(SystemConfig).where(SystemConfig.config_key == config_key))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="配置项不存在")
    config.config_value = req.config_value
    await db.commit()
    await db.refresh(config)
    return ApiResponse(data=SystemConfigResponse(
        id=config.id, config_key=config.config_key, config_value=config.config_value,
        value_type=config.value_type, description=config.description,
    ))


@router.get("/admin-path", response_model=ApiResponse[AdminPathResponse])
async def get_admin_path(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """查看当前管理路径"""
    result = await db.execute(select(SystemConfig).where(SystemConfig.config_key == "admin_path_salt"))
    config = result.scalar_one_or_none()
    salt = config.config_value if config else ""
    return ApiResponse(data=AdminPathResponse(admin_path=get_admin_path_prefix(salt), salt=salt))


@router.post("/admin-path/regenerate", response_model=ApiResponse[AdminPathResponse])
async def regenerate_admin_path(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """重新生成管理路径随机值"""
    new_salt = generate_admin_salt()
    result = await db.execute(select(SystemConfig).where(SystemConfig.config_key == "admin_path_salt"))
    config = result.scalar_one_or_none()
    if config:
        config.config_value = new_salt
    else:
        config = SystemConfig(config_key="admin_path_salt", config_value=new_salt, value_type="string", description="管理路径随机值")
        db.add(config)
    await db.commit()
    return ApiResponse(data=AdminPathResponse(admin_path=get_admin_path_prefix(new_salt), salt=new_salt))


@router.get("/stats")
async def get_system_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """系统统计概览"""
    from ...models.agent import Agent
    from ...models.operation_log import OperationLog
    from datetime import datetime, timedelta, timezone

    # 用户总数
    user_count = (await db.execute(select(func.count(User.id)))).scalar()
    # Agent总数
    agent_count = (await db.execute(select(func.count(Agent.id)))).scalar()
    # 待审核Agent
    pending_count = (await db.execute(select(func.count(Agent.id)).where(Agent.status == "pending"))).scalar()
    # 今日访问
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_visits = (await db.execute(
        select(func.count(OperationLog.id)).where(OperationLog.created_at >= today)
    )).scalar()

    from sqlalchemy import func
    return ApiResponse(data={
        "user_count": user_count,
        "agent_count": agent_count,
        "pending_count": pending_count,
        "today_visits": today_visits,
    })
