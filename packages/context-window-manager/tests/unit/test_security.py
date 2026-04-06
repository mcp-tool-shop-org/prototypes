"""
Unit tests for security module.

Tests input sanitization, session isolation, and audit logging.
"""

from __future__ import annotations

import pytest

from context_window_manager.errors import (
    InvalidParameterError,
    InvalidSessionIdError,
    InvalidWindowNameError,
    SecurityError,
    SessionIsolationError,
)
from context_window_manager.security import (
    AuditEventType,
    AuditLogger,
    RateLimitConfig,
    RateLimiter,
    get_audit_logger,
    get_rate_limiter,
    sanitize_description,
    sanitize_path,
    sanitize_session_id,
    sanitize_tags,
    sanitize_window_name,
    verify_cache_salt_ownership,
    verify_session_isolation,
)


class TestSanitizeSessionId:
    """Tests for sanitize_session_id function."""

    def test_valid_session_id(self):
        """Should accept valid session IDs."""
        assert sanitize_session_id("session-123") == "session-123"
        assert sanitize_session_id("my_session") == "my_session"
        assert sanitize_session_id("Session123") == "Session123"
        assert sanitize_session_id("a1b2c3") == "a1b2c3"

    def test_trims_whitespace(self):
        """Should trim leading/trailing whitespace."""
        assert sanitize_session_id("  session-123  ") == "session-123"

    def test_rejects_empty(self):
        """Should reject empty session IDs."""
        with pytest.raises(InvalidSessionIdError):
            sanitize_session_id("")
        with pytest.raises(InvalidSessionIdError):
            sanitize_session_id("   ")

    def test_rejects_too_long(self):
        """Should reject session IDs exceeding max length."""
        long_id = "a" * 100
        with pytest.raises(InvalidSessionIdError):
            sanitize_session_id(long_id)

    def test_rejects_invalid_characters(self):
        """Should reject session IDs with invalid characters."""
        invalid_ids = [
            "session/123",  # slash
            "session\\123",  # backslash
            "session:123",  # colon
            "session 123",  # space
            "session@123",  # at sign
            "session!123",  # exclamation
            "../session",  # path traversal
        ]
        for invalid_id in invalid_ids:
            with pytest.raises(InvalidSessionIdError):
                sanitize_session_id(invalid_id)

    def test_rejects_injection_attempts(self):
        """Should reject potential injection patterns."""
        injection_attempts = [
            "session; DROP TABLE",
            "session' OR '1'='1",
            "session`whoami`",
            "session$(command)",
        ]
        for attempt in injection_attempts:
            with pytest.raises(InvalidSessionIdError):
                sanitize_session_id(attempt)


class TestSanitizeWindowName:
    """Tests for sanitize_window_name function."""

    def test_valid_window_name(self):
        """Should accept valid window names."""
        assert sanitize_window_name("my-window") == "my-window"
        assert sanitize_window_name("window_1") == "window_1"
        assert sanitize_window_name("MyWindow") == "MyWindow"

    def test_rejects_empty(self):
        """Should reject empty window names."""
        with pytest.raises(InvalidWindowNameError):
            sanitize_window_name("")

    def test_rejects_invalid_characters(self):
        """Should reject window names with invalid characters."""
        with pytest.raises(InvalidWindowNameError):
            sanitize_window_name("window/name")
        with pytest.raises(InvalidWindowNameError):
            sanitize_window_name("window name")


class TestSanitizeDescription:
    """Tests for sanitize_description function."""

    def test_valid_description(self):
        """Should accept valid descriptions."""
        desc = "This is a valid description."
        assert sanitize_description(desc) == desc

    def test_empty_description(self):
        """Should handle empty descriptions."""
        assert sanitize_description("") == ""
        assert sanitize_description(None) == ""

    def test_removes_control_characters(self):
        """Should remove control characters."""
        desc = "Hello\x00World\x07Test"
        result = sanitize_description(desc)
        assert "\x00" not in result
        assert "\x07" not in result

    def test_preserves_newlines(self):
        """Should preserve newlines and tabs."""
        desc = "Line 1\nLine 2\tIndented"
        assert sanitize_description(desc) == desc

    def test_truncates_long_descriptions(self):
        """Should truncate descriptions exceeding max length."""
        long_desc = "a" * 2000
        result = sanitize_description(long_desc)
        assert len(result) == 1024


