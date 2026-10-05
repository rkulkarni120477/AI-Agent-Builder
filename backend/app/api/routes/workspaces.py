"""Workspace management endpoints."""

import uuid
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.db import get_session
from app.models import Workspace
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceUpdate,
    WorkspaceListResponse,
    WorkspaceContentUpdate,
)

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=list[WorkspaceListResponse])
async def list_workspaces(
    q: str = Query("", min_length=0, max_length=255),
    session: AsyncSession = Depends(get_session),
):
    """List all workspaces."""
    query = select(Workspace).where(Workspace.deleted_at.is_(None))

    if q:
        search_term = f"%{q}%"
        query = query.where(Workspace.title.ilike(search_term))

    query = query.order_by(Workspace.updated_at.desc())
    result = await session.execute(query)
    workspaces = result.scalars().all()

    return [
        WorkspaceListResponse(
            id=w.id,
            title=w.title,
            version=w.version,
            created_at=w.created_at.isoformat(),
            updated_at=w.updated_at.isoformat(),
        )
        for w in workspaces
    ]


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    workspace_in: WorkspaceCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new workspace."""
    workspace = Workspace(
        id=str(uuid.uuid4()),
        **workspace_in.model_dump(),
        owner_id="default-user",  # TODO: Get from auth context
    )
    session.add(workspace)
    await session.commit()
    await session.refresh(workspace)

    return WorkspaceResponse(
        id=workspace.id,
        title=workspace.title,
        content=workspace.content,
        version=workspace.version,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
        deleted_at=None,
    )


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get workspace by ID."""
    workspace = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    result = workspace.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return WorkspaceResponse(
        id=result.id,
        title=result.title,
        content=result.content,
        version=result.version,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        deleted_at=result.deleted_at.isoformat() if result.deleted_at else None,
    )


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: str,
    workspace_in: WorkspaceUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update workspace."""
    workspace = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    result = workspace.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Workspace not found")

    update_data = workspace_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(result, field, value)

    result.version += 1
    await session.commit()
    await session.refresh(result)

    return WorkspaceResponse(
        id=result.id,
        title=result.title,
        content=result.content,
        version=result.version,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        deleted_at=result.deleted_at.isoformat() if result.deleted_at else None,
    )


@router.patch("/{workspace_id}/content", response_model=WorkspaceResponse)
async def update_workspace_content(
    workspace_id: str,
    content_in: WorkspaceContentUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update workspace content (for autosave)."""
    workspace = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    result = workspace.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Workspace not found")

    result.content = content_in.content
    result.version += 1
    result.updated_at = datetime.utcnow()
    await session.commit()
    await session.refresh(result)

    return WorkspaceResponse(
        id=result.id,
        title=result.title,
        content=result.content,
        version=result.version,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        deleted_at=result.deleted_at.isoformat() if result.deleted_at else None,
    )


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete workspace (soft delete)."""
    workspace = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    result = workspace.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Workspace not found")

    result.deleted_at = datetime.utcnow()
    await session.commit()
