from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class OAuthConnectionRead(BaseModel):
    provider: str
    scopes: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenManualInput(BaseModel):
    provider: str
    access_token: str
    refresh_token: Optional[str] = None
