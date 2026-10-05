"""Pydantic schemas for workspace endpoints."""

from typing import Optional
from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    """Create workspace request."""

    title: str = Field(..., min_length=1, max_length=255)


class WorkspaceUpdate(BaseModel):
    """Update workspace request."""

    title: Optional[str] = None
    content: Optional[str] = None


class WorkspaceResponse(BaseModel):
    """Workspace response."""

    id: str
    title: str
    content: str
    version: int
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None

    model_config = {"from_attributes": True}


class WorkspaceListResponse(BaseModel):
    """Workspace list response."""

    id: str
    title: str
    version: int
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class WorkspaceContentUpdate(BaseModel):
    """Update workspace content only (for autosave)."""

    content: str = Field(..., min_length=1)
