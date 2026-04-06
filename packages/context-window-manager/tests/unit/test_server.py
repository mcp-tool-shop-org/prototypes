"""
Unit tests for MCP Server.

Tests tool implementations, resources, and server lifecycle.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from context_window_manager.config import Settings, StorageConfig, VLLMConfig
from context_window_manager.core.kv_store import MemoryKVStore
from context_window_manager.core.session_registry import (
    SessionRegistry,
    SessionState,
)
from context_window_manager.core.vllm_client import CacheStats, VLLMClient
from context_window_manager.core.window_manager import (
    AutoFreezeManager,
    AutoFreezePolicy,
    WindowManager,
)
from context_window_manager.errors import (
    SessionNotFoundError,
    WindowAlreadyExistsError,
    WindowNotFoundError,
)
from context_window_manager.server import (
    ServerState,
    cache_stats,
    get_state,
    session_list,
    window_delete,
    window_freeze,
    window_list,
    window_status,
    window_thaw,
)

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_settings(tmp_path):
    """Create mock settings."""
    return Settings(
        db_path=tmp_path / "test.db",
        vllm=VLLMConfig(url="http://localhost:8000"),
        storage=StorageConfig(enable_disk=False),
    )


@pytest.fixture
async def mock_registry(tmp_path):
    """Create a real registry for testing."""
    registry = SessionRegistry(tmp_path / "test.db")
    await registry.initialize()
    yield registry
    await registry.close()


@pytest.fixture
def mock_kv_store():
    """Create a memory KV store for testing."""
    return MemoryKVStore()


@pytest.fixture
def mock_vllm_client():
    """Create a mock vLLM client."""
    client = MagicMock(spec=VLLMClient)
    client.health = AsyncMock(return_value=False)
    client.get_cache_stats = AsyncMock(return_value=CacheStats())
    client.close = AsyncMock()
    return client


@pytest.fixture
def mock_window_manager(mock_registry, mock_kv_store, mock_vllm_client):
    """Create a WindowManager for testing."""
    return WindowManager(
        registry=mock_registry,
        kv_store=mock_kv_store,
        vllm_client=mock_vllm_client,
    )


@pytest.fixture
def mock_auto_freeze_manager(mock_window_manager):
    """Create an AutoFreezeManager for testing."""
    return AutoFreezeManager(
        window_manager=mock_window_manager,
        policy=AutoFreezePolicy(enabled=False),
        max_context_tokens=128000,
    )


@pytest.fixture
def mock_health_checker():
    """Create a mock HealthChecker for testing."""
    from context_window_manager.monitoring import HealthChecker

    return HealthChecker(version="0.6.0-test")


@pytest.fixture
def server_state(
    mock_settings,
    mock_registry,
    mock_kv_store,
    mock_vllm_client,
    mock_window_manager,
    mock_auto_freeze_manager,
    mock_health_checker,
):
    """Create a server state for testing."""
    return ServerState(
        settings=mock_settings,
        registry=mock_registry,
        kv_store=mock_kv_store,
        vllm_client=mock_vllm_client,
        window_manager=mock_window_manager,
        auto_freeze_manager=mock_auto_freeze_manager,
        health_checker=mock_health_checker,
    )


@pytest.fixture
def patch_state(server_state):
    """Patch the global state for tool testing."""
    import context_window_manager.server as server_module

    original_state = server_module._state
    server_module._state = server_state
    yield server_state
    server_module._state = original_state


# =============================================================================
# Test get_state
# =============================================================================


class TestGetState:
    """Tests for get_state function."""

    def test_raises_when_not_initialized(self):
        """Should raise RuntimeError when state is None."""
        import context_window_manager.server as server_module

        original = server_module._state
        server_module._state = None

        try:
            with pytest.raises(RuntimeError, match="Server not initialized"):
                get_state()
        finally:
            server_module._state = original

    def test_returns_state_when_initialized(self, patch_state):
        """Should return state when initialized."""
        state = get_state()
        assert state is patch_state


# =============================================================================
# Test window_freeze
# =============================================================================


class TestWindowFreeze:
    """Tests for window_freeze tool."""

    async def test_freeze_new_session(self, patch_state):
        """Should create session and window when freezing new session."""
        result = await window_freeze(
            session_id="test-session",
            window_name="test-window",
            description="Test freeze",
            tags=["test", "unit"],
        )

        assert result["success"] is True
        assert result["window_name"] == "test-window"
        assert result["session_id"] == "test-session"
        assert result["tags"] == ["test", "unit"]

        # Verify window was created
        window = await patch_state.registry.get_window("test-window")
        assert window is not None
        assert window.description == "Test freeze"

        # Verify session state
        session = await patch_state.registry.get_session("test-session")
        assert session.state == SessionState.FROZEN

    async def test_freeze_existing_session(self, patch_state):
        """Should freeze existing session."""
        # Create session first
        await patch_state.registry.create_session("existing-session", "llama-3.1-8b")

        result = await window_freeze(
            session_id="existing-session",
            window_name="existing-window",
        )

        assert result["success"] is True
        assert result["session_id"] == "existing-session"

    async def test_freeze_duplicate_window_raises(self, patch_state):
        """Should raise error when window name already exists."""
        # Create first window
        await window_freeze(
            session_id="session1",
            window_name="duplicate-name",
        )

        # Try to create duplicate
        with pytest.raises(WindowAlreadyExistsError):
            await window_freeze(
                session_id="session2",
                window_name="duplicate-name",
            )


# =============================================================================
# Test window_thaw
# =============================================================================


class TestWindowThaw:
    """Tests for window_thaw tool."""

    async def test_thaw_existing_window(self, patch_state):
        """Should thaw an existing window."""
        # First freeze a window
        await window_freeze(
            session_id="original-session",
            window_name="thaw-test",
            description="Window to thaw",
        )

        # Thaw it
        result = await window_thaw(
            window_name="thaw-test",
            new_session_id="restored-session",
        )

        assert result["success"] is True
        assert result["window_name"] == "thaw-test"
        assert result["session_id"] == "restored-session"
        assert result["cache_salt"] is not None

        # Verify new session was created (starts as ACTIVE, metadata tracks thaw source)
        session = await patch_state.registry.get_session("restored-session")
        assert session is not None
        assert session.state == SessionState.ACTIVE
        assert session.metadata.get("source_window") == "thaw-test"

    async def test_thaw_auto_generates_session_id(self, patch_state):
        """Should auto-generate session ID when not provided."""
        await window_freeze(
            session_id="original",
            window_name="auto-id-test",
        )

        result = await window_thaw(window_name="auto-id-test")

        assert result["success"] is True
        assert "thaw-auto-id-test" in result["session_id"]

    async def test_thaw_nonexistent_window_raises(self, patch_state):
        """Should raise error when window doesn't exist."""
        with pytest.raises(WindowNotFoundError):
            await window_thaw(window_name="nonexistent")


