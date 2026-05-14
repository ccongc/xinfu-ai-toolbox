"""大模型管理接口"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ...core.deps import get_db, require_admin
from ...core.security import encrypt_api_key, decrypt_api_key
from ...models.user import User
from ...models.model_config import ModelConfig
from ...schemas.model_config import ModelConfigCreateRequest, ModelConfigUpdateRequest, ModelConfigResponse
from ...utils.pagination import ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[list[ModelConfigResponse]])
async def list_models(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """模型配置列表"""
    result = await db.execute(select(ModelConfig).order_by(ModelConfig.created_at.desc()))
    models = result.scalars().all()
    items = []
    for m in models:
        items.append(ModelConfigResponse(
            id=m.id, name=m.name, provider=m.provider, model_type=m.model_type,
            api_base_url=m.api_base_url, model_id=m.model_id,
            extra_config=_parse_json(m.extra_config),
            is_active=m.is_active, has_api_key=bool(m.api_key_encrypted),
            created_at=m.created_at, updated_at=m.updated_at,
        ))
    return ApiResponse(data=items)


@router.post("", response_model=ApiResponse[ModelConfigResponse])
async def create_model(
    req: ModelConfigCreateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """添加模型配置"""
    import json
    model = ModelConfig(
        name=req.name, provider=req.provider, model_type=req.model_type,
        api_key_encrypted=encrypt_api_key(req.api_key) if req.api_key else None,
        api_base_url=req.api_base_url, model_id=req.model_id,
        extra_config=json.dumps(req.extra_config, ensure_ascii=False) if req.extra_config else None,
        is_active=req.is_active,
    )
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return ApiResponse(data=ModelConfigResponse(
        id=model.id, name=model.name, provider=model.provider, model_type=model.model_type,
        api_base_url=model.api_base_url, model_id=model.model_id,
        extra_config=_parse_json(model.extra_config), is_active=model.is_active,
        has_api_key=bool(model.api_key_encrypted), created_at=model.created_at, updated_at=model.updated_at,
    ))


@router.put("/{model_id}", response_model=ApiResponse[ModelConfigResponse])
async def update_model(
    model_id: int, req: ModelConfigUpdateRequest,
    db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin),
):
    """编辑模型配置"""
    import json
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模型配置不存在")

    if req.name is not None:
        model.name = req.name
    if req.provider is not None:
        model.provider = req.provider
    if req.model_type is not None:
        model.model_type = req.model_type
    if req.api_key is not None:
        model.api_key_encrypted = encrypt_api_key(req.api_key)
    if req.api_base_url is not None:
        model.api_base_url = req.api_base_url
    if req.model_id is not None:
        model.model_id = req.model_id
    if req.extra_config is not None:
        model.extra_config = json.dumps(req.extra_config, ensure_ascii=False)
    if req.is_active is not None:
        model.is_active = req.is_active
    await db.commit()
    await db.refresh(model)
    return ApiResponse(data=ModelConfigResponse(
        id=model.id, name=model.name, provider=model.provider, model_type=model.model_type,
        api_base_url=model.api_base_url, model_id=model.model_id,
        extra_config=_parse_json(model.extra_config), is_active=model.is_active,
        has_api_key=bool(model.api_key_encrypted), created_at=model.created_at, updated_at=model.updated_at,
    ))


@router.delete("/{model_id}")
async def delete_model(model_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """删除模型配置"""
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模型配置不存在")
    await db.delete(model)
    await db.commit()
    return ApiResponse(message="已删除")


@router.post("/{model_id}/test")
async def test_model(model_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """测试模型连通性"""
    result = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="模型配置不存在")

    try:
        import httpx
        api_key = decrypt_api_key(model.api_key_encrypted) if model.api_key_encrypted else ""
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": model.model_id,
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 5,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{model.api_base_url}/chat/completions",
                headers=headers, json=payload,
            )
        if resp.status_code == 200:
            return ApiResponse(data={"status": "ok", "response_preview": resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")})
        else:
            return ApiResponse(code=1, message=f"连通测试失败: HTTP {resp.status_code}", data={"status": "error", "detail": resp.text[:200]})
    except Exception as e:
        return ApiResponse(code=1, message=f"连通测试异常: {str(e)}", data={"status": "error"})


def _parse_json(value: str | None):
    if not value:
        return None
    import json
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None
