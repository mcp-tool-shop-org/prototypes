"""
Unit tests for error classes.

Tests error hierarchy, codes, and serialization.
"""

from __future__ import annotations

import pytest

from context_window_manager.errors import (
    CWMError,
    KVStoreConnectionError,
    KVStoreError,
    KVStoreTimeoutError,
    ResourceExhaustedError,
    SecurityError,
    SessionNotFoundError,
    StateTransitionError,
    ValidationError,
    VLLMConnectionError,
    VLLMTimeoutError,
    WindowNotFoundError,
)


class TestCWMError:
    """Tests for base CWMError class."""

    def test_basic_creation(self):
        """Should create error with message and code."""
        error = CWMError("Test error", "CWM-0000")
        assert "Test error" in str(error)
        assert error.code == "CWM-0000"

    def test_with_context(self):
        """Should store additional context."""
        error = CWMError("Test", "CWM-0000", context={"key": "value"})
        assert error.context == {"key": "value"}

    def test_to_dict(self):
        """Should convert to dictionary."""
        error = CWMError("Test error", "CWM-0001", context={"extra": "info"})
        result = error.to_dict()

        assert result["code"] == "CWM-0001"
        assert "Test error" in result["message"]
        assert result["error"] == "CWMError"

    def test_to_log_dict(self):
        """Should convert to logging dictionary."""
        error = CWMError("Test", "CWM-0001", context={"x": 1})
        result = error.to_log_dict()

        assert result["code"] == "CWM-0001"
        assert result["context"] == {"x": 1}
        assert "timestamp" in result


class TestValidationError:
    """Tests for ValidationError class."""

    def test_basic_creation(self):
        """Should create validation error."""
        error = ValidationError("Invalid value")
        assert "Invalid value" in str(error)
        assert error.code.startswith("CWM-1")

    def test_inherits_from_base(self):
        """Should inherit from CWMError."""
        error = ValidationError("test")
        assert isinstance(error, CWMError)


class TestSessionNotFoundError:
    """Tests for SessionNotFoundError class."""

    def test_includes_session_id(self):
        """Should include session ID in message."""
        error = SessionNotFoundError("sess-123")
        assert "sess-123" in str(error)
        assert error.code.startswith("CWM-2")

    def test_context_contains_session_id(self):
        """Should include session_id in context."""
        error = SessionNotFoundError("sess-abc")
        assert error.context["session_id"] == "sess-abc"


class TestWindowNotFoundError:
    """Tests for WindowNotFoundError class."""

    def test_includes_window_name(self):
        """Should include window name in message."""
        error = WindowNotFoundError("win-456")
        assert "win-456" in str(error)
        assert error.code.startswith("CWM-2")


class TestStateTransitionError:
    """Tests for StateTransitionError class."""

    def test_includes_states(self):
        """Should include from/to states."""
        error = StateTransitionError("active", "thawed")
        assert "active" in str(error)
        assert "thawed" in str(error)
        assert error.from_state == "active"
        assert error.to_state == "thawed"
        assert error.code.startswith("CWM-3")

    def test_context_contains_states(self):
        """Should include states in context."""
        error = StateTransitionError("frozen", "active")
        assert error.context["from_state"] == "frozen"
        assert error.context["to_state"] == "active"


class TestKVStoreError:
    """Tests for KVStoreError class."""

    def test_basic_creation(self):
        """Should create with message."""
        error = KVStoreError("Storage failed")
        assert "Storage failed" in str(error)
        assert error.code.startswith("CWM-4")


class TestKVStoreConnectionError:
    """Tests for KVStoreConnectionError class."""

    def test_includes_backend(self):
        """Should include backend info."""
        error = KVStoreConnectionError("redis://localhost", "Connection refused")
        assert "redis://localhost" in str(error)
        assert error.backend == "redis://localhost"
        assert error.code.startswith("CWM-5")


class TestKVStoreTimeoutError:
    """Tests for KVStoreTimeoutError class."""

    def test_includes_timeout(self):
        """Should include timeout value."""
        error = KVStoreTimeoutError(30.0)
        assert "30" in str(error)
        assert error.timeout == 30.0
        assert error.code.startswith("CWM-6")


