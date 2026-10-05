"""Knowledge base management endpoints."""

import asyncio
import hashlib
import uuid
from datetime import datetime
from io import BytesIO

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from starlette.responses import StreamingResponse

from app.core.db import get_session, AsyncSessionLocal
from app.models import KnowledgeBase, File as FileModel
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
    FileUploadResponse,
    FileResponse,
    DocumentSearchRequest,
    DocumentSearchResponse,
    DocumentSearchResult,
)
from app.services.document import DocumentProcessor
from app.services.vector_store import VectorStoreService
from app.services.embeddings import get_embeddings
from app.services.ingestion import IngestionPipeline

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge_bases"])

# Initialize document processor (reuse across requests)
doc_processor = DocumentProcessor()
ingestion = IngestionPipeline()


async def process_file_background(
    file_id: str,
    kb_id: str,
    filename: str,
    content: bytes,
):
    """Background task to process file."""
    async with AsyncSessionLocal() as session:
        await ingestion.process_file(file_id, kb_id, filename, content, session)


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(
    q: str = Query("", min_length=0, max_length=255),
    session: AsyncSession = Depends(get_session),
):
    """List all knowledge bases."""
    query = select(KnowledgeBase).where(KnowledgeBase.deleted_at.is_(None))

    if q:
        search_term = f"%{q}%"
        query = query.where(
            or_(
                KnowledgeBase.name.ilike(search_term),
                KnowledgeBase.description.ilike(search_term),
            )
        )

    query = query.options(selectinload(KnowledgeBase.files)).order_by(KnowledgeBase.updated_at.desc())
    result = await session.execute(query)
    kbs = result.scalars().all()

    return [
        KnowledgeBaseResponse(
            id=kb.id,
            name=kb.name,
            description=kb.description,
            created_at=kb.created_at.isoformat(),
            updated_at=kb.updated_at.isoformat(),
            deleted_at=kb.deleted_at.isoformat() if kb.deleted_at else None,
            document_count=len(kb.files),
        )
        for kb in kbs
    ]


@router.post("", response_model=KnowledgeBaseResponse, status_code=201)
async def create_knowledge_base(
    kb_in: KnowledgeBaseCreate,
    session: AsyncSession = Depends(get_session),
):
    """Create a new knowledge base."""
    # Check name uniqueness
    existing = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.name == kb_in.name, KnowledgeBase.deleted_at.is_(None))
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Knowledge base name already exists")

    kb = KnowledgeBase(
        id=str(uuid.uuid4()),
        **kb_in.model_dump(),
    )
    session.add(kb)
    await session.commit()
    await session.refresh(kb)

    return KnowledgeBaseResponse(
        id=kb.id,
        name=kb.name,
        description=kb.description,
        created_at=kb.created_at.isoformat(),
        updated_at=kb.updated_at.isoformat(),
        deleted_at=None,
        document_count=0,
    )


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(
    kb_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get knowledge base by ID."""
    kb = await session.execute(
        select(KnowledgeBase)
        .where(and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None)))
        .options(selectinload(KnowledgeBase.files))
    )
    result = kb.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    return KnowledgeBaseResponse(
        id=result.id,
        name=result.name,
        description=result.description,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        deleted_at=result.deleted_at.isoformat() if result.deleted_at else None,
        document_count=len(result.files),
    )


@router.patch("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: str,
    kb_in: KnowledgeBaseUpdate,
    session: AsyncSession = Depends(get_session),
):
    """Update knowledge base."""
    kb = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None))
        )
    )
    result = kb.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    update_data = kb_in.model_dump(exclude_unset=True)

    # Check name uniqueness if changing
    if "name" in update_data and update_data["name"] != result.name:
        existing = await session.execute(
            select(KnowledgeBase).where(
                and_(
                    KnowledgeBase.name == update_data["name"],
                    KnowledgeBase.deleted_at.is_(None),
                )
            )
        )
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Knowledge base name already exists")

    for field, value in update_data.items():
        setattr(result, field, value)

    await session.commit()
    await session.refresh(result)

    return KnowledgeBaseResponse(
        id=result.id,
        name=result.name,
        description=result.description,
        created_at=result.created_at.isoformat(),
        updated_at=result.updated_at.isoformat(),
        deleted_at=result.deleted_at.isoformat() if result.deleted_at else None,
        document_count=len(result.files),
    )


@router.delete("/{kb_id}", status_code=204)
async def delete_knowledge_base(
    kb_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete knowledge base (soft delete)."""
    kb = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None))
        )
    )
    result = kb.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    result.deleted_at = datetime.utcnow()
    await session.commit()


