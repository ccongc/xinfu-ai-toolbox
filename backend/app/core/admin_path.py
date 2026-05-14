"""管理路径随机值生成与校验"""
import secrets
import string

from .config import settings


def generate_admin_salt(length: int = 8) -> str:
    """生成管理路径随机值"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def get_admin_path_prefix(salt: str | None = None) -> str:
    """获取管理路径前缀"""
    s = salt or settings.ADMIN_PATH_SALT
    return f"/admin-{s}"


def verify_admin_salt(request_salt: str, stored_salt: str) -> bool:
    """校验管理路径中的salt值"""
    return secrets.compare_digest(request_salt, stored_salt)
