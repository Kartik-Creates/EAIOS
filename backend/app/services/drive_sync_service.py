import logging
import re
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import decrypt_token, encrypt_token
from app.models.integration import Integration
from app.models.oauth_token import OAuthToken
from app.services.ingestion_service import ingest_document
from app.services.meeting_service import MeetingIntelligenceError, summarize_meeting

logger = logging.getLogger("eaios.drive_sync")

class DriveSyncError(RuntimeError):
    """Base error for Google Drive sync flow."""

# Google Meet auto-generates transcripts as Google Docs named like
# "<Meeting Title> - Transcript (2026-08-02 10:00 GMT+5:30)" once a
# participant manually enables transcription — there is no API to trigger
# or query Meet transcription (Phase C plan), so this naming pattern is the
# only reliable signal available for detecting one during a normal Drive sync.
_MEET_TRANSCRIPT_PATTERN = re.compile(r"-\s*Transcript\b", re.IGNORECASE)


def _is_meet_transcript(file_name: str) -> bool:
    return bool(_MEET_TRANSCRIPT_PATTERN.search(file_name))

async def _refresh_google_token(db: AsyncSession, db_token: OAuthToken) -> str:
    """Refresh the expired Google access token using the refresh token."""
    refresh_token = decrypt_token(db_token.refresh_token_encrypted)
    if not refresh_token:
        raise DriveSyncError("Missing refresh token for Google OAuth connection.")

    logger.info("Attempting to refresh Google OAuth token for user: %s", db_token.user_id)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token",
                },
                timeout=30.0,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise DriveSyncError(f"Failed to contact Google OAuth token endpoint: {exc}") from exc

        data = response.json()

    new_access = data.get("access_token")
    if not new_access:
        raise DriveSyncError("Google OAuth refresh response did not contain access_token.")

    new_refresh = data.get("refresh_token")
    expires_in = data.get("expires_in")

    db_token.access_token_encrypted = encrypt_token(new_access)
    if new_refresh:
        db_token.refresh_token_encrypted = encrypt_token(new_refresh)
    if expires_in:
        db_token.expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
    else:
        db_token.expires_at = None

    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    logger.info("Successfully refreshed Google OAuth token for user: %s", db_token.user_id)
    return new_access

async def sync_drive_documents(db: AsyncSession, user_id: str) -> dict:
    """Sync all text files and Google Docs accessible via user's Google Drive OAuth integration."""
    # 1. Fetch Google OAuth token
    stmt = select(OAuthToken).where(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == "google"
    )
    res = await db.execute(stmt)
    db_token = res.scalars().first()

    if not db_token:
        raise DriveSyncError("Google OAuth connection not configured for this user.")

    # 2. Check token expiration
    access_token = decrypt_token(db_token.access_token_encrypted)
    # Buffer of 60 seconds
    if db_token.expires_at and datetime.now(timezone.utc) >= db_token.expires_at - timedelta(seconds=60):
        access_token = await _refresh_google_token(db, db_token)

    # 3. Call Google Drive list API
    files = []
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(headers=headers, timeout=60.0) as client:
        try:
            # Query files listing fields name, id, mimeType, webViewLink
            resp = await client.get(
                "https://www.googleapis.com/drive/v3/files",
                params={"fields": "files(id, name, mimeType, webViewLink)"},
            )
            resp.raise_for_status()
            files = resp.json().get("files", [])
        except httpx.HTTPError as exc:
            raise DriveSyncError(f"Failed to query Google Drive files list: {exc}") from exc

        # 4. Download and ingest each file
        files_synced = []
        meetings_synced = []
        files_skipped = []
        errors = []

        for file_meta in files:
            file_id = file_meta.get("id")
            file_name = file_meta.get("name", "Unnamed File")
            mime_type = file_meta.get("mimeType", "")
            web_link = file_meta.get("webViewLink")

            if not file_id:
                continue

            try:
                # Case A: Google Doc - Needs to be exported to plain text
                if mime_type == "application/vnd.google-apps.document":
                    export_resp = await client.get(
                        f"https://www.googleapis.com/drive/v3/files/{file_id}/export",
                        params={"mimeType": "text/plain"},
                    )
                    export_resp.raise_for_status()
                    content = export_resp.text

                    # Phase C: a Meet transcript doc gets routed into the meeting
                    # intelligence pipeline (Phase A) instead of Company Brain —
                    # it's a transcript to summarize, not a document to chunk.
                    if _is_meet_transcript(file_name):
                        try:
                            await summarize_meeting(
                                db,
                                transcript=content,
                                organizer_user_id=user_id,
                                source="google_meet",
                            )
                        except MeetingIntelligenceError as exc:
                            raise DriveSyncError(
                                f"Meeting intelligence extraction failed: {exc}"
                            ) from exc
                        meetings_synced.append({"name": file_name, "id": file_id})
                        logger.info(
                            "Successfully summarized Meet transcript: %s (id: %s)", file_name, file_id
                        )
                        continue

                # Case B: Standard text files
                elif mime_type.startswith("text/") or mime_type in ("application/x-javascript", "application/json", "application/xml"):
                    dl_resp = await client.get(
                        f"https://www.googleapis.com/drive/v3/files/{file_id}",
                        params={"alt": "media"},
                    )
                    dl_resp.raise_for_status()
                    content = dl_resp.content.decode("utf-8", errors="ignore")

                # Case C: Skip binary / unsupported types
                else:
                    files_skipped.append({
                        "name": file_name,
                        "id": file_id,
                        "reason": f"Unsupported MIME type: {mime_type}"
                    })
                    continue

                # 5. Ingest into RAG pipeline
                await ingest_document(
                    db,
                    title=file_name,
                    content=content,
                    source="google_drive",
                    source_uri=web_link,
                    owner_id=user_id,
                )
                files_synced.append({"name": file_name, "id": file_id})
                logger.info("Successfully synced Drive file: %s (id: %s)", file_name, file_id)

            except Exception as exc:  # noqa: BLE001 — one bad file must not abort the whole
                # sync; record it and keep processing the rest of the batch.
                logger.error("Error syncing Google Drive file %s (id: %s): %s", file_name, file_id, exc)
                errors.append({"name": file_name, "id": file_id, "error": str(exc)})

    # 6. Update integrations registry
    stmt_int = select(Integration).where(
        Integration.user_id == user_id,
        Integration.provider == "google_drive"
    )
    res_int = await db.execute(stmt_int)
    integration = res_int.scalars().first()

    if not integration:
        integration = Integration(
            user_id=user_id,
            provider="google_drive",
            status="active",
            last_sync_at=datetime.now(timezone.utc)
        )
        db.add(integration)
    else:
        integration.status = "active"
        integration.last_sync_at = datetime.now(timezone.utc)
        db.add(integration)

    await db.commit()

    return {
        # Counts match the frontend's DriveSyncResult contract (integration.types.ts) —
        # the previous version returned only the detail arrays below under different
        # key names, which the frontend's `synced`/`skipped`/`errors` fields never matched.
        "synced": len(files_synced),
        "skipped": len(files_skipped),
        "errors": len(errors),
        "meetings_synced": len(meetings_synced),
        "message": (
            f"Synced {len(files_synced)} document(s) and {len(meetings_synced)} "
            f"meeting transcript(s); {len(files_skipped)} skipped, {len(errors)} failed."
        ),
        "files_synced": files_synced,
        "meeting_details": meetings_synced,
        "files_skipped": files_skipped,
        "error_details": errors,
    }
