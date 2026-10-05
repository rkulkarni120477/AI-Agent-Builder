"""Agent management endpoints."""

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime

from app.core.db import get_session
from app.models import Agent, Model
from app.schemas.agent import (
    AgentCreate,
    AgentListResponse,
    AgentResponse,
    AgentUpdate,
    HandleAvailabilityRequest,
    HandleAvailabilityResponse,
)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[AgentListResponse])
async def list_agents(
    q: str = Query("", min_length=0, max_length=255),
    status: str = Query("All", regex="^(All|Active|Draft|Paused)$"),
    type: str = Query("", regex="^[a-z0-9_-]*$"),
    session: AsyncSession = Depends(get_session),
):
    """List agents with search and filter."""
    query = select(Agent).where(Agent.deleted_at.is_(None))

    if status != "All":
        query = query.where(Agent.status == status.lower())

    if type:
        query = query.where(Agent.type == type)

    if q:
        search_term = f"%{q}%"
        query = query.where(
            or_(
                Agent.name.ilike(search_term),
                Agent.description.ilike(search_term),
                Agent.handle.ilike(search_term),
            )
        )

    query = query.options(selectinload(Agent.model), selectinload(Agent.knowledge_bases)).order_by(Agent.updated_at.desc())
    result = await session.execute(query)
    agents = result.scalars().all()

    return [
        AgentListResponse(
            id=a.id,
            name=a.name,
            type=a.type,
            description=a.description,
            model={
                "id": a.model.id,
                "display_name": a.model.display_name,
                "badge": a.model.badge,
                "note": a.model.note,
                "bedrock_model_id": a.model.bedrock_model_id,
                "region": a.model.region,
                "default_temperature": a.model.default_temperature,
                "max_tokens": a.model.max_tokens,
                "input_price_per_1k": a.model.input_price_per_1k,
                "output_price_per_1k": a.model.output_price_per_1k,
                "enabled": a.model.enabled,
            } if a.model else None,
            status=a.status,
            version=a.version,
            created_at=a.created_at.isoformat(),
            updated_at=a.updated_at.isoformat(),
            knowledge_bases=[kb.name for kb in a.knowledge_bases] if a.knowledge_bases else [],
        )
        for a in agents
    ]


@router.post("", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_in: AgentCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new agent."""
    # Check handle uniqueness
    existing = await session.execute(
        select(Agent).where(and_(Agent.handle == agent_in.handle, Agent.deleted_at.is_(None)))
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Handle already in use")

    # Verify model exists
    model = await session.execute(select(Model).where(Model.id == agent_in.model_id))
    if not model.scalars().first():
        raise HTTPException(status_code=404, detail="Model not found")

    agent = Agent(
        **agent_in.model_dump(),
        owner_id="default-user",  # TODO: Get from auth context
        status="draft",
    )
    session.add(agent)
    await session.commit()
    await session.refresh(agent)

    return AgentResponse(
        **agent.__dict__,
        created_at=agent.created_at.isoformat(),
        updated_at=agent.updated_at.isoformat(),
    )


@router.get("/handle-available", response_model=HandleAvailabilityResponse)
async def check_handle_availability(
    handle: str = Query(..., min_length=1, max_length=100, regex="^[a-z0-9_-]+$"),
    session: AsyncSession = Depends(get_session),
):
    """Check if a handle is available."""
    existing = await session.execute(
        select(Agent).where(and_(Agent.handle == handle, Agent.deleted_at.is_(None)))
    )

    if existing.scalars().first():
        return HandleAvailabilityResponse(available=False, message="Handle already in use")

    return HandleAvailabilityResponse(available=True)


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get agent by ID."""
    agent = await session.execute(
        select(Agent)
        .where(and_(Agent.id == agent_id, Agent.deleted_at.is_(None)))
        .options(selectinload(Agent.model))
    )
    result = agent.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")

    return AgentResponse(
        **result.__dict__,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
    )


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_in: AgentUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update agent."""
    agent = await session.execute(
        select(Agent).where(and_(Agent.id == agent_id, Agent.deleted_at.is_(None)))
    )
    result = agent.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = agent_in.model_dump(exclude_unset=True)

    # Check handle uniqueness if handle is being changed
    if "handle" in update_data and update_data["handle"] != result.handle:
        existing = await session.execute(
            select(Agent).where(and_(Agent.handle == update_data["handle"], Agent.deleted_at.is_(None)))
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Handle already in use")

    for field, value in update_data.items():
        setattr(result, field, value)

    result.version += 1
    await session.commit()
    await session.refresh(result)

    return AgentResponse(
        **result.__dict__,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
    )


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete agent (soft delete)."""
    agent = await session.execute(
        select(Agent).where(and_(Agent.id == agent_id, Agent.deleted_at.is_(None)))
    )
    result = agent.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Agent not found")

    result.deleted_at = datetime.utcnow()
    await session.commit()
