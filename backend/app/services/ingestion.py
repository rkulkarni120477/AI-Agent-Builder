"""Document ingestion pipeline: chunking, embedding, storage."""

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import File as FileModel
from app.services.document import DocumentProcessor
from app.services.vector_store import VectorStoreService
from app.services.embeddings import get_embeddings

logger = logging.getLogger(__name__)


class IngestionPipeline:
    """Process uploaded files: chunk, embed, and store in vector DB."""

    def __init__(self):
        self.doc_processor = DocumentProcessor()

    async def process_file(
        self,
        file_id: str,
        kb_id: str,
        filename: str,
        content: bytes,
        session: AsyncSession,
    ) -> bool:
        """
        Process file: chunk, embed, and store.

        Args:
            file_id: File record ID
            kb_id: Knowledge base ID
            filename: Original filename
            content: File content
            session: Database session

        Returns:
            True if successful, False if failed
        """
        try:
            # Get file record
            file_result = await session.execute(select(FileModel).where(FileModel.id == file_id))
            file_obj = file_result.scalars().first()
            if not file_obj:
                logger.error(f"File {file_id} not found")
                return False

            # Update status
            file_obj.status = "processing"
            await session.commit()

            # Decode content
            try:
                text_content = content.decode("utf-8")
            except UnicodeDecodeError:
                file_obj.status = "failed"
                file_obj.error = "File is not valid UTF-8 text"
                await session.commit()
                return False

            # Chunk document
            documents = self.doc_processor.process_text(text_content, filename)
            if not documents:
                file_obj.status = "ready"
                file_obj.chunk_count = 0
                await session.commit()
                return True

            # Embed and store
            try:
                embeddings = await get_embeddings()
                vs = VectorStoreService(embeddings)
                vs.add_documents(kb_id, documents)
            except Exception as e:
                logger.error(f"Embedding failed for {file_id}: {str(e)}")
                file_obj.status = "failed"
                file_obj.error = f"Embedding failed: {str(e)}"
                await session.commit()
                return False

            # Mark as ready
            file_obj.status = "ready"
            file_obj.chunk_count = len(documents)
            file_obj.updated_at = datetime.utcnow()
            await session.commit()

            logger.info(f"Processed {file_id}: {len(documents)} chunks")
            return True

        except Exception as e:
            logger.error(f"Ingestion failed for {file_id}: {str(e)}")
            try:
                file_result = await session.execute(select(FileModel).where(FileModel.id == file_id))
                file_obj = file_result.scalars().first()
                if file_obj:
                    file_obj.status = "failed"
                    file_obj.error = str(e)
                    await session.commit()
            except Exception:
                pass
            return False
