from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="calendar",
    display_name="Google Calendar",
    icon="Calendar",
    oauth_config=PROVIDERS.get("google", {}),
    briefing_fn=lambda db, user: bs.get_calendar_briefing(db, user),
    detail_fn=lambda db, user, item_id: bs.get_calendar_item_detail(db, user, item_id),
    chat_fn=lambda db, user: bs.get_calendar_recent(db, user),
    is_implemented=True,
)
