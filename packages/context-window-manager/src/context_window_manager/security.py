"""
Security utilities for Context Window Manager.

Provides:
- Input sanitization and validation
- Session isolation verification
- Audit logging for security events
- Path traversal prevention
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

import structlog

from context_window_manager.errors import (
    InvalidParameterError,
    InvalidSessionIdError,
    InvalidWindowNameError,
    SecurityError,
    SessionIsolationError,
)

logger = structlog.get_logger()


# =============================================================================
# Input Validation Patterns
# =============================================================================


# Safe patterns for identifiers (alphanumeric, hyphens, underscores)
SAFE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$")

# Pattern to detect path traversal attempts
PATH_TRAVERSAL_PATTERN = re.compile(r"(?:^|[/\\])\.\.(?:[/\\]|$)|[/\\]\.\.(?:[/\\]|$)")

# Pattern to detect shell injection attempts
SHELL_INJECTION_PATTERN = re.compile(r"[;&|`$()]")

# Pattern to detect SQL injection attempts
SQL_INJECTION_PATTERN = re.compile(
    r"(?:'|\"|--|;|union|select|insert|update|delete|drop|exec|execute|script|javascript)",
    re.IGNORECASE,
)

# Maximum lengths for various inputs
MAX_SESSION_ID_LENGTH = 64
MAX_WINDOW_NAME_LENGTH = 64
MAX_DESCRIPTION_LENGTH = 1024
MAX_TAG_LENGTH = 64
MAX_TAGS_COUNT = 20


# =============================================================================
# Input Sanitization Functions
# =============================================================================


def sanitize_session_id(session_id: str) -> str:
    """
    Validate and sanitize a session ID.

    Args:
        session_id: The session ID to validate

    Returns:
        The sanitized session ID (trimmed, validated)

    Raises:
        InvalidSessionIdError: If the session ID is invalid
    """
    if not session_id:
        raise InvalidSessionIdError("")

    # Trim whitespace
    session_id = session_id.strip()

    # Check length
    if len(session_id) > MAX_SESSION_ID_LENGTH:
        raise InvalidSessionIdError(session_id[:20] + "...")

    # Check pattern
    if not SAFE_ID_PATTERN.match(session_id):
        raise InvalidSessionIdError(session_id)

    # Check for injection attempts
    if _contains_injection_patterns(session_id):
        _log_security_event(
            "injection_attempt",
            "Session ID contains suspicious patterns",
            session_id=session_id,
        )
        raise InvalidSessionIdError(session_id)

    return session_id


def sanitize_window_name(window_name: str) -> str:
    """
    Validate and sanitize a window name.

    Args:
        window_name: The window name to validate

    Returns:
        The sanitized window name

    Raises:
        InvalidWindowNameError: If the window name is invalid
    """
    if not window_name:
        raise InvalidWindowNameError("")

    # Trim whitespace
    window_name = window_name.strip()

    # Check length
    if len(window_name) > MAX_WINDOW_NAME_LENGTH:
        raise InvalidWindowNameError(window_name[:20] + "...")

    # Check pattern
    if not SAFE_ID_PATTERN.match(window_name):
        raise InvalidWindowNameError(window_name)

    # Check for injection attempts
    if _contains_injection_patterns(window_name):
        _log_security_event(
            "injection_attempt",
            "Window name contains suspicious patterns",
            window_name=window_name,
        )
        raise InvalidWindowNameError(window_name)

    return window_name


def sanitize_description(description: str) -> str:
    """
    Sanitize a description string.

    Removes potentially dangerous characters while preserving readability.

    Args:
        description: The description to sanitize

    Returns:
        The sanitized description
    """
    if not description:
        return ""

    # Trim and truncate
    description = description.strip()[:MAX_DESCRIPTION_LENGTH]

    # Remove control characters except newlines and tabs
    description = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", description)

    return description


def sanitize_tags(tags: list[str] | None) -> list[str]:
    """
    Validate and sanitize a list of tags.

    Args:
        tags: The tags to validate

    Returns:
        The sanitized tags list

    Raises:
        InvalidParameterError: If tags are invalid
    """
    if not tags:
        return []

    if len(tags) > MAX_TAGS_COUNT:
        raise InvalidParameterError("tags", f"Maximum {MAX_TAGS_COUNT} tags allowed")

    sanitized = []
    for tag in tags:
        if not isinstance(tag, str):
            raise InvalidParameterError("tags", "All tags must be strings")

        cleaned = tag.strip().lower()
        if not cleaned:
            continue

        if len(cleaned) > MAX_TAG_LENGTH:
            raise InvalidParameterError("tags", f"Tag too long: {cleaned[:20]}...")

        if not SAFE_ID_PATTERN.match(cleaned):
            raise InvalidParameterError("tags", f"Invalid tag format: {cleaned}")

        sanitized.append(cleaned)

    return sanitized


def sanitize_path(path: str) -> str:
    """
    Sanitize a file path to prevent path traversal.

    Args:
        path: The path to sanitize

    Returns:
        The sanitized path

    Raises:
        SecurityError: If path traversal is detected
    """
    if not path:
        return ""

    # Check for path traversal
    if PATH_TRAVERSAL_PATTERN.search(path):
        _log_security_event(
            "path_traversal_attempt",
            "Path contains traversal patterns",
            path=path,
        )
        raise SecurityError("Path traversal attempt detected")

    # Normalize separators
    path = path.replace("\\", "/")

    # Remove any null bytes
    path = path.replace("\x00", "")

    return path


def _contains_injection_patterns(value: str) -> bool:
    """Check if a value contains potential injection patterns."""
    if PATH_TRAVERSAL_PATTERN.search(value):
        return True
    if SHELL_INJECTION_PATTERN.search(value):
        return True
    return bool(SQL_INJECTION_PATTERN.search(value))


# =============================================================================
# Session Isolation
# =============================================================================


def verify_session_isolation(
    requesting_session_id: str,
    target_session_id: str,
    allow_same_session: bool = True,
) -> None:
    """
    Verify that session isolation is maintained.

    Args:
        requesting_session_id: The session making the request
        target_session_id: The target session being accessed
        allow_same_session: If True, allows access to own session

    Raises:
        SessionIsolationError: If isolation is violated
    """
    if not requesting_session_id or not target_session_id:
        return  # Can't verify without session IDs

    if requesting_session_id == target_session_id:
        if not allow_same_session:
            raise SessionIsolationError("Cannot access own session in this context")
        return

    # Different sessions - this may be allowed for some operations (e.g., cloning)
    # but should be logged for audit purposes
    _log_security_event(
        "cross_session_access",
        "Session accessing another session's resources",
        requesting_session=requesting_session_id,
        target_session=target_session_id,
    )


def verify_cache_salt_ownership(
    session_id: str,
    cache_salt: str,
    expected_prefix: str = "",
) -> bool:
    """
    Verify that a cache_salt belongs to the expected session.

    The cache_salt should contain or derive from the session_id to
    ensure session isolation in the KV cache.

    Args:
        session_id: The session claiming ownership
        cache_salt: The cache salt to verify
        expected_prefix: Optional prefix that should be in the salt

    Returns:
        True if ownership is verified, False otherwise
    """
    if not cache_salt:
        return False

    # Basic verification: cache_salt should reference the session
    # In production, this would use cryptographic verification
    if session_id not in cache_salt:
        _log_security_event(
            "cache_salt_mismatch",
            "Cache salt does not match session",
            session_id=session_id,
            cache_salt_preview=cache_salt[:16] + "...",
        )
        return False

    return not (expected_prefix and not cache_salt.startswith(expected_prefix))


# =============================================================================
# Audit Logging
# =============================================================================


class AuditEventType(Enum):
    """Types of auditable security events."""

    # Authentication/Authorization
    SESSION_CREATE = "session_create"
    SESSION_DELETE = "session_delete"
    SESSION_ACCESS = "session_access"

    # Window operations
    WINDOW_CREATE = "window_create"
    WINDOW_DELETE = "window_delete"
    WINDOW_CLONE = "window_clone"
    WINDOW_THAW = "window_thaw"

    # Security events
    INJECTION_ATTEMPT = "injection_attempt"
    PATH_TRAVERSAL = "path_traversal"
    ISOLATION_VIOLATION = "isolation_violation"
    ACCESS_DENIED = "access_denied"

    # Data access
    DATA_EXPORT = "data_export"
    DATA_IMPORT = "data_import"


@dataclass
class AuditEvent:
    """An auditable security event."""

    event_type: AuditEventType
    timestamp: datetime
    session_id: str | None
    operation: str
    success: bool
    details: dict[str, Any] = field(default_factory=dict)
    ip_address: str | None = None
    user_agent: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for logging/storage."""
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "session_id": self.session_id,
            "operation": self.operation,
            "success": self.success,
            "details": self.details,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
        }