# =============================================================================
# Test window_list
# =============================================================================


class TestWindowList:
    """Tests for window_list tool."""

    async def test_list_empty(self, patch_state):
        """Should return empty list when no windows exist."""
        result = await window_list()

        assert result["success"] is True
        assert result["windows"] == []
        assert result["total"] == 0

    async def test_list_multiple_windows(self, patch_state):
        """Should list multiple windows."""
        await window_freeze("s1", "window-1", tags=["tag1"])
        await window_freeze("s2", "window-2", tags=["tag2"])
        await window_freeze("s3", "window-3", tags=["tag1", "tag2"])

        result = await window_list()

        assert result["success"] is True
        assert len(result["windows"]) == 3
        assert result["total"] == 3

    async def test_list_with_tag_filter(self, patch_state):
        """Should filter by tags."""
        await window_freeze("s1", "w1", tags=["important"])
        await window_freeze("s2", "w2", tags=["draft"])

        result = await window_list(tags=["important"])

        assert len(result["windows"]) == 1
        assert result["windows"][0]["name"] == "w1"

    async def test_list_with_limit(self, patch_state):
        """Should respect limit parameter and return pagination info."""
        for i in range(5):
            await window_freeze(f"s{i}", f"w{i}")

        result = await window_list(limit=2)

        assert len(result["windows"]) == 2
        assert result["total"] == 5
        assert result["has_next"] is True
        assert result["has_prev"] is False
        assert result["page"] == 1
        assert result["total_pages"] == 3


# =============================================================================
# Test window_status
# =============================================================================