class TestSanitizeTags:
    """Tests for sanitize_tags function."""

    def test_valid_tags(self):
        """Should accept valid tags."""
        tags = ["project-a", "important", "v2"]
        result = sanitize_tags(tags)
        assert result == ["project-a", "important", "v2"]

    def test_empty_tags(self):
        """Should handle empty/None tags."""
        assert sanitize_tags(None) == []
        assert sanitize_tags([]) == []

    def test_lowercases_tags(self):
        """Should lowercase all tags."""
        tags = ["Project", "IMPORTANT", "V2"]
        result = sanitize_tags(tags)
        assert result == ["project", "important", "v2"]

    def test_filters_empty_tags(self):
        """Should filter out empty tags."""
        tags = ["valid", "", "  ", "also-valid"]
        result = sanitize_tags(tags)
        assert result == ["valid", "also-valid"]

    def test_rejects_too_many_tags(self):
        """Should reject more than max tags."""
        tags = [f"tag{i}" for i in range(25)]
        with pytest.raises(InvalidParameterError):
            sanitize_tags(tags)

    def test_rejects_invalid_tag_format(self):
        """Should reject tags with invalid format."""
        with pytest.raises(InvalidParameterError):
            sanitize_tags(["valid", "invalid/tag"])


class TestSanitizePath:
    """Tests for sanitize_path function."""

    def test_valid_path(self):
        """Should accept valid paths."""
        assert sanitize_path("data/sessions/123.json") == "data/sessions/123.json"

    def test_empty_path(self):
        """Should handle empty paths."""
        assert sanitize_path("") == ""

    def test_rejects_path_traversal(self):
        """Should reject path traversal attempts."""
        traversal_attempts = [
            "../../../etc/passwd",
            "data/../../../secret",
            "..\\..\\windows\\system32",
            "data/./../../secret",
        ]
        for attempt in traversal_attempts:
            with pytest.raises(SecurityError):
                sanitize_path(attempt)

    def test_normalizes_separators(self):
        """Should normalize path separators."""
        result = sanitize_path("data\\sessions\\file.json")
        assert result == "data/sessions/file.json"

    def test_removes_null_bytes(self):
        """Should remove null bytes."""
        result = sanitize_path("data\x00.json")
        assert result == "data.json"


class TestVerifySessionIsolation:
    """Tests for verify_session_isolation function."""

    def test_same_session_allowed(self):
        """Should allow access to own session by default."""
        # Should not raise
        verify_session_isolation("session-1", "session-1")

    def test_same_session_denied_when_configured(self):
        """Should deny own session access when not allowed."""
        with pytest.raises(SessionIsolationError):
            verify_session_isolation("session-1", "session-1", allow_same_session=False)

    def test_different_sessions_logs(self):
        """Should log cross-session access."""
        # Should not raise by default, but logs the access
        verify_session_isolation("session-1", "session-2")

    def test_empty_sessions_allowed(self):
        """Should allow empty session IDs (can't verify)."""
        verify_session_isolation("", "session-1")
        verify_session_isolation("session-1", "")


class TestVerifyCacheSaltOwnership:
    """Tests for verify_cache_salt_ownership function."""

    def test_valid_ownership(self):
        """Should verify valid cache salt ownership."""
        assert verify_cache_salt_ownership("session-123", "session-123-abc123-salt")

    def test_invalid_ownership(self):
        """Should reject invalid cache salt ownership."""
        assert not verify_cache_salt_ownership("session-123", "session-456-abc123-salt")

    def test_empty_cache_salt(self):
        """Should reject empty cache salt."""
        assert not verify_cache_salt_ownership("session-123", "")

    def test_with_expected_prefix(self):
        """Should verify expected prefix."""
        assert verify_cache_salt_ownership(
            "session-123", "prefix-session-123-salt", expected_prefix="prefix"
        )
        assert not verify_cache_salt_ownership(
            "session-123", "session-123-salt", expected_prefix="wrong"
        )


