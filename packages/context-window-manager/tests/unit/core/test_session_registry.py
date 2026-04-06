"""
Unit tests for SessionRegistry.

Tests session and window management, state transitions, and SQLite operations.
"""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from context_window_manager.core.session_registry import (
    Session,
    SessionRegistry,
    SessionState,
    Window,
)
from context_window_manager.errors import (
    InvalidStateTransitionError,
    SessionNotFoundError,
    WindowAlreadyExistsError,
    WindowNotFoundError,
)


class TestSessionState:
    """Tests for SessionState enum."""

    def test_all_states_defined(self):
        """Should have all expected states."""
        assert SessionState.ACTIVE.value == "active"
        assert SessionState.FROZEN.value == "frozen"
        assert SessionState.THAWED.value == "thawed"
        assert SessionState.EXPIRED.value == "expired"
        assert SessionState.DELETED.value == "deleted"


class TestSession:
    """Tests for Session class."""

    def test_to_dict(self):
        """Should convert to dictionary."""
        session = Session(
            id="test-session",
            model="llama-3.1-8b",
            cache_salt="abc123",
            state=SessionState.ACTIVE,
            token_count=1000,
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
            updated_at=datetime(2026, 1, 2, tzinfo=UTC),
            metadata={"key": "value"},
        )

        result = session.to_dict()

        assert result["id"] == "test-session"
        assert result["model"] == "llama-3.1-8b"
        assert result["cache_salt"] == "abc123"
        assert result["state"] == "active"
        assert result["token_count"] == 1000
        assert result["metadata"] == {"key": "value"}

    def test_from_row(self):
        """Should create from database row."""
        # Simulate a database row dict with all required fields
        row = {
            "id": "test-session",
            "model": "llama-3.1-8b",
            "cache_salt": "abc123",
            "state": "frozen",
            "token_count": 500,
            "created_at": "2026-01-01T00:00:00+00:00",
            "updated_at": "2026-01-02T00:00:00+00:00",
            "frozen_at": None,
            "metadata": '{"key": "value"}',
        }

        session = Session.from_row(row)

        assert session.id == "test-session"
        assert session.model == "llama-3.1-8b"
        assert session.state == SessionState.FROZEN
        assert session.metadata == {"key": "value"}


class TestWindow:
    """Tests for Window class."""

    def test_to_dict(self):
        """Should convert to dictionary."""
        window = Window(
            name="checkpoint-1",
            session_id="session-1",
            description="Test checkpoint",
            block_hashes=["h1", "h2", "h3"],
            block_count=3,
            token_count=500,
            created_at=datetime(2026, 1, 1, tzinfo=UTC),
            tags=["important", "test"],
        )

        result = window.to_dict()

        assert result["name"] == "checkpoint-1"
        assert result["session_id"] == "session-1"
        assert result["block_hashes"] == ["h1", "h2", "h3"]
        assert result["tags"] == ["important", "test"]

    def test_from_row(self):
        """Should create from database row."""
        row = {
            "name": "checkpoint-1",
            "session_id": "session-1",
            "description": "Test",
            "tags": '["tag1"]',
            "block_count": 2,
            "block_hashes": '["h1", "h2"]',
            "total_size_bytes": 1024,
            "model": "llama-3.1-8b",
            "token_count": 100,
            "created_at": "2026-01-01T00:00:00+00:00",
            "parent_window": None,
        }

        window = Window.from_row(row)

        assert window.name == "checkpoint-1"
        assert window.block_hashes == ["h1", "h2"]
        assert window.tags == ["tag1"]
        assert window.block_count == 2


