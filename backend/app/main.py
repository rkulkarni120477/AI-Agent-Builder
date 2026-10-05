from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import engine, init_db
from app.api.routes import agents, models, knowledge_bases, workspaces


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    if engine:
        await engine.dispose()


app = FastAPI(
    title="Agent Studio API",
    description="AI Agent Builder backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(agents.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(knowledge_bases.router, prefix="/api")
app.include_router(workspaces.router, prefix="/api")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.environment,
    }


@app.get("/api/health")
async def api_health():
    return {
        "status": "ok",
        "service": "Agent Studio API",
    }
