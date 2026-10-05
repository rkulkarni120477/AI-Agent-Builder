# Agent Studio — Architecture & Decisions

## Current Phase

**Phase 6: Runs, Settings, Hardening** (complete ✓)
- [x] Runs history dashboard with filtering
- [x] Agent performance metrics and analytics
- [x] Workspace settings and collaboration
- [x] User settings and preferences (theme, notifications)
- [x] System health monitoring and status page
- [x] Model catalog with pricing and specifications

🎉 **Agent Studio is now production-ready!** All 6 phases complete. The platform supports:
- Full agent lifecycle management (create, edit, delete, version control)
- Knowledge base ingestion with semantic search
- Multi-turn workspace editor with autosave
- Real-time agent execution with streaming responses
- Quick actions and result insertion workflows
- System analytics and monitoring dashboards
- User preferences and workspace collaboration settings

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

## Production Readiness Checklist

### Phase 6 Complete
- [x] System health monitoring with real-time metrics
- [x] Agent performance analytics (success rate, tokens, execution time)
- [x] Workspace and user settings management
- [x] Model catalog with pricing and token specifications
- [x] Admin dashboard for system overview

### Future Enhancements (Post-MVP)
- [ ] User role-based access control (RBAC) with fine-grained permissions
- [ ] API rate limiting (per-user, per-model, or global)
- [ ] Database indexes on frequently queried fields for scaling
- [ ] Advanced error logging with structured stack traces
- [ ] Prometheus metrics export for external monitoring
- [ ] Multi-tenancy support with workspace isolation
- [ ] Audit trails for compliance

## Phases Checklist

- [x] 0. Scaffold
- [x] 1. Data & Agents CRUD
- [x] 2. Knowledge & Ingestion
- [x] 3. Workspace Editor
- [x] 4. Agent Runtime & Chat
- [x] 5. Quick Actions & Review
- [x] 6. Runs, Settings, Hardening ✓ **COMPLETE**

## Deployment Notes

Agent Studio is production-ready. To deploy:

1. Set AWS credentials via IAM role or `AWS_PROFILE` env var
2. Configure `ENVIRONMENT=production` and secure `JWT_SECRET`
3. Use Docker Compose for containerized deployment
4. Enable database WAL mode with `PRAGMA journal_mode=WAL`
5. Set up log aggregation and monitoring
6. Consider load balancing for multiple instances (shared SQLite via network FS or migration to PostgreSQL)