class AuditLogger:
    """
    Logs security audit events.

    Events are logged to both structured logs and can be stored
    in the registry for compliance/forensics.
    """

    def __init__(self, log_level: str = "info"):
        self._log_level = log_level
        self._events: list[AuditEvent] = []
        self._max_events = 10000  # Keep last N events in memory

    def log(
        self,
        event_type: AuditEventType,
        operation: str,
        success: bool = True,
        session_id: str | None = None,
        **details,
    ) -> AuditEvent:
        """
        Log an audit event.

        Args:
            event_type: Type of event
            operation: The operation being performed
            success: Whether the operation succeeded
            session_id: Associated session ID if any
            **details: Additional event details

        Returns:
            The created AuditEvent
        """
        event = AuditEvent(
            event_type=event_type,
            timestamp=datetime.utcnow(),
            session_id=session_id,
            operation=operation,
            success=success,
            details=details,
        )

        # Log to structured logger
        log_method = getattr(logger, self._log_level)
        log_method(
            f"AUDIT: {event_type.value}",
            **event.to_dict(),
        )

        # Store in memory buffer (for recent event queries)
        self._events.append(event)
        if len(self._events) > self._max_events:
            self._events = self._events[-self._max_events :]

        return event

    def log_security_event(
        self,
        event_type: str,
        message: str,
        **context,
    ) -> None:
        """
        Log a security-related event.

        This is a convenience method for logging security events
        without creating a full AuditEvent.
        """
        mapped_type = AuditEventType.ACCESS_DENIED
        if "injection" in event_type.lower():
            mapped_type = AuditEventType.INJECTION_ATTEMPT
        elif "traversal" in event_type.lower():
            mapped_type = AuditEventType.PATH_TRAVERSAL
        elif "isolation" in event_type.lower():
            mapped_type = AuditEventType.ISOLATION_VIOLATION

        self.log(
            event_type=mapped_type,
            operation=event_type,
            success=False,
            message=message,
            **context,
        )

    def get_recent_events(
        self,
        limit: int = 100,
        event_type: AuditEventType | None = None,
        session_id: str | None = None,
    ) -> list[AuditEvent]:
        """
        Get recent audit events.

        Args:
            limit: Maximum events to return
            event_type: Filter by event type
            session_id: Filter by session ID

        Returns:
            List of matching audit events
        """
        events = self._events

        if event_type:
            events = [e for e in events if e.event_type == event_type]

        if session_id:
            events = [e for e in events if e.session_id == session_id]

        return events[-limit:]


