"""操作日志工具"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.operation_log import OperationLog


async def write_op_log(
    db: AsyncSession,
    user_id: int | None,
    action: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    detail: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    """写入操作日志"""
    log = OperationLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        detail=json.dumps(detail, ensure_ascii=False) if detail else None,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
