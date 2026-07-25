from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OAuthConnectionRead(BaseModel):
    provider: str
    scopes: str | None = None
    expires_at: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)

class TokenManualInput(BaseModel):
    provider: str
    access_token: str
    refresh_token: str | None = None
