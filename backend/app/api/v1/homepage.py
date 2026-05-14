"""首页内容接口"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, require_admin
from ...models.user import User
from ...models.homepage_section import HomepageSection
from ...schemas.homepage import HomepageSectionResponse, HomepageSectionUpdateRequest, HomepageResponse
from ...utils.pagination import ApiResponse

public_router = APIRouter()
admin_router = APIRouter()


def _section_to_response(s: HomepageSection) -> HomepageSectionResponse:
    content = None
    if s.content:
        try:
            content = json.loads(s.content)
        except (json.JSONDecodeError, TypeError):
            content = None
    return HomepageSectionResponse(
        id=s.id, section_key=s.section_key, title=s.title,
        subtitle=s.subtitle, content=content,
        sort_order=s.sort_order, is_visible=s.is_visible,
    )


@public_router.get("", response_model=ApiResponse[HomepageResponse])
async def get_homepage(db: AsyncSession = Depends(get_db)):
    """获取首页所有区域内容"""
    result = await db.execute(
        select(HomepageSection)
        .where(HomepageSection.is_visible == True)
        .order_by(HomepageSection.sort_order.asc())
    )
    sections = result.scalars().all()
    return ApiResponse(data=HomepageResponse(sections=[_section_to_response(s) for s in sections]))


@admin_router.get("", response_model=ApiResponse[HomepageResponse])
async def admin_get_homepage(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """管理侧获取首页内容（含隐藏区域）"""
    result = await db.execute(select(HomepageSection).order_by(HomepageSection.sort_order.asc()))
    sections = result.scalars().all()
    return ApiResponse(data=HomepageResponse(sections=[_section_to_response(s) for s in sections]))


@admin_router.put("/{section_key}", response_model=ApiResponse[HomepageSectionResponse])
async def update_homepage_section(
    section_key: str, req: HomepageSectionUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """更新首页区域内容"""
    result = await db.execute(select(HomepageSection).where(HomepageSection.section_key == section_key))
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="区域不存在")

    if req.title is not None:
        section.title = req.title
    if req.subtitle is not None:
        section.subtitle = req.subtitle
    if req.content is not None:
        section.content = json.dumps(req.content, ensure_ascii=False)
    if req.sort_order is not None:
        section.sort_order = req.sort_order
    if req.is_visible is not None:
        section.is_visible = req.is_visible
    section.updated_by = admin.id

    await db.commit()
    await db.refresh(section)
    return ApiResponse(data=_section_to_response(section))
