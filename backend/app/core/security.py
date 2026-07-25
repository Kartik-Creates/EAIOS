from datetime import datetime, timedelta
import os
import base64
import hashlib
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.core.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

class TokenEncryption:
    def __init__(self, key: str):
        # Derive a 32-byte key from the provided key using SHA-256
        self.key_bytes = hashlib.sha256(key.encode("utf-8")).digest()
        self.aesgcm = AESGCM(self.key_bytes)

    def encrypt(self, plain: str) -> str:
        if not plain:
            return ""
        nonce = os.urandom(12)
        encrypted = self.aesgcm.encrypt(nonce, plain.encode("utf-8"), None)
        # Prepend nonce to ciphertext
        combined = nonce + encrypted
        return base64.b64encode(combined).decode("utf-8")

    def decrypt(self, cipher: str) -> str:
        if not cipher:
            return ""
        combined = base64.b64decode(cipher.encode("utf-8"))
        if len(combined) < 12:
            raise ValueError("Invalid ciphertext: too short")
        nonce = combined[:12]
        ciphertext = combined[12:]
        decrypted = self.aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")

# Initialize TokenEncryption instance using settings.ENCRYPTION_KEY or settings.SECRET_KEY
encryption_key_source = settings.ENCRYPTION_KEY or settings.SECRET_KEY
token_encryption = TokenEncryption(encryption_key_source)

def encrypt_token(plain: str) -> str:
    return token_encryption.encrypt(plain)

def decrypt_token(cipher: str) -> str:
    return token_encryption.decrypt(cipher)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(
    subject: Union[str, Any],
    token_version: int,
    expires_delta: timedelta = None,
) -> str:
    """Create a refresh token embedding the user's current token_version.

    On /refresh the version in the token is compared against the DB value;
    a mismatch (caused by logout) rejects the token immediately.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "ver": token_version,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
