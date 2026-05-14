"""Agent接口（用户侧 + 管理侧）"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from ...core.deps import get_db, get_current_user, require_admin, get_current_user_optional
from ...models.agent import Agent
from ...models.user import User
from ...models.role import Role
from ...schemas.agent import (
    AgentCreateRequest, AgentUpdateRequest, AgentResponse, AgentMarketResponse,
    AgentReviewRequest, AgentListQuery,
)
from ...utils.pagination import PaginatedResponse, ApiResponse
from ...utils.op_log import write_op_log

# 用户侧路由
user_router = APIRouter()
# 管理侧路由
admin_router = APIRouter()


def _parse_json_field(value: str | None, default=None):
    """安全解析JSON字段"""
    if not value:
        return default
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return default


def _agent_to_response(agent: Agent, publisher_name: str | None = None) -> AgentResponse:
    return AgentResponse(
        id=agent.id, name=agent.name, description=agent.description,
        detail=agent.detail, scenarios=agent.scenarios, design_idea=agent.design_idea,
        icon_url=agent.icon_url, cover_url=agent.cover_url, category=agent.category,
        tags=_parse_json_field(agent.tags, []),
        embed_type=agent.embed_type, embed_code=agent.embed_code,
        api_endpoint=agent.api_endpoint, api_config=_parse_json_field(agent.api_config, {}),
        template_id=agent.template_id, publisher_id=agent.publisher_id,
        publisher_name=publisher_name, is_official=agent.is_official,
        status=agent.status, review_comment=agent.review_comment,
        reviewer_id=agent.reviewer_id, reviewed_at=agent.reviewed_at,
        sort_order=agent.sort_order, view_count=agent.view_count,
        created_at=agent.created_at, updated_at=agent.updated_at,
    )


async def _get_publisher_name(db: AsyncSession, publisher_id: int | None, is_official: bool) -> str | None:
    if is_official:
        return "系统/官方"
    if not publisher_id:
        return None
    result = await db.execute(select(User).where(User.id == publisher_id))
    user = result.scalar_one_or_none()
    return user.display_name or user.username if user else None


# ===== 用户侧 =====

@user_router.get("", response_model=ApiResponse[PaginatedResponse[AgentMarketResponse]])
async def market_list(
    page: int = 1, page_size: int = 20,
    keyword: str | None = None, category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Agent市场列表（仅approved）"""
    query = select(Agent).where(Agent.status == "approved")
    count_query = select(func.count(Agent.id)).where(Agent.status == "approved")

    if keyword:
        cond = Agent.name.ilike(f"%{keyword}%") | Agent.description.ilike(f"%{keyword}%")
        query = query.where(cond)
        count_query = count_query.where(cond)
    if category:
        query = query.where(Agent.category == category)
        count_query = count_query.where(Agent.category == category)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Agent.sort_order.desc(), Agent.created_at.desc())
    result = await db.execute(query)
    agents = result.scalars().all()

    items = []
    for a in agents:
        name = await _get_publisher_name(db, a.publisher_id, a.is_official)
        items.append(AgentMarketResponse(
            id=a.id, name=a.name, description=a.description,
            icon_url=a.icon_url, cover_url=a.cover_url, category=a.category,
            tags=_parse_json_field(a.tags, []), embed_type=a.embed_type,
            is_official=a.is_official, publisher_name=name,
            view_count=a.view_count, sort_order=a.sort_order,
        ))
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


@user_router.get("/categories", response_model=ApiResponse[list[str]])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """获取Agent分类列表"""
    result = await db.execute(
        select(Agent.category).where(Agent.status == "approved", Agent.category.isnot(None)).distinct()
    )
    return ApiResponse(data=[r[0] for r in result.all() if r[0]])


@user_router.get("/{agent_id}", response_model=ApiResponse[AgentResponse])
async def agent_detail(agent_id: int, db: AsyncSession = Depends(get_db)):
    """Agent详情"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.status == "approved"))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在或未上架")
    name = await _get_publisher_name(db, agent.publisher_id, agent.is_official)
    return ApiResponse(data=_agent_to_response(agent, name))


@user_router.post("/{agent_id}/view")
async def record_view(agent_id: int, db: AsyncSession = Depends(get_db)):
    """记录浏览"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent:
        agent.view_count = (agent.view_count or 0) + 1
        await db.commit()
    return ApiResponse(message="ok")


