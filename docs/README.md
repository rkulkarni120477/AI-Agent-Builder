# Agent Studio — AI Agent Builder

A production-grade platform for building, managing, and deploying specialized AI agents for educational content.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- `uv` (Python package manager)
- `pnpm` (Node package manager)
- AWS credentials (for Bedrock access)

### Setup

1. **Clone and navigate to the repo**
   ```bash
   cd "AI-Agent Builder"
   ```

2. **Install dependencies**
   ```bash
   uv pip install -e .
   cd frontend && pnpm install && cd ..
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials and Bedrock model IDs
   ```

4. **Check Bedrock access**
   ```bash
   make bedrock-check
   ```

### Development

**Start both backend and frontend:**
```bash
make dev
```

Or start them separately:
```bash
make backend-dev    # Terminal 1: FastAPI on http://localhost:8000
make frontend-dev   # Terminal 2: Next.js on http://localhost:3000
```

**Run tests:**
```bash
make test           # All tests
make test-backend   # Backend only
make test-frontend  # Frontend only
```

**Lint and format:**
```bash
make lint           # Check code
make format         # Auto-format
```

### Docker

Start all services with Docker Compose:
```bash
make docker-up
```

View logs:
```bash
make docker-logs
```

Stop services:
```bash
make docker-down
```

## Architecture

### Backend (`backend/`)
- **FastAPI** with async SQLAlchemy 2.0
- **SQLite** (WAL mode) for data persistence
- **AWS Bedrock** for Claude model access
- **LangChain + LangGraph** for agent orchestration
- **Chroma** for vector embeddings

### Frontend (`frontend/`)
- **Next.js 14** (App Router) for server-side rendering
- **React 18** with TypeScript (strict)
- **TailwindCSS** with design tokens from mockup
- **TipTap** for rich-text editing
- **TanStack Query** for server state
- **Zustand** for UI state

### Design System
All colors, fonts, spacing, and shadows are defined in `frontend/styles/tokens.css` and mapped to Tailwind for consistency.

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `POST /api/auth/login` | User login |
| `GET /api/agents` | List agents |
| `POST /api/agents` | Create agent |
| `GET /api/models` | List available models |
| `POST /api/documents/{id}/threads/{thread_id}/messages` | Chat (SSE stream) |

## Phases

- **Phase 0**: Scaffold (current) — repo setup, design tokens, app shell
- **Phase 1**: Data & Agents CRUD — schema, seed, APIs
- **Phase 2**: Knowledge & Ingestion — file upload, embeddings, retrieval
- **Phase 3**: Workspace Editor — TipTap editor with all menus and dialogs
- **Phase 4**: Agent Runtime & Chat — LangGraph orchestrator, SSE streaming
- **Phase 5**: Quick Actions & Review — 10 actions, 4-category review
- **Phase 6**: Runs, Settings, Hardening — logs, auth, rate limiting, E2E tests

## AWS Setup

### Required Model Access

Enable these models in your AWS Bedrock console:

- `claude-opus-5-5-sonnet-20241022` (or equivalent Opus)
- `claude-sonnet-5-5-20241022` (or equivalent Sonnet)
- `claude-haiku-4-5-20241022` (or equivalent Haiku)
- `amazon.titan-embed-text-v2:0` (embeddings)

### IAM Policy

Attach the least-privilege policy from `infra/iam-policy.json` to your deployment role.

## Configuration

All settings are in `.env`:

```
AWS_REGION=us-east-1
AWS_PROFILE=                    # Optional local profile name
BEDROCK_MODEL_OPUS=...          # Model ID or cross-region inference profile ID
BEDROCK_MODEL_SONNET=...
BEDROCK_MODEL_HAIKU=...
BEDROCK_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
DATABASE_URL=sqlite+aiosqlite:///./data/app.db
VECTOR_DIR=./data/vectors       # Chroma persistent folder
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=...                  # Generate a strong secret in production
```

## File Structure

```
agent-studio/
├── backend/                     # Python FastAPI app
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── core/
│   │   │   ├── config.py        # Settings
│   │   │   ├── db.py            # SQLAlchemy + SQLite
│   │   │   └── security.py      # JWT auth
│   │   ├── llm/
│   │   │   ├── bedrock.py       # Boto3 client setup
│   │   │   ├── factory.py       # get_chat_model() factory
│   │   │   └── catalog.py       # Model catalog
│   │   ├── models/              # SQLAlchemy tables (TODO Phase 1)
│   │   ├── schemas/             # Pydantic request/response (TODO Phase 1)
│   │   ├── api/routes/          # API endpoints (TODO Phase 1)
│   │   ├── services/            # Business logic (TODO Phase 2)
│   │   └── agents/              # Agent runtime (TODO Phase 4)
│   ├── alembic/                 # Database migrations (TODO Phase 1)
│   ├── tests/                   # Pytest suite (TODO Phase 1)
│   ├── seed.py                  # Seed data script (TODO Phase 1)
│   └── pyproject.toml
├── frontend/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── (studio)/            # Studio group (TODO Phase 1)
│   ├── components/              # React components (TODO Phase 1+)
│   ├── lib/                     # Utilities & API client
│   ├── styles/
│   │   ├── tokens.css           # Design tokens
│   │   └── globals.css          # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── tailwind.config.ts
├── infra/
│   └── iam-policy.json          # AWS least-privilege policy (TODO Phase 0)
├── docker-compose.yml           # Local development setup
├── Makefile                     # Development commands
├── CLAUDE.md                    # Project notes
├── CHANGELOG.md                 # Release notes (TODO)
└── README.md                    # This file
```

## Contributing

1. Create a feature branch
2. Make changes, ensuring tests pass
3. Run `make lint` and `make format`
4. Commit with clear messages
5. Open a PR with a summary

## License

Proprietary — Agent Studio by Academian.
