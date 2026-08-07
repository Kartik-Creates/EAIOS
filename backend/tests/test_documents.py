"""Tests for POST /api/v1/documents (manual Company Brain ingestion, admin-only).

Embedding calls are mocked (no live Ollama/Gemini in this environment) —
same pattern as test_chat.py / test_meeting.py.
"""
import uuid

import pytest
from app.core.security import get_password_hash
from app.models.document import Document
from app.models.user import User
from sqlalchemy import select

from tests.rag_fixtures import register_and_login

FAKE_EMBEDDING = [0.01] * 768


async def fake_embed_texts(texts: list[str]) -> list[list[float]]:
    return [FAKE_EMBEDDING for _ in texts]


@pytest.fixture(autouse=True)
def _patch_embedding(monkeypatch):
    monkeypatch.setattr("app.services.ingestion_service.embed_texts", fake_embed_texts)


async def _make_admin(client, db_session, email: str) -> str:
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        full_name="Admin User",
        hashed_password=get_password_hash("securepassword"),
        is_active=True,
        is_superuser=False,
        role="admin",
        token_version=0,
    )
    db_session.add(user)
    await db_session.commit()

    login_resp = client.post("/api/v1/auth/login", data={"username": email, "password": "securepassword"})
    return login_resp.json()["access_token"]


@pytest.mark.asyncio
async def test_documents_ingest_success_as_admin(client, db_session):
    token = await _make_admin(client, db_session, "admin-ingest@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/documents",
        json={"title": "Sample Policy.pdf", "content": "Employees get 20 days of paid leave per year."},
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Sample Policy.pdf"
    assert data["source"] == "manual_upload"
    assert data["restricted_role"] is None
    assert data["chunk_count"] >= 1
    assert data.get("id")

    stmt = select(Document).where(Document.id == data["id"])
    row = (await db_session.execute(stmt)).scalars().first()
    assert row is not None
    assert row.title == "Sample Policy.pdf"


@pytest.mark.asyncio
async def test_documents_ingest_respects_restricted_role(client, db_session):
    token = await _make_admin(client, db_session, "admin-ingest2@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/documents",
        json={"title": "HR Only.pdf", "content": "Confidential salary data.", "restricted_role": "hr"},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["restricted_role"] == "hr"


@pytest.mark.asyncio
async def test_documents_ingest_rejected_for_non_admin(client):
    token = register_and_login(client, "employee-ingest@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/documents",
        json={"title": "Should Fail.pdf", "content": "Content."},
        headers=headers,
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_documents_ingest_unauthenticated_returns_401(client):
    response = client.post(
        "/api/v1/documents",
        json={"title": "Should Fail.pdf", "content": "Content."},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_documents_ingest_missing_content_returns_422(client, db_session):
    token = await _make_admin(client, db_session, "admin-ingest3@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/documents",
        json={"title": "No Content.pdf", "content": ""},
        headers=headers,
    )
    assert response.status_code == 422
