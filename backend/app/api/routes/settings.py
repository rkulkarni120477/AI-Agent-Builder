"""Settings management endpoints."""

import uuid
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Body

from app.core.db import get_session
from app.models import WorkspaceSettings, UserSettings, Workspace, User
from app.schemas.workspace import WorkspaceResponse

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/workspace/{workspace_id}")
async def get_workspace_settings(
    workspace_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get workspace settings."""
    # Get or create settings
    settings_result = await session.execute(
        select(WorkspaceSettings).where(
            WorkspaceSettings.workspace_id == workspace_id
        )
    )
    settings = settings_result.scalars().first()

    if not settings:
        # Verify workspace exists
        ws_result = await session.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        if not ws_result.scalars().first():
            raise HTTPException(status_code=404, detail="Workspace not found")

        # Create default settings
        settings = WorkspaceSettings(
            workspace_id=workspace_id,
            is_shared=False,
        )
        session.add(settings)
        await session.commit()
        await session.refresh(settings)

    return {
        "id": settings.id,
        "workspace_id": settings.workspace_id,
        "is_shared": settings.is_shared,
        "share_token": settings.share_token,
        "allow_comments": settings.allow_comments,
        "allow_editing": settings.allow_editing,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.patch("/workspace/{workspace_id}")
async def update_workspace_settings(
    workspace_id: str,
    data: dict = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """Update workspace settings."""
    # Get or create settings
    settings_result = await session.execute(
        select(WorkspaceSettings).where(
            WorkspaceSettings.workspace_id == workspace_id
        )
    )
    settings = settings_result.scalars().first()

    if not settings:
        raise HTTPException(status_code=404, detail="Workspace settings not found")

    # Update fields
    for key, value in data.items():
        if hasattr(settings, key) and key != "workspace_id":
            setattr(settings, key, value)

    # Generate share token if sharing enabled
    if data.get("is_shared") and not settings.share_token:
        settings.share_token = str(uuid.uuid4())

    await session.commit()
    await session.refresh(settings)

    return {
        "id": settings.id,
        "workspace_id": settings.workspace_id,
        "is_shared": settings.is_shared,
        "share_token": settings.share_token,
        "allow_comments": settings.allow_comments,
        "allow_editing": settings.allow_editing,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.get("/user/{user_id}")
async def get_user_settings(
    user_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get user settings."""
    settings_result = await session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = settings_result.scalars().first()

    if not settings:
        # Verify user exists
        user_result = await session.execute(select(User).where(User.id == user_id))
        if not user_result.scalars().first():
            raise HTTPException(status_code=404, detail="User not found")

        # Create default settings
        settings = UserSettings(user_id=user_id)
        session.add(settings)
        await session.commit()
        await session.refresh(settings)

    return {
        "id": settings.id,
        "user_id": settings.user_id,
        "theme": settings.theme,
        "notifications_enabled": settings.notifications_enabled,
        "notification_email": settings.notification_email,
        "notify_on_success": settings.notify_on_success,
        "notify_on_failure": settings.notify_on_failure,
        "has_api_key": settings.api_key is not None,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }


@router.patch("/user/{user_id}")
async def update_user_settings(
    user_id: str,
    data: dict = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """Update user settings."""
    settings_result = await session.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = settings_result.scalars().first()

    if not settings:
        raise HTTPException(status_code=404, detail="User settings not found")

    # Update allowed fields only
    allowed_fields = {
        "theme",
        "notifications_enabled",
        "notification_email",
        "notify_on_success",
        "notify_on_failure",
    }
    for key, value in data.items():
        if key in allowed_fields:
            setattr(settings, key, value)

    await session.commit()
    await session.refresh(settings)

    return {
        "id": settings.id,
        "user_id": settings.user_id,
        "theme": settings.theme,
        "notifications_enabled": settings.notifications_enabled,
        "notification_email": settings.notification_email,
        "notify_on_success": settings.notify_on_success,
        "notify_on_failure": settings.notify_on_failure,
        "has_api_key": settings.api_key is not None,
        "created_at": settings.created_at.isoformat(),
        "updated_at": settings.updated_at.isoformat(),
    }
