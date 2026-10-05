# Agent Studio — Architecture & Decisions

## Current Phase

**Phase 3: Workspace Editor** (starting)
- [ ] TipTap rich-text editor integration
- [ ] Block-based editor with agent result insertion
- [ ] Workspace persistence to database
- [ ] Document collaboration state management
- [ ] Copy/paste with formatting preservation
- [ ] Export to PDF/Word/HTML
- [ ] Real-time autosave with conflict resolution

## Tech Stack (Fixed)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 14+, React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand, TipTap, Radix UI |
| Backend | Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 async, Alembic |
| Database | SQLite (aiosqlite), WAL mode |
| AI | LangChain, LangGraph, AWS Bedrock (Claude models via boto3) |
| Vector Store | Chroma (persistent local) |
| Embeddings | BedrockEmbeddings (Titan V2), sentence-transformers fallback |
| Streaming | Server-Sent Events (FastAPI) |
| Auth | JWT (httpOnly cookies), Pydantic settings |
| Package Management | uv (Python), pnpm (Node) |

## Design Decisions

### Backend

1. **Bedrock Client** (`app/llm/bedrock.py`): Single boto3 session, reused across requests. Default AWS credential chain (IAM role in prod, `AWS_PROFILE` locally).
2. **Model Factory** (`app/llm/factory.py`): All LLM access goes through `get_chat_model()` and `get_embeddings()` to centralize config and retries.
3. **SQLite + WAL**: Fast enough for MVP, no ops overhead. `PRAGMA journal_mode=WAL` and `foreign_keys=ON` on every connection.
4. **Soft Deletes**: Agents, KBs, documents have `deleted_at` for audit trails without data loss.
5. **Async SQLAlchemy 2.0**: Non-blocking database calls, ready for high concurrency.
6. **Structured Logging**: JSON logs with `run_id`, `request_id`, AWS request ID for tracing.

### Frontend

1. **Design Tokens as CSS Variables** (`styles/tokens.css`): One source of truth, easily themeable. Tailwind config maps to them.
2. **TanStack Query for Server State**: Automatic caching, refetch, background sync for agent lists, documents, chat history.
3. **Zustand for UI State**: Lightweight, minimal boilerplate (sidebar toggle, active tab, dialog state).
4. **TipTap Editor**: Headless, extensible, integrates with Tailwind. Custom toolbar + menu bar per mockup.
5. **Radix UI Primitives**: Unstyled, accessible, combine with Tailwind for consistent look.
6. **Server-side Search & Filters**: Agent name/description search, status filter, knowledge base tag filter — all via query params (`?q=`, `?status=`).

### Auth

1. **JWT in httpOnly Cookies**: Secure by default, CSRF protection via same-site cookie.
2. **Roles** (admin, editor, viewer): Check before actions. Phase 0 mocks a single user; Phase 6 adds multi-user.
3. **No Password Storage in Phase 0**: Demo login. Phase 6 adds passlib + bcrypt.

### Knowledge & Retrieval

1. **Chroma Vector Store** (persistent folder `data/vectors`): Local, fast for MVP. Can swap for sqlite-vec later via `VectorStore` interface.
2. **RecursiveCharacterTextSplitter**: Default 1,000 chars, 150 overlap. Keeps page/heading metadata for citation.
3. **Top-k Retrieval**: Default 6 chunks. Score-based MMR reranking optional.
4. **Strict Grounding**: Agent-level flag. When on, agent replies "I don't know" if no relevant chunks; when off, allowed to use general knowledge.

### Agent Runtime

1. **Agents as Data Rows**: No Python classes. `agents/registry.py` builds runnables from DB rows at request time. Cached by `(agent_id, version)`.
2. **LangGraph Orchestrator** (`agents/graph.py`): State machine with Router → Retrieve → Agent → Finalize. Handoff support via tool calls. Timeouts enforced per agent.
3. **System Prompt Assembly**: Platform rules + type template + user instructions + I/O spec + grounding rule + handoff list.
4. **Structured Outputs**: Each agent type has a Pydantic schema. Final output rendered to blocks for editor insertion.

## Open Questions

- **Inference Profiles**: Should we prefer cross-region profiles (prefix `us.`, `eu.`) for Claude? Decision: Yes, store exact ID per model row, never construct in code.
- **LangSmith Tracing**: Optional behind env flag (`LANGSMITH_API_KEY`)?
- **Rate Limiting**: Per-user, per-model, or global? Decision: Per-user initially; per-model in Phase 6.

## What Blocks Phase 3

- [ ] Workspace model (parent document with blocks and metadata)
- [ ] TipTap editor initializes and renders with custom extensions
- [ ] Agent result schema supports block insertion (text, code, table)
- [ ] Document content persists to database on each keystroke
- [ ] Editor shows agent output in-line with proper formatting
- [ ] Autosave debouncing prevents excessive writes
- [ ] Workspace UI renders editor toolbar matching mockup
- [ ] Copy/paste preserves rich formatting from TipTap nodes

## Phases Checklist

- [x] 0. Scaffold
- [x] 1. Data & Agents CRUD
- [x] 2. Knowledge & Ingestion
- [ ] 3. Workspace Editor ← **current**
- [ ] 4. Agent Runtime & Chat
- [ ] 5. Quick Actions & Review
- [ ] 6. Runs, Settings, Hardening