class TestVLLMConnectionError:
    """Tests for VLLMConnectionError class."""

    def test_includes_url(self):
        """Should include vLLM URL."""
        error = VLLMConnectionError("http://vllm:8000", "Connection failed")
        assert "http://vllm:8000" in str(error)
        assert error.url == "http://vllm:8000"
        assert error.code.startswith("CWM-5")


class TestVLLMTimeoutError:
    """Tests for VLLMTimeoutError class."""

    def test_includes_timeout(self):
        """Should include timeout value."""
        error = VLLMTimeoutError(60.0)
        assert "60" in str(error)
        assert error.timeout == 60.0
        assert error.code.startswith("CWM-6")


class TestResourceExhaustedError:
    """Tests for ResourceExhaustedError class."""

    def test_includes_resource(self):
        """Should include resource type and limit."""
        error = ResourceExhaustedError("memory", "10GB")
        assert "memory" in str(error)
        assert "10GB" in str(error)
        assert error.resource == "memory"
        assert error.limit == "10GB"
        assert error.code.startswith("CWM-7")


class TestSecurityError:
    """Tests for SecurityError class."""

    def test_basic_creation(self):
        """Should create security error."""
        error = SecurityError("Unauthorized access")
        assert "Unauthorized" in str(error)
        assert error.code.startswith("CWM-8")


class TestErrorHierarchy:
    """Tests for error class hierarchy."""

    def test_all_inherit_from_base(self):
        """All errors should inherit from CWMError."""
        errors = [
            ValidationError("test"),
            SessionNotFoundError("sess"),
            WindowNotFoundError("win"),
            StateTransitionError("a", "b"),
            KVStoreError("test"),
            KVStoreConnectionError("backend", "error"),
            KVStoreTimeoutError(30.0),
            VLLMConnectionError("url", "error"),
            VLLMTimeoutError(60.0),
            ResourceExhaustedError("res", "lim"),
            SecurityError("test"),
        ]

        for error in errors:
            assert isinstance(error, CWMError)
            assert isinstance(error, Exception)

    def test_catchable_by_base_class(self):
        """Should be catchable by base class."""
        with pytest.raises(CWMError):
            raise SessionNotFoundError("test")

        with pytest.raises(CWMError):
            raise ValidationError("test")


class TestErrorCodes:
    """Tests for error code uniqueness and format."""

    def test_codes_follow_format(self):
        """All codes should follow CWM-XXXX format."""
        errors = [
            CWMError("test", "CWM-0000"),
            ValidationError("test"),
            SessionNotFoundError("sess"),
            StateTransitionError("a", "b"),
            KVStoreError("test"),
            VLLMConnectionError("url", "msg"),
        ]

        for error in errors:
            assert error.code.startswith("CWM-")
            # Code should be CWM- followed by digits

    def test_category_codes(self):
        """Error codes should reflect category."""
        # Validation: CWM-1xxx
        assert ValidationError("test").code.startswith("CWM-1")

        # NotFound: CWM-2xxx
        assert SessionNotFoundError("s").code.startswith("CWM-2")
        assert WindowNotFoundError("w").code.startswith("CWM-2")

        # State: CWM-3xxx
        assert StateTransitionError("a", "b").code.startswith("CWM-3")

        # Storage: CWM-4xxx
        assert KVStoreError("test").code.startswith("CWM-4")

        # Connection: CWM-5xxx
        assert KVStoreConnectionError("b", "e").code.startswith("CWM-5")
        assert VLLMConnectionError("u", "m").code.startswith("CWM-5")

        # Timeout: CWM-6xxx
        assert KVStoreTimeoutError(30.0).code.startswith("CWM-6")
        assert VLLMTimeoutError(60.0).code.startswith("CWM-6")

        # Resource: CWM-7xxx
        assert ResourceExhaustedError("r", "l").code.startswith("CWM-7")

        # Security: CWM-8xxx
        assert SecurityError("test").code.startswith("CWM-8")


