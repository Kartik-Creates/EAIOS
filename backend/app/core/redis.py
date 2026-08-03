import redis.asyncio as aioredis

from app.core.config import settings

# Global async redis client connection
redis_client = aioredis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

ACTIVE_JTIS_PREFIX = "active_jtis"
REVOKED_JTI_PREFIX = "revoked_jti"

async def add_active_jti(user_id: str, jti: str, expire_seconds: int) -> None:
    """Store the issued JTI in the user's active set and set/refresh its TTL."""
    key = f"{ACTIVE_JTIS_PREFIX}:{user_id}"
    await redis_client.sadd(key, jti)
    await redis_client.expire(key, expire_seconds)

async def remove_active_jti(user_id: str, jti: str) -> None:
    """Remove a specific JTI from the user's active set."""
    key = f"{ACTIVE_JTIS_PREFIX}:{user_id}"
    await redis_client.srem(key, jti)

async def get_active_jtis(user_id: str) -> set[str]:
    """Retrieve all currently active JTIs for a user."""
    key = f"{ACTIVE_JTIS_PREFIX}:{user_id}"
    members = await redis_client.smembers(key)
    return set(members) if members else set()

async def clear_active_jtis(user_id: str) -> None:
    """Clear all active JTIs for a user (e.g. on logout)."""
    key = f"{ACTIVE_JTIS_PREFIX}:{user_id}"
    await redis_client.delete(key)

async def revoke_jti(jti: str, expire_seconds: int) -> None:
    """Store a JTI in the revoked/used blacklist with a TTL matching its expiry."""
    if expire_seconds <= 0:
        return
    key = f"{REVOKED_JTI_PREFIX}:{jti}"
    await redis_client.setex(key, expire_seconds, "1")

async def is_jti_revoked(jti: str) -> bool:
    """Check if a JTI has been revoked/used."""
    key = f"{REVOKED_JTI_PREFIX}:{jti}"
    val = await redis_client.get(key)
    return val is not None


OAUTH_STATE_PREFIX = "oauth_state"

async def store_oauth_state(jti: str, user_id: str, expire_seconds: int = 600) -> None:
    """Store OAuth state JTI in Redis with a short TTL (10 minutes)."""
    key = f"{OAUTH_STATE_PREFIX}:{jti}"
    await redis_client.setex(key, expire_seconds, user_id)

async def consume_oauth_state(jti: str) -> str | None:
    """Retrieve and delete an OAuth state JTI atomically (single-use enforcement)."""
    key = f"{OAUTH_STATE_PREFIX}:{jti}"
    user_id = await redis_client.get(key)
    if user_id:
        await redis_client.delete(key)
    return user_id

