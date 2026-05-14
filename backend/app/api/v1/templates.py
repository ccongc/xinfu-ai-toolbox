"""模板管理接口"""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, require_admin, get_current_user_optional
from ...models.user import User
from ...models.chat_template import ChatTemplate
from ...schemas.template import (
    TemplateCreateRequest, TemplateUpdateRequest, TemplateResponse,
    DEFAULT_STYLE_CONFIG, DEFAULT_LAYOUT_CONFIG,
)
from ...utils.pagination import ApiResponse

public_router = APIRouter()
admin_router = APIRouter()


def _template_to_response(t: ChatTemplate) -> TemplateResponse:
    return TemplateResponse(
        id=t.id, name=t.name, description=t.description,
        preview_image=t.preview_image,
        style_config=_safe_json(t.style_config),
        layout_config=_safe_json(t.layout_config),
        is_default=t.is_default, is_active=t.is_active,
        created_at=t.created_at, updated_at=t.updated_at,
    )


def _safe_json(value: str | None):
    if not value:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


# ===== 用户侧 =====

@public_router.get("/default", response_model=ApiResponse[TemplateResponse])
async def get_default_template(db: AsyncSession = Depends(get_db)):
    """获取默认模板"""
    result = await db.execute(select(ChatTemplate).where(ChatTemplate.is_default == True, ChatTemplate.is_active == True))
    template = result.scalar_one_or_none()
    if not template:
        # 返回内置默认配置
        return ApiResponse(data=TemplateResponse(
            id=0, name="默认科技蓝", style_config=DEFAULT_STYLE_CONFIG,
            layout_config=DEFAULT_LAYOUT_CONFIG, is_default=True, is_active=True,
            created_at=None, updated_at=None,
        ))
    return ApiResponse(data=_template_to_response(template))


@public_router.get("/{template_id}", response_model=ApiResponse[TemplateResponse])
async def get_template(template_id: int, db: AsyncSession = Depends(get_db)):
    """获取模板详情"""
    result = await db.execute(select(ChatTemplate).where(ChatTemplate.id == template_id, ChatTemplate.is_active == True))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模板不存在")
    return ApiResponse(data=_template_to_response(template))


# ===== 管理侧 =====

@admin_router.get("", response_model=ApiResponse[list[TemplateResponse]])
async def list_templates(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """模板列表"""
    result = await db.execute(select(ChatTemplate).order_by(ChatTemplate.created_at.desc()))
    templates = result.scalars().all()
    return ApiResponse(data=[_template_to_response(t) for t in templates])


@admin_router.post("", response_model=ApiResponse[TemplateResponse])
async def create_template(
    req: TemplateCreateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """创建模板"""
    # 如果设为默认，先取消其他默认
    if req.is_default:
        result = await db.execute(select(ChatTemplate).where(ChatTemplate.is_default == True))
        for t in result.scalars().all():
            t.is_default = False

    template = ChatTemplate(
        name=req.name, description=req.description, preview_image=req.preview_image,
        style_config=json.dumps(req.style_config, ensure_ascii=False),
        layout_config=json.dumps(req.layout_config, ensure_ascii=False) if req.layout_config else None,
        is_default=req.is_default,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return ApiResponse(data=_template_to_response(template))


@admin_router.put("/{template_id}", response_model=ApiResponse[TemplateResponse])
async def update_template(
    template_id: int, req: TemplateUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """编辑模板"""
    result = await db.execute(select(ChatTemplate).where(ChatTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模板不存在")

    if req.name is not None:
        template.name = req.name
    if req.description is not None:
        template.description = req.description
    if req.preview_image is not None:
        template.preview_image = req.preview_image
    if req.style_config is not None:
        template.style_config = json.dumps(req.style_config, ensure_ascii=False)
    if req.layout_config is not None:
        template.layout_config = json.dumps(req.layout_config, ensure_ascii=False)
    if req.is_active is not None:
        template.is_active = req.is_active
    if req.is_default is not None and req.is_default:
        # 取消其他默认
        r = await db.execute(select(ChatTemplate).where(ChatTemplate.is_default == True, ChatTemplate.id != template_id))
        for t in r.scalars().all():
            t.is_default = False
        template.is_default = True

    await db.commit()
    await db.refresh(template)
    return ApiResponse(data=_template_to_response(template))


@admin_router.delete("/{template_id}")
async def delete_template(template_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """删除模板"""
    result = await db.execute(select(ChatTemplate).where(ChatTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模板不存在")
    if template.is_default:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="不能删除默认模板")
    await db.delete(template)
    await db.commit()
    return ApiResponse(message="已删除")
