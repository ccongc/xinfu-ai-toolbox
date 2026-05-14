"""应用导航接口"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, require_admin
from ...models.user import User
from ...models.nav_link import NavLink
from ...schemas.nav_link import NavLinkCreateRequest, NavLinkUpdateRequest, NavLinkResponse
from ...utils.pagination import ApiResponse

public_router = APIRouter()
admin_router = APIRouter()


@public_router.get("", response_model=ApiResponse[list[NavLinkResponse]])
async def list_visible_nav_links(db: AsyncSession = Depends(get_db)):
    """获取可见导航列表"""
    result = await db.execute(
        select(NavLink).where(NavLink.is_visible == True).order_by(NavLink.sort_order.asc())
    )
    links = result.scalars().all()
    return ApiResponse(data=[
        NavLinkResponse(
            id=l.id, name=l.name, description=l.description, icon_url=l.icon_url,
            url=l.url, category=l.category, is_external=l.is_external,
            sort_order=l.sort_order, is_visible=l.is_visible, created_at=l.created_at,
        ) for l in links
    ])


@admin_router.get("", response_model=ApiResponse[list[NavLinkResponse]])
async def admin_list_nav_links(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """管理侧导航列表"""
    result = await db.execute(select(NavLink).order_by(NavLink.sort_order.asc()))
    links = result.scalars().all()
    return ApiResponse(data=[
        NavLinkResponse(
            id=l.id, name=l.name, description=l.description, icon_url=l.icon_url,
            url=l.url, category=l.category, is_external=l.is_external,
            sort_order=l.sort_order, is_visible=l.is_visible, created_at=l.created_at,
        ) for l in links
    ])


@admin_router.post("", response_model=ApiResponse[NavLinkResponse])
async def create_nav_link(
    req: NavLinkCreateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """添加导航"""
    link = NavLink(
        name=req.name, description=req.description, icon_url=req.icon_url,
        url=req.url, category=req.category, is_external=req.is_external,
        sort_order=req.sort_order, is_visible=req.is_visible,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return ApiResponse(data=NavLinkResponse(
        id=link.id, name=link.name, description=link.description, icon_url=link.icon_url,
        url=link.url, category=link.category, is_external=link.is_external,
        sort_order=link.sort_order, is_visible=link.is_visible, created_at=link.created_at,
    ))


@admin_router.put("/{link_id}", response_model=ApiResponse[NavLinkResponse])
async def update_nav_link(
    link_id: int, req: NavLinkUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """编辑导航"""
    result = await db.execute(select(NavLink).where(NavLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="导航不存在")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)
    await db.commit()
    await db.refresh(link)
    return ApiResponse(data=NavLinkResponse(
        id=link.id, name=link.name, description=link.description, icon_url=link.icon_url,
        url=link.url, category=link.category, is_external=link.is_external,
        sort_order=link.sort_order, is_visible=link.is_visible, created_at=link.created_at,
    ))


@admin_router.delete("/{link_id}")
async def delete_nav_link(link_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """删除导航"""
    result = await db.execute(select(NavLink).where(NavLink.id == link_id))
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="导航不存在")
    await db.delete(link)
    await db.commit()
    return ApiResponse(message="已删除")
