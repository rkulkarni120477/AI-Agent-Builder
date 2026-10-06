"""Chat and agent invocation endpoints."""

import logging
from typing import Optional

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.db import get_session
from app.models import Agent, Workspace, Run, Message
from app.schemas.chat import (
    InvokeAgentRequest,
    RunResponse,
    MessageResponse,
    ChatHistoryResponse,
)
from app.agents.executor import AgentExecutor
from app.services.notification import notification_service

router = APIRouter(prefix="/chat", tags=["chat"])
executor = AgentExecutor()

logger = logging.getLogger(__name__)


@router.post("/invoke")
async def invoke_agent(
    request: InvokeAgentRequest,
    session: AsyncSession = Depends(get_session),
):
    """Invoke agent with streaming response."""
    # Verify agent exists
    agent_result = await session.execute(
        select(Agent).where(
            and_(Agent.id == request.agent_id, Agent.deleted_at.is_(None))
        ).options(selectinload(Agent.model))
    )
    agent = agent_result.scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Verify workspace exists
    workspace_result = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == request.workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    workspace = workspace_result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Execute agent and stream response
    async def generate():
        output_text = ""
        run = None
        try:
            # Stream the response
            async for chunk in executor.execute(
                agent,
                request.input_text,
                request.knowledge_base_ids,
            ):
                output_text += chunk
                yield f"data: {chunk}\n\n"

            # Save run after completion
            run = await executor.save_run(
                session,
                request.workspace_id,
                request.agent_id,
                request.input_text,
                output_text,
                status="completed",
                tokens_used=0,
            )

            # Send notification to agent owner
            if run:
                await notification_service.send_run_notification(
                    run_id=run.id,
                    agent_id=request.agent_id,
                    user_id=agent.owner_id,
                    run_status="completed",
                    session=session,
                )

        except Exception as e:
            logger.error(f"Agent execution error: {e}")
            try:
                await session.rollback()
                run = await executor.save_run(
                    session,
                    request.workspace_id,
                    request.agent_id,
                    request.input_text,
                    output_text,
                    status="failed",
                    error=str(e),
                    tokens_used=0,
                )

                # Send notification for failed run
                if run:
                    await notification_service.send_run_notification(
                        run_id=run.id,
                        agent_id=request.agent_id,
                        user_id=agent.owner_id,
                        run_status="failed",
                        session=session,
                    )
            except Exception as save_err:
                logger.error(f"Failed to save failed run: {save_err}")
            msg = " ".join(str(e).split())
            yield f"data: [ERROR] {msg}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/runs/{workspace_id}", response_model=list[RunResponse])
async def get_workspace_runs(
    workspace_id: str,
    agent_id: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """Get all runs in a workspace."""
    # Verify workspace exists
    workspace_result = await session.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    if not workspace_result.scalars().first():
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Get runs
    query = select(Run).where(Run.workspace_id == workspace_id)
    if agent_id:
        query = query.where(Run.agent_id == agent_id)

    query = query.options(selectinload(Run.messages)).order_by(Run.created_at.desc())
    result = await session.execute(query)
    runs = result.scalars().all()

    return [
        RunResponse(
            id=r.id,
            workspace_id=r.workspace_id,
            agent_id=r.agent_id,
            status=r.status,
            input_text=r.input_text,
            output_text=r.output_text,
            error=r.error,
            tokens_used=r.tokens_used,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat(),
            messages=[
                MessageResponse(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    created_at=m.created_at.isoformat(),
                )
                for m in r.messages
            ],
        )
        for r in runs
    ]


@router.get("/runs/{workspace_id}/{run_id}", response_model=RunResponse)
async def get_run(
    workspace_id: str,
    run_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific run."""
    run = await session.execute(
        select(Run).where(
            and_(Run.id == run_id, Run.workspace_id == workspace_id)
        ).options(selectinload(Run.messages))
    )
    result = run.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Run not found")

    return RunResponse(
        id=result.id,
        workspace_id=result.workspace_id,
        agent_id=result.agent_id,
        status=result.status,
        input_text=result.input_text,
        output_text=result.output_text,
        error=result.error,
        tokens_used=result.tokens_used,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in result.messages
        ],
    )
