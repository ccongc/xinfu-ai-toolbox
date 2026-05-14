"""系统配置模型"""
from datetime import datetime

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    config_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="配置键")
    config_value: Mapped[str | None] = mapped_column(Text, comment="配置值")
    value_type: Mapped[str] = mapped_column(String(20), default="string", comment="string/json/number/boolean")
    description: Mapped[str | None] = mapped_column(String(200), comment="说明")
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
