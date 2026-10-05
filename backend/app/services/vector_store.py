"""Vector store service using Chroma."""

from pathlib import Path
import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_core.embeddings import Embeddings
from langchain_core.documents import Document
from typing import Optional


class VectorStoreService:
    """Manage Chroma vector store for knowledge base documents."""

    def __init__(self, embeddings: Embeddings, persist_directory: str = "data/vectors"):
        self.embeddings = embeddings
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)

        # Configure Chroma
        settings = Settings(
            is_persistent=True,
            persist_directory=str(self.persist_directory),
            anonymized_telemetry=False,
        )
        self.client = chromadb.Client(settings)

    def get_collection(self, kb_id: str) -> Chroma:
        """Get or create collection for knowledge base."""
        return Chroma(
            client=self.client,
            collection_name=f"kb_{kb_id}",
            embedding_function=self.embeddings,
            persist_directory=str(self.persist_directory),
        )

    def add_documents(self, kb_id: str, documents: list[Document]) -> list[str]:
        """
        Add documents to knowledge base collection.

        Args:
            kb_id: Knowledge base ID
            documents: List of Document objects

        Returns:
            List of document IDs
        """
        collection = self.get_collection(kb_id)
        ids = collection.add_documents(documents)
        collection.persist()
        return ids

    def search(
        self,
        kb_id: str,
        query: str,
        k: int = 6,
    ) -> list[tuple[Document, float]]:
        """
        Search knowledge base with similarity score.

        Args:
            kb_id: Knowledge base ID
            query: Search query
            k: Number of results to return

        Returns:
            List of (Document, score) tuples
        """
        collection = self.get_collection(kb_id)
        results = collection.similarity_search_with_score(query, k=k)
        return results

    def delete_documents(self, kb_id: str, ids: list[str]) -> None:
        """Delete documents from collection."""
        collection = self.get_collection(kb_id)
        collection.delete(ids=ids)
        collection.persist()

    def clear_collection(self, kb_id: str) -> None:
        """Delete entire collection."""
        self.client.delete_collection(name=f"kb_{kb_id}")

    def get_collection_info(self, kb_id: str) -> dict:
        """Get collection metadata and statistics."""
        try:
            collection = self.client.get_collection(name=f"kb_{kb_id}")
            return {
                "count": collection.count(),
                "name": collection.name,
            }
        except Exception:
            return {"count": 0, "name": f"kb_{kb_id}"}
