import httpx

from app.core.config import settings


class EmbeddingServiceError(RuntimeError):
    """Raised when the embedding backend is unreachable or returns an unexpected shape."""


async def embed_text(text: str) -> list[float]:
    return (await embed_texts([text]))[0]


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Batch-embed texts via the local Ollama embeddings API."""
    if not texts:
        return []

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
