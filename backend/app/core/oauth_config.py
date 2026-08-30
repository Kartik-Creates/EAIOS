"""Centralized OAuth Provider Configuration for EAIOS Integrations.

Drives the generic OAuth engine for Gmail, Google Drive, GitHub, Slack, and Jira.
"""
from app.core.config import settings

PROVIDERS = {
    "gmail": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly",
        "get_client_id": lambda: settings.GOOGLE_CLIENT_ID,
        "get_client_secret": lambda: settings.GOOGLE_CLIENT_SECRET,
        "extra_params": {"access_type": "offline", "prompt": "consent"},
    },
    "google_drive": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scope": "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.readonly",
        "get_client_id": lambda: settings.GOOGLE_CLIENT_ID,
        "get_client_secret": lambda: settings.GOOGLE_CLIENT_SECRET,
        "extra_params": {"access_type": "offline", "prompt": "consent"},
    },

    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "scope": "read:user repo:status",
        "get_client_id": lambda: settings.GITHUB_CLIENT_ID,
        "get_client_secret": lambda: settings.GITHUB_CLIENT_SECRET,
        "extra_params": {},
    },
    "slack": {
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "scope": "channels:read channels:history",
        "get_client_id": lambda: settings.SLACK_CLIENT_ID,
        "get_client_secret": lambda: settings.SLACK_CLIENT_SECRET,
        "extra_params": {},
    },
    "jira": {
        "auth_url": "https://auth.atlassian.com/authorize",
        "token_url": "https://auth.atlassian.com/oauth/token",
        "scope": "read:jira-work read:jira-user offline_access",
        "get_client_id": lambda: settings.JIRA_CLIENT_ID,
        "get_client_secret": lambda: settings.JIRA_CLIENT_SECRET,
        "extra_params": {"audience": "api.atlassian.com", "prompt": "consent"},
    },
}

# Alias map for standard frontend names (e.g. 'google' -> 'google_drive')
PROVIDER_ALIASES = {
    "google": "google_drive",
}


def resolve_provider(provider_name: str) -> tuple[str, dict] | None:
    """Normalize provider name and return canonical name + config, or None if unknown."""
    canonical = PROVIDER_ALIASES.get(provider_name.lower(), provider_name.lower())
    config = PROVIDERS.get(canonical)
    if not config:
        return None
    return canonical, config