class TestSessionRegistry:
    """Tests for SessionRegistry."""

    @pytest.fixture
    async def registry(self, tmp_path):
        """Create an initialized registry."""
        reg = SessionRegistry(tmp_path / "test.db")
        await reg.initialize()
        yield reg
        await reg.close()

    async def test_initialize_creates_tables(self, tmp_path):
        """Should create database tables."""
        reg = SessionRegistry(tmp_path / "test.db")
        await reg.initialize()

        # Should not raise
        sessions = await reg.list_sessions()
        assert sessions == []

        await reg.close()

    async def test_create_session(self, registry):
        """Should create a new session."""
        session = await registry.create_session(
            session_id="test-123",
            model="llama-3.1-8b",
        )

        assert session.id == "test-123"
        assert session.model == "llama-3.1-8b"
        assert session.state == SessionState.ACTIVE
        assert session.cache_salt is not None

    async def test_create_session_with_metadata(self, registry):
        """Should store custom metadata."""
        session = await registry.create_session(
            session_id="test-123",
            model="llama-3.1-8b",
            metadata={"custom": "data"},
        )

        assert session.metadata == {"custom": "data"}

    async def test_create_duplicate_session(self, registry):
        """Should raise on duplicate session ID."""
        await registry.create_session("test-123", "model")

        with pytest.raises(ValueError, match="already exists"):
            await registry.create_session("test-123", "model")

    async def test_get_session(self, registry):
        """Should retrieve existing session."""
        await registry.create_session("test-123", "model")
        session = await registry.get_session("test-123")

        assert session is not None
        assert session.id == "test-123"

    async def test_get_nonexistent_session(self, registry):
        """Should return None for nonexistent session."""
        session = await registry.get_session("nonexistent")
        assert session is None

    async def test_list_sessions(self, registry):
        """Should list all sessions."""
        await registry.create_session("s1", "model")
        await registry.create_session("s2", "model")
        await registry.create_session("s3", "model")

        sessions = await registry.list_sessions()
        assert len(sessions) == 3

    async def test_list_sessions_by_state(self, registry):
        """Should filter sessions by state."""
        await registry.create_session("s1", "model")
        await registry.create_session("s2", "model")
        await registry.update_session("s2", state=SessionState.FROZEN)

        active = await registry.list_sessions(state=SessionState.ACTIVE)
        frozen = await registry.list_sessions(state=SessionState.FROZEN)

        assert len(active) == 1
        assert len(frozen) == 1

    async def test_list_sessions_by_model(self, registry):
        """Should filter sessions by model."""
        await registry.create_session("s1", "llama-3.1-8b")
        await registry.create_session("s2", "llama-3.1-70b")
        await registry.create_session("s3", "llama-3.1-8b")

        sessions = await registry.list_sessions(model="llama-3.1-8b")
        assert len(sessions) == 2

    async def test_update_session_state(self, registry):
        """Should update session state."""
        await registry.create_session("test-123", "model")
        await registry.update_session("test-123", state=SessionState.FROZEN)

        session = await registry.get_session("test-123")
        assert session.state == SessionState.FROZEN

    async def test_invalid_state_transition(self, registry):
        """Should reject invalid state transitions."""
        await registry.create_session("test-123", "model")
        await registry.update_session("test-123", state=SessionState.DELETED)

        # Cannot transition from DELETED to ACTIVE
        with pytest.raises(InvalidStateTransitionError):
            await registry.update_session("test-123", state=SessionState.ACTIVE)

    async def test_update_nonexistent_session(self, registry):
        """Should raise for nonexistent session."""
        with pytest.raises(SessionNotFoundError):
            await registry.update_session("nonexistent", state=SessionState.FROZEN)

    async def test_update_token_count(self, registry):
        """Should update token count."""
        await registry.create_session("test-123", "model")
        await registry.update_session("test-123", token_count=1000)

        session = await registry.get_session("test-123")
        assert session.token_count == 1000

    async def test_delete_session(self, registry):
        """Should soft delete session."""
        await registry.create_session("test-123", "model")

        await registry.delete_session("test-123")

        # Session should be in DELETED state
        deleted = await registry.get_session("test-123")
        assert deleted.state == SessionState.DELETED

    async def test_create_window(self, registry):
        """Should create a window."""
        await registry.create_session("s1", "model")
        window = Window(
            name="checkpoint-1",
            session_id="s1",
            block_hashes=["h1", "h2", "h3"],
            block_count=3,
            description="Test window",
            tags=["important"],
            model="model",
            token_count=500,
        )
        created = await registry.create_window(window)

        assert created.session_id == "s1"
        assert created.name == "checkpoint-1"
        assert created.block_hashes == ["h1", "h2", "h3"]
        assert created.tags == ["important"]

    async def test_create_duplicate_window(self, registry):
        """Should raise for duplicate window name."""
        await registry.create_session("s1", "model")
        window1 = Window(name="checkpoint-1", session_id="s1")
        await registry.create_window(window1)

        window2 = Window(name="checkpoint-1", session_id="s1")
        with pytest.raises(WindowAlreadyExistsError):
            await registry.create_window(window2)

    async def test_get_window(self, registry):
        """Should retrieve window by name."""
        await registry.create_session("s1", "model")
        window = Window(name="checkpoint-1", session_id="s1")
        await registry.create_window(window)

        retrieved = await registry.get_window("checkpoint-1")
        assert retrieved is not None
        assert retrieved.name == "checkpoint-1"

    async def test_get_nonexistent_window(self, registry):
        """Should return None for nonexistent window."""
        window = await registry.get_window("nonexistent")
        assert window is None

    async def test_list_windows(self, registry):
        """Should list windows."""
        await registry.create_session("s1", "model")
        await registry.create_window(Window(name="w1", session_id="s1"))
        await registry.create_window(Window(name="w2", session_id="s1"))

        windows, total = await registry.list_windows()
        assert len(windows) == 2
        assert total == 2

    async def test_list_windows_by_session(self, registry):
        """Should filter windows by session."""
        await registry.create_session("s1", "model")
        await registry.create_session("s2", "model")
        await registry.create_window(Window(name="w1", session_id="s1"))
        await registry.create_window(Window(name="w2", session_id="s2"))

        windows, _total = await registry.list_windows(session_id="s1")
        assert len(windows) == 1
        assert windows[0].session_id == "s1"

    async def test_list_windows_by_tags(self, registry):
        """Should filter windows by tags."""
        await registry.create_session("s1", "model")
        await registry.create_window(
            Window(name="w1", session_id="s1", tags=["important"])
        )
        await registry.create_window(Window(name="w2", session_id="s1", tags=["draft"]))

        windows, _total = await registry.list_windows(tags=["important"])
        assert len(windows) == 1
        assert windows[0].name == "w1"

    async def test_delete_window(self, registry):
        """Should delete window."""
        await registry.create_session("s1", "model")
        await registry.create_window(Window(name="w1", session_id="s1"))

        await registry.delete_window("w1")

        deleted = await registry.get_window("w1")
        assert deleted is None

    async def test_delete_nonexistent_window(self, registry):
        """Should raise for nonexistent window."""
        with pytest.raises(WindowNotFoundError):
            await registry.delete_window("nonexistent")

    async def test_concurrent_operations(self, registry):
        """Should handle concurrent operations safely."""
        import asyncio

        # Create multiple sessions concurrently
        tasks = [registry.create_session(f"session-{i}", "model") for i in range(10)]
        sessions = await asyncio.gather(*tasks)

        assert len(sessions) == 10
        all_sessions = await registry.list_sessions()
        assert len(all_sessions) == 10


