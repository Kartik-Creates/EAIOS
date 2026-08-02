"""Unit tests for the swappable embedding provider abstraction (Ollama vs Gemini google-genai SDK).

Tests verify:
  - Ollama path routing and response handling
  - Gemini path routing via google-genai Client, API call shape, and dimension validation
  - Error handling for missing API key and unsupported providers
  - Dimension mismatch detection
"""
from unittest.mock import MagicMock

import pytest

from app.core.config import settings
from app.services.embedding_service import (
    EmbeddingServiceError,
    embed_text,
    embed_texts,
)


@pytest.mark.asyncio
async def test_embed_texts_ollama_path(monkeypatch):
    """When EMBEDDING_PROVIDER='ollama', embed_texts routes to Ollama."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "ollama")
    monkeypatch.setattr(settings, "EMBEDDING_DIM", 768)

    fake_vector = [0.1] * 768

    class MockResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"embeddings": [fake_vector]}

    async def mock_post(self, url, *args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    result = await embed_texts(["test text"])
    assert len(result) == 1
    assert len(result[0]) == 768
    assert result[0] == fake_vector


@pytest.mark.asyncio
async def test_embed_text_ollama_single(monkeypatch):
    """embed_text (singular) delegates to embed_texts correctly."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "ollama")
    monkeypatch.setattr(settings, "EMBEDDING_DIM", 768)

    fake_vector = [0.5] * 768

    class MockResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"embeddings": [fake_vector]}

    async def mock_post(self, url, *args, **kwargs):
        return MockResponse()

    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    result = await embed_text("single text")
    assert len(result) == 768


@pytest.mark.asyncio
async def test_embed_texts_gemini_path(monkeypatch):
    """When EMBEDDING_PROVIDER='gemini', embed_texts routes to Gemini Client (google-genai)."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "EMBEDDING_DIM", 768)

    fake_vector = [0.2] * 768

    mock_client = MagicMock()
    mock_embedding = MagicMock()
    mock_embedding.values = fake_vector
    mock_response = MagicMock()
    mock_response.embeddings = [mock_embedding]
    mock_client.models.embed_content.return_value = mock_response

    mock_genai_module = MagicMock()
    mock_genai_module.Client.return_value = mock_client

    monkeypatch.setattr("google.genai.Client", mock_genai_module.Client)

    result = await embed_texts(["test text for gemini"])
    assert len(result) == 1
    assert len(result[0]) == 768

    # Verify Client initialization and embed_content call
    mock_genai_module.Client.assert_called_once_with(api_key="test-key")
    mock_client.models.embed_content.assert_called_once()
    call_kwargs = mock_client.models.embed_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-embedding-001"
    assert call_kwargs["contents"] == "test text for gemini"
    assert call_kwargs["config"].output_dimensionality == 768


@pytest.mark.asyncio
async def test_embed_texts_gemini_missing_key(monkeypatch):
    """When EMBEDDING_PROVIDER='gemini' but GEMINI_API_KEY is empty, raise error."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    with pytest.raises(EmbeddingServiceError) as exc_info:
        await embed_texts(["test"])

    assert "GEMINI_API_KEY is not configured" in str(exc_info.value)


@pytest.mark.asyncio
async def test_embed_texts_invalid_provider(monkeypatch):
    """When EMBEDDING_PROVIDER is unsupported, raise error."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "cohere")

    with pytest.raises(EmbeddingServiceError) as exc_info:
        await embed_texts(["test"])

    assert "Unsupported EMBEDDING_PROVIDER" in str(exc_info.value)


@pytest.mark.asyncio
async def test_embed_texts_empty_input(monkeypatch):
    """embed_texts with empty list returns empty list without hitting any API."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "ollama")
    result = await embed_texts([])
    assert result == []


@pytest.mark.asyncio
async def test_embed_texts_gemini_dimension_mismatch(monkeypatch):
    """If Gemini returns wrong dimension, EmbeddingServiceError is raised."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "EMBEDDING_DIM", 768)

    wrong_dim_vector = [0.1] * 512  # Wrong dimension

    mock_client = MagicMock()
    mock_embedding = MagicMock()
    mock_embedding.values = wrong_dim_vector
    mock_response = MagicMock()
    mock_response.embeddings = [mock_embedding]
    mock_client.models.embed_content.return_value = mock_response

    mock_genai_module = MagicMock()
    mock_genai_module.Client.return_value = mock_client

    monkeypatch.setattr("google.genai.Client", mock_genai_module.Client)

    with pytest.raises(EmbeddingServiceError) as exc_info:
        await embed_texts(["test"])

    assert "dimension mismatch" in str(exc_info.value).lower()


@pytest.mark.asyncio
async def test_embed_texts_gemini_batch(monkeypatch):
    """Gemini path handles multiple texts by calling embed_content per text."""
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
    monkeypatch.setattr(settings, "EMBEDDING_DIM", 768)

    call_count = 0

    def mock_embed_content(**kwargs):
        nonlocal call_count
        call_count += 1
        mock_emb = MagicMock()
        mock_emb.values = [float(call_count)] * 768
        mock_res = MagicMock()
        mock_res.embeddings = [mock_emb]
        return mock_res

    mock_client = MagicMock()
    mock_client.models.embed_content.side_effect = mock_embed_content

    mock_genai_module = MagicMock()
    mock_genai_module.Client.return_value = mock_client

    monkeypatch.setattr("google.genai.Client", mock_genai_module.Client)

    result = await embed_texts(["text 1", "text 2", "text 3"])
    assert len(result) == 3
    assert result[0][0] != result[1][0]
    assert mock_client.models.embed_content.call_count == 3
