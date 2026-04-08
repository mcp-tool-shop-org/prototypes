"""Structured error types for edgepacks."""

from __future__ import annotations


class EdgepacksError(Exception):
    """Base error with structured fields.

    Attributes:
        code: Machine-readable error code (e.g. INPUT_PACK_NOT_FOUND).
        message: Human-readable description.
        hint: Actionable suggestion for the user.
        cause: Optional underlying exception.
        retryable: Whether the operation can be retried.
    """

    def __init__(
        self,
        code: str,
        message: str,
        hint: str = "",
        cause: Exception | None = None,
        *,
        retryable: bool = False,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.hint = hint
        self.cause = cause
        self.retryable = retryable


class PackNotFoundError(EdgepacksError):
    """Raised when a requested pack does not exist."""

    def __init__(self, pack_name: str, available: list[str]) -> None:
        super().__init__(
            code="INPUT_PACK_NOT_FOUND",
            message=f"Pack '{pack_name}' not found.",
            hint=f"Available packs: {', '.join(sorted(available))}",
        )


class OllamaError(EdgepacksError):
    """Raised when Ollama API is unreachable or returns an error."""

    def __init__(self, message: str, cause: Exception | None = None) -> None:
        super().__init__(
            code="DEP_OLLAMA_FAILED",
            message=message,
            hint="Ensure Ollama is running: ollama serve",
            cause=cause,
            retryable=True,
        )


class ValidationError(EdgepacksError):
    """Raised when pack data fails validation."""

    def __init__(self, message: str) -> None:
        super().__init__(
            code="INPUT_VALIDATION_FAILED",
            message=message,
            hint="Check example format matches the pack's schema.",
        )
