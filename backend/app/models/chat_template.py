"""对话模板模型"""
from datetime import datetime

from sqlalchemy import String, Boolean, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class ChatTemplate(Base):
    __tablename__ = "chat_templates"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="模板名称")
    description: Mapped[str | None] = mapped_column(String(200), comment="模板描述")
    preview_image: Mapped[str | None] = mapped_column(String(500), comment="预览图URL")
    style_config: Mapped[str] = mapped_column(Text, nullable=False, comment="样式配置JSON")
    layout_config: Mapped[str | None] = mapped_column(Text, comment="布局配置JSON")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, comment="是否默认模板")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
