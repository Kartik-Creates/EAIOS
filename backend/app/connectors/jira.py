from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="jira",
    display_name="Jira",
    icon="CheckSquare",
    oauth_config=PROVIDERS.get("jira", {}),
    briefing_fn=lambda db, user: bs.get_jira_briefing(db, user),
    detail_fn=lambda db, user, item_id: bs.get_jira_item_detail(db, user, item_id),
    chat_fn=lambda db, user: bs.get_jira_recent(db, user),
    is_implemented=True,
)