@user_router.post("", response_model=ApiResponse[AgentResponse])
async def publish_agent(
    req: AgentCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """用户发布Agent"""
    agent = Agent(
        name=req.name, description=req.description, detail=req.detail,
        scenarios=req.scenarios, design_idea=req.design_idea,
        icon_url=req.icon_url, cover_url=req.cover_url, category=req.category,
        tags=json.dumps(req.tags, ensure_ascii=False) if req.tags else None,
        embed_type=req.embed_type, embed_code=req.embed_code,
        api_endpoint=req.api_endpoint,
        api_config=json.dumps(req.api_config, ensure_ascii=False) if req.api_config else None,
        template_id=req.template_id, publisher_id=user.id,
        is_official=False, status="pending",
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    await write_op_log(db, user.id, "publish_agent", "agent", agent.id, {"name": agent.name})
    return ApiResponse(data=_agent_to_response(agent, user.display_name or user.username))


@user_router.put("/{agent_id}", response_model=ApiResponse[AgentResponse])
async def update_my_agent(
    agent_id: int, req: AgentUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """编辑自己发布的Agent"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.publisher_id == user.id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在或非本人发布")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("tags", "api_config") and value is not None:
            setattr(agent, field, json.dumps(value, ensure_ascii=False))
        else:
            setattr(agent, field, value)

    # 编辑后重新提交审核
    if agent.status in ("approved", "rejected"):
        agent.status = "pending"
        agent.review_comment = None
        agent.reviewer_id = None

    await db.commit()
    await db.refresh(agent)
    return ApiResponse(data=_agent_to_response(agent, user.display_name or user.username))


@user_router.get("/my/list", response_model=ApiResponse[PaginatedResponse[AgentResponse]])
async def my_agents(
    page: int = 1, page_size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """我发布的Agent列表"""
    count_result = await db.execute(select(func.count(Agent.id)).where(Agent.publisher_id == user.id))
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Agent).where(Agent.publisher_id == user.id)
        .offset(offset).limit(page_size).order_by(Agent.created_at.desc())
    )
    agents = result.scalars().all()
    items = [_agent_to_response(a, user.display_name or user.username) for a in agents]
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


# ===== 管理侧 =====

@admin_router.get("", response_model=ApiResponse[PaginatedResponse[AgentResponse]])
async def admin_list_agents(
    page: int = 1, page_size: int = 20,
    keyword: str | None = None, category: str | None = None,
    status_filter: str | None = None, is_official: bool | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """全部Agent列表"""
    query = select(Agent)
    count_query = select(func.count(Agent.id))

    if keyword:
        cond = Agent.name.ilike(f"%{keyword}%") | Agent.description.ilike(f"%{keyword}%")
        query = query.where(cond)
        count_query = count_query.where(cond)
    if category:
        query = query.where(Agent.category == category)
        count_query = count_query.where(Agent.category == category)
    if status_filter:
        query = query.where(Agent.status == status_filter)
        count_query = count_query.where(Agent.status == status_filter)
    if is_official is not None:
        query = query.where(Agent.is_official == is_official)
        count_query = count_query.where(Agent.is_official == is_official)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size).order_by(Agent.created_at.desc()))
    agents = result.scalars().all()

    items = []
    for a in agents:
        name = await _get_publisher_name(db, a.publisher_id, a.is_official)
        items.append(_agent_to_response(a, name))
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


@admin_router.post("", response_model=ApiResponse[AgentResponse])
async def admin_publish_agent(
    req: AgentCreateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """管理员发布Agent（自动official+approved）"""
    agent = Agent(
        name=req.name, description=req.description, detail=req.detail,
        scenarios=req.scenarios, design_idea=req.design_idea,
        icon_url=req.icon_url, cover_url=req.cover_url, category=req.category,
        tags=json.dumps(req.tags, ensure_ascii=False) if req.tags else None,
        embed_type=req.embed_type, embed_code=req.embed_code,
        api_endpoint=req.api_endpoint,
        api_config=json.dumps(req.api_config, ensure_ascii=False) if req.api_config else None,
        template_id=req.template_id, publisher_id=admin.id,
        is_official=True, status="approved",
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    await write_op_log(db, admin.id, "admin_publish_agent", "agent", agent.id, {"name": agent.name})
    return ApiResponse(data=_agent_to_response(agent, "系统/官方"))


@admin_router.put("/{agent_id}/approve")
async def approve_agent(
    agent_id: int, req: AgentReviewRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审核通过"""
    from datetime import datetime, timezone
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在")
    agent.status = "approved"
    agent.reviewer_id = admin.id
    agent.reviewed_at = datetime.utcnow()
    agent.review_comment = req.comment
    await db.commit()
    await write_op_log(db, admin.id, "approve_agent", "agent", agent_id, {"name": agent.name})
    return ApiResponse(message="审核通过")


@admin_router.put("/{agent_id}/reject")
async def reject_agent(
    agent_id: int, req: AgentReviewRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """审核拒绝"""
    from datetime import datetime
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在")
    agent.status = "rejected"
    agent.reviewer_id = admin.id
    agent.reviewed_at = datetime.utcnow()
    agent.review_comment = req.comment
    await db.commit()
    await write_op_log(db, admin.id, "reject_agent", "agent", agent_id, {"name": agent.name})
    return ApiResponse(message="已拒绝")


@admin_router.put("/{agent_id}", response_model=ApiResponse[AgentResponse])
async def admin_update_agent(
    agent_id: int, req: AgentUpdateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """管理员编辑Agent"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ("tags", "api_config") and value is not None:
            setattr(agent, field, json.dumps(value, ensure_ascii=False))
        else:
            setattr(agent, field, value)
    await db.commit()
    await db.refresh(agent)
    name = await _get_publisher_name(db, agent.publisher_id, agent.is_official)
    return ApiResponse(data=_agent_to_response(agent, name))


@admin_router.put("/{agent_id}/offline")
async def offline_agent(agent_id: int, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """下架Agent"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在")
    agent.status = "offline"
    await db.commit()
    await write_op_log(db, admin.id, "offline_agent", "agent", agent_id, {"name": agent.name})
    return ApiResponse(message="已下架")


@admin_router.delete("/{agent_id}")
async def delete_agent(agent_id: int, admin: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """删除Agent"""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Agent不存在")
    await write_op_log(db, admin.id, "delete_agent", "agent", agent_id, {"name": agent.name})
    await db.delete(agent)
    await db.commit()
    return ApiResponse(message="已删除")
