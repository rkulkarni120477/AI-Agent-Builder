"""Pydantic schemas for knowledge base and file endpoints."""

from typing import Optional
from pydantic import BaseModel, Field


class KnowledgeBaseCreate(BaseModel):
    """Create knowledge base request."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class KnowledgeBaseUpdate(BaseModel):
    """Update knowledge base request."""

    name: Optional[str] = None
    description: Optional[str] = None


class KnowledgeBaseResponse(BaseModel):
    """Knowledge base response."""

    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None
    document_count: int = 0

    model_config = {"from_attributes": True}


class FileUploadResponse(BaseModel):
    """File upload response."""

    id: str
    filename: str
    mime: str
    size_bytes: int
    status: str
    created_at: str
    chunk_count: int = 0
    error: Optional[str] = None

    model_config = {"from_attributes": True}


class FileResponse(BaseModel):
    """File response with full metadata."""

    id: str
    kb_id: str
    filename: str
    mime: str
    size_bytes: int
    sha256: str
    storage_path: str
    status: str
    error: Optional[str] = None
    chunk_count: int = 0
    tags_csv: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class DocumentSearchRequest(BaseModel):
    """Search documents in knowledge base."""

    query: str = Field(..., min_length=1, max_length=500)
    k: int = Field(default=6, ge=1, le=20)


class DocumentSearchResult(BaseModel):
    """Single search result."""

    content: str
    score: float
    source: str
    filename: str


class DocumentSearchResponse(BaseModel):
    """Document search response."""

    results: list[DocumentSearchResult]
    query: str
