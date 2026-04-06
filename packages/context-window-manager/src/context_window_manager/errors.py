"""
Error definitions for Context Window Manager.

This module defines the error hierarchy and all specific error types
used throughout the application. See ERROR_HANDLING.md for details.
"""

from datetime import datetime
from typing import Any


class CWMError(Exception):
    """
    Base exception for all Context Window Manager errors.

    Attributes:
        code: Error code (e.g., "CWM-1001")
        context: Additional context for debugging
        cause: Original exception if wrapping another error
        timestamp: When the error occurred
    """

    code: str = "CWM-9999"
    retryable: bool = False

    def __init__(
        self,
        message: str,
        code: str | None = None,
        context: dict[str, Any] | None = None,
        cause: Exception | None = None,
    ):
        super().__init__(message)
        self.code = code or self.__class__.code
        self.context = context or {}
        self.cause = cause
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> dict[str, Any]:
        """Serialize for MCP response (user-safe)."""
        return {
            "error": self.__class__.__name__,
            "message": str(self),
            "code": self.code,
            "retryable": self.retryable,
        }

    def to_log_dict(self) -> dict[str, Any]:
        """Full context for logging."""
        import traceback

        return {
            **self.to_dict(),
            "context": self.context,
            "cause": str(self.cause) if self.cause else None,
            "traceback": traceback.format_exc(),
            "timestamp": self.timestamp.isoformat(),
        }


# =============================================================================
# Validation Errors (CWM-1xxx)
# =============================================================================


class ValidationError(CWMError):
    """Base class for validation errors."""

    code = "CWM-1000"


class InvalidSessionIdError(ValidationError):
    """Session ID doesn't match required pattern."""

    code = "CWM-1001"

    def __init__(self, session_id: str):
        super().__init__(
            f"Invalid session ID format: {session_id!r}",
            context={"session_id": session_id},
        )


class InvalidWindowNameError(ValidationError):
    """Window name doesn't match required pattern."""

    code = "CWM-1002"

    def __init__(self, window_name: str):
        super().__init__(
            f"Invalid window name format: {window_name!r}",
            context={"window_name": window_name},
        )


class InvalidParameterError(ValidationError):
    """Tool parameter has invalid type or value."""

    code = "CWM-1003"

    def __init__(self, param_name: str, reason: str):
        super().__init__(
            f"Invalid parameter '{param_name}': {reason}",
            context={"param_name": param_name, "reason": reason},
        )


# =============================================================================
# Not Found Errors (CWM-2xxx)
# =============================================================================


class NotFoundError(CWMError):
    """Base class for resource not found errors."""

    code = "CWM-2000"


class SessionNotFoundError(NotFoundError):
    """Referenced session doesn't exist."""

    code = "CWM-2001"

    def __init__(self, session_id: str):
        super().__init__(
            f"Session not found: {session_id}",
            context={"session_id": session_id},
        )


class WindowNotFoundError(NotFoundError):
    """Referenced window doesn't exist."""

    code = "CWM-2002"

    def __init__(self, window_name: str):
        super().__init__(
            f"Window not found: {window_name}",
            context={"window_name": window_name},
        )


class BlockNotFoundError(NotFoundError):
    """KV cache block missing from storage."""

    code = "CWM-2003"

    def __init__(self, block_hash: str):
        super().__init__(
            "Some context data is unavailable",
            context={"block_hash": block_hash},
        )


# =============================================================================
# State Errors (CWM-3xxx)
# =============================================================================


class StateError(CWMError):
    """Base class for state machine errors."""

    code = "CWM-3000"


class InvalidStateTransitionError(StateError):
    """Attempted invalid state transition."""

    code = "CWM-3001"

    def __init__(self, current_state: str, attempted_operation: str):
        super().__init__(
            f"Cannot perform '{attempted_operation}' in state '{current_state}'",
            context={
                "current_state": current_state,
                "attempted_operation": attempted_operation,
            },
        )


class StateTransitionError(StateError):
    """Invalid state transition attempted."""

    code = "CWM-3010"

    def __init__(self, from_state: str, to_state: str):
        super().__init__(
            f"Cannot transition from '{from_state}' to '{to_state}'",
            context={"from_state": from_state, "to_state": to_state},
        )
        self.from_state = from_state
        self.to_state = to_state


