import json
from typing import Any
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "EAIOS"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: list[str | AnyHttpUrl] | str = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "https://unifyai-zeta.vercel.app",
        "https://eaios-ijy2.onrender.com",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).rstrip("/") for i in v]
        return []

    # Host URLs for OAuth redirects
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"


    # Database

    DATABASE_URL: str = "postgresql+asyncpg://eaios_user:eaios_password@localhost:5432/eaios_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_MIN_32_CHARS"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes — non-negotiable baseline rule
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = "CHANGE_THIS_IN_PRODUCTION_ENCRYPTION_KEY_MIN_32_CHARS"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Slack OAuth/Token
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""
    SLACK_BOT_TOKEN: str = ""

    # Jira OAuth/Token
    JIRA_CLIENT_ID: str = ""
    JIRA_CLIENT_SECRET: str = ""
    JIRA_API_TOKEN: str = ""

    # LLM Provider selection ("ollama" for local dev, "gemini" for production)
    LLM_PROVIDER: str = "ollama"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"


    # Embedding Provider selection ("ollama" for local dev, "gemini" for production)
    EMBEDDING_PROVIDER: str = "ollama"

    # Ollama (local LLM + embeddings)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_EMBED_MODEL: str = "nomic-embed-text"
    OLLAMA_CHAT_MODEL: str = "llama3.2"
    EMBEDDING_DIM: int = 768

    # Chat endpoint rate limit (in-process; see app/core/rate_limit.py)
    CHAT_RATE_LIMIT: str = "10/minute"


    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()