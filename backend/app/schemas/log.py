"""日志Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class OperationLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    username: str | None = None
    action: str
    resource_type: str | None = None
    resource_id: int | None = None
    detail: dict | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class AccessLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    path: str
    method: str
    status_code: int | None = None
    response_time_ms: int | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class LogQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    start_date: str | None = None
    end_date: str | None = None
    user_id: int | None = None
    action: str | None = None
    resource_type: str | None = None