# Global audit logger instance
_audit_logger: AuditLogger | None = None


def get_audit_logger() -> AuditLogger:
    """Get the global audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def _log_security_event(event_type: str, message: str, **context) -> None:
    """Helper to log security events."""
    get_audit_logger().log_security_event(event_type, message, **context)


# =============================================================================
# Rate Limiting (Basic Implementation)
# =============================================================================


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting."""

    requests_per_minute: int = 60
    requests_per_hour: int = 1000
    burst_limit: int = 10


class RateLimiter:
    """
    Simple in-memory rate limiter.

    For production, use Redis-backed rate limiting.
    """

    def __init__(self, config: RateLimitConfig | None = None):
        self.config = config or RateLimitConfig()
        self._request_counts: dict[str, list[datetime]] = {}

    def check_rate_limit(self, key: str) -> tuple[bool, int]:
        """
        Check if a request is within rate limits.

        Args:
            key: The rate limit key (e.g., session_id, IP address)

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        now = datetime.utcnow()

        if key not in self._request_counts:
            self._request_counts[key] = []

        # Clean old entries
        minute_ago = now.timestamp() - 60
        hour_ago = now.timestamp() - 3600

        self._request_counts[key] = [
            ts for ts in self._request_counts[key] if ts.timestamp() > hour_ago
        ]

        # Count recent requests
        requests = self._request_counts[key]
        recent_minute = sum(1 for ts in requests if ts.timestamp() > minute_ago)
        recent_hour = len(requests)

        # Check limits
        if recent_minute >= self.config.requests_per_minute:
            # Find oldest request in the last minute to calculate retry time
            minute_requests = [ts for ts in requests if ts.timestamp() > minute_ago]
            if minute_requests:
                oldest = min(minute_requests, key=lambda ts: ts.timestamp())
                retry_after = max(1, int(60 - (now.timestamp() - oldest.timestamp())))
            else:
                retry_after = 60
            return False, retry_after

        if recent_hour >= self.config.requests_per_hour:
            # Find oldest request in the last hour
            if requests:
                oldest = min(requests, key=lambda ts: ts.timestamp())
                retry_after = max(1, int(3600 - (now.timestamp() - oldest.timestamp())))
            else:
                retry_after = 3600
            return False, retry_after

        # Record this request
        self._request_counts[key].append(now)

        return True, 0

    def reset(self, key: str | None = None) -> None:
        """Reset rate limit counters."""
        if key:
            self._request_counts.pop(key, None)
        else:
            self._request_counts.clear()


# Global rate limiter
_rate_limiter: RateLimiter | None = None


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RateLimiter()
    return _rate_limiter
