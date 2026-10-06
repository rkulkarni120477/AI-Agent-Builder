#!/usr/bin/env python3
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Model, Agent, User, KnowledgeBase, Base

engine = create_engine("sqlite:///./data/app.db")
Session = sessionmaker(bind=engine)
session = Session()

# Create all tables
Base.metadata.create_all(engine)

try:
    # Create default models
    models_data = [
        Model(
            id=str(uuid.uuid4()),
            display_name="Claude 3.5 Haiku",
            badge="fast",
            bedrock_model_id="us.anthropic.claude-haiku-4-5-20251001-v1:0",
            region="us-east-1",
            supports_tools=True,
            supports_streaming=True,
            context_window=200000,
            default_temperature=0.7,
            max_tokens=4096,
            input_price_per_1k=0.00080,
            output_price_per_1k=0.00400,
            enabled=True,
            sort_order=1
        ),
        Model(
            id=str(uuid.uuid4()),
            display_name="Claude 3.5 Sonnet",
            badge="balanced",
            bedrock_model_id="us.anthropic.claude-sonnet-4-5-20250929-v1:0",
            region="us-east-1",
            supports_tools=True,
            supports_streaming=True,
            context_window=200000,
            default_temperature=0.7,
            max_tokens=4096,
            input_price_per_1k=0.00300,
            output_price_per_1k=0.01500,
            enabled=True,
            sort_order=2
        ),
        Model(
            id=str(uuid.uuid4()),
            display_name="Claude 3 Opus",
            badge="powerful",
            bedrock_model_id="us.anthropic.claude-opus-4-5-20251101-v1:0",
            region="us-east-1",
            supports_tools=True,
            supports_streaming=True,
            context_window=200000,
            default_temperature=0.7,
            max_tokens=4096,
            input_price_per_1k=0.01500,
            output_price_per_1k=0.07500,
            enabled=True,
            sort_order=3
        )
    ]

    for model in models_data:
        session.add(model)

    session.commit()
    print("✓ Models created")

    first_model = session.query(Model).first()

    # Create knowledge bases
    kb_research = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Research Papers",
        description="Collection of research papers and academic articles"
    )
    kb_code = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Code Samples",
        description="Best practices and code samples for review"
    )
    kb_content = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Content Guidelines",
        description="Writing guidelines and content standards"
    )

    session.add_all([kb_research, kb_code, kb_content])
    session.commit()
    print("✓ Knowledge bases created")

    # Create default user
    user = session.query(User).filter_by(id="default-user").first()
    if not user:
        user = User(
            id="default-user",
            email="user@example.com",
            name="Default User",
            role="admin"
        )
        session.add(user)
        session.commit()
        print("✓ Default user created")

    # Create test agents with knowledge bases
    agent1 = Agent(
        id=str(uuid.uuid4()),
        name="Research Assistant",
        handle="research-assistant",
        type="text",
        description="Helps with research and information gathering",
        instructions="You are a helpful research assistant.",
        status="active",
        model_id=first_model.id,
        owner_id="default-user",
        temperature=0.7,
        strict_grounding=False
    )
    agent1.knowledge_bases = [kb_research]
    session.add(agent1)

    agent2 = Agent(
        id=str(uuid.uuid4()),
        name="Code Reviewer",
        handle="code-reviewer",
        type="text",
        description="Reviews and analyzes code for quality",
        instructions="You are an expert code reviewer.",
        status="paused",
        model_id=first_model.id,
        owner_id="default-user",
        temperature=0.3,
        strict_grounding=False
    )
    agent2.knowledge_bases = [kb_code]
    session.add(agent2)

    agent3 = Agent(
        id=str(uuid.uuid4()),
        name="Content Writer",
        handle="content-writer",
        type="text",
        description="Writes engaging and informative content",
        instructions="You are a professional content writer.",
        status="active",
        model_id=first_model.id,
        owner_id="default-user",
        temperature=0.8,
        strict_grounding=False
    )
    agent3.knowledge_bases = [kb_content]
    session.add(agent3)

    session.commit()
    print("✓ Agents created with knowledge bases")
    print("\n✅ Database seeded successfully!")

except Exception as e:
    print(f"❌ Error: {e}")
    session.rollback()
finally:
    session.close()
