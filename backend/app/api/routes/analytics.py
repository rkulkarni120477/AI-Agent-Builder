"""Analytics and runs dashboard endpoints."""

from datetime import datetime, timedelta
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, Query

from app.core.db import get_session
from app.models import Run, Agent, Workspace
from app.schemas.analytics import (
    AgentMetrics,
    WorkspaceStats,
    RunStatistics,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/workspace/{workspace_id}/stats", response_model=WorkspaceStats)
async def get_workspace_stats(
    workspace_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get workspace statistics."""
    # Get workspace
    workspace_result = await session.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = workspace_result.scalars().first()
    if not workspace:
        return {"error": "Workspace not found"}

    # Get stats
    runs_result = await session.execute(
        select(Run).where(Run.workspace_id == workspace_id)
    )
    runs = runs_result.scalars().all()

    total_tokens = sum(r.tokens_used for r in runs)

    return WorkspaceStats(
        workspace_id=workspace_id,
        workspace_title=workspace.title,
        total_runs=len(runs),
        unique_agents_used=len(set(r.agent_id for r in runs)),
        total_tokens_used=total_tokens,
        created_at=workspace.created_at.isoformat(),
        updated_at=workspace.updated_at.isoformat(),
    )


@router.get("/workspace/{workspace_id}/runs", response_model=list)
async def get_workspace_runs(
    workspace_id: str,
    status: str = Query("", regex="^(|running|completed|failed)$"),
    agent_id: str = Query(""),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session),
):
    """Get filtered runs for workspace."""
    query = select(Run).where(Run.workspace_id == workspace_id)

    if status:
        query = query.where(Run.status == status)
    if agent_id:
        query = query.where(Run.agent_id == agent_id)

    # Count total
    count_result = await session.execute(select(func.count(Run.id)).select_from(Run).where(
        and_(
            Run.workspace_id == workspace_id,
            *(Run.status == status for _ in [status] if status),
            *(Run.agent_id == agent_id for _ in [agent_id] if agent_id),
        )
    ))
    total_count = count_result.scalar() or 0

    # Get paginated results
    query = query.order_by(Run.created_at.desc()).limit(limit).offset(offset)
    runs_result = await session.execute(query)
    runs = runs_result.scalars().all()

    return [
        {
            "id": r.id,
            "agent_id": r.agent_id,
            "status": r.status,
            "input_text": r.input_text[:100] + "..." if len(r.input_text) > 100 else r.input_text,
            "tokens_used": r.tokens_used,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat(),
        }
        for r in runs
    ]


@router.get("/agent/{agent_id}/metrics", response_model=AgentMetrics)
async def get_agent_metrics(
    agent_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get metrics for an agent."""
    # Get agent
    agent_result = await session.execute(select(Agent).where(Agent.id == agent_id))
    agent = agent_result.scalars().first()
    if not agent:
        return {"error": "Agent not found"}

    # Get runs
    runs_result = await session.execute(
        select(Run).where(Run.agent_id == agent_id)
    )
    runs = runs_result.scalars().all()

    total_runs = len(runs)
    successful_runs = len([r for r in runs if r.status == "completed"])
    failed_runs = len([r for r in runs if r.status == "failed"])
    success_rate = successful_runs / total_runs if total_runs > 0 else 0

    total_tokens = sum(r.tokens_used for r in runs)
    avg_tokens = total_tokens / total_runs if total_runs > 0 else 0

    return AgentMetrics(
        agent_id=agent_id,
        agent_name=agent.name,
        total_runs=total_runs,
        successful_runs=successful_runs,
        failed_runs=failed_runs,
        success_rate=success_rate,
        avg_tokens_used=avg_tokens,
        total_tokens_used=total_tokens,
        avg_execution_time=0.0,  # Would need timestamps to calculate
    )


@router.get("/system/health", response_model=dict)
async def get_system_health(
    session: AsyncSession = Depends(get_session),
):
    """Get system health metrics."""
    try:
        # Count entities
        agents_result = await session.execute(select(func.count(Agent.id)))
        total_agents = agents_result.scalar() or 0

        workspaces_result = await session.execute(select(func.count(Workspace.id)))
        total_workspaces = workspaces_result.scalar() or 0

        runs_result = await session.execute(select(func.count(Run.id)))
        total_runs = runs_result.scalar() or 0

        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {
                "total_agents": total_agents,
                "total_workspaces": total_workspaces,
                "total_runs": total_runs,
            },
        }
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }
