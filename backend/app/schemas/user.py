"""用户管理Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class UserListResponse(BaseModel):
    id: int
    username: str
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    role_id: int | None = None
    role_name: str | None = None
    status: str = "active"
    wecom_userid: str | None = None
    last_login_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    role_id: int | None = None
    status: str | None = None


class UserRoleUpdateRequest(BaseModel):
    role_id: int


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=128)


class UserListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    keyword: str | None = None
    status: str | None = None
    role_id: int | None = None
