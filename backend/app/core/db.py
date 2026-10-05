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
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.execute("PRAGMA foreign_keys=ON")
        await conn.commit()


async def init_db():
    await init_engine()


async def get_session() -> AsyncSession:
    if not engine:
        await init_engine()
    async with AsyncSessionLocal() as session:
        yield session
