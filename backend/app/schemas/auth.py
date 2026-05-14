"""认证相关Schema"""
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserInfoResponse"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserInfoResponse(BaseModel):
    id: int
    username: str
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None
    role: str | None = None
    is_admin: bool = False

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    display_name: str | None = None
    email: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class WecomCallbackRequest(BaseModel):
    code: str
    state: str