class TestAuditLogger:
    """Tests for AuditLogger class."""

    @pytest.fixture
    def logger(self):
        """Create a fresh audit logger."""
        return AuditLogger()

    def test_log_event(self, logger):
        """Should log audit events."""
        event = logger.log(
            event_type=AuditEventType.SESSION_CREATE,
            operation="create_session",
            session_id="session-123",
            success=True,
        )

        assert event.event_type == AuditEventType.SESSION_CREATE
        assert event.session_id == "session-123"
        assert event.success is True

    def test_get_recent_events(self, logger):
        """Should return recent events."""
        logger.log(AuditEventType.SESSION_CREATE, "create", session_id="s1")
        logger.log(AuditEventType.WINDOW_CREATE, "create", session_id="s1")
        logger.log(AuditEventType.SESSION_DELETE, "delete", session_id="s2")

        events = logger.get_recent_events()
        assert len(events) == 3

    def test_filter_by_event_type(self, logger):
        """Should filter events by type."""
        logger.log(AuditEventType.SESSION_CREATE, "create", session_id="s1")
        logger.log(AuditEventType.WINDOW_CREATE, "create", session_id="s1")

        events = logger.get_recent_events(event_type=AuditEventType.SESSION_CREATE)
        assert len(events) == 1
        assert events[0].event_type == AuditEventType.SESSION_CREATE

    def test_filter_by_session(self, logger):
        """Should filter events by session ID."""
        logger.log(AuditEventType.SESSION_CREATE, "create", session_id="s1")
        logger.log(AuditEventType.SESSION_CREATE, "create", session_id="s2")

        events = logger.get_recent_events(session_id="s1")
        assert len(events) == 1
        assert events[0].session_id == "s1"

    def test_limits_stored_events(self, logger):
        """Should limit stored events to prevent memory exhaustion."""
        logger._max_events = 10

        for i in range(20):
            logger.log(AuditEventType.SESSION_ACCESS, f"access-{i}")

        events = logger.get_recent_events(limit=100)
        assert len(events) == 10

    def test_to_dict(self, logger):
        """Should convert event to dictionary."""
        event = logger.log(
            AuditEventType.INJECTION_ATTEMPT,
            "sql_injection",
            success=False,
            session_id="s1",
            payload="'; DROP TABLE",
        )

        d = event.to_dict()
        assert d["event_type"] == "injection_attempt"
        assert d["session_id"] == "s1"
        assert d["success"] is False
        assert "timestamp" in d


class TestRateLimiter:
    """Tests for RateLimiter class."""

    @pytest.fixture
    def limiter(self):
        """Create a rate limiter with low limits for testing."""
        config = RateLimitConfig(
            requests_per_minute=3,
            requests_per_hour=10,
            burst_limit=2,
        )
        return RateLimiter(config)

    def test_allows_within_limits(self, limiter):
        """Should allow requests within limits."""
        allowed, _ = limiter.check_rate_limit("user-1")
        assert allowed is True

    def test_blocks_exceeding_minute_limit(self, limiter):
        """Should block requests exceeding per-minute limit."""
        for _ in range(3):
            limiter.check_rate_limit("user-1")

        allowed, retry_after = limiter.check_rate_limit("user-1")
        assert allowed is False
        assert retry_after > 0

    def test_independent_keys(self, limiter):
        """Should track different keys independently."""
        for _ in range(3):
            limiter.check_rate_limit("user-1")

        # Different user should still be allowed
        allowed, _ = limiter.check_rate_limit("user-2")
        assert allowed is True

    def test_reset_single_key(self, limiter):
        """Should reset single key's counters."""
        for _ in range(3):
            limiter.check_rate_limit("user-1")

        limiter.reset("user-1")

        allowed, _ = limiter.check_rate_limit("user-1")
        assert allowed is True

    def test_reset_all(self, limiter):
        """Should reset all counters."""
        for _ in range(3):
            limiter.check_rate_limit("user-1")
            limiter.check_rate_limit("user-2")

        limiter.reset()

        allowed1, _ = limiter.check_rate_limit("user-1")
        allowed2, _ = limiter.check_rate_limit("user-2")
        assert allowed1 is True
        assert allowed2 is True


class TestGlobalInstances:
    """Tests for global singleton instances."""

    def test_get_audit_logger(self):
        """Should return same instance."""
        logger1 = get_audit_logger()
        logger2 = get_audit_logger()
        assert logger1 is logger2

    def test_get_rate_limiter(self):
        """Should return same instance."""
        limiter1 = get_rate_limiter()
        limiter2 = get_rate_limiter()
        assert limiter1 is limiter2
