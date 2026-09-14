from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ---------------------------------------------------------------------------
# Connection pool configuration for asyncpg / PostgreSQL
#
# pool_size=5     — Max persistent connections per worker process.
#                   Kept conservative: Render's free/starter tier and local
#                   dev PostgreSQL both have limited simultaneous connection
#                   budgets. 5 concurrent connections per worker is safe.
#
# max_overflow=10 — Additional connections allowed beyond pool_size under burst
#                   load. These are created on demand and closed when idle.
#                   Total max = pool_size + max_overflow = 15 per worker.
#
# pool_recycle=1800 — Recycle connections older than 30 minutes to avoid
#                     "SSL connection has been closed unexpectedly" errors
#                     from PostgreSQL's idle connection timeouts.
#
# pool_pre_ping=True — Issue a lightweight "SELECT 1" before handing out a
#                      connection. Prevents failed queries from stale (dropped)
#                      TCP connections, especially after network interruptions
#                      or DB restarts.
# ---------------------------------------------------------------------------
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
