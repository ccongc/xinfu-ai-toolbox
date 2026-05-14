"""全局异常定义与处理"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    """应用业务异常基类"""
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class NotFoundError(AppException):
    def __init__(self, detail: str = "资源不存在"):
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "权限不足"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail)


class BadRequestError(AppException):
    def __init__(self, detail: str = "请求参数错误"):
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "认证失败"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """业务异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.status_code, "message": exc.detail, "data": None},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """参数校验异常处理"""
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    detail = first_error.get("msg", "参数校验失败")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"code": 422, "message": detail, "data": errors},
    )