class TestStateTransitions:
    """Tests for session state machine."""

    @pytest.fixture
    async def registry(self, tmp_path):
        """Create an initialized registry."""
        reg = SessionRegistry(tmp_path / "test.db")
        await reg.initialize()
        yield reg
        await reg.close()

    async def test_active_to_frozen(self, registry):
        """ACTIVE -> FROZEN is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)
        session = await registry.get_session("s1")
        assert session.state == SessionState.FROZEN

    async def test_active_to_expired(self, registry):
        """ACTIVE -> EXPIRED is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.EXPIRED)
        session = await registry.get_session("s1")
        assert session.state == SessionState.EXPIRED

    async def test_active_to_deleted(self, registry):
        """ACTIVE -> DELETED is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.DELETED)
        session = await registry.get_session("s1")
        assert session.state == SessionState.DELETED

    async def test_frozen_to_thawed(self, registry):
        """FROZEN -> THAWED is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)
        await registry.update_session("s1", state=SessionState.THAWED)
        session = await registry.get_session("s1")
        assert session.state == SessionState.THAWED

    async def test_frozen_to_deleted(self, registry):
        """FROZEN -> DELETED is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)
        await registry.update_session("s1", state=SessionState.DELETED)
        session = await registry.get_session("s1")
        assert session.state == SessionState.DELETED

    async def test_thawed_to_active(self, registry):
        """THAWED -> ACTIVE is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)
        await registry.update_session("s1", state=SessionState.THAWED)
        await registry.update_session("s1", state=SessionState.ACTIVE)
        session = await registry.get_session("s1")
        assert session.state == SessionState.ACTIVE

    async def test_thawed_to_frozen(self, registry):
        """THAWED -> FROZEN is valid (re-freeze)."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)
        await registry.update_session("s1", state=SessionState.THAWED)
        await registry.update_session("s1", state=SessionState.FROZEN)
        session = await registry.get_session("s1")
        assert session.state == SessionState.FROZEN

    async def test_expired_to_deleted(self, registry):
        """EXPIRED -> DELETED is valid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.EXPIRED)
        await registry.update_session("s1", state=SessionState.DELETED)
        session = await registry.get_session("s1")
        assert session.state == SessionState.DELETED

    async def test_deleted_to_any_invalid(self, registry):
        """DELETED -> any state is invalid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.DELETED)

        for state in [
            SessionState.ACTIVE,
            SessionState.FROZEN,
            SessionState.THAWED,
            SessionState.EXPIRED,
        ]:
            with pytest.raises(InvalidStateTransitionError):
                await registry.update_session("s1", state=state)

    async def test_active_to_thawed_invalid(self, registry):
        """ACTIVE -> THAWED is invalid (must freeze first)."""
        await registry.create_session("s1", "model")

        with pytest.raises(InvalidStateTransitionError):
            await registry.update_session("s1", state=SessionState.THAWED)

    async def test_frozen_to_active_invalid(self, registry):
        """FROZEN -> ACTIVE is invalid (must thaw first)."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)

        with pytest.raises(InvalidStateTransitionError):
            await registry.update_session("s1", state=SessionState.ACTIVE)

    async def test_frozen_to_expired_invalid(self, registry):
        """FROZEN -> EXPIRED is invalid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.FROZEN)

        with pytest.raises(InvalidStateTransitionError):
            await registry.update_session("s1", state=SessionState.EXPIRED)

    async def test_expired_to_active_invalid(self, registry):
        """EXPIRED -> ACTIVE is invalid."""
        await registry.create_session("s1", "model")
        await registry.update_session("s1", state=SessionState.EXPIRED)

        with pytest.raises(InvalidStateTransitionError):
            await registry.update_session("s1", state=SessionState.ACTIVE)