class SessionAlreadyFrozenError(StateError):
    """Attempted to freeze already-frozen session."""

    code = "CWM-3002"

    def __init__(self, session_id: str):
        super().__init__(
            f"Session is already frozen: {session_id}",
            context={"session_id": session_id},
        )


class WindowAlreadyExistsError(StateError):
    """Window name already in use."""

    code = "CWM-3003"

    def __init__(self, window_name: str):
        super().__init__(
            f"Window name already exists: {window_name}",
            context={"window_name": window_name},
        )


# =============================================================================
# Storage Errors (CWM-4xxx)
# =============================================================================


class StorageError(CWMError):
    """Base class for storage errors."""

    code = "CWM-4000"


class KVStoreError(StorageError):
    """KV store operation failed."""

    code = "CWM-4010"

    def __init__(self, message: str = "KV store operation failed"):
        super().__init__(message)


class KVStoreConnectionError(StorageError):
    """Cannot connect to KV store backend."""

    code = "CWM-5010"
    retryable = True

    def __init__(self, backend: str, details: str = ""):
        super().__init__(
            f"Cannot connect to KV store backend: {backend}",
            context={"backend": backend, "details": details},
        )
        self.backend = backend


class KVStoreTimeoutError(StorageError):
    """KV store operation timed out."""

    code = "CWM-6010"
    retryable = True

    def __init__(self, timeout: float):
        super().__init__(
            f"KV store operation timed out after {timeout}s",
            context={"timeout": timeout},
        )
        self.timeout = timeout


class StorageWriteError(StorageError):
    """Failed to write to storage backend."""

    code = "CWM-4001"
    retryable = True

    def __init__(self, message: str = "Failed to save context data"):
        super().__init__(message)


class StorageReadError(StorageError):
    """Failed to read from storage backend."""

    code = "CWM-4002"
    retryable = True

    def __init__(self, message: str = "Failed to load context data"):
        super().__init__(message)


class StorageQuotaExceededError(StorageError):
    """Storage quota exceeded."""

    code = "CWM-4003"
    retryable = False

    def __init__(self, quota_gb: float, used_gb: float):
        super().__init__(
            f"Storage quota exceeded: {used_gb:.1f}GB / {quota_gb:.1f}GB",
            context={"quota_gb": quota_gb, "used_gb": used_gb},
        )


class StorageCorruptionError(StorageError):
    """Data integrity check failed."""

    code = "CWM-4004"
    retryable = False

    def __init__(self, window_name: str, details: str = ""):
        super().__init__(
            f"Context data is corrupted for window: {window_name}",
            context={"window_name": window_name, "details": details},
        )


# =============================================================================
# Connection Errors (CWM-5xxx)
# =============================================================================


class ConnectionError(CWMError):
    """Base class for connection errors."""

    code = "CWM-5000"
    retryable = True


class VLLMConnectionError(ConnectionError):
    """Cannot connect to vLLM server."""

    code = "CWM-5001"

    def __init__(self, url: str, details: str = ""):
        super().__init__(
            f"Cannot connect to inference server at {url}",
            context={"url": url, "details": details},
        )
        self.url = url


class ModelNotAvailableError(ConnectionError):
    """Requested model is not available in vLLM."""

    code = "CWM-5003"

    def __init__(self, model: str):
        super().__init__(
            f"Model not available: {model}",
            context={"model": model},
        )
        self.model = model


class LMCacheConnectionError(ConnectionError):
    """Cannot connect to LMCache backend."""

    code = "CWM-5002"

    def __init__(self, backend: str, details: str = ""):
        super().__init__(
            f"Cannot connect to cache backend: {backend}",
            context={"backend": backend, "details": details},
        )


# =============================================================================
# Timeout Errors (CWM-6xxx)
# =============================================================================


class TimeoutError(CWMError):
    """Base class for timeout errors."""

    code = "CWM-6000"
    retryable = True


class VLLMTimeoutError(TimeoutError):
    """vLLM request exceeded timeout."""

    code = "CWM-6001"

    def __init__(self, timeout_seconds: float):
        super().__init__(
            f"Inference server request timed out after {timeout_seconds}s",
            context={"timeout_seconds": timeout_seconds},
        )
        self.timeout = timeout_seconds


