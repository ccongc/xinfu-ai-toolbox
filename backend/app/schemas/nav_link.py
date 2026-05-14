"""应用导航Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class NavLinkCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    icon_url: str | None = None
    url: str = Field(..., min_length=1, max_length=500)
    category: str | None = None
    is_external: bool = True
    sort_order: int = 0
    is_visible: bool = True


class NavLinkUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    icon_url: str | None = None
    url: str | None = Field(None, min_length=1, max_length=500)
    category: str | None = None
    is_external: bool | None = None
    sort_order: int | None = None
    is_visible: bool | None = None


class NavLinkResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    icon_url: str | None = None
    url: str
    category: str | None = None
    is_external: bool = True
    sort_order: int = 0
    is_visible: bool = True
    created_at: datetime

    class Config:
        from_attributes = True
