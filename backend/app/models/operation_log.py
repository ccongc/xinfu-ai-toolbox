"""操作日志模型"""
from datetime import datetime

from sqlalchemy import String, Integer, BigInteger, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), comment="操作用户")
    action: Mapped[str] = mapped_column(String(100), nullable=False, comment="操作类型")
    resource_type: Mapped[str | None] = mapped_column(String(50), comment="资源类型")
    resource_id: Mapped[int | None] = mapped_column(Integer, comment="资源ID")
    detail: Mapped[str | None] = mapped_column(Text, comment="操作详情JSON")
    ip_address: Mapped[str | None] = mapped_column(String(45), comment="IP地址")
    user_agent: Mapped[str | None] = mapped_column(String(500), comment="User-Agent")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
