from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.future import select

from app.core.security import encrypt_token
from app.models.integration import Integration
from app.models.oauth_token import OAuthToken
from app.models.user import User


@pytest.mark.asyncio
async def test_drive_sync_success(client, db_session, monkeypatch):
    # 1. Create a test user and login
    client.post("/api/v1/auth/register", json={
        "email": "drivesync@example.com", "password": "securepassword", "full_name": "Drive Sync User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "drivesync@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]
    
    # Get user ID from DB
    res = await db_session.execute(select(User).where(User.email == "drivesync@example.com"))
    user = res.scalars().first()
    
    # 2. Add an OAuth token row for provider="google" for this user
    token_row = OAuthToken(
        user_id=user.id,
        provider="google",
        access_token_encrypted=encrypt_token("fake-google-access-token"),
        refresh_token_encrypted=encrypt_token("fake-google-refresh-token"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(token_row)
    await db_session.commit()
    
    # 3. Mock Google API HTTP calls
    # File listing returns two files: one Google Doc, one plain text file, and one unsupported binary file
    mock_files = [
        {
            "id": "file-doc-123",
            "name": "Meeting Minutes.gdoc",
            "mimeType": "application/vnd.google-apps.document",
            "webViewLink": "https://docs.google.com/document/d/file-doc-123"
        },
        {
            "id": "file-txt-456",
            "name": "notes.txt",
            "mimeType": "text/plain",
            "webViewLink": "https://docs.google.com/file/d/file-txt-456"
        },
        {
            "id": "file-pdf-789",
            "name": "handbook.pdf",
            "mimeType": "application/pdf",
            "webViewLink": "https://docs.google.com/file/d/file-pdf-789"
        }
    ]
    
    class MockResponse:
        def __init__(self, json_data, text_data=None, content_bytes=None, status_code=200):
            self._json = json_data
            self.text = text_data
            self.content = content_bytes
            self.status_code = status_code
        def json(self):
            return self._json
        def raise_for_status(self):
            pass
            
    async def mock_get(self, url, *args, **kwargs):
        url_str = str(url)
        if "drive/v3/files" in url_str:
            if "export" in url_str:
                # Export Google Doc
                return MockResponse(None, text_data="This is the plain text of the Google Doc", status_code=200)
            elif "alt" in kwargs.get("params", {}):
                # Download notes.txt
                return MockResponse(None, content_bytes=b"This is a plain text notes file", status_code=200)
            else:
                # File listing
                return MockResponse({"files": mock_files}, status_code=200)
        return MockResponse({}, status_code=404)
        
    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)
    
    # 4. Mock ingestion_service.ingest_document to track arguments
    ingested_docs = []
    async def mock_ingest(db, *, title, content, source, source_uri=None, restricted_role=None, owner_id=None):
        ingested_docs.append({
            "title": title,
            "content": content,
            "source": source,
            "source_uri": source_uri,
            "owner_id": owner_id
        })
        from app.models.document import Document
        return Document(title=title, source=source)
        
    monkeypatch.setattr("app.services.drive_sync_service.ingest_document", mock_ingest)
    
    # 5. Trigger Drive Sync via POST endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    sync_resp = client.post("/api/v1/integrations/drive/sync", headers=headers)
    assert sync_resp.status_code == 200
    summary = sync_resp.json()
    
    # 6. Verify assertions
    assert len(summary["files_synced"]) == 2
    assert summary["files_synced"][0]["id"] == "file-doc-123"
    assert summary["files_synced"][1]["id"] == "file-txt-456"
    assert len(summary["files_skipped"]) == 1
    assert summary["files_skipped"][0]["id"] == "file-pdf-789"
    assert summary["files_skipped"][0]["reason"] == "Unsupported MIME type: application/pdf"
    
    # Verify ingest_document arguments
    assert len(ingested_docs) == 2
    assert ingested_docs[0]["title"] == "Meeting Minutes.gdoc"
    assert ingested_docs[0]["content"] == "This is the plain text of the Google Doc"
    assert ingested_docs[0]["source"] == "google_drive"
    assert ingested_docs[0]["source_uri"] == "https://docs.google.com/document/d/file-doc-123"
    assert ingested_docs[0]["owner_id"] == user.id
    
    assert ingested_docs[1]["title"] == "notes.txt"
    assert ingested_docs[1]["content"] == "This is a plain text notes file"
    assert ingested_docs[1]["source"] == "google_drive"
    assert ingested_docs[1]["source_uri"] == "https://docs.google.com/file/d/file-txt-456"
    assert ingested_docs[1]["owner_id"] == user.id
    
    # Check Integration DB row was updated/created
    stmt_int = select(Integration).where(Integration.user_id == user.id, Integration.provider == "google_drive")
    res_int = await db_session.execute(stmt_int)
    integration = res_int.scalars().first()
    assert integration is not None
    assert integration.status == "active"
    assert integration.last_sync_at is not None


@pytest.mark.asyncio
async def test_drive_sync_works_with_canonical_google_drive_provider_name(client, db_session, monkeypatch):
    """Regression test: the OAuth callback stores the connection under the canonical
    provider name "google_drive" (see oauth_config.PROVIDER_ALIASES), not "google".
    sync_drive_documents() must look the token up under the name that's actually
    stored, or a real, successfully-connected Drive integration can never sync."""
    client.post("/api/v1/auth/register", json={
        "email": "canonicaldrive@example.com", "password": "securepassword", "full_name": "Canonical Drive User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "canonicaldrive@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]

    res = await db_session.execute(select(User).where(User.email == "canonicaldrive@example.com"))
    user = res.scalars().first()

    token_row = OAuthToken(
        user_id=user.id,
        provider="google_drive",
        access_token_encrypted=encrypt_token("fake-google-access-token"),
        refresh_token_encrypted=encrypt_token("fake-google-refresh-token"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(token_row)
    await db_session.commit()

    class MockResponse:
        def __init__(self, json_data, status_code=200):
            self._json = json_data
            self.status_code = status_code

        def json(self):
            return self._json

        def raise_for_status(self):
            pass

    async def mock_get(self, url, *args, **kwargs):
        return MockResponse({"files": []})

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    headers = {"Authorization": f"Bearer {access_token}"}
    sync_resp = client.post("/api/v1/integrations/drive/sync", headers=headers)

    assert sync_resp.status_code == 200
    assert "not configured" not in sync_resp.text


@pytest.mark.asyncio
async def test_drive_sync_routes_meet_transcripts_to_meeting_pipeline(client, db_session, monkeypatch):
    """A Drive file named like a Google Meet transcript must be summarized as a
    meeting, not ingested as a generic Company Brain document."""
    client.post("/api/v1/auth/register", json={
        "email": "meetsync@example.com", "password": "securepassword", "full_name": "Meet Sync User"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "meetsync@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]

    res = await db_session.execute(select(User).where(User.email == "meetsync@example.com"))
    user = res.scalars().first()

    token_row = OAuthToken(
        user_id=user.id,
        provider="google",
        access_token_encrypted=encrypt_token("fake-google-access-token"),
        refresh_token_encrypted=encrypt_token("fake-google-refresh-token"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(token_row)
    await db_session.commit()

    mock_files = [
        {
            "id": "file-transcript-1",
            "name": "Q4 Planning - Transcript (2026-08-02 10:00 GMT+5:30)",
            "mimeType": "application/vnd.google-apps.document",
            "webViewLink": "https://docs.google.com/document/d/file-transcript-1",
        },
        {
            "id": "file-doc-normal",
            "name": "Vacation Policy.gdoc",
            "mimeType": "application/vnd.google-apps.document",
            "webViewLink": "https://docs.google.com/document/d/file-doc-normal",
        },
    ]

    class MockResponse:
        def __init__(self, json_data, text_data=None, status_code=200):
            self._json = json_data
            self.text = text_data
            self.status_code = status_code

        def json(self):
            return self._json

        def raise_for_status(self):
            pass

    async def mock_get(self, url, *args, **kwargs):
        url_str = str(url)
        if "export" in url_str:
            if "file-transcript-1" in url_str:
                return MockResponse(None, text_data="Alice: Let's finalize Q4 scope.\nBob: Agreed.")
            return MockResponse(None, text_data="Employees get 20 days PTO per year.")
        return MockResponse({"files": mock_files})

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    ingested_docs = []

    async def mock_ingest(db, *, title, content, source, source_uri=None, restricted_role=None, owner_id=None):
        ingested_docs.append({"title": title})
        from app.models.document import Document
        return Document(title=title, source=source)

    monkeypatch.setattr("app.services.drive_sync_service.ingest_document", mock_ingest)

    summarized_meetings = []

    async def mock_summarize_meeting(db, *, transcript, organizer_user_id, source="manual"):
        summarized_meetings.append(
            {"transcript": transcript, "organizer_user_id": organizer_user_id, "source": source}
        )
        from app.models.meeting import Meeting
        from app.models.meeting_summary import MeetingSummary
        meeting = Meeting(title="Q4 Planning", organizer_user_id=organizer_user_id, source=source)
        summary = MeetingSummary(summary_text="stub", decisions=[], action_items=[], embedding=[0.0] * 768)
        return meeting, summary, {"decisions": [], "action_items": []}

    monkeypatch.setattr(
        "app.services.drive_sync_service.summarize_meeting", mock_summarize_meeting
    )

    headers = {"Authorization": f"Bearer {access_token}"}
    sync_resp = client.post("/api/v1/integrations/drive/sync", headers=headers)
    assert sync_resp.status_code == 200
    summary = sync_resp.json()

    # The transcript file must NOT have been ingested as a generic document...
    assert len(ingested_docs) == 1
    assert ingested_docs[0]["title"] == "Vacation Policy.gdoc"

    # ...it must have gone through the meeting pipeline instead, tagged google_meet.
    assert len(summarized_meetings) == 1
    assert summarized_meetings[0]["source"] == "google_meet"
    assert summarized_meetings[0]["organizer_user_id"] == user.id
    assert "finalize Q4 scope" in summarized_meetings[0]["transcript"]

    assert summary["meetings_synced"] == 1
    assert summary["synced"] == 1
    assert summary["skipped"] == 0
    assert summary["errors"] == 0


@pytest.mark.asyncio
async def test_drive_sync_rbac_scoping(client):
    """A non-admin user cannot trigger Drive sync for another user's account."""
    client.post("/api/v1/auth/register", json={
        "email": "employee_sync@example.com", "password": "securepassword", "full_name": "Employee Sync"
    })
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "employee_sync@example.com", "password": "securepassword"
    })
    access_token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # Attempt to sync another user's Drive account as a non-admin
    resp = client.post("/api/v1/integrations/drive/sync?target_user_id=some-other-user-uuid", headers=headers)
    assert resp.status_code == 403
    assert "Insufficient permissions" in resp.json()["detail"]

