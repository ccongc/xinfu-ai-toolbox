"""请求日志中间件"""
import time
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LoggingMiddleware(BaseHTTPMiddleware):
    """记录请求日志"""

    # 不记录日志的路径
    SKIP_PATHS = {"/docs", "/redoc", "/openapi.json", "/health"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        start_time = time.time()
        response = await call_next(request)
        process_time = int((time.time() - start_time) * 1000)

        # 异步写入访问日志（不阻塞请求）
        try:
            from ..database import async_session_factory
            from ..models.access_log import AccessLog
            from ..core.deps import get_current_user_optional

            # 简化：不在此中间件中获取用户，避免循环依赖
            async with async_session_factory() as session:
                log = AccessLog(
                    path=request.url.path[:200],
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=process_time,
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent", "")[:500],
                )
                session.add(log)
                await session.commit()
        except Exception:
            pass  # 日志写入失败不影响请求

        return response
