"""Pydantic schemas for agent endpoints."""

from typing import Optional

from pydantic import BaseModel, Field


class ModelResponse(BaseModel):
    """Model catalog item."""

    id: str
    display_name: str
    badge: Optional[str] = None
    note: Optional[str] = None
    bedrock_model_id: str
    region: str
    default_temperature: float
    max_tokens: int
    input_price_per_1k: float
    output_price_per_1k: float
    enabled: bool


class AgentBase(BaseModel):
    """Base agent fields."""

    name: str = Field(..., min_length=1, max_length=255)
    handle: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9_-]+$")
    type: str = Field(..., description="One of 8 agent types")
    description: Optional[str] = None
    instructions: str = Field(..., min_length=1)
    when_to_call: Optional[str] = None
    input_spec: Optional[str] = None
    output_spec: Optional[str] = None
    callable_by: str = Field(default="any", pattern="^(any|approved|orchestrator)$")
    timeout_seconds: int = Field(default=60, ge=5, le=600)
    model_id: str
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    strict_grounding: bool = Field(default=True)
    guardrail_id: Optional[str] = None
    guardrail_version: Optional[str] = None


class AgentCreate(AgentBase):
    """Create agent request."""

    pass


class AgentUpdate(BaseModel):
    """Update agent request."""

    name: Optional[str] = None
    handle: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    when_to_call: Optional[str] = None
    input_spec: Optional[str] = None
    output_spec: Optional[str] = None
    callable_by: Optional[str] = None
    timeout_seconds: Optional[int] = None
    model_id: Optional[str] = None
    temperature: Optional[float] = None
    strict_grounding: Optional[bool] = None
    guardrail_id: Optional[str] = None
    guardrail_version: Optional[str] = None


class AgentResponse(AgentBase):
    """Agent response."""

    id: str
    status: str
    version: int
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    """Agent list response."""

    id: str
    name: str
    type: str
    description: Optional[str] = None
    model: Optional[ModelResponse] = None
    status: str
    version: int
    created_at: str
    updated_at: str
    knowledge_bases: list[str] = []
    files_count: int = 0

    model_config = {"from_attributes": True}


class HandleAvailabilityRequest(BaseModel):
    """Check if handle is available."""

    handle: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9_-]+$")


class HandleAvailabilityResponse(BaseModel):
    """Handle availability response."""

    available: bool
    message: Optional[str] = None
