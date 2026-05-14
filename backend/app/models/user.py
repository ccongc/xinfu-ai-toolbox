"""用户模型"""
from datetime import datetime

from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="用户名")
    display_name: Mapped[str | None] = mapped_column(String(100), comment="显示姓名")
    email: Mapped[str | None] = mapped_column(String(200), unique=True, comment="邮箱")
    phone: Mapped[str | None] = mapped_column(String(20), comment="手机号")
    hashed_password: Mapped[str | None] = mapped_column(String(255), comment="密码哈希")
    avatar_url: Mapped[str | None] = mapped_column(String(500), comment="头像")
    role_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("roles.id"), comment="角色ID")
    status: Mapped[str] = mapped_column(String(20), default="active", comment="active/disabled")
    wecom_userid: Mapped[str | None] = mapped_column(String(100), unique=True, comment="企业微信用户ID")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, comment="最后登录时间")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=func.now())
