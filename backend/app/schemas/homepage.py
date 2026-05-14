"""首页内容Schema"""
from pydantic import BaseModel, Field


class HomepageSectionResponse(BaseModel):
    id: int
    section_key: str
    title: str | None = None
    subtitle: str | None = None
    content: dict | None = None
    sort_order: int = 0
    is_visible: bool = True

    class Config:
        from_attributes = True


class HomepageSectionUpdateRequest(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    content: dict | None = None
    sort_order: int | None = None
    is_visible: bool | None = None


class HomepageResponse(BaseModel):
    sections: list[HomepageSectionResponse]
