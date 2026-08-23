from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="google_drive",
    display_name="Google Drive",
    icon="FolderOpen",
    oauth_config=PROVIDERS.get("google_drive", {}),
    briefing_fn=lambda db, user: bs.get_drive_briefing(db, user),
    detail_fn=None,
    chat_fn=lambda db, user: bs.get_drive_briefing(db, user),
    is_implemented=True,
)
