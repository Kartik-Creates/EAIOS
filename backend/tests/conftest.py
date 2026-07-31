import pytest
import pytest_asyncio
from app.core.deps import get_db
from app.db.base import Base
from app.main import app
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Use StaticPool to ensure a single in-memory SQLite connection is reused
# across the entire session — this prevents cross-fixture data leaks that
# occur when different connections each get their own empty in-memory DB.
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

@pytest_asyncio.fixture(name="db_session")
async def db_session_fixture():
    # Create the tables in the in-memory database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with TestingSessionLocal() as session:
        yield session
        
    # Clean up tables — drop and recreate ensures isolation between tests
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture(name="client")
async def client_fixture(db_session):
    from app.core.rate_limit import limiter

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    limiter.reset()  # the limiter is a process-wide singleton; isolate tests
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def mock_redis_helpers(monkeypatch):
    active_jtis = {}  # user_id -> set of jtis
    revoked_jtis = set()
    oauth_states = {}  # jti -> user_id

    async def fake_add_active_jti(user_id: str, jti: str, expire_seconds: int):
        if user_id not in active_jtis:
            active_jtis[user_id] = set()
        active_jtis[user_id].add(jti)

    async def fake_remove_active_jti(user_id: str, jti: str):
        if user_id in active_jtis:
            active_jtis[user_id].discard(jti)

    async def fake_get_active_jtis(user_id: str):
        return active_jtis.get(user_id, set())

    async def fake_clear_active_jtis(user_id: str):
        if user_id in active_jtis:
            active_jtis[user_id].clear()

    async def fake_revoke_jti(jti: str, expire_seconds: int):
        revoked_jtis.add(jti)

    async def fake_is_jti_revoked(jti: str):
        return jti in revoked_jtis

    async def fake_store_oauth_state(jti: str, user_id: str, expire_seconds: int = 600):
        oauth_states[jti] = user_id

    async def fake_consume_oauth_state(jti: str):
        return oauth_states.pop(jti, None)

    monkeypatch.setattr("app.core.redis.add_active_jti", fake_add_active_jti)
    monkeypatch.setattr("app.core.redis.remove_active_jti", fake_remove_active_jti)
    monkeypatch.setattr("app.core.redis.get_active_jtis", fake_get_active_jtis)
    monkeypatch.setattr("app.core.redis.clear_active_jtis", fake_clear_active_jtis)
    monkeypatch.setattr("app.core.redis.revoke_jti", fake_revoke_jti)
    monkeypatch.setattr("app.core.redis.is_jti_revoked", fake_is_jti_revoked)
    monkeypatch.setattr("app.core.redis.store_oauth_state", fake_store_oauth_state)
    monkeypatch.setattr("app.core.redis.consume_oauth_state", fake_consume_oauth_state)

    # Patch the direct imports inside app.routers.auth and app.routers.integrations
    monkeypatch.setattr("app.routers.auth.add_active_jti", fake_add_active_jti)
    monkeypatch.setattr("app.routers.auth.remove_active_jti", fake_remove_active_jti)
    monkeypatch.setattr("app.routers.auth.get_active_jtis", fake_get_active_jtis)
    monkeypatch.setattr("app.routers.auth.clear_active_jtis", fake_clear_active_jtis)
    monkeypatch.setattr("app.routers.auth.revoke_jti", fake_revoke_jti)
    monkeypatch.setattr("app.routers.auth.is_jti_revoked", fake_is_jti_revoked)

    monkeypatch.setattr("app.routers.integrations.store_oauth_state", fake_store_oauth_state)
    monkeypatch.setattr("app.routers.integrations.consume_oauth_state", fake_consume_oauth_state)

    yield {"active_jtis": active_jtis, "revoked_jtis": revoked_jtis, "oauth_states": oauth_states}

