"""Agent相关Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class AgentCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    detail: str | None = None
    scenarios: str | None = None
    design_idea: str | None = None
    icon_url: str | None = None
    cover_url: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    embed_type: str = Field(..., pattern="^(iframe|api)$")
    embed_code: str | None = None
    api_endpoint: str | None = None
    api_config: dict | None = None
    template_id: int | None = None


class AgentUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    detail: str | None = None
    scenarios: str | None = None
    design_idea: str | None = None
    icon_url: str | None = None
    cover_url: str | None = None
    category: str | None = None
    tags: list[str] | None = None
    embed_type: str | None = Field(None, pattern="^(iframe|api)$")
    embed_code: str | None = None
    api_endpoint: str | None = None
    api_config: dict | None = None
    template_id: int | None = None
    sort_order: int | None = None


class AgentResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    detail: str | None = None
    scenarios: str | None = None
    design_idea: str | None = None
    icon_url: str | None = None
    cover_url: str | None = None
    category: str | None = None
    tags: list | None = None
    embed_type: str
    embed_code: str | None = None
    api_endpoint: str | None = None
    api_config: dict | None = None
    template_id: int | None = None
    publisher_id: int | None = None
    publisher_name: str | None = None
    is_official: bool = False
    status: str = "draft"
    review_comment: str | None = None
    reviewer_id: int | None = None
    reviewed_at: datetime | None = None
    sort_order: int = 0
    view_count: int = 0
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class AgentMarketResponse(BaseModel):
    """市场列表精简版"""
    id: int
    name: str
    description: str | None = None
    icon_url: str | None = None
    cover_url: str | None = None
    category: str | None = None
    tags: list | None = None
    embed_type: str
    is_official: bool = False
    publisher_name: str | None = None
    view_count: int = 0
    sort_order: int = 0

    class Config:
        from_attributes = True


class AgentReviewRequest(BaseModel):
    comment: str | None = None


class AgentListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    keyword: str | None = None
    category: str | None = None
    status: str | None = None
    is_official: bool | None = None
