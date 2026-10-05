"""Pydantic schemas for review and quick actions."""

from typing import Optional
from pydantic import BaseModel, Field


class ReviewResponse(BaseModel):
    """Review response."""

    id: str
    run_id: str
    workspace_id: str
    status: str
    reviewer_notes: Optional[str] = None
    inserted_at: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class InsertResultRequest(BaseModel):
    """Request to insert agent result into workspace."""

    run_id: str
    workspace_id: str
    format_type: str = Field(default="paragraph", pattern="^(paragraph|code|formatted)$")
    position: Optional[str] = None  # Position in document (e.g., "end", "after_block_id")
    insert_separator: bool = Field(default=True)


class InsertResultResponse(BaseModel):
    """Response from inserting result."""

    workspace_id: str
    run_id: str
    block_count: int
    preview: str


class ReviewRequest(BaseModel):
    """Request to review/approve result."""

    run_id: str
    workspace_id: str
    status: str = Field(pattern="^(approved|rejected)$")
    notes: Optional[str] = None


class QuickActionResponse(BaseModel):
    """Quick action result (insert, copy, etc)."""

    action: str
    success: bool
    message: str
    data: Optional[dict] = None