class TestClassifyError:
    """Tests for classify_error utility function."""

    def test_cwm_error_passthrough(self):
        """CWMError instances should pass through unchanged."""
        from context_window_manager.errors import classify_error

        original = SessionNotFoundError("sess-123")
        result = classify_error(original)
        assert result is original

    def test_file_not_found_to_storage_read(self):
        """FileNotFoundError should map to StorageReadError."""
        from context_window_manager.errors import StorageReadError, classify_error

        result = classify_error(FileNotFoundError("missing.txt"))
        assert isinstance(result, StorageReadError)
        assert "missing.txt" in str(result)

    def test_permission_error_to_access_denied(self):
        """PermissionError should map to AccessDeniedError."""
        from context_window_manager.errors import AccessDeniedError, classify_error

        perm_error = PermissionError("Access denied")
        perm_error.filename = "/etc/secret"
        result = classify_error(perm_error)
        assert isinstance(result, AccessDeniedError)

    def test_memory_error_to_memory_exhausted(self):
        """MemoryError should map to MemoryExhaustedError."""
        from context_window_manager.errors import MemoryExhaustedError, classify_error

        result = classify_error(MemoryError())
        assert isinstance(result, MemoryExhaustedError)

    def test_timeout_keyword_to_operation_timeout(self):
        """Errors with 'timeout' in message should map to OperationTimeoutError."""
        from context_window_manager.errors import OperationTimeoutError, classify_error

        result = classify_error(Exception("Request timeout exceeded"))
        assert isinstance(result, OperationTimeoutError)

    def test_unknown_error_to_internal(self):
        """Unknown exceptions should become InternalError."""
        from context_window_manager.errors import InternalError, classify_error

        result = classify_error(RuntimeError("Something weird happened"))
        assert isinstance(result, InternalError)
        assert "RuntimeError" in str(result)


class TestIsRetryable:
    """Tests for is_retryable utility function."""

    def test_cwm_error_uses_retryable_flag(self):
        """CWMError instances should use their retryable attribute."""
        from context_window_manager.errors import (
            SessionNotFoundError,
            VLLMConnectionError,
            is_retryable,
        )

        # VLLMConnectionError is retryable
        assert is_retryable(VLLMConnectionError("http://localhost:8000")) is True

        # SessionNotFoundError is not retryable
        assert is_retryable(SessionNotFoundError("sess-123")) is False

    def test_timeout_pattern_is_retryable(self):
        """Errors with 'timeout' should be retryable."""
        from context_window_manager.errors import is_retryable

        assert is_retryable(Exception("Connection timeout")) is True
        assert (
            is_retryable(Exception("Request timed out")) is False
        )  # 'timeout' must be full word match

    def test_connection_pattern_is_retryable(self):
        """Errors with 'connection' should be retryable."""
        from context_window_manager.errors import is_retryable

        assert is_retryable(Exception("Connection refused")) is True

    def test_unavailable_pattern_is_retryable(self):
        """Errors with 'unavailable' should be retryable."""
        from context_window_manager.errors import is_retryable

        assert is_retryable(Exception("Service unavailable")) is True

    def test_non_retryable_error(self):
        """Errors without retryable patterns should not be retryable."""
        from context_window_manager.errors import is_retryable

        assert is_retryable(ValueError("Invalid input")) is False


class TestGetRetryDelay:
    """Tests for get_retry_delay utility function."""

    def test_exponential_backoff(self):
        """Delay should increase exponentially with attempts."""
        from context_window_manager.errors import get_retry_delay

        error = Exception("test")
        delay_0 = get_retry_delay(error, 0, base_delay=1.0)
        delay_1 = get_retry_delay(error, 1, base_delay=1.0)
        delay_2 = get_retry_delay(error, 2, base_delay=1.0)

        # Account for jitter (0-25%)
        assert 1.0 <= delay_0 <= 1.25
        assert 2.0 <= delay_1 <= 2.5
        assert 4.0 <= delay_2 <= 5.0

    def test_max_delay_cap(self):
        """Delay should be capped at 60 seconds."""
        from context_window_manager.errors import get_retry_delay

        error = Exception("test")
        # Attempt 10 would give 2^10 = 1024 seconds without cap
        delay = get_retry_delay(error, 10, base_delay=1.0)
        assert delay <= 60.0

    def test_custom_base_delay(self):
        """Should respect custom base delay."""
        from context_window_manager.errors import get_retry_delay

        error = Exception("test")
        delay = get_retry_delay(error, 0, base_delay=5.0)
        # Base delay of 5 with 0-25% jitter
        assert 5.0 <= delay <= 6.25


