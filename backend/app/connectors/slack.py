from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="slack",
    display_name="Slack",
    icon="MessageSquare",
    oauth_config=PROVIDERS.get("slack", {}),
    briefing_fn=lambda db, user: bs.get_slack_briefing(db, user),
    detail_fn=None,
    chat_fn=lambda db, user: bs.get_slack_briefing(db, user),
    is_implemented=True,
)
