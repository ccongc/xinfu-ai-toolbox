"""限流中间件"""
import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """基于内存的简单限流（生产环境建议用Redis）"""

    def __init__(self, app, requests_per_minute: int = 60, login_per_minute: int = 5):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.login_per_minute = login_per_minute
        self._requests = defaultdict(list)

    def _cleanup(self, key: str):
        """清理过期记录"""
        now = time.time()
        self._requests[key] = [t for t in self._requests[key] if now - t < 60]

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        # 登录接口更严格限流
        if "/auth/login" in path:
            key = f"login:{client_ip}"
            limit = self.login_per_minute
        else:
            key = f"api:{client_ip}"
            limit = self.requests_per_minute

        self._cleanup(key)
        if len(self._requests[key]) >= limit:
            return JSONResponse(
                status_code=429,
                content={"code": 429, "message": "请求过于频繁，请稍后再试"},
            )

        self._requests[key].append(time.time())
        return await call_next(request)
