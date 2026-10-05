from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

engine: AsyncEngine | None = None
AsyncSessionLocal = sessionmaker(
    bind=None,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_engine():
    global engine
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
        poolclass=NullPool,
        connect_args={"timeout": 30, "check_same_thread": False},
    )
    AsyncSessionLocal.configure(bind=engine)

    async with engine.connect() as conn:
        await conn.execute(text("PRAGMA journal_mode=WAL"))
        await conn.execute(text("PRAGMA foreign_keys=ON"))
        await conn.commit()


async def init_db():
    await init_engine()
    # Create all tables
    from app.models.base import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    if not engine:
        await init_engine()
    async with AsyncSessionLocal() as session:
        yield session
