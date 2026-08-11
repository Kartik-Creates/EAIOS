from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter
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

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
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
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(workflow.router, prefix=f"{settings.API_V1_STR}/workflows", tags=["workflows"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])



import logging

logger = logging.getLogger("eaios.security")

@app.on_event("startup")
async def startup_security_checks():
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