class TestWindowStatus:
    """Tests for window_status tool."""

    async def test_status_for_window(self, patch_state):
        """Should return window status."""
        await window_freeze("session", "status-test", description="Test")

        result = await window_status(window_name="status-test")

        assert result["success"] is True
        assert result["type"] == "window"
        assert result["window"]["name"] == "status-test"

    async def test_status_for_session(self, patch_state):
        """Should return session status."""
        await patch_state.registry.create_session("session-status", "model")

        result = await window_status(session_id="session-status")

        assert result["success"] is True
        assert result["type"] == "session"
        assert result["session"]["id"] == "session-status"

    async def test_status_both_params_error(self, patch_state):
        """Should return error when both params provided."""
        result = await window_status(
            window_name="window",
            session_id="session",
        )

        assert result["success"] is False
        assert "not both" in result["error"]

    async def test_status_no_params_error(self, patch_state):
        """Should return error when no params provided."""
        result = await window_status()

        assert result["success"] is False
        assert "Provide either" in result["error"]

    async def test_status_nonexistent_window_raises(self, patch_state):
        """Should raise error for nonexistent window."""
        with pytest.raises(WindowNotFoundError):
            await window_status(window_name="nonexistent")

    async def test_status_nonexistent_session_raises(self, patch_state):
        """Should raise error for nonexistent session."""
        with pytest.raises(SessionNotFoundError):
            await window_status(session_id="nonexistent")


# =============================================================================
# Test window_delete
# =============================================================================


class TestWindowDelete:
    """Tests for window_delete tool."""

    async def test_delete_window(self, patch_state):
        """Should delete an existing window."""
        await window_freeze("session", "delete-me")

        result = await window_delete(window_name="delete-me")

        assert result["success"] is True
        assert result["window_name"] == "delete-me"

        # Verify window is gone
        window = await patch_state.registry.get_window("delete-me")
        assert window is None

    async def test_delete_nonexistent_raises(self, patch_state):
        """Should raise error for nonexistent window."""
        with pytest.raises(WindowNotFoundError):
            await window_delete(window_name="nonexistent")


# =============================================================================
# Test session_list
# =============================================================================


class TestSessionList:
    """Tests for session_list tool."""

    async def test_list_empty(self, patch_state):
        """Should return empty list when no sessions exist."""
        result = await session_list()

        assert result["success"] is True
        assert result["sessions"] == []
        assert result["count"] == 0

    async def test_list_multiple_sessions(self, patch_state):
        """Should list multiple sessions."""
        await patch_state.registry.create_session("s1", "model1")
        await patch_state.registry.create_session("s2", "model2")

        result = await session_list()

        assert result["success"] is True
        assert result["count"] == 2

    async def test_list_with_state_filter(self, patch_state):
        """Should filter by state."""
        await patch_state.registry.create_session("active1", "model")
        await patch_state.registry.create_session("frozen1", "model")
        await patch_state.registry.update_session("frozen1", state=SessionState.FROZEN)

        result = await session_list(state_filter="frozen")

        assert result["count"] == 1
        assert result["sessions"][0]["state"] == "frozen"

    async def test_list_invalid_state_filter(self, patch_state):
        """Should return error for invalid state."""
        result = await session_list(state_filter="invalid")

        assert result["success"] is False
        assert "Invalid state" in result["error"]


# =============================================================================
# Test cache_stats
# =============================================================================


class TestCacheStats:
    """Tests for cache_stats tool."""

    async def test_cache_stats_basic(self, patch_state):
        """Should return cache statistics."""
        result = await cache_stats()

        assert result["success"] is True
        assert "kv_store" in result
        assert "vllm" in result
        assert result["kv_store"]["total_blocks"] == 0

    async def test_cache_stats_with_vllm_connected(self, patch_state):
        """Should include vLLM stats when connected."""
        patch_state.vllm_client.health = AsyncMock(return_value=True)
        patch_state.vllm_client.get_cache_stats = AsyncMock(
            return_value=CacheStats(hit_rate=0.85, num_cached_tokens=5000)
        )

        result = await cache_stats()

        assert result["vllm"]["connected"] is True
        assert result["vllm"]["hit_rate"] == 0.85
        assert result["vllm"]["cached_tokens"] == 5000