class TestFormatUserMessage:
    """Tests for format_user_message utility function."""

    def test_known_code_returns_friendly_message(self):
        """Known error codes should return user-friendly messages."""
        from context_window_manager.errors import format_user_message

        error = SessionNotFoundError("sess-123")
        msg = format_user_message(error)
        # Should be friendly, not expose internal session ID format
        assert "window_list" in msg or "doesn't exist" in msg

    def test_validation_error_message(self):
        """Validation errors should have helpful messages."""
        from context_window_manager.errors import (
            InvalidSessionIdError,
            format_user_message,
        )

        error = InvalidSessionIdError("bad!@#id")
        msg = format_user_message(error)
        assert "alphanumeric" in msg.lower()

    def test_window_not_found_message(self):
        """Window not found should suggest window_list."""
        from context_window_manager.errors import format_user_message

        error = WindowNotFoundError("my-window")
        msg = format_user_message(error)
        assert "window_list" in msg

    def test_connection_error_message(self):
        """Connection errors should suggest checking server."""
        from context_window_manager.errors import format_user_message

        error = VLLMConnectionError("http://localhost:8000")
        msg = format_user_message(error)
        assert "vLLM" in msg or "server" in msg

    def test_unknown_code_returns_error_message(self):
        """Unknown codes should return the error message."""
        from context_window_manager.errors import format_user_message

        error = CWMError("Custom message", code="CWM-0000")
        msg = format_user_message(error)
        assert "Custom message" in msg


class TestErrorContext:
    """Tests for ErrorContext async context manager."""

    @pytest.mark.asyncio
    async def test_no_error_passes_through(self):
        """Context should pass through when no error occurs."""
        from context_window_manager.errors import ErrorContext

        async with ErrorContext("test_operation"):
            result = 42
        assert result == 42

    @pytest.mark.asyncio
    async def test_cwm_error_preserved(self):
        """CWMError should be preserved with added context."""
        from context_window_manager.errors import ErrorContext

        with pytest.raises(SessionNotFoundError) as exc_info:
            async with ErrorContext("test_operation", session_id="sess-123"):
                raise SessionNotFoundError("sess-123")

        assert exc_info.value.context["operation"] == "test_operation"
        assert exc_info.value.context["session_id"] == "sess-123"

    @pytest.mark.asyncio
    async def test_stdlib_error_converted_to_cwm_error(self):
        """Standard library errors should be converted to CWMError."""
        from context_window_manager.errors import ErrorContext, StorageReadError

        with pytest.raises(StorageReadError):
            async with ErrorContext("file_read"):
                raise FileNotFoundError("missing.txt")

    @pytest.mark.asyncio
    async def test_context_added_to_error(self):
        """Additional context should be added to error."""
        from context_window_manager.errors import ErrorContext, InternalError

        with pytest.raises(InternalError) as exc_info:
            async with ErrorContext(
                "custom_op", user_id="user-1", request_id="req-123"
            ):
                raise RuntimeError("Something failed")

        error = exc_info.value
        assert error.context["operation"] == "custom_op"
        assert error.context["user_id"] == "user-1"
        assert error.context["request_id"] == "req-123"

    @pytest.mark.asyncio
    async def test_logger_called_on_error(self):
        """Logger should be called when error occurs."""
        from unittest.mock import MagicMock

        from context_window_manager.errors import ErrorContext

        mock_logger = MagicMock()

        with pytest.raises(Exception):
            async with ErrorContext("test_op", logger=mock_logger):
                raise ValueError("test error")

        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args
        assert "test_op" in call_args[0][0]
