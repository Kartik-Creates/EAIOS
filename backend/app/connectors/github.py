from app.connectors.base import ConnectorSpec
from app.core.oauth_config import PROVIDERS
import app.services.briefing_service as bs

CONNECTOR = ConnectorSpec(
    name="github",
    display_name="GitHub",
    icon="GitPullRequest",
    oauth_config=PROVIDERS.get("github", {}),
    briefing_fn=lambda db, user: bs.get_github_briefing(db, user),
    detail_fn=lambda db, user, item_id: bs.get_github_item_detail(db, user, item_id),
    chat_fn=lambda db, user: bs.get_github_briefing(db, user),
    is_implemented=True,
)
