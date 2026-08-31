import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter

logger = logging.getLogger("eaios.api")
from app.routers import (
    admin,
    auth,
    briefing,
    chat,
    dashboard,
    documents,
    health,
    integrations,
    meeting,
    notifications,
    search,
    workflow,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure any unhandled server error returns clean JSON and includes CORS headers,
    preventing browser-level CORS policy blocks on 500 errors.
    """
    logger.exception("Unhandled error on %s %s: %s", request.method, request.url.path, exc)
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# Set all CORS enabled origins
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "https://unifyai-zeta.vercel.app",
    "https://eaios-ijy2.onrender.com",
]

cors_origins = list(DEFAULT_CORS_ORIGINS)
if settings.BACKEND_CORS_ORIGINS:
    configured = settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else [settings.BACKEND_CORS_ORIGINS]
    for o in configured:
        cleaned = str(o).rstrip("/")
        if cleaned and cleaned not in cors_origins:
            cors_origins.append(cleaned)

if settings.FRONTEND_URL:
    clean_frontend = str(settings.FRONTEND_URL).rstrip("/")
    if clean_frontend and clean_frontend not in cors_origins:
        cors_origins.append(clean_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_STR, tags=["health"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(chat.router, prefix=settings.API_V1_STR, tags=["chat"])
app.include_router(search.router, prefix=settings.API_V1_STR, tags=["search"])
app.include_router(integrations.router, prefix=f"{settings.API_V1_STR}/integrations", tags=["integrations"])
app.include_router(briefing.router, prefix=settings.API_V1_STR, tags=["briefing"])
app.include_router(meeting.router, prefix=settings.API_V1_STR, tags=["meeting"])
app.include_router(documents.router, prefix=settings.API_V1_STR, tags=["documents"])
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/workflows", tags=["workflows"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(notifications.router, prefix=settings.API_V1_STR, tags=["notifications"])




@app.on_event("startup")
async def startup_security_checks():
    # 1. Run database auto-migrations to guarantee production DB tables exist
    try:
        import asyncio
        from alembic.config import Config
        from alembic import command
        alembic_cfg = Config("alembic.ini")
        await asyncio.to_thread(command.upgrade, alembic_cfg, "head")
        logger.info("Database auto-migrations (alembic upgrade head) applied successfully at startup.")
    except Exception as exc:
        logger.warning("Database auto-migration check skipped/failed: %s", exc)

    env = getattr(settings, "ENVIRONMENT", "development")
    if env != "development":
        logger.warning(
            "CRITICAL SECURITY NOTICE: Running in non-development environment '%s'. "
            "Confirm VITE_BYPASS_AUTH and dev-only auth bypass flags are disabled across all client builds.",
            env
        )
    if settings.LLM_PROVIDER.lower() == "gemini" or settings.EMBEDDING_PROVIDER.lower() == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "CONFIG WARNING: GEMINI_API_KEY is not set while LLM_PROVIDER or EMBEDDING_PROVIDER is 'gemini'."
            )
        else:
            try:
                from google import genai
                _ = genai.Client(api_key=settings.GEMINI_API_KEY)
                logger.info("Gemini provider validation successful at startup.")
            except Exception as exc:  # noqa: BLE001 — genai.Client can raise various SDK/network
                # errors; any of them should just warn at startup, never crash the server.
                logger.warning("Gemini provider initialization check failed at startup: %s", exc)


@app.get("/")
def root():
    return {
        "message": "Welcome to Enterprise AI Operating System (EAIOS) API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }

