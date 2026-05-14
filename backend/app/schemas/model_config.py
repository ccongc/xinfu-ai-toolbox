"""大模型配置Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class ModelConfigCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., min_length=1, max_length=50)
    model_type: str | None = None
    api_key: str | None = None
    api_base_url: str | None = None
    model_id: str | None = None
    extra_config: dict | None = None
    is_active: bool = True


class ModelConfigUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    provider: str | None = Field(None, min_length=1, max_length=50)
    model_type: str | None = None
    api_key: str | None = None
    api_base_url: str | None = None
    model_id: str | None = None
    extra_config: dict | None = None
    is_active: bool | None = None


class ModelConfigResponse(BaseModel):
    id: int
    name: str
    provider: str
    model_type: str | None = None
    api_base_url: str | None = None
    model_id: str | None = None
    extra_config: dict | None = None
    is_active: bool = True
    has_api_key: bool = False
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class ModelTestRequest(BaseModel):
    message: str = "Hello"
