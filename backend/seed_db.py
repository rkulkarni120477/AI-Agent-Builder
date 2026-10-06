#!/usr/bin/env python3
import uuid
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Model, Agent, User, KnowledgeBase, Workspace, Base

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
    kb_academic = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Academic Standards",
        description="Educational standards and curriculum frameworks"
    )
    kb_curriculum = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Curriculum Library",
        description="Curated curriculum resources and lesson plans"
    )
    kb_learning = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Learning Content",
        description="Educational content and learning materials"
    )
    kb_skills = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Skills Taxonomies",
        description="Skill classification and taxonomy frameworks"
    )
    kb_credentials = KnowledgeBase(
        id=str(uuid.uuid4()),
        name="Industry Credentials",
        description="Professional certifications and credential requirements"
    )

    session.add_all([kb_research, kb_code, kb_content, kb_academic, kb_curriculum, kb_learning, kb_skills, kb_credentials])
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

    # Create test agents
    agents = [
        Agent(
            id=str(uuid.uuid4()),
            name="Standards Aligner",
            handle="standards-aligner",
            type="Standard alignment",
            description="Maps lessons and assessments to academic standards.",
            instructions="You are an expert in academic standards alignment. Map educational content to relevant standards.",
            status="active",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.7,
            strict_grounding=False,
            knowledge_bases=[kb_academic, kb_curriculum]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Content Tagger",
            handle="content-tagger",
            type="Content tagging",
            description="Tags learning content with topics, standards and skills.",
            instructions="You are an expert in content tagging and classification. Assign relevant tags to educational content.",
            status="active",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.5,
            strict_grounding=False,
            knowledge_bases=[kb_learning, kb_skills]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Skill Extractor",
            handle="skill-extractor",
            type="Skill extraction",
            description="Pulls skills from course outcomes and job descriptions.",
            instructions="You are an expert at identifying and extracting skills from various sources.",
            status="active",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.6,
            strict_grounding=False,
            knowledge_bases=[kb_skills]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Skill Gap Analyzer",
            handle="skill-gap-analyzer",
            type="Skill gap analysis",
            description="Compares program skills against target roles.",
            instructions="You are an expert at analyzing skill gaps and making recommendations.",
            status="draft",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.6,
            strict_grounding=False,
            knowledge_bases=[kb_skills, kb_credentials]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Curriculum Creator",
            handle="curriculum-creator",
            type="Curriculum creation",
            description="Designs comprehensive curriculum frameworks and learning paths",
            instructions="You are an expert curriculum designer. Create well-structured learning pathways.",
            status="draft",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.7,
            strict_grounding=False,
            knowledge_bases=[kb_curriculum, kb_learning]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Micro-course Builder",
            handle="micro-course-builder",
            type="Micro-course creation",
            description="Develops focused, bite-sized learning modules and micro-courses",
            instructions="You are an expert in creating micro-learning content. Design engaging short-form courses.",
            status="draft",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.7,
            strict_grounding=False,
            knowledge_bases=[kb_learning]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Assessment Designer",
            handle="assessment-designer",
            type="Other",
            description="Creates aligned assessments that measure learning outcomes",
            instructions="You are an expert in assessment design. Create evaluations that align with learning objectives.",
            status="draft",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.6,
            strict_grounding=False,
            knowledge_bases=[kb_academic]
        ),
        Agent(
            id=str(uuid.uuid4()),
            name="Content Generator",
            handle="content-generator",
            type="Content creation",
            description="Generates educational content, lessons, and explanations",
            instructions="You are an expert content creator. Generate clear, engaging educational material.",
            status="draft",
            model_id=first_model.id,
            owner_id="default-user",
            temperature=0.8,
            strict_grounding=False,
            knowledge_bases=[kb_learning, kb_content]
        ),
    ]

    for agent in agents:
        session.add(agent)

    session.commit()
    print(f"✓ {len(agents)} agents created with knowledge bases")

    # Create default workspace with Forces and Motion content
    workspace_content = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Forces and Motion"}]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Learning objectives"}]
            },
            {
                "type": "bulletList",
                "content": [
                    {
                        "type": "listItem",
                        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Students will understand forces."}]}]
                    },
                    {
                        "type": "listItem",
                        "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Students will learn about motion."}]}]
                    }
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Introduction"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "A force is a push or a pull that is applied to an object. When the forces acting on an object are unbalanced, the motion of the object changes. Forces are measured in newtons, which is why the net force must be calculated before the resulting acceleration can be determined."}
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Activity: Ramp investigation"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Students roll a toy car down a ramp at three different heights and the distance traveled is recorded. Results are then compared in a table and conclusions are drawn by the groups."}
                ]
            },
            {
                "type": "heading",
                "attrs": {"level": 2},
                "content": [{"type": "text", "text": "Exit ticket"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "Explain, in two or three sentences, why a heavier cart needs a larger force to reach the same acceleration."}
                ]
            }
        ]
    }

    workspace = Workspace(
        id=str(uuid.uuid4()),
        title="Forces and Motion · Grade 7 Science",
        content=json.dumps(workspace_content),
        owner_id="default-user",
        version=1
    )
    session.add(workspace)
    session.commit()
    print("✓ Default workspace created with Forces and Motion lesson")

    print("\n✅ Database seeded successfully!")

except Exception as e:
    print(f"❌ Error: {e}")
    session.rollback()
finally:
    session.close()
