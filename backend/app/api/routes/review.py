"""Quick actions and review workflow endpoints."""

import json
import logging
from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException

from app.core.db import get_session
from app.models import Run, Workspace, Review
from app.schemas.review import (
    ReviewResponse,
    InsertResultRequest,
    InsertResultResponse,
    ReviewRequest,
    QuickActionResponse,
)
from app.services.formatter import BlockFormatter

router = APIRouter(prefix="/review", tags=["review"])
logger = logging.getLogger(__name__)


@router.post("/insert-result", response_model=InsertResultResponse)
async def insert_result(
    request: InsertResultRequest,
    session: AsyncSession = Depends(get_session),
):
    """Insert agent result into workspace."""
    # Verify run exists
    run_result = await session.execute(
        select(Run).where(Run.id == request.run_id)
    )
    run = run_result.scalars().first()
    if not run or not run.output_text:
        raise HTTPException(status_code=404, detail="Run not found or has no output")

    # Verify workspace exists
    workspace_result = await session.execute(
        select(Workspace).where(
            and_(Workspace.id == request.workspace_id, Workspace.deleted_at.is_(None))
        )
    )
    workspace = workspace_result.scalars().first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    try:
        # Parse existing content
        current_content = json.loads(workspace.content)
        if not isinstance(current_content, dict) or "content" not in current_content:
            current_content = {"type": "doc", "content": []}

        # Format output based on type
        if request.format_type == "code":
            new_blocks = [
                BlockFormatter.create_code_block(run.output_text, "text")
            ]
        elif request.format_type == "formatted":
            formatted = BlockFormatter.format_output(
                run.output_text,
                agent_name=run.agent.name if run.agent else "Agent",
                agent_type=run.agent.type if run.agent else "Unknown",
            )
            new_blocks = formatted.get("content", [])
        else:  # paragraph
            new_blocks = [BlockFormatter.create_paragraph(run.output_text)]

        # Add separator if requested
        if request.insert_separator and current_content["content"]:
            current_content["content"].append(BlockFormatter.create_horizontal_rule())

        # Insert blocks
        current_content["content"].extend(new_blocks)

        # Update workspace
        workspace.content = json.dumps(current_content)
        workspace.version += 1
        workspace.updated_at = datetime.utcnow()

        # Create review record
        review = Review(
            run_id=request.run_id,
            workspace_id=request.workspace_id,
            status="inserted",
            inserted_at=request.position or "end",
        )
        session.add(review)

        await session.commit()

        # Generate preview
        preview = run.output_text[:200] + "..." if len(run.output_text) > 200 else run.output_text

        return InsertResultResponse(
            workspace_id=request.workspace_id,
            run_id=request.run_id,
            block_count=len(new_blocks),
            preview=preview,
        )

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid workspace content format")
    except Exception as e:
        logger.error(f"Failed to insert result: {e}")
        raise HTTPException(status_code=500, detail="Failed to insert result")


@router.post("/review", response_model=ReviewResponse)
async def create_review(
    request: ReviewRequest,
    session: AsyncSession = Depends(get_session),
):
    """Create or update review."""
    # Verify run exists
    run_result = await session.execute(select(Run).where(Run.id == request.run_id))
    if not run_result.scalars().first():
        raise HTTPException(status_code=404, detail="Run not found")

    # Verify workspace exists
    workspace_result = await session.execute(
        select(Workspace).where(Workspace.id == request.workspace_id)
    )
    if not workspace_result.scalars().first():
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if review exists
    existing_review = await session.execute(
        select(Review).where(
            and_(
                Review.run_id == request.run_id,
                Review.workspace_id == request.workspace_id,
            )
        )
    )
    review = existing_review.scalars().first()

    if review:
        review.status = request.status
        review.reviewer_notes = request.notes
    else:
        review = Review(
            run_id=request.run_id,
            workspace_id=request.workspace_id,
            status=request.status,
            reviewer_notes=request.notes,
        )
        session.add(review)

    await session.commit()
    await session.refresh(review)

    return ReviewResponse(
        id=review.id,
        run_id=review.run_id,
        workspace_id=review.workspace_id,
        status=review.status,
        reviewer_notes=review.reviewer_notes,
        inserted_at=review.inserted_at,
        created_at=review.created_at.isoformat(),
        updated_at=review.updated_at.isoformat(),
    )


@router.get("/reviews/{workspace_id}", response_model=list[ReviewResponse])
async def get_workspace_reviews(
    workspace_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get all reviews for a workspace."""
    reviews_result = await session.execute(
        select(Review).where(Review.workspace_id == workspace_id)
        .order_by(Review.created_at.desc())
    )
    reviews = reviews_result.scalars().all()

    return [
        ReviewResponse(
            id=r.id,
            run_id=r.run_id,
            workspace_id=r.workspace_id,
            status=r.status,
            reviewer_notes=r.reviewer_notes,
            inserted_at=r.inserted_at,
            created_at=r.created_at.isoformat(),
            updated_at=r.updated_at.isoformat(),
        )
        for r in reviews
    ]


@router.post("/copy-to-clipboard", response_model=QuickActionResponse)
async def copy_to_clipboard(
    request: dict,
    session: AsyncSession = Depends(get_session),
):
    """Copy run output to clipboard (tracked server-side)."""
    run_id = request.get("run_id")
    workspace_id = request.get("workspace_id")

    # Verify run exists
    run_result = await session.execute(select(Run).where(Run.id == run_id))
    run = run_result.scalars().first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # Track copy action
    review = await session.execute(
        select(Review).where(
            and_(Review.run_id == run_id, Review.workspace_id == workspace_id)
        )
    )
    existing = review.scalars().first()

    if not existing:
        review = Review(
            run_id=run_id,
            workspace_id=workspace_id,
            status="copied",
        )
        session.add(review)
        await session.commit()

    return QuickActionResponse(
        action="copy",
        success=True,
        message="Output copied to clipboard",
        data={"content": run.output_text},
    )
