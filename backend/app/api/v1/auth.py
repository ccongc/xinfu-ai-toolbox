"""认证接口"""
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, get_current_user
from ...core.security import (
    hash_password, verify_password, create_access_token, create_refresh_token, decode_token,
)
from ...core.config import settings
from ...models.user import User
from ...models.role import Role
from ...schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, UserInfoResponse,
    RefreshTokenRequest, UpdateProfileRequest, ChangePasswordRequest,
    WecomCallbackRequest,
)
from ...utils.pagination import ApiResponse
from ...utils.op_log import write_op_log

router = APIRouter()


@router.post("/register", response_model=ApiResponse[TokenResponse])
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """用户注册"""
    # 检查用户名是否已存在
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="用户名已存在")

    # 获取默认user角色
    result = await db.execute(select(Role).where(Role.name == "user"))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="系统角色未初始化")

    user = User(
        username=req.username,
        display_name=req.display_name or req.username,
        email=req.email,
        phone=req.phone,
        hashed_password=hash_password(req.password),
        role_id=role.id,
        status="active",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 生成Token
    access_token = create_access_token({"sub": str(user.id), "username": user.username, "role": "user", "is_admin": False})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    user_info = UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role="user", is_admin=False,
    )
    return ApiResponse(data=TokenResponse(
        access_token=access_token, refresh_token=refresh_token, user=user_info,
    ))


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """账号密码登录"""
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    if user.status != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="用户已被禁用")

    # 获取角色
    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    role_name = role.name if role else "user"
    is_admin = role_name == "admin"

    access_token = create_access_token({"sub": str(user.id), "username": user.username, "role": role_name, "is_admin": is_admin})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # 更新最后登录时间
    from datetime import datetime
    user.last_login_at = datetime.utcnow()
    await db.commit()

    user_info = UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role=role_name, is_admin=is_admin,
    )
    return ApiResponse(data=TokenResponse(
        access_token=access_token, refresh_token=refresh_token, user=user_info,
    ))


@router.get("/wecom/qrurl", response_model=ApiResponse[str])
async def get_wecom_qrurl():
    """获取企业微信扫码URL"""
    if not settings.WECOM_CORP_ID or not settings.WECOM_AGENT_ID:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="企业微信未配置")
    import urllib.parse
    redirect_uri = urllib.parse.quote(settings.WECOM_CALLBACK_URL, safe="")
    url = (
        f"https://open.work.weixin.qq.com/wwopen/sso/qrConnect"
        f"?appid={settings.WECOM_CORP_ID}"
        f"&agentid={settings.WECOM_AGENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&state=wecom_login"
    )
    return ApiResponse(data=url)


@router.post("/wecom/callback", response_model=ApiResponse[TokenResponse])
async def wecom_callback(req: WecomCallbackRequest, db: AsyncSession = Depends(get_db)):
    """企业微信OAuth回调"""
    import httpx
    # 获取access_token
    token_url = (
        f"https://qyapi.weixin.qq.com/cgi-bin/gettoken"
        f"?corpid={settings.WECOM_CORP_ID}"
        f"&corpsecret={settings.WECOM_SECRET}"
    )
    async with httpx.AsyncClient() as client:
        token_resp = await client.get(token_url)
        token_data = token_resp.json()

    if token_data.get("errcode") != 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="获取企微access_token失败")

    access_token = token_data["access_token"]

    # 获取用户身份
    async with httpx.AsyncClient() as client:
        user_url = f"https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo?access_token={access_token}&code={req.code}"
        user_resp = await client.get(user_url)
        user_data = user_resp.json()

    if user_data.get("errcode") != 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="企微用户认证失败")

    wecom_userid = user_data.get("userid") or user_data.get("UserId")
    if not wecom_userid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="获取企微用户ID失败")

    # 查找或创建用户
    result = await db.execute(select(User).where(User.wecom_userid == wecom_userid))
    user = result.scalar_one_or_none()

    if not user:
        # 自动注册
        result = await db.execute(select(Role).where(Role.name == "user"))
        role = result.scalar_one_or_none()
        user = User(
            username=f"wecom_{wecom_userid}",
            display_name=wecom_userid,
            wecom_userid=wecom_userid,
            role_id=role.id if role else None,
            status="active",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if user.status != "active":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="用户已被禁用")

    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    role_name = role.name if role else "user"
    is_admin = role_name == "admin"

    jwt_access = create_access_token({"sub": str(user.id), "username": user.username, "role": role_name, "is_admin": is_admin})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    user_info = UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role=role_name, is_admin=is_admin,
    )
    return ApiResponse(data=TokenResponse(
        access_token=jwt_access, refresh_token=refresh_token, user=user_info,
    ))


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh_token(req: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """刷新Token"""
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="无效的Refresh Token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user or user.status != "active":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="用户不存在或已禁用")

    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    role_name = role.name if role else "user"
    is_admin = role_name == "admin"

    access_token = create_access_token({"sub": str(user.id), "username": user.username, "role": role_name, "is_admin": is_admin})
    new_refresh = create_refresh_token({"sub": str(user.id)})

    user_info = UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role=role_name, is_admin=is_admin,
    )
    return ApiResponse(data=TokenResponse(
        access_token=access_token, refresh_token=new_refresh, user=user_info,
    ))


@router.get("/me", response_model=ApiResponse[UserInfoResponse])
async def get_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """获取当前用户信息"""
    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    role_name = role.name if role else "user"
    return ApiResponse(data=UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role=role_name, is_admin=role_name == "admin",
    ))


@router.put("/me", response_model=ApiResponse[UserInfoResponse])
async def update_me(
    req: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """更新当前用户信息"""
    if req.display_name is not None:
        user.display_name = req.display_name
    if req.email is not None:
        user.email = req.email
    if req.phone is not None:
        user.phone = req.phone
    if req.avatar_url is not None:
        user.avatar_url = req.avatar_url
    await db.commit()

    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    role_name = role.name if role else "user"
    return ApiResponse(data=UserInfoResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role=role_name, is_admin=role_name == "admin",
    ))


@router.put("/me/password")
async def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """修改密码"""
    if not user.hashed_password or not verify_password(req.old_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="原密码错误")
    user.hashed_password = hash_password(req.new_password)
    await db.commit()
    await write_op_log(db, user.id, "change_password", "user", user.id)
    return ApiResponse(message="密码修改成功")


@router.post("/logout")
async def logout():
    """登出（前端清除Token即可）"""
    return ApiResponse(message="登出成功")


@router.get("/admin-path-info")
async def get_admin_path_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取管理路径信息（仅管理员）"""
    from ...models.system_config import SystemConfig
    result = await db.execute(select(Role).where(Role.id == user.role_id))
    role = result.scalar_one_or_none()
    if not role or role.name != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="需要管理员权限")

    result = await db.execute(select(SystemConfig).where(SystemConfig.config_key == "admin_path_salt"))
    config = result.scalar_one_or_none()
    salt = config.config_value if config else ""
    return ApiResponse(data={"admin_path": f"/admin-{salt}", "salt": salt})
