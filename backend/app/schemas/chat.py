"""Pydantic schemas for chat endpoints."""

from typing import Optional
from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Chat message response."""

    id: str
    role: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}


class RunResponse(BaseModel):
    """Agent run response."""

    id: str
    workspace_id: str
    agent_id: str
    status: str
    input_text: str
    output_text: Optional[str] = None
    error: Optional[str] = None
    tokens_used: int
    created_at: str
    updated_at: str
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class InvokeAgentRequest(BaseModel):
    """Request to invoke an agent."""

    agent_id: str
    workspace_id: str
    input_text: str = Field(..., min_length=1, max_length=10000)
    knowledge_base_ids: Optional[list[str]] = None


class AgentResponse(BaseModel):
    """Response chunk from agent (for streaming)."""

    run_id: str
    delta: str  # Streamed text content


class ChatHistoryResponse(BaseModel):
    """Chat history for a workspace/agent."""

    workspace_id: str
    agent_id: str
    messages: list[MessageResponse]