@router.get("/{kb_id}/files", response_model=list[FileResponse])
async def list_files(
    kb_id: str,
    session: AsyncSession = Depends(get_session),
):
    """List files in knowledge base."""
    # Verify KB exists
    kb = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None))
        )
    )
    if not kb.scalars().first():
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    files = await session.execute(select(FileModel).where(FileModel.kb_id == kb_id))
    result = files.scalars().all()

    return [
        FileResponse(
            id=f.id,
            kb_id=f.kb_id,
            filename=f.filename,
            mime=f.mime,
            size_bytes=f.size_bytes,
            sha256=f.sha256,
            storage_path=f.storage_path,
            status=f.status,
            error=f.error,
            chunk_count=f.chunk_count or 0,
            tags_csv=f.tags_csv,
            created_at=f.created_at.isoformat(),
            updated_at=f.updated_at.isoformat(),
        )
        for f in result
    ]


@router.post("/{kb_id}/files", response_model=FileUploadResponse, status_code=201)
async def upload_file(
    kb_id: str,
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    session: AsyncSession = Depends(get_session),
):
    """Upload file to knowledge base."""
    # Verify KB exists
    kb = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None))
        )
    )
    if not kb.scalars().first():
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    # Read file content
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Calculate SHA256
    sha256 = hashlib.sha256(content).hexdigest()

    # Estimate chunks
    try:
        text_content = content.decode("utf-8")
        chunk_count = doc_processor.estimate_chunks(text_content)
    except UnicodeDecodeError:
        chunk_count = 0
        text_content = ""

    # Create file record
    file_id = str(uuid.uuid4())
    file_obj = FileModel(
        id=file_id,
        kb_id=kb_id,
        filename=file.filename or "unknown",
        mime=file.content_type or "application/octet-stream",
        size_bytes=len(content),
        sha256=sha256,
        storage_path=f"files/{kb_id}/{file_id}",
        status="queued",
        chunk_count=chunk_count if text_content else 0,
    )
    session.add(file_obj)
    await session.commit()
    await session.refresh(file_obj)

    # Queue background processing
    background_tasks.add_task(
        process_file_background,
        file_id,
        kb_id,
        file_obj.filename,
        content,
    )

    return FileUploadResponse(
        id=file_obj.id,
        filename=file_obj.filename,
        mime=file_obj.mime,
        size_bytes=file_obj.size_bytes,
        status=file_obj.status,
        created_at=file_obj.created_at.isoformat(),
        chunk_count=file_obj.chunk_count or 0,
    )


@router.delete("/{kb_id}/files/{file_id}", status_code=204)
async def delete_file(
    kb_id: str,
    file_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Delete file from knowledge base."""
    file_obj = await session.execute(
        select(FileModel).where(
            and_(FileModel.id == file_id, FileModel.kb_id == kb_id)
        )
    )
    result = file_obj.scalars().first()

    if not result:
        raise HTTPException(status_code=404, detail="File not found")

    await session.delete(result)
    await session.commit()


@router.post("/{kb_id}/search", response_model=DocumentSearchResponse)
async def search_documents(
    kb_id: str,
    search_req: DocumentSearchRequest,
    session: AsyncSession = Depends(get_session),
):
    """Search documents in knowledge base."""
    # Verify KB exists
    kb = await session.execute(
        select(KnowledgeBase).where(
            and_(KnowledgeBase.id == kb_id, KnowledgeBase.deleted_at.is_(None))
        )
    )
    if not kb.scalars().first():
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    try:
        embeddings = await get_embeddings()
        vs = VectorStoreService(embeddings)
        results = vs.search(kb_id, search_req.query, k=search_req.k)

        return DocumentSearchResponse(
            query=search_req.query,
            results=[
                DocumentSearchResult(
                    content=doc.page_content,
                    score=float(score),
                    source=doc.metadata.get("source", "unknown"),
                    filename=doc.metadata.get("filename", "unknown"),
                )
                for doc, score in results
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
