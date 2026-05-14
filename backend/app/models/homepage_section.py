"""首页区域模型"""
from datetime import datetime

from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class HomepageSection(Base):
    __tablename__ = "homepage_sections"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    section_key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="区域标识")
    title: Mapped[str | None] = mapped_column(String(200), comment="标题")
    subtitle: Mapped[str | None] = mapped_column(String(500), comment="副标题")
    content: Mapped[str | None] = mapped_column(Text, comment="区域内容JSON")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, comment="排序")
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否显示")
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), comment="更新人")
