"""访问日志模型"""
from datetime import datetime

from sqlalchemy import String, Integer, BigInteger, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class AccessLog(Base):
    __tablename__ = "access_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(Integer, comment="访问用户")
    path: Mapped[str] = mapped_column(String(200), nullable=False, comment="访问路径")
    method: Mapped[str] = mapped_column(String(10), nullable=False, comment="HTTP方法")
    status_code: Mapped[int | None] = mapped_column(Integer, comment="响应状态码")
    response_time_ms: Mapped[int | None] = mapped_column(Integer, comment="响应耗时(ms)")
    ip_address: Mapped[str | None] = mapped_column(String(45), comment="IP地址")
    user_agent: Mapped[str | None] = mapped_column(String(500), comment="User-Agent")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
