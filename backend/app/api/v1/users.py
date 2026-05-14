"""用户管理接口（管理员）"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ...core.deps import get_db, require_admin
from ...models.user import User
from ...models.role import Role
from ...models.agent import Agent
from ...schemas.user import UserListResponse, UserUpdateRequest, UserRoleUpdateRequest, UserListQuery, AdminResetPasswordRequest
from ...core.security import hash_password
from ...utils.pagination import PaginatedResponse, ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[PaginatedResponse[UserListResponse]])
async def list_users(
    page: int = 1, page_size: int = 20,
    keyword: str | None = None, status: str | None = None, role_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """用户列表"""
    query = select(User)
    count_query = select(func.count(User.id))

    if keyword:
        filter_cond = (User.username.ilike(f"%{keyword}%") | User.display_name.ilike(f"%{keyword}%") | User.email.ilike(f"%{keyword}%"))
        query = query.where(filter_cond)
        count_query = count_query.where(filter_cond)
    if status:
        query = query.where(User.status == status)
        count_query = count_query.where(User.status == status)
    if role_id:
        query = query.where(User.role_id == role_id)
        count_query = count_query.where(User.role_id == role_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    # 批量获取角色名
    role_ids = [u.role_id for u in users if u.role_id]
    role_map = {}
    if role_ids:
        role_result = await db.execute(select(Role).where(Role.id.in_(set(role_ids))))
        for r in role_result.scalars():
            role_map[r.id] = r.name

    items = [
        UserListResponse(
            id=u.id, username=u.username, display_name=u.display_name,
            email=u.email, phone=u.phone, avatar_url=u.avatar_url,
            role_id=u.role_id, role_name=role_map.get(u.role_id),
            status=u.status, wecom_userid=u.wecom_userid,
            last_login_at=u.last_login_at, created_at=u.created_at,
        ) for u in users
    ]
    return ApiResponse(data=PaginatedResponse.create(items, total, page, page_size))


@router.get("/{user_id}", response_model=ApiResponse[UserListResponse])
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """用户详情"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="用户不存在")

    role_name = None
    if user.role_id:
        role_result = await db.execute(select(Role).where(Role.id == user.role_id))
        role = role_result.scalar_one_or_none()
        role_name = role.name if role else None

    return ApiResponse(data=UserListResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role_id=user.role_id, role_name=role_name, status=user.status,
        wecom_userid=user.wecom_userid, last_login_at=user.last_login_at, created_at=user.created_at,
    ))


@router.put("/{user_id}", response_model=ApiResponse[UserListResponse])
async def update_user(
    user_id: int, req: UserUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """编辑用户"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="用户不存在")

    if req.display_name is not None:
        user.display_name = req.display_name
    if req.email is not None:
        user.email = req.email
    if req.phone is not None:
        user.phone = req.phone
    if req.role_id is not None:
        user.role_id = req.role_id
    if req.status is not None:
        user.status = req.status
    await db.commit()

    role_name = None
    if user.role_id:
        role_result = await db.execute(select(Role).where(Role.id == user.role_id))
        role = role_result.scalar_one_or_none()
        role_name = role.name if role else None

    return ApiResponse(data=UserListResponse(
        id=user.id, username=user.username, display_name=user.display_name,
        email=user.email, phone=user.phone, avatar_url=user.avatar_url,
        role_id=user.role_id, role_name=role_name, status=user.status,
        wecom_userid=user.wecom_userid, last_login_at=user.last_login_at, created_at=user.created_at,
    ))


@router.put("/{user_id}/role")
async def assign_role(
    user_id: int, req: UserRoleUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """分配角色"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="用户不存在")

    role_result = await db.execute(select(Role).where(Role.id == req.role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="角色不存在")

    user.role_id = req.role_id
    await db.commit()
    return ApiResponse(message="角色分配成功")


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """删除用户"""
    if user_id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="不能删除自己")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="用户不存在")
    # 将该用户发布的Agent的publisher_id置为NULL，解除外键引用
    from sqlalchemy import update as sa_update
    await db.execute(sa_update(Agent).where(Agent.publisher_id == user_id).values(publisher_id=None))
    await db.delete(user)
    await db.commit()
    return ApiResponse(message="用户已删除")


@router.put("/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    req: AdminResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """重置用户密码（管理员）"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user.hashed_password = hash_password(req.new_password)
    await db.commit()
    return ApiResponse(message="密码重置成功")
