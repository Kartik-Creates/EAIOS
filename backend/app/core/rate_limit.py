from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.core.config import settings


def _rate_limit_key(request: Request) -> str:
    """Rate-limit by authenticated user id; fall back to client IP.

    Reads the bearer token directly instead of depending on get_current_user
    because slowapi's key_func runs before FastAPI resolves dependencies.
    Keying by user (not just IP) stops one account from exhausting the quota
    for everyone behind the same NAT/proxy, and vice versa.
    """
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id and payload.get("type") == "access":
                return f"user:{user_id}"
        except JWTError:
            pass
    return f"ip:{get_remote_address(request)}"


# In-memory storage: correct for the current single-process deployment
# (docker-compose runs one uvicorn process, no --workers). If the backend
# is ever scaled to multiple workers/replicas, switch to
# storage_uri=settings.REDIS_URL (Redis is already in the stack) so quotas
# are shared across processes instead of tracked independently per worker.
limiter = Limiter(key_func=_rate_limit_key)
