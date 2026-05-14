"""系统配置Schema"""
from pydantic import BaseModel, Field


class SystemConfigResponse(BaseModel):
    id: int
    config_key: str
    config_value: str | None = None
    value_type: str = "string"
    description: str | None = None

    class Config:
        from_attributes = True


class SystemConfigUpdateRequest(BaseModel):
    config_value: str | None = None


class AdminPathResponse(BaseModel):
    admin_path: str
    salt: str