class OperationTimeoutError(TimeoutError):
    """Overall operation exceeded timeout."""

    code = "CWM-6002"

    def __init__(self, operation: str, timeout_seconds: float):
        super().__init__(
            f"Operation '{operation}' timed out after {timeout_seconds}s",
            context={"operation": operation, "timeout_seconds": timeout_seconds},
        )


# =============================================================================
# Resource Errors (CWM-7xxx)
# =============================================================================


class ResourceError(CWMError):
    """Base class for resource exhaustion errors."""

    code = "CWM-7000"


class MemoryExhaustedError(ResourceError):
    """Insufficient memory for operation."""

    code = "CWM-7001"
    retryable = False

    def __init__(self, required_mb: float, available_mb: float):
        super().__init__(
            f"Insufficient memory: need {required_mb:.0f}MB, have {available_mb:.0f}MB",
            context={"required_mb": required_mb, "available_mb": available_mb},
        )


class RateLimitExceededError(ResourceError):
    """Too many requests in time window."""

    code = "CWM-7002"
    retryable = True

    def __init__(self, retry_after_seconds: int):
        super().__init__(
            f"Rate limit exceeded, try again in {retry_after_seconds}s",
            context={"retry_after_seconds": retry_after_seconds},
        )


class ConcurrencyLimitError(ResourceError):
    """Too many concurrent operations."""

    code = "CWM-7003"
    retryable = True

    def __init__(self, limit: int):
        super().__init__(
            f"Concurrency limit ({limit}) exceeded, try again later",
            context={"limit": limit},
        )


class ResourceExhaustedError(ResourceError):
    """A resource has been exhausted."""

    code = "CWM-7010"
    retryable = False

    def __init__(self, resource: str, limit: str):
        super().__init__(
            f"Resource '{resource}' exhausted (limit: {limit})",
            context={"resource": resource, "limit": limit},
        )
        self.resource = resource
        self.limit = limit


# =============================================================================
# Security Errors (CWM-8xxx)
# =============================================================================


class SecurityError(CWMError):
    """Base class for security errors."""

    code = "CWM-8000"
    retryable = False


class AccessDeniedError(SecurityError):
    """Caller lacks permission for operation."""

    code = "CWM-8001"

    def __init__(self, operation: str, resource: str):
        super().__init__(
            "Access denied",
            context={"operation": operation, "resource": resource},
        )


class SessionIsolationError(SecurityError):
    """Session isolation boundary violated."""

    code = "CWM-8002"

    def __init__(self, message: str = "Session isolation violation detected"):
        super().__init__(message)


# =============================================================================
# Internal Errors (CWM-9xxx)
# =============================================================================


class InternalError(CWMError):
    """Unexpected internal error."""

    code = "CWM-9001"

    def __init__(self, message: str = "An internal error occurred"):
        super().__init__(message)


# =============================================================================
# Error Handling Utilities
# =============================================================================


def classify_error(error: Exception) -> CWMError:
    """
    Convert any exception into an appropriate CWMError.

    This ensures all errors returned to clients follow a consistent format.
    """
    if isinstance(error, CWMError):
        return error

    # Map common stdlib exceptions
    error_type = type(error).__name__
    error_msg = str(error)

    if isinstance(error, FileNotFoundError):
        return StorageReadError(f"File not found: {error_msg}")
    if isinstance(error, PermissionError):
        return AccessDeniedError(
            "file_operation",
            str(error.filename) if hasattr(error, "filename") else "unknown",
        )
    if isinstance(error, (OSError, IOError)):
        return StorageError(f"I/O error: {error_msg}")
    if isinstance(error, MemoryError):
        return MemoryExhaustedError(0, 0)
    if "timeout" in error_type.lower() or "timeout" in error_msg.lower():
        return OperationTimeoutError("unknown", 0)
    if "connection" in error_type.lower() or "connection" in error_msg.lower():
        return InternalError(f"Connection error: {error_msg}")

    # Default to internal error for unknown exceptions
    return InternalError(f"Unexpected error: {error_type}: {error_msg}")


