import logging
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.oauth_config import PROVIDERS, resolve_provider
from app.core.redis import consume_oauth_state, store_oauth_state
from app.core.security import encrypt_token
from app.models.integration import Integration
from app.models.oauth_token import OAuthToken
from app.models.user import User
from app.services.drive_sync_service import DriveSyncError, sync_drive_documents

router = APIRouter()
logger = logging.getLogger("eaios.integrations")


@router.get("/{provider}/connect")
async def connect_oauth_provider(
    provider: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Generate OAuth authorization URL for the requested integration provider.

    Generic engine supporting Gmail, Google Drive, GitHub, Slack, and Jira.
    Validates provider allowlist, creates a single-use CSRF state token stored in Redis,
    and returns the target authorization URL.
    """
    resolved = resolve_provider(provider)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported integration provider '{provider}'. Supported providers: {list(PROVIDERS.keys())}",
        )

    canonical_provider, config = resolved
    client_id = config["get_client_id"]()

    if not client_id:
        logger.warning("OAuth client ID for provider '%s' is unconfigured in settings.", canonical_provider)

    # 1. Create single-use CSRF state token
    jti = str(uuid.uuid4())
    state_payload = {
        "user_id": current_user.id,
        "provider": canonical_provider,
        "jti": jti,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    state_token = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    # 2. Store JTI in Redis with 10 minute expiry
    await store_oauth_state(jti=jti, user_id=current_user.id, expire_seconds=600)

    # 3. Build authorization URL
    redirect_uri = f"http://localhost:8000/api/v1/integrations/{canonical_provider}/callback"
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": config["scope"],
        "state": state_token,
    }
    params.update(config.get("extra_params", {}))

    url = f"{config['auth_url']}?{urllib.parse.urlencode(params)}"
    return {"url": url, "provider": canonical_provider}


@router.get("/{provider}/callback")
async def oauth_provider_callback(
    provider: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    """Generic OAuth 2.0 authorization code callback handler.

    Validates CSRF state token against Redis (single-use enforcement), exchanges code
    for tokens server-to-server, encrypts tokens at rest, and updates Integration status.
    """
    frontend_base = "http://localhost:5173/integrations"

    if error:
        logger.warning("OAuth authorization denied by user for provider '%s': %s", provider, error)
        return RedirectResponse(f"{frontend_base}?error={urllib.parse.quote(error)}")

    if not code or not state:
        return RedirectResponse(f"{frontend_base}?error=Missing+authorization+code+or+state")

    resolved = resolve_provider(provider)
    if not resolved:
        return RedirectResponse(f"{frontend_base}?error=Unsupported+provider")

    canonical_provider, config = resolved

    # 1. Validate CSRF state JWT
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("user_id")
        state_provider: str = payload.get("provider")
        jti: str = payload.get("jti")

        if not user_id or state_provider != canonical_provider or not jti:
            return RedirectResponse(f"{frontend_base}?error=Invalid+state+token+payload")
    except JWTError:
        return RedirectResponse(f"{frontend_base}?error=Invalid+or+expired+state+token")

    # 2. Check single-use state token in Redis (replay protection)
    stored_user_id = await consume_oauth_state(jti)
    if not stored_user_id or stored_user_id != user_id:
        logger.warning("OAuth state replay or expired attempt detected for user: %s, jti: %s", user_id, jti)
        return RedirectResponse(f"{frontend_base}?error=State+token+already+used+or+expired")

    # 3. Exchange authorization code for tokens (server-to-server)
    client_id = config["get_client_id"]()
    client_secret = config["get_client_secret"]()
    redirect_uri = f"http://localhost:8000/api/v1/integrations/{canonical_provider}/callback"

    headers = {"Accept": "application/json"}
    token_payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
    }

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                config["token_url"],
                data=token_payload,
                headers=headers,
                timeout=30.0,
            )
            if resp.status_code != 200:
                logger.error("Token exchange failed for '%s': %s", canonical_provider, resp.text)
                return RedirectResponse(
                    f"{frontend_base}?error={urllib.parse.quote(f'Token exchange failed for {canonical_provider}')}"
                )
            token_data = resp.json()
        except Exception as exc:
            logger.error("HTTP error during token exchange for '%s': %s", canonical_provider, exc)
            return RedirectResponse(f"{frontend_base}?error=Failed+to+contact+OAuth+provider")

    access_token = token_data.get("access_token")
    if not access_token:
        return RedirectResponse(f"{frontend_base}?error=No+access+token+received+from+provider")

    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    granted_scopes = token_data.get("scope", config["scope"])

    # 4. Encrypt tokens at rest
    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None

    # 5. Store / update OAuthToken DB row
    stmt_token = select(OAuthToken).where(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == canonical_provider,
    )
    res_token = await db.execute(stmt_token)
    db_token = res_token.scalars().first()

    if db_token:
        db_token.access_token_encrypted = enc_access
        if enc_refresh:
            db_token.refresh_token_encrypted = enc_refresh
        db_token.expires_at = expires_at
        db_token.scopes = str(granted_scopes)
    else:
        db_token = OAuthToken(
            user_id=user_id,
            provider=canonical_provider,
            access_token_encrypted=enc_access,
            refresh_token_encrypted=enc_refresh,
            expires_at=expires_at,
            scopes=str(granted_scopes),
        )
        db.add(db_token)

    # 6. Update Integration status registry
    stmt_int = select(Integration).where(
        Integration.user_id == user_id,
        Integration.provider == canonical_provider,
    )
    res_int = await db.execute(stmt_int)
    integration = res_int.scalars().first()

    if not integration:
        integration = Integration(
            user_id=user_id,
            provider=canonical_provider,
            status="active",
            last_sync_at=None,
        )
        db.add(integration)
    else:
        integration.status = "active"

    await db.commit()
    logger.info("Successfully connected provider '%s' for user_id: %s", canonical_provider, user_id)

    return RedirectResponse(f"{frontend_base}?connected={canonical_provider}")


@router.post("/drive/sync")
async def trigger_drive_sync(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    target_user_id: Annotated[str | None, Query(description="Target user ID to sync (Admin only)")] = None,
):
    """Trigger Google Drive document sync.

    Syncs the requesting user's own connected Drive integration by default.
    Syncing another user's Drive integration requires 'admin' role privileges.
    """
    if target_user_id and target_user_id != current_user.id:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to trigger sync for another user's Drive data.",
            )
        sync_user_id = target_user_id
    else:
        sync_user_id = current_user.id

    try:
        summary = await sync_drive_documents(db=db, user_id=sync_user_id)
        return summary
    except DriveSyncError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during sync: {exc}",
        )
