"""Tests for ID validation in WindowManager operations.

Goal: Ensure freeze/thaw/clone reject malformed IDs at the boundary.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from context_window_manager.core.kv_store import MemoryKVStore
from context_window_manager.core.session_registry import SessionRegistry
from context_window_manager.core.window_manager import WindowManager
from context_window_manager.errors import ValidationError


@pytest.fixture
async def window_manager(tmp_path):
    """Create a WindowManager with mock dependencies."""
    kv = MemoryKVStore()
    registry = SessionRegistry(tmp_path / "registry.db")
    await registry.initialize()  # Initialize the database
    vllm = MagicMock()
    return WindowManager(registry=registry, kv_store=kv, vllm_client=vllm)


class TestFreezeIdValidation:
    """Tests for ID validation in freeze operation."""

    @pytest.mark.asyncio
    async def test_freeze_rejects_invalid_session_id(self, window_manager):
        """Session ID with special chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.freeze(
                session_id="session:with:colons",
                window_name="valid-window",
            )

    @pytest.mark.asyncio
    async def test_freeze_rejects_invalid_window_name(self, window_manager):
        """Window name with special chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.freeze(
                session_id="valid-session",
                window_name="window/with/slashes",
            )

    @pytest.mark.asyncio
    async def test_freeze_rejects_empty_session_id(self, window_manager):
        """Empty session ID should raise ValidationError."""
        with pytest.raises(ValidationError, match="cannot be empty"):
            await window_manager.freeze(
                session_id="",
                window_name="valid-window",
            )

    @pytest.mark.asyncio
    async def test_freeze_rejects_reserved_window_name(self, window_manager):
        """Reserved window names should raise ValidationError."""
        with pytest.raises(ValidationError, match="reserved"):
            await window_manager.freeze(
                session_id="valid-session",
                window_name="metadata",
            )

    @pytest.mark.asyncio
    async def test_freeze_normalizes_unicode(self, window_manager):
        """Unicode IDs should be NFKC normalized."""
        # Full-width ABC -> ASCII ABC after normalization
        # This test verifies normalization happens without error
        # The actual freeze will fail because session doesn't exist,
        # but it should fail AFTER validation passes
        from context_window_manager.errors import SessionNotFoundError

        with pytest.raises(SessionNotFoundError):
            await window_manager.freeze(
                session_id="ＡＢＣ",  # Full-width
                window_name="valid-window",
            )


class TestThawIdValidation:
    """Tests for ID validation in thaw operation."""

    @pytest.mark.asyncio
    async def test_thaw_rejects_invalid_window_name(self, window_manager):
        """Window name with path traversal should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.thaw(
                window_name="../../../etc/passwd",
            )

    @pytest.mark.asyncio
    async def test_thaw_rejects_invalid_new_session_id(self, window_manager):
        """New session ID with special chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.thaw(
                window_name="valid-window",
                new_session_id="session with spaces",
            )

    @pytest.mark.asyncio
    async def test_thaw_allows_none_session_id(self, window_manager):
        """None session ID should be allowed (auto-generated)."""
        from context_window_manager.errors import WindowNotFoundError

        # Should fail with WindowNotFoundError, not ValidationError
        with pytest.raises(WindowNotFoundError):
            await window_manager.thaw(
                window_name="nonexistent-window",
                new_session_id=None,
            )


class TestCloneIdValidation:
    """Tests for ID validation in clone operation."""

    @pytest.mark.asyncio
    async def test_clone_rejects_invalid_source_window(self, window_manager):
        """Source window with dots should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.clone(
                source_window="source.window.name",
                new_window_name="valid-target",
            )

    @pytest.mark.asyncio
    async def test_clone_rejects_invalid_new_window_name(self, window_manager):
        """New window name with special chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="Invalid"):
            await window_manager.clone(
                source_window="valid-source",
                new_window_name="new@window#name",
            )

    @pytest.mark.asyncio
    async def test_clone_rejects_too_long_window_name(self, window_manager):
        """Window name > 128 chars should raise ValidationError."""
        with pytest.raises(ValidationError, match="too long"):
            await window_manager.clone(
                source_window="valid-source",
                new_window_name="w" * 200,
            )
