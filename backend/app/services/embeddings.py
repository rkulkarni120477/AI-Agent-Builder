"""Embeddings service using Bedrock."""

from langchain_aws import BedrockEmbeddings
from app.core.config import settings


async def get_embeddings() -> BedrockEmbeddings:
    """
    Get Bedrock embeddings instance.

    Uses Titan Embeddings V2 by default.
    """
    return BedrockEmbeddings(
        region_name=settings.aws_region,
        model_id="amazon.titan-embed-text-v2:0",
    )
