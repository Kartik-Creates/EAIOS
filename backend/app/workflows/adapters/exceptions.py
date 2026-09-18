class AdapterError(Exception):
    """Base exception for normalized integration adapter errors."""
    def __init__(self, message: str, provider: str):
        super().__init__(f"[{provider}] {message}")
        self.message = message
        self.provider = provider


class AdapterAuthenticationError(AdapterError):
    """Raised when authentication credentials or OAuth tokens are missing/invalid."""


class AdapterPermissionError(AdapterError):
    """Raised when permission/scope is insufficient."""


class AdapterRateLimitError(AdapterError):
    """Raised when external API rate limit is exceeded."""


class AdapterResourceNotFoundError(AdapterError):
    """Raised when requested external resource is not found."""


class AdapterConfigurationError(AdapterError):
    """Raised when integration settings are misconfigured."""


class AdapterTemporaryFailure(AdapterError):
    """Raised when temporary network/timeout error occurs."""
