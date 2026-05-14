"""对话模板Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


class TemplateCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    preview_image: str | None = None
    style_config: dict
    layout_config: dict | None = None
    is_default: bool = False


class TemplateUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    preview_image: str | None = None
    style_config: dict | None = None
    layout_config: dict | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    preview_image: str | None = None
    style_config: dict | None = None
    layout_config: dict | None = None
    is_default: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# 默认模板样式配置
DEFAULT_STYLE_CONFIG = {
    "primaryColor": "#1677ff",
    "backgroundColor": "#ffffff",
    "chatBubbleUser": "#1677ff",
    "chatBubbleBot": "#f0f0f0",
    "fontFamily": "system-ui",
    "fontSize": 14,
    "borderRadius": 8,
    "headerVisible": True,
    "headerTitle": "AI助手",
    "inputPlaceholder": "请输入您的问题...",
    "sendButtonColor": "#1677ff",
    "welcomeMessage": "您好，请问有什么可以帮助您的？",
}

DEFAULT_LAYOUT_CONFIG = {
    "showSidebar": False,
    "maxWidth": 800,
    "messageMaxWidth": "70%",
    "showTimestamp": True,
    "showAvatar": True,
    "markdownRender": True,
    "codeHighlight": True,
}
