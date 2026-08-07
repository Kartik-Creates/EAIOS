class AdapterError(Exception):
    """Base exception for normalized integration adapter errors."""
    def __init__(self, message: str, provider: str):
        super().__init__(f"[{provider}] {message}")
        self.message = message
        self.provider = provider


class AdapterAuthenticationError(AdapterError):
    """Raised when authentication credentials or OAuth tokens are missing/invalid."""
    pass


class AdapterPermissionError(AdapterError):
    """Raised when permission/scope is insufficient."""
    pass


class AdapterRateLimitError(AdapterError):
    """Raised when external API rate limit is exceeded."""
    pass


class AdapterResourceNotFoundError(AdapterError):
    """Raised when requested external resource is not found."""
    pass


class AdapterConfigurationError(AdapterError):
    """Raised when integration settings are misconfigured."""
    pass


class AdapterTemporaryFailure(AdapterError):
    """Raised when temporary network/timeout error occurs."""
    pass
