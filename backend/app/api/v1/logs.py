"""日志接口"""
import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...core.deps import get_db, require_admin
from ...models.user import User
from ...models.operation_log import OperationLog
from ...models.access_log import AccessLog
from ...schemas.log import OperationLogResponse, AccessLogResponse, LogQuery
from ...utils.pagination import PaginatedResponse, ApiResponse

router = APIRouter()


@router.get("/operations", response_model=ApiResponse[PaginatedResponse[OperationLogResponse]])
async def list_operation_logs(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    start_date: str | None = None, end_date: str | None = None,
    user_id: int | None = None, action: str | None = None,
    resource_type: str | None = None,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """操作日志列表"""
    query = select(OperationLog)
    count_query = select(func.count(OperationLog.id))

    if start_date:
        query = query.where(OperationLog.created_at >= start_date)
        count_query = count_query.where(OperationLog.created_at >= start_date)
    if end_date:
        query = query.where(OperationLog.created_at <= end_date)
        count_query = count_query.where(OperationLog.created_at <= end_date)
    if user_id:
        query = query.where(OperationLog.user_id == user_id)
        count_query = count_query.where(OperationLog.user_id == user_id)
    if action:
        query = query.where(OperationLog.action == action)
        count_query = count_query.where(OperationLog.action == action)
    if resource_type:
        query = query.where(OperationLog.resource_type == resource_type)
        count_query = count_query.where(OperationLog.resource_type == resource_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size).order_by(OperationLog.created_at.desc()))
    logs = result.scalars().all()

    # 批量获取用户名
    user_ids = list(set(l.user_id for l in logs if l.user_id))
    user_map = {}
    if user_ids:
        u_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in u_result.scalars():
            user_map[u.id] = u.display_name or u.username

    items = [
        OperationLogResponse(
            id=l.id, user_id=l.user_id, username=user_map.get(l.user_id),
            action=l.action, resource_type=l.resource_type, resource_id=l.resource_id,
            detail=_safe_json(l.detail), ip_address=l.ip_address,
            user_agent=l.user_agent, created_at=l.created_at,
        ) for l in logs
    ]
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


@router.get("/access", response_model=ApiResponse[PaginatedResponse[AccessLogResponse]])
async def list_access_logs(
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
    start_date: str | None = None, end_date: str | None = None,
    user_id: int | None = None,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """访问日志列表"""
    query = select(AccessLog)
    count_query = select(func.count(AccessLog.id))

    if start_date:
        query = query.where(AccessLog.created_at >= start_date)
        count_query = count_query.where(AccessLog.created_at >= start_date)
    if end_date:
        query = query.where(AccessLog.created_at <= end_date)
        count_query = count_query.where(AccessLog.created_at <= end_date)
    if user_id:
        query = query.where(AccessLog.user_id == user_id)
        count_query = count_query.where(AccessLog.user_id == user_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(query.offset(offset).limit(page_size).order_by(AccessLog.created_at.desc()))
    logs = result.scalars().all()

    items = [
        AccessLogResponse(
            id=l.id, user_id=l.user_id, path=l.path, method=l.method,
            status_code=l.status_code, response_time_ms=l.response_time_ms,
            ip_address=l.ip_address, user_agent=l.user_agent, created_at=l.created_at,
        ) for l in logs
    ]
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


def _safe_json(value: str | None):
    if not value:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None
