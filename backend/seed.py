"""Seed database with mockup data."""

import asyncio
import sys
import uuid

from sqlalchemy import select

from app.core.config import settings
from app.core.db import AsyncSessionLocal, init_engine
from app.models import Agent, KnowledgeBase, Model, User


async def main():
    """Seed the database."""
    print("Seeding Agent Studio database...")
    print(f"Database: {settings.database_url}")

    try:
        await init_engine()
        print("✓ Database initialized")

        async with AsyncSessionLocal() as session:
            # Create default user
            user = User(
                id=str(uuid.uuid4()),
                email="demo@academian.com",
                name="Demo User",
                role="admin",
            )
            session.add(user)
            await session.flush()

            # Create models (3 from mockup)
            models_data = [
                {
                    "display_name": "Claude Opus 5.5",
                    "badge": "Most capable",
                    "note": "Deepest reasoning for complex, multi-step work.",
                    "bedrock_model_id": settings.bedrock_model_opus,
                    "region": settings.aws_region,
                    "sort_order": 0,
                    "default_temperature": 1.0,
                    "max_tokens": 4096,
                    "input_price_per_1k": 0.015,
                    "output_price_per_1k": 0.075,
                },
                {
                    "display_name": "Claude Sonnet 5.5",
                    "badge": "Recommended",
                    "note": "Balanced quality and speed for everyday agents.",
                    "bedrock_model_id": settings.bedrock_model_sonnet,
                    "region": settings.aws_region,
                    "sort_order": 1,
                    "default_temperature": 1.0,
                    "max_tokens": 4096,
                    "input_price_per_1k": 0.003,
                    "output_price_per_1k": 0.015,
                },
                {
                    "display_name": "Claude Haiku 4.5",
                    "badge": "Fastest",
                    "note": "Quick, lightweight replies for high-volume tasks.",
                    "bedrock_model_id": settings.bedrock_model_haiku,
                    "region": settings.aws_region,
                    "sort_order": 2,
                    "default_temperature": 1.0,
                    "max_tokens": 4096,
                    "input_price_per_1k": 0.00025,
                    "output_price_per_1k": 0.00125,
                },
            ]

            models_map = {}
            for model_data in models_data:
                model = Model(id=str(uuid.uuid4()), **model_data)
                session.add(model)
                models_map[model_data["display_name"]] = model
            await session.flush()

            # Create knowledge bases (6 from mockup)
            kbs_data = [
                {
                    "name": "Academic Standards",
                    "description": "Standards frameworks and their indicators.",
                },
                {
                    "name": "Skills Taxonomies",
                    "description": "Skill frameworks and competency models.",
                },
                {
                    "name": "Curriculum Library",
                    "description": "Courses, units and scope and sequence.",
                },
                {
                    "name": "Learning Content",
                    "description": "Lessons, activities and assessments.",
                },
                {
                    "name": "Industry Credentials",
                    "description": "Certification blueprints and exam objectives.",
                },
                {
                    "name": "Style and Accessibility Guides",
                    "description": "Editorial rules and accessibility requirements.",
                },
            ]

            kbs = []
            for kb_data in kbs_data:
                kb = KnowledgeBase(id=str(uuid.uuid4()), **kb_data)
                session.add(kb)
                kbs.append(kb)
            await session.flush()

            # Create agents (7 from mockup)
            agents_data = [
                {
                    "name": "Standards Aligner",
                    "handle": "standards-aligner",
                    "type": "Standard alignment",
                    "description": "Maps lessons and assessments to academic standards.",
                    "instructions": "Align content to academic standards using evidence-based mapping.",
                    "model_id": models_map["Claude Opus 5.5"].id,
                    "status": "active",
                },
                {
                    "name": "Content Tagger",
                    "handle": "content-tagger",
                    "type": "Content tagging",
                    "description": "Tags learning content with topics, standards and skills.",
                    "instructions": "Extract and tag content with relevant topics, standards, and skills.",
                    "model_id": models_map["Claude Haiku 4.5"].id,
                    "status": "active",
                },
                {
                    "name": "Skill Extractor",
                    "handle": "skill-extractor",
                    "type": "Skill extraction",
                    "description": "Pulls skills from course outcomes and job descriptions.",
                    "instructions": "Extract and list skills from provided text.",
                    "model_id": models_map["Claude Sonnet 5.5"].id,
                    "status": "active",
                },
                {
                    "name": "Skill Gap Analyzer",
                    "handle": "skill-gap-analyzer",
                    "type": "Skill gap analysis",
                    "description": "Compares program skills against target roles.",
                    "instructions": "Analyze skill gaps between content and target.",
                    "model_id": models_map["Claude Opus 5.5"].id,
                    "status": "draft",
                },
                {
                    "name": "Content Creator",
                    "handle": "content-creator",
                    "type": "Content creation",
                    "description": "Drafts lessons, activities and assessments.",
                    "instructions": "Create educational content based on requirements.",
                    "model_id": models_map["Claude Sonnet 5.5"].id,
                    "status": "active",
                },
                {
                    "name": "Curriculum Designer",
                    "handle": "curriculum-designer",
                    "type": "Curriculum creation",
                    "description": "Builds scope and sequence from outcomes and standards.",
                    "instructions": "Design curriculum structure and sequence.",
                    "model_id": models_map["Claude Opus 5.5"].id,
                    "status": "active",
                },
                {
                    "name": "Micro-course Builder",
                    "handle": "microcourse-builder",
                    "type": "Micro-course creation",
                    "description": "Turns source material into short, focused courses.",
                    "instructions": "Create micro-courses from source content.",
                    "model_id": models_map["Claude Sonnet 5.5"].id,
                    "status": "paused",
                },
            ]

            for agent_data in agents_data:
                agent = Agent(
                    id=str(uuid.uuid4()),
                    owner_id=user.id,
                    **agent_data,
                )
                session.add(agent)

            await session.commit()
            print(f"✓ Created {len(models_data)} models")
            print(f"✓ Created {len(kbs_data)} knowledge bases")
            print(f"✓ Created {len(agents_data)} agents")
            print("✓ Seeding complete")

    except Exception as e:
        print(f"✗ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
