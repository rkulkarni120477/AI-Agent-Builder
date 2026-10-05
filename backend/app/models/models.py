"""SQLAlchemy models for Agent Studio."""

import uuid
from typing import Optional

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampedMixin


class User(Base, TimestampedMixin):
    """User account."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="editor")  # admin, editor, viewer
    password_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    agents: Mapped[list["Agent"]] = relationship(back_populates="owner", foreign_keys="Agent.owner_id")


class Model(Base, TimestampedMixin):
    """LLM model configuration."""

    __tablename__ = "models"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Most capable, Recommended, Fastest
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    bedrock_model_id: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    supports_tools: Mapped[bool] = mapped_column(Boolean, default=True)
    supports_streaming: Mapped[bool] = mapped_column(Boolean, default=True)
    context_window: Mapped[int] = mapped_column(Integer, default=200000)
    default_temperature: Mapped[float] = mapped_column(Float, default=1.0)
    max_tokens: Mapped[int] = mapped_column(Integer, default=4096)
    input_price_per_1k: Mapped[float] = mapped_column(Float, default=0.0)
    output_price_per_1k: Mapped[float] = mapped_column(Float, default=0.0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    agents: Mapped[list["Agent"]] = relationship(back_populates="model")


# Association tables for many-to-many relationships
agent_approved_callers = Table(
    "agent_approved_callers",
    Base.metadata,
    Column("agent_id", String(36), ForeignKey("agents.id"), primary_key=True),
    Column("caller_agent_id", String(36), ForeignKey("agents.id"), primary_key=True),
)

agent_handoffs = Table(
    "agent_handoffs",
    Base.metadata,
    Column("agent_id", String(36), ForeignKey("agents.id"), primary_key=True),
    Column("target_agent_id", String(36), ForeignKey("agents.id"), primary_key=True),
)

agent_knowledge_bases = Table(
    "agent_knowledge_bases",
    Base.metadata,
    Column("agent_id", String(36), ForeignKey("agents.id"), primary_key=True),
    Column("kb_id", String(36), ForeignKey("knowledge_bases.id"), primary_key=True),
)


class Agent(Base, TimestampedMixin, SoftDeleteMixin):
    """AI agent configuration."""

    __tablename__ = "agents"
    __table_args__ = (UniqueConstraint("handle", "deleted_at", name="uix_handle_not_deleted"),)

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    handle: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # 8 agent types
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    when_to_call: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    input_spec: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    output_spec: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    callable_by: Mapped[str] = mapped_column(String(50), default="any")  # any, approved, orchestrator
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=60)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("models.id"), nullable=False)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    strict_grounding: Mapped[bool] = mapped_column(Boolean, default=True)
    guardrail_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    guardrail_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, active, paused
    version: Mapped[int] = mapped_column(Integer, default=1)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

    owner: Mapped["User"] = relationship(back_populates="agents")
    model: Mapped["Model"] = relationship(back_populates="agents")
    knowledge_bases: Mapped[list["KnowledgeBase"]] = relationship(
        secondary=agent_knowledge_bases,
        back_populates="agents",
    )
    approved_callers: Mapped[list["Agent"]] = relationship(
        "Agent",
        secondary=agent_approved_callers,
        primaryjoin=agent_approved_callers.c.agent_id,
        secondaryjoin=agent_approved_callers.c.caller_agent_id,
        back_populates="approved_for",
    )
    approved_for: Mapped[list["Agent"]] = relationship(
        "Agent",
        secondary=agent_approved_callers,
        primaryjoin=agent_approved_callers.c.caller_agent_id,
        secondaryjoin=agent_approved_callers.c.agent_id,
        back_populates="approved_callers",
    )
    handoff_targets: Mapped[list["Agent"]] = relationship(
        "Agent",
        secondary=agent_handoffs,
        primaryjoin=agent_handoffs.c.agent_id,
        secondaryjoin=agent_handoffs.c.target_agent_id,
        back_populates="handoff_sources",
    )
    handoff_sources: Mapped[list["Agent"]] = relationship(
        "Agent",
        secondary=agent_handoffs,
        primaryjoin=agent_handoffs.c.target_agent_id,
        secondaryjoin=agent_handoffs.c.agent_id,
        back_populates="handoff_targets",
    )


class KnowledgeBase(Base, TimestampedMixin, SoftDeleteMixin):
    """Knowledge base for agent grounding."""

    __tablename__ = "knowledge_bases"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    agents: Mapped[list["Agent"]] = relationship(
        secondary=agent_knowledge_bases,
        back_populates="knowledge_bases",
    )
    files: Mapped[list["File"]] = relationship(back_populates="knowledge_base")
    tags: Mapped[list["Tag"]] = relationship(
        secondary="kb_tags",
        back_populates="knowledge_bases",
    )


class Tag(Base):
    """Tag for organizing knowledge bases and files."""

    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    knowledge_bases: Mapped[list["KnowledgeBase"]] = relationship(
        secondary="kb_tags",
        back_populates="tags",
    )


kb_tags = Table(
    "kb_tags",
    Base.metadata,
    Column("kb_id", String(36), ForeignKey("knowledge_bases.id"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id"), primary_key=True),
)


class File(Base, TimestampedMixin):
    """Uploaded file for knowledge ingestion."""

    __tablename__ = "files"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    kb_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("knowledge_bases.id"), nullable=True)
    agent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("agents.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    mime: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    storage_path: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="queued")  # queued, processing, ready, failed
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags_csv: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)

    knowledge_base: Mapped[Optional["KnowledgeBase"]] = relationship(back_populates="files")


class Workspace(Base, TimestampedMixin, SoftDeleteMixin):
    """Document workspace for editing and collaboration."""

    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="{\"type\":\"doc\",\"content\":[]}")  # TipTap JSON
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1)

    owner: Mapped["User"] = relationship("User", foreign_keys=[owner_id])


from sqlalchemy import Column
