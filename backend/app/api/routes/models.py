"""Model management endpoints."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends

from app.core.db import get_session
from app.models import Model
from app.schemas.agent import ModelResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=list[ModelResponse])
async def list_models(
    session: AsyncSession = Depends(get_session),
):
    """List all available models."""
    result = await session.execute(
        select(Model).where(Model.enabled.is_(True)).order_by(Model.sort_order)
    )
    models = result.scalars().all()

    return [
        ModelResponse(
            id=m.id,
            display_name=m.display_name,
            badge=m.badge,
            note=m.note,
            bedrock_model_id=m.bedrock_model_id,
            region=m.region,
            default_temperature=m.default_temperature,
            max_tokens=m.max_tokens,
            input_price_per_1k=m.input_price_per_1k,
            output_price_per_1k=m.output_price_per_1k,
            enabled=m.enabled,
        )
        for m in models
    ]
