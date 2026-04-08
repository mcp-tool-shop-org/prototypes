"""Tests for structured error types."""

from edgepacks.errors import EdgepacksError, OllamaError, PackNotFoundError, ValidationError


class TestEdgepacksError:
    def test_structured_fields(self) -> None:
        err = EdgepacksError(
            code="TEST_CODE",
            message="something broke",
            hint="try again",
            retryable=True,
        )
        assert err.code == "TEST_CODE"
        assert err.message == "something broke"
        assert err.hint == "try again"
        assert err.retryable is True
        assert err.cause is None
        assert str(err) == "something broke"

    def test_with_cause(self) -> None:
        cause = ValueError("root cause")
        err = EdgepacksError(code="X", message="wrapped", cause=cause)
        assert err.cause is cause


class TestPackNotFoundError:
    def test_fields(self) -> None:
        err = PackNotFoundError("nope", ["tool-routing", "error-triage"])
        assert err.code == "INPUT_PACK_NOT_FOUND"
        assert "nope" in err.message
        assert "error-triage" in err.hint
        assert "tool-routing" in err.hint


class TestOllamaError:
    def test_retryable(self) -> None:
        err = OllamaError("connection refused")
        assert err.retryable is True
        assert err.code == "DEP_OLLAMA_FAILED"
        assert "ollama serve" in err.hint.lower()


class TestValidationError:
    def test_fields(self) -> None:
        err = ValidationError("bad input")
        assert err.code == "INPUT_VALIDATION_FAILED"
        assert err.retryable is False
