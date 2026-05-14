"""应用导航模型"""
from datetime import datetime

from sqlalchemy import String, Integer, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class NavLink(Base):
    __tablename__ = "nav_links"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="应用名称")
    description: Mapped[str | None] = mapped_column(String(200), comment="描述")
    icon_url: Mapped[str | None] = mapped_column(String(500), comment="图标URL")
    url: Mapped[str] = mapped_column(String(500), nullable=False, comment="链接地址")
    category: Mapped[str | None] = mapped_column(String(50), comment="分类")
    is_external: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否外部链接")
    sort_order: Mapped[int] = mapped_column(Integer, default=0, comment="排序")
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否显示")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
