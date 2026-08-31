"""Tests for POST /api/v1/documents (manual Company Brain ingestion, admin-only),
POST /api/v1/documents/upload (multipart file upload),
GET /api/v1/documents (list documents),
and DELETE /api/v1/documents/{id} (delete document and chunks).

Embedding calls are mocked (no live Ollama/Gemini in this environment) —
same pattern as test_chat.py / test_meeting.py.
"""
import io
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


# ── File Upload, List, and Delete Tests ────────────────────────────────────────


@pytest.mark.asyncio
async def test_documents_upload_txt_file_success(client, db_session):
    token = await _make_admin(client, db_session, "admin-upload-txt@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    file_content = b"Remote work is permitted on Mondays and Fridays with manager approval."
    files = {"file": ("Remote_Work_Guidelines.txt", io.BytesIO(file_content), "text/plain")}

    response = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Remote_Work_Guidelines.txt"
    assert data["source"] == "manual_upload"
    assert data["chunk_count"] >= 1
    assert data["id"]


@pytest.mark.asyncio
async def test_documents_upload_docx_file_success(client, db_session):
    import docx

    token = await _make_admin(client, db_session, "admin-upload-docx@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create a real in-memory docx file
    doc = docx.Document()
    doc.add_paragraph("Travel Reimbursement Policy details: Per diem allowance is $50/day.")
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)

    files = {"file": ("Travel_Reimbursement_Policy.docx", buf, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}

    response = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Travel_Reimbursement_Policy.docx"
    assert data["chunk_count"] >= 1


@pytest.mark.asyncio
async def test_documents_upload_pdf_file_success(client, db_session, monkeypatch):
    from pypdf import PdfWriter

    token = await _make_admin(client, db_session, "admin-upload-pdf@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create in-memory PDF with text content via pypdf
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    buf.seek(0)

    # Mock extract_text_from_file for this test to ensure text is present
    monkeypatch.setattr(
        "app.routers.documents.extract_text_from_file",
        lambda filename, bytes_data: "Health and wellness insurance coverage details.",
    )
    files = {"file": ("Healthcare_Benefits.pdf", buf, "application/pdf")}
    response = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Healthcare_Benefits.pdf"


@pytest.mark.asyncio
async def test_documents_upload_empty_rejected(client, db_session):
    token = await _make_admin(client, db_session, "admin-upload-empty@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    response = client.post(
        "/api/v1/documents/upload",
        files=files,
        headers=headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_documents_list_endpoint(client, db_session):
    token = await _make_admin(client, db_session, "admin-list@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest a document first
    client.post(
        "/api/v1/documents",
        json={"title": "Listable Document.pdf", "content": "Listable document content."},
        headers=headers,
    )

    response = client.get("/api/v1/documents", headers=headers)
    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)
    assert any(d["title"] == "Listable Document.pdf" for d in docs)


@pytest.mark.asyncio
async def test_documents_delete_endpoint(client, db_session):
    token = await _make_admin(client, db_session, "admin-delete@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Ingest a document first
    create_resp = client.post(
        "/api/v1/documents",
        json={"title": "To Be Deleted.pdf", "content": "Delete me."},
        headers=headers,
    )
    doc_id = create_resp.json()["id"]

    # Delete it
    del_resp = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert del_resp.status_code == 204

    # Verify gone from db
    stmt = select(Document).where(Document.id == doc_id)
    row = (await db_session.execute(stmt)).scalars().first()
    assert row is None
