"""大模型配置模型"""
from datetime import datetime

from sqlalchemy import String, Boolean, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="模型名称")
    provider: Mapped[str] = mapped_column(String(50), nullable=False, comment="提供商")
    model_type: Mapped[str | None] = mapped_column(String(50), comment="模型类型")
    api_key_encrypted: Mapped[str | None] = mapped_column(String(500), comment="加密后的API Key")
    api_base_url: Mapped[str | None] = mapped_column(String(500), comment="API基础URL")
    model_id: Mapped[str | None] = mapped_column(String(100), comment="模型标识")
    extra_config: Mapped[str | None] = mapped_column(Text, comment="额外配置JSON")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