def is_retryable(error: Exception) -> bool:
    """Check if an error is potentially retryable."""
    if isinstance(error, CWMError):
        return error.retryable
    # Common retryable error patterns
    error_str = str(error).lower()
    return any(
        pattern in error_str
        for pattern in ["timeout", "connection", "temporarily", "retry", "unavailable"]
    )


def get_retry_delay(error: Exception, attempt: int, base_delay: float = 1.0) -> float:  # noqa: ARG001
    """
    Calculate exponential backoff delay for retry.

    Args:
        error: The error that occurred
        attempt: Current attempt number (0-indexed)
        base_delay: Base delay in seconds

    Returns:
        Delay in seconds before next retry
    """
    import random

    # Exponential backoff with jitter
    delay = base_delay * (2**attempt)
    # Add 0-25% jitter
    jitter = delay * random.uniform(0, 0.25)
    return min(delay + jitter, 60.0)  # Cap at 60 seconds


def format_user_message(error: CWMError) -> str:
    """
    Format an error message for end users.

    Provides a friendly, actionable message without exposing internals.
    """
    messages = {
        # Validation
        "CWM-1001": "Please use alphanumeric characters, hyphens, and underscores for the session ID.",
        "CWM-1002": "Please use alphanumeric characters, hyphens, and underscores for the window name.",
        "CWM-1003": "One of the parameters has an invalid value. Please check your input.",
        # Not Found
        "CWM-2001": "The session you referenced doesn't exist. It may have expired or been deleted.",
        "CWM-2002": "The window you're looking for doesn't exist. Use window_list to see available windows.",
        "CWM-2003": "Some cached data is no longer available. The context may need to be recreated.",
        # State
        "CWM-3001": "This operation isn't allowed in the current state. Check session/window status first.",
        "CWM-3002": "This session is already frozen. Use window_thaw to restore it first.",
        "CWM-3003": "A window with this name already exists. Please choose a different name.",
        # Storage
        "CWM-4001": "Failed to save your data. Please try again or check available storage.",
        "CWM-4002": "Failed to load the requested data. It may be corrupted or missing.",
        "CWM-4003": "Storage limit reached. Delete some windows to free up space.",
        "CWM-4004": "The stored data appears corrupted. You may need to recreate this context.",
        # Connection
        "CWM-5001": "Cannot connect to the inference server. Check that vLLM is running.",
        "CWM-5002": "Cannot connect to the cache backend. Check your configuration.",
        "CWM-5003": "The requested model is not available. Check loaded models.",
        # Timeout
        "CWM-6001": "The request took too long. Try a smaller context or check server load.",
        "CWM-6002": "The operation timed out. Please try again.",
        # Resource
        "CWM-7001": "Not enough memory available. Try freeing up resources.",
        "CWM-7002": "Too many requests. Please wait a moment and try again.",
        "CWM-7003": "Too many concurrent operations. Please wait for others to complete.",
        # Security
        "CWM-8001": "You don't have permission for this operation.",
        "CWM-8002": "Security violation detected. This incident has been logged.",
        # Internal
        "CWM-9001": "An unexpected error occurred. Please try again or report this issue.",
    }

    code = error.code
    if code in messages:
        return messages[code]

    # Fallback for unknown codes - use the error message but sanitize it
    return str(error)


class ErrorContext:
    """
    Context manager for error handling with automatic logging and classification.

    Usage:
        async with ErrorContext("freeze operation", session_id=session_id):
            # ... code that might raise ...
    """

    def __init__(self, operation: str, logger=None, **context):
        """
        Initialize error context.

        Args:
            operation: Name of the operation for error messages
            logger: Optional logger instance
            **context: Additional context to include in errors
        """
        self.operation = operation
        self.context = context
        self._logger = logger

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val is not None:
            # Classify the error
            cwm_error = classify_error(exc_val)

            # Add operation context
            cwm_error.context.update(self.context)
            cwm_error.context["operation"] = self.operation

            # Log if logger provided
            if self._logger:
                self._logger.error(
                    f"Error in {self.operation}",
                    error_code=cwm_error.code,
                    **cwm_error.context,
                )

            # Re-raise as CWMError
            if not isinstance(exc_val, CWMError):
                raise cwm_error from exc_val

        return False  # Don't suppress exceptions
