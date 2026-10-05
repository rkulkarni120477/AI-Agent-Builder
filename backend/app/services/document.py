"""Document processing services: chunking, embedding, storage."""

from typing import Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import json
import hashlib


class DocumentProcessor:
    """Process documents into chunks with metadata."""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 150,
    ):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
            length_function=len,
        )

    def process_text(self, text: str, filename: str, source: Optional[str] = None) -> list[Document]:
        """
        Split text into documents with metadata.

        Args:
            text: Raw text content
            filename: Original filename
            source: Optional source URL or file path

        Returns:
            List of Document objects with metadata
        """
        docs = self.splitter.create_documents(
            texts=[text],
            metadatas=[{
                "source": source or filename,
                "filename": filename,
                "sha256": hashlib.sha256(text.encode()).hexdigest(),
            }],
        )
        return docs

    def estimate_chunks(self, text: str) -> int:
        """Estimate number of chunks for given text."""
        return max(1, len(text) // (self.splitter.chunk_size - self.splitter.chunk_overlap))
