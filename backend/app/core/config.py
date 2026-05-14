"""信服AI工具箱 - 全局配置"""
from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # 应用
    APP_NAME: str = "信服AI工具箱"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://xinfu:changeme@localhost:5432/xinfu_ai"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "xinfu_ai"
    POSTGRES_USER: str = "xinfu"
    POSTGRES_PASSWORD: str = ""

    # Redis
    REDIS_URL: str = "redis://:changeme@localhost:6379/0"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 企业微信
    WECOM_CORP_ID: str = ""
    WECOM_AGENT_ID: str = ""
    WECOM_SECRET: str = ""
    WECOM_CALLBACK_URL: str = ""

    # 管理路径
    ADMIN_PATH_SALT: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # API Key 加密
    ENCRYPTION_KEY: str = "change-me-32-chars-encryption!!"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        """构建异步数据库URL"""
        if self.DATABASE_URL and "postgresql" in self.DATABASE_URL:
            url = self.DATABASE_URL
            if not url.startswith("postgresql+asyncpg"):
                url = url.replace("postgresql://", "postgresql+asyncpg://")
            return url
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def sync_database_url(self) -> str:
        """构建同步数据库URL（Alembic用）"""
        if self.DATABASE_URL and "postgresql" in self.DATABASE_URL:
            url = self.DATABASE_URL
            if url.startswith("postgresql+asyncpg"):
                url = url.replace("postgresql+asyncpg://", "postgresql://")
            return url
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def async_redis_url(self) -> str:
        if self.REDIS_URL:
            return self.REDIS_URL
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
