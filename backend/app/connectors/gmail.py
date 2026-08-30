from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="gmail",
    display_name="Gmail",
    icon="Mail",
    oauth_config=PROVIDERS.get("gmail", {}),
    briefing_fn=lambda db, user: bs.get_gmail_briefing(db, user),
    detail_fn=lambda db, user, item_id: bs.get_gmail_item_detail(db, user, item_id),
    chat_fn=lambda db, user: bs.get_gmail_recent(db, user),
    is_implemented=True,
)
