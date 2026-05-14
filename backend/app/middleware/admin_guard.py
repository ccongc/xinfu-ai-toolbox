"""管理路径校验中间件"""
import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class AdminGuardMiddleware(BaseHTTPMiddleware):
    """拦截 /admin-* 请求，校验路径中的salt值"""

    # 匹配 /admin-xxx 路径
    ADMIN_PATH_PATTERN = re.compile(r"^/admin-(\w+)")

    def __init__(self, app, get_salt_func):
        super().__init__(app)
        self.get_salt_func = get_salt_func

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        # 只拦截前端管理路径，API路径通过Token校验
        match = self.ADMIN_PATH_PATTERN.match(path)
        if match:
            request_salt = match.group(1)
            stored_salt = await self.get_salt_func()
            if not stored_salt or request_salt != stored_salt:
                return JSONResponse(status_code=404, content={"detail": "Not Found"})

        return await call_next(request)
