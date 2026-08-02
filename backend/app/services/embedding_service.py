import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("eaios.embedding")

GEMINI_EMBED_MODEL = "gemini-embedding-001"


class EmbeddingServiceError(RuntimeError):
    """Raised when the embedding backend is unreachable or returns an unexpected shape."""


# ── Ollama path (local dev default) ──────────────────────────────────


async def _embed_texts_ollama(texts: list[str]) -> list[list[float]]:
    """Batch-embed texts via the local Ollama embeddings API."""
    async with httpx.AsyncClient(base_url=settings.OLLAMA_BASE_URL, timeout=60.0) as client:
        try:
            response = await client.post(
                "/api/embed",
                json={"model": settings.OLLAMA_EMBED_MODEL, "input": texts},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise EmbeddingServiceError(
                f"Failed to reach Ollama at {settings.OLLAMA_BASE_URL}: {exc}"
            ) from exc

        payload = response.json()

    vectors = payload.get("embeddings")
    if not isinstance(vectors, list) or len(vectors) != len(texts):
        raise EmbeddingServiceError(
            f"Ollama returned {len(vectors) if isinstance(vectors, list) else 'no'} "
            f"embeddings for {len(texts)} inputs (model={settings.OLLAMA_EMBED_MODEL})"
        )

    for vector in vectors:
        if len(vector) != settings.EMBEDDING_DIM:
            raise EmbeddingServiceError(
                f"Embedding dimension mismatch: got {len(vector)}, "
                f"expected {settings.EMBEDDING_DIM} for model '{settings.OLLAMA_EMBED_MODEL}'"
            )

    return vectors


# ── Gemini path (production) ─────────────────────────────────────────


def _embed_texts_gemini(texts: list[str]) -> list[list[float]]:
    """Batch-embed texts via Google Gemini gemini-embedding-001 API using google-genai SDK.

    Configures output_dimensionality=768 to explicitly match existing Vector(768)
    pgvector columns.
    """
    if not settings.GEMINI_API_KEY:
        raise EmbeddingServiceError(
            "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in your "
            "environment or .env file to use EMBEDDING_PROVIDER=gemini."
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        vectors: list[list[float]] = []
        for text in texts:
            response = client.models.embed_content(
                model=GEMINI_EMBED_MODEL,
                contents=text,
                config=types.EmbedContentConfig(
                    output_dimensionality=settings.EMBEDDING_DIM,
                ),
            )
            if not response.embeddings or not response.embeddings[0].values:
                raise EmbeddingServiceError(
                    f"Gemini returned empty embedding vector for model '{GEMINI_EMBED_MODEL}'"
                )
            vectors.append(response.embeddings[0].values)

    except Exception as exc:
        if isinstance(exc, EmbeddingServiceError):
            raise
        raise EmbeddingServiceError(
            f"Gemini embedding API call failed ({GEMINI_EMBED_MODEL}): {type(exc).__name__}: {exc}"
        ) from exc

    if len(vectors) != len(texts):
        raise EmbeddingServiceError(
            f"Gemini returned {len(vectors)} embeddings for {len(texts)} inputs"
        )

    for vector in vectors:
        if len(vector) != settings.EMBEDDING_DIM:
            raise EmbeddingServiceError(
                f"Embedding dimension mismatch: got {len(vector)}, "
                f"expected {settings.EMBEDDING_DIM} for model '{GEMINI_EMBED_MODEL}'"
            )

    return vectors


# ── Public interface ─────────────────────────────────────────────────


async def embed_text(text: str) -> list[float]:
    """Embed a single text string using the configured EMBEDDING_PROVIDER."""
    return (await embed_texts([text]))[0]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed texts using the configured EMBEDDING_PROVIDER ('ollama' or 'gemini')."""
    if not texts:
        return []

    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "gemini":
        logger.info("Routing embedding to Gemini API (%s), %d texts", GEMINI_EMBED_MODEL, len(texts))
        return _embed_texts_gemini(texts)
    elif provider == "ollama":
        logger.info("Routing embedding to Ollama (%s), %d texts", settings.OLLAMA_EMBED_MODEL, len(texts))
        return await _embed_texts_ollama(texts)
    else:
        raise EmbeddingServiceError(
            f"Unsupported EMBEDDING_PROVIDER '{settings.EMBEDDING_PROVIDER}'. "
            f"Supported providers: 'ollama', 'gemini'."
        )
