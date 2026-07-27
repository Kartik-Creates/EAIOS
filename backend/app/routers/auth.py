import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    encrypt_token,
    get_password_hash,
    verify_password,
)
from app.core.redis import (
    add_active_jti,
    remove_active_jti,
    get_active_jtis,
    clear_active_jtis,
    is_jti_revoked,
    revoke_jti,
)
from app.models.oauth_token import OAuthToken
from app.models.user import User
from app.schemas.oauth import OAuthConnectionRead, TokenManualInput
from app.schemas.user import RefreshRequest, Token, UserCreate, UserRead

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    user_in: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists.",
        )

    db_user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superuser=False,
        role="employee",
        token_version=0,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
async def login(
    db: Annotated[AsyncSession, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    stmt = select(User).where(User.email == form_data.username)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    access_token = create_access_token(subject=user.id)
    refresh_token, jti = create_refresh_token(
        subject=user.id, token_version=user.token_version
    )
    # Track the active JTI in Redis
    await add_active_jti(user_id=user.id, jti=jti, expire_seconds=7 * 24 * 3600)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Exchange a valid refresh token for a new access + refresh token pair.

    Validates the embedded token_version against the DB — if the user has
    logged out (which increments token_version), this rejects the old token.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            body.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        token_version: int = payload.get("ver")
        jti: str = payload.get("jti")
        if user_id is None or token_type != "refresh" or token_version is None or jti is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Replay protection: check if JTI has already been revoked/used
    if await is_jti_revoked(jti):
        raise credentials_exception

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    # Reject if token_version has been incremented (user logged out)
    if user.token_version != token_version:
        raise credentials_exception

    # Determine remaining lifespan of old refresh token to blacklist it properly
    exp_time = payload.get("exp")
    now_ts = datetime.now(timezone.utc).timestamp()
    remaining_seconds = int(exp_time - now_ts) if exp_time else 0

    new_access = create_access_token(subject=user.id)
    new_refresh, new_jti = create_refresh_token(
        subject=user.id, token_version=user.token_version
    )

    # Redis rotation logic: swap JTI references and revoke the old JTI
    await remove_active_jti(user_id=user.id, jti=jti)
    await add_active_jti(user_id=user.id, jti=new_jti, expire_seconds=7 * 24 * 3600)
    if remaining_seconds > 0:
        await revoke_jti(jti=jti, expire_seconds=remaining_seconds)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Revoke all refresh tokens by incrementing the user's token_version and invalidating Redis JTIs.

    Already-issued access tokens remain valid until their 15-minute expiry.
    """
    # Fetch active JTIs for this user and revoke them in Redis
    active_jtis = await get_active_jtis(current_user.id)
    for jti in active_jtis:
        await revoke_jti(jti, expire_seconds=7 * 24 * 3600)
    
    await clear_active_jtis(current_user.id)

    current_user.token_version += 1
    db.add(current_user)
    await db.commit()
    return {"detail": "Successfully logged out — all refresh tokens revoked."}


@router.get("/me", response_model=UserRead)
async def read_user_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.get("/oauth/{provider}/login")
async def oauth_login(
    provider: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if provider not in ("google", "github"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth login for provider '{provider}' is not supported.",
        )

    state_payload = {
        "user_id": current_user.id,
        "provider": provider,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    state_jwt = jwt.encode(state_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    if provider == "google":
        client_id = settings.GOOGLE_CLIENT_ID
        redirect_uri = "http://localhost:8000/api/v1/auth/oauth/google/callback"
        scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive.readonly openid email profile"
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code"
            f"&client_id={client_id}&redirect_uri={redirect_uri}&scope={scopes}"
            f"&state={state_jwt}&access_type=offline&prompt=consent"
        )
    else:  # github
        client_id = settings.GITHUB_CLIENT_ID
        redirect_uri = "http://localhost:8000/api/v1/auth/oauth/github/callback"
        scopes = "user,repo"
        url = (
            f"https://github.com/login/oauth/authorize?client_id={client_id}"
            f"&redirect_uri={redirect_uri}&scope={scopes}&state={state_jwt}"
        )

    return RedirectResponse(url)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    error: str | None = None,
):
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider returned error: {error}",
        )

    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")
        provider_from_state = payload.get("provider")
        if not user_id or provider_from_state != provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth state",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state",
        )

    token_data = {}
    async with httpx.AsyncClient() as client:
        if provider == "google":
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": "http://localhost:8000/api/v1/auth/oauth/google/callback",
                    "grant_type": "authorization_code",
                },
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google token exchange failed: {response.text}",
                )
            token_data = response.json()
        elif provider == "github":
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "redirect_uri": "http://localhost:8000/api/v1/auth/oauth/github/callback",
                },
                headers={"Accept": "application/json"},
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub token exchange failed: {response.text}",
                )
            token_data = response.json()
            if "error" in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub token exchange error: {token_data.get('error_description')}",
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported OAuth provider",
            )

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received from provider",
        )

    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

    scopes = token_data.get("scope")

    # Encrypt the tokens
    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None

    # Check if OAuth connection already exists
    stmt = select(OAuthToken).where(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == provider,
    )
    res = await db.execute(stmt)
    db_token = res.scalars().first()

    if db_token:
        db_token.access_token_encrypted = enc_access
        if enc_refresh:
            db_token.refresh_token_encrypted = enc_refresh
        db_token.expires_at = expires_at
        db_token.scopes = scopes
    else:
        db_token = OAuthToken(
            user_id=user_id,
            provider=provider,
            access_token_encrypted=enc_access,
            refresh_token_encrypted=enc_refresh,
            expires_at=expires_at,
            scopes=scopes,
        )
        db.add(db_token)

    await db.commit()
    return {"status": "success", "message": f"Successfully connected to {provider}"}


@router.post("/connections/token")
async def connect_manual_token(
    connection_in: TokenManualInput,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if connection_in.provider not in ("slack", "jira"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manual token input is only supported for 'slack' or 'jira' integrations.",
        )

    enc_access = encrypt_token(connection_in.access_token)
    enc_refresh = encrypt_token(connection_in.refresh_token) if connection_in.refresh_token else None

    stmt = select(OAuthToken).where(
        OAuthToken.user_id == current_user.id,
        OAuthToken.provider == connection_in.provider,
    )
    res = await db.execute(stmt)
    db_token = res.scalars().first()

    if db_token:
        db_token.access_token_encrypted = enc_access
        db_token.refresh_token_encrypted = enc_refresh
        db_token.expires_at = None
        db_token.scopes = None
    else:
        db_token = OAuthToken(
            user_id=current_user.id,
            provider=connection_in.provider,
            access_token_encrypted=enc_access,
            refresh_token_encrypted=enc_refresh,
            expires_at=None,
            scopes=None,
        )
        db.add(db_token)

    await db.commit()
    return {
        "status": "success",
        "message": f"Successfully configured manual connection for {connection_in.provider}",
    }


@router.get("/connections", response_model=list[OAuthConnectionRead])
async def list_connections(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    stmt = select(OAuthToken).where(OAuthToken.user_id == current_user.id)
    res = await db.execute(stmt)
    connections = res.scalars().all()
    return connections
