"""Agent模型"""
from datetime import datetime

from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="Agent名称")
    description: Mapped[str | None] = mapped_column(Text, comment="简要描述")
    detail: Mapped[str | None] = mapped_column(Text, comment="功能详细介绍")
    scenarios: Mapped[str | None] = mapped_column(Text, comment="解决场景说明")
    design_idea: Mapped[str | None] = mapped_column(Text, comment="设计思路")
    icon_url: Mapped[str | None] = mapped_column(String(500), comment="图标URL")
    cover_url: Mapped[str | None] = mapped_column(String(500), comment="封面图URL")
    category: Mapped[str | None] = mapped_column(String(50), comment="分类")
    tags: Mapped[str | None] = mapped_column(Text, comment="标签JSON数组")
    embed_type: Mapped[str] = mapped_column(String(20), nullable=False, comment="iframe/api")
    embed_code: Mapped[str | None] = mapped_column(Text, comment="iframe嵌入代码")
    api_endpoint: Mapped[str | None] = mapped_column(String(500), comment="API端点")
    api_config: Mapped[str | None] = mapped_column(Text, comment="API配置JSON")
    template_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("chat_templates.id"), comment="对话模板ID")
    publisher_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), comment="发布者ID")
    is_official: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否官方")
    status: Mapped[str] = mapped_column(String(20), default="draft", comment="draft/pending/approved/rejected/offline")
    review_comment: Mapped[str | None] = mapped_column(Text, comment="审核意见")
    reviewer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), comment="审核人ID")
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, comment="审核时间")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, comment="排序权重")
    view_count: Mapped[int] = mapped_column(Integer, default=0, comment="浏览计数")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
