from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import httpx
from jose import jwt

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash, encrypt_token
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.oauth_token import OAuthToken
from app.schemas.user import Token, UserCreate, UserRead
from app.schemas.oauth import OAuthConnectionRead, TokenManualInput

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    existing_user = res.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists."
        )
    
    db_user = User(
        id=str(uuid.uuid4()),
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_superuser=False
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
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
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserRead)
async def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/oauth/{provider}/login")
async def oauth_login(
    provider: str,
    current_user: User = Depends(get_current_user)
):
    if provider not in ("google", "github"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth login for provider '{provider}' is not supported."
        )
    
    state_payload = {
        "user_id": current_user.id,
        "provider": provider,
        "exp": datetime.utcnow() + timedelta(minutes=15)
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
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth provider returned error: {error}"
        )
        
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")
        provider_from_state = payload.get("provider")
        if not user_id or provider_from_state != provider:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth state"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OAuth state"
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
                }
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google token exchange failed: {response.text}"
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
                headers={"Accept": "application/json"}
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub token exchange failed: {response.text}"
                )
            token_data = response.json()
            if "error" in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub token exchange error: {token_data.get('error_description')}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported OAuth provider"
            )

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No access token received from provider"
        )
        
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")
    expires_at = None
    if expires_in:
        expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))
    
    scopes = token_data.get("scope")
    
    # Encrypt the tokens
    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None
    
    # Check if OAuth connection already exists
    stmt = select(OAuthToken).where(
        OAuthToken.user_id == user_id,
        OAuthToken.provider == provider
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
            scopes=scopes
        )
        db.add(db_token)
        
    await db.commit()
    return {"status": "success", "message": f"Successfully connected to {provider}"}

@router.post("/connections/token")
async def connect_manual_token(
    connection_in: TokenManualInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if connection_in.provider not in ("slack", "jira"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Manual token input is only supported for 'slack' or 'jira' integrations."
        )
        
    enc_access = encrypt_token(connection_in.access_token)
    enc_refresh = encrypt_token(connection_in.refresh_token) if connection_in.refresh_token else None
    
    stmt = select(OAuthToken).where(
        OAuthToken.user_id == current_user.id,
        OAuthToken.provider == connection_in.provider
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
            scopes=None
        )
        db.add(db_token)
        
    await db.commit()
    return {"status": "success", "message": f"Successfully configured manual connection for {connection_in.provider}"}

@router.get("/connections", response_model=List[OAuthConnectionRead])
async def list_connections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(OAuthToken).where(OAuthToken.user_id == current_user.id)
    res = await db.execute(stmt)
    connections = res.scalars().all()
    return connections

