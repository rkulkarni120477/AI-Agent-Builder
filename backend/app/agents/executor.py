"""Agent executor using LangGraph."""

import logging
import uuid
from typing import Optional, AsyncGenerator

from langchain_core.messages import HumanMessage, AIMessage
from langchain_aws import ChatBedrock
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Agent as AgentModel, Message, Run
from app.core.config import settings
from app.services.vector_store import VectorStoreService
from app.services.embeddings import get_embeddings

logger = logging.getLogger(__name__)


class AgentExecutor:
    """Execute agents with streaming support."""

    def __init__(self):
        self.embeddings_client = None

    async def _get_embeddings(self):
        """Lazy load embeddings client."""
        if not self.embeddings_client:
            self.embeddings_client = await get_embeddings()
        return self.embeddings_client

    async def retrieve_context(
        self,
        query: str,
        knowledge_base_ids: Optional[list[str]] = None,
    ) -> str:
        """Retrieve relevant context from knowledge bases."""
        if not knowledge_base_ids:
            return ""

        try:
            embeddings = await self._get_embeddings()
            vs = VectorStoreService(embeddings)

            all_results = []
            for kb_id in knowledge_base_ids:
                results = vs.search(kb_id, query, k=3)
                for doc, score in results:
                    all_results.append((doc.page_content, score))

            # Sort by score and take top 5
            all_results.sort(key=lambda x: x[1], reverse=True)
            context = "\n\n".join([content for content, _ in all_results[:5]])

            return context
        except Exception as e:
            logger.error(f"Context retrieval failed: {e}")
            return ""

    def _build_system_prompt(
        self,
        agent: AgentModel,
        context: str = "",
    ) -> str:
        """Build system prompt for agent."""
        prompt = f"""You are {agent.name}, an AI agent with the following role:

Type: {agent.type}
Description: {agent.description or "No description provided."}

Instructions:
{agent.instructions}

When to call this agent: {agent.when_to_call or "Use your judgment."}

Input format: {agent.input_spec or "Plain text"}
Output format: {agent.output_spec or "Plain text response"}
"""

        if agent.strict_grounding and context:
            prompt += f"""

You have access to the following knowledge base content. Use it to inform your response:

{context}

Important: Only cite information from the provided knowledge base. If the knowledge base doesn't contain relevant information, say "I don't have information about this in my knowledge base."
"""

        return prompt

    async def execute(
        self,
        agent: AgentModel,
        user_input: str,
        knowledge_base_ids: Optional[list[str]] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Execute agent with streaming responses.

        Yields text chunks as they are generated.
        """
        try:
            # Retrieve context from knowledge bases
            context = await self.retrieve_context(user_input, knowledge_base_ids)

            # Build system prompt
            system_prompt = self._build_system_prompt(agent, context)

            # Initialize chat model
            model = ChatBedrock(
                model_id=agent.model.bedrock_model_id,
                region_name=agent.model.region,
                model_kwargs={
                    "temperature": agent.temperature or 1.0,
                    "max_tokens": agent.model.max_tokens,
                },
            )

            # Build messages
            messages = [
                HumanMessage(content=system_prompt),
                HumanMessage(content=user_input),
            ]

            # Stream response
            full_response = ""
            async for chunk in model.astream(messages):
                if chunk.content:
                    full_response += chunk.content
                    yield chunk.content

            logger.info(f"Agent {agent.id} completed execution: {len(full_response)} chars")

        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            text = str(e)
            if "does not support chat" in text or "ValidationException" in text:
                text = (
                    f"Model ID '{agent.model.bedrock_model_id}' is not a valid AWS Bedrock model. "
                    "Set a valid Bedrock model ID for this model in Models."
                )
            elif "credentials" in text.lower():
                text = "AWS credentials not found. Set AWS_PROFILE or AWS credentials for the backend."
            raise RuntimeError(text) from e

    async def save_run(
        self,
        session: AsyncSession,
        workspace_id: str,
        agent_id: str,
        input_text: str,
        output_text: str,
        status: str = "completed",
        error: Optional[str] = None,
        tokens_used: int = 0,
    ) -> Run:
        """Save agent run to database."""
        run = Run(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            agent_id=agent_id,
            input_text=input_text,
            output_text=output_text,
            status=status,
            error=error,
            tokens_used=tokens_used,
        )
        session.add(run)
        await session.flush()

        # Add messages
        session.add(Message(
            run_id=run.id,
            role="user",
            content=input_text,
        ))

        if output_text:
            session.add(Message(
                run_id=run.id,
                role="assistant",
                content=output_text,
            ))

        await session.commit()
        await session.refresh(run)
        return run
