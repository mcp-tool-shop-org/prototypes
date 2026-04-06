"""
Unit tests for WindowManager.

Tests the orchestration layer for freeze/thaw operations.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from context_window_manager.core.kv_store import MemoryKVStore
from context_window_manager.core.session_registry import (
    SessionRegistry,
    SessionState,
)
from context_window_manager.core.vllm_client import GenerateResponse, VLLMClient
from context_window_manager.core.window_manager import (
    CacheInfo,
    CloneResult,
    FreezeResult,
    ThawResult,
    WindowManager,
)
from context_window_manager.errors import (
    InvalidStateTransitionError,
    SessionNotFoundError,
    WindowAlreadyExistsError,
    WindowNotFoundError,
)

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
async def registry(tmp_path):
    """Create a real registry for testing."""
    reg = SessionRegistry(tmp_path / "test.db")
    await reg.initialize()
    yield reg
    await reg.close()


@pytest.fixture
def kv_store():
    """Create a memory KV store for testing."""
    return MemoryKVStore()


@pytest.fixture
def mock_vllm_client():
    """Create a mock vLLM client."""
    client = MagicMock(spec=VLLMClient)
    client.health = AsyncMock(return_value=False)
    client.model_available = AsyncMock(return_value=True)
    client.generate = AsyncMock(
        return_value=GenerateResponse(
            text="test",
            prompt_tokens=10,
            completion_tokens=1,
            total_tokens=11,
            finish_reason="stop",
            model="test-model",
        )
    )
    client.close = AsyncMock()
    return client


@pytest.fixture
def window_manager(registry, kv_store, mock_vllm_client):
    """Create a WindowManager for testing."""
    return WindowManager(
        registry=registry,
        kv_store=kv_store,
        vllm_client=mock_vllm_client,
    )


# =============================================================================
# Test FreezeResult
# =============================================================================


class TestFreezeResult:
    """Tests for FreezeResult dataclass."""

    def test_to_dict_success(self):
        """Should convert successful result to dict."""
        result = FreezeResult(
            success=True,
            window_name="test-window",
            session_id="test-session",
            block_count=5,
            total_size_bytes=1024,
            cache_salt="YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=",
            prompt_hash="abc123",
        )

        d = result.to_dict()

        assert d["success"] is True
        assert d["window_name"] == "test-window"
        assert d["session_id"] == "test-session"
        assert d["block_count"] == 5
        assert d["total_size_bytes"] == 1024
        assert d["cache_salt"].startswith("YWJjZGVmZ2hpamts")  # Truncated
        assert d["cache_salt"].endswith("...")
        assert d["prompt_hash"] == "abc123"
        assert d["error"] is None

    def test_to_dict_failure(self):
        """Should convert failed result to dict."""
        result = FreezeResult(
            success=False,
            window_name="test-window",
            session_id="test-session",
            error="Something went wrong",
        )

        d = result.to_dict()

        assert d["success"] is False
        assert d["error"] == "Something went wrong"


# =============================================================================
# Test ThawResult
# =============================================================================


class TestThawResult:
    """Tests for ThawResult dataclass."""

    def test_to_dict_success(self):
        """Should convert successful result to dict."""
        result = ThawResult(
            success=True,
            window_name="test-window",
            session_id="thaw-test-123",
            cache_salt="YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=",
            token_count=100,
            restoration_time_ms=50,
            cache_hit=True,
        )

        d = result.to_dict()

        assert d["success"] is True
        assert d["window_name"] == "test-window"
        assert d["session_id"] == "thaw-test-123"
        assert d["cache_salt"].endswith("...")
        assert d["token_count"] == 100
        assert d["restoration_time_ms"] == 50
        assert d["cache_hit"] is True


# =============================================================================
# Test CacheInfo
# =============================================================================


class TestCacheInfo:
    """Tests for CacheInfo dataclass."""

    def test_creation(self):
        """Should create CacheInfo with all fields."""
        info = CacheInfo(
            cache_salt="test-salt",
            prompt_prefix="Hello, world!",
            prompt_hash="abc123",
            token_count=100,
            block_count=7,
            block_hashes=["hash1", "hash2"],
            estimated_size_bytes=51200,
        )

        assert info.cache_salt == "test-salt"
        assert info.prompt_prefix == "Hello, world!"
        assert info.block_count == 7
        assert len(info.block_hashes) == 2


# =============================================================================
# Test WindowManager.freeze
# =============================================================================


class TestWindowManagerFreeze:
    """Tests for WindowManager.freeze operation."""

    async def test_freeze_new_session(self, window_manager, registry):
        """Should freeze a new session successfully."""
        # Create a session first
        session = await registry.create_session("test-session", "llama-3.1-8b")

        result = await window_manager.freeze(
            session_id="test-session",
            window_name="frozen-window",
            prompt_prefix="This is a test prompt.",
            description="Test freeze",
            tags=["test"],
        )

        assert result.success is True
        assert result.window_name == "frozen-window"
        assert result.session_id == "test-session"
        assert result.cache_salt == session.cache_salt
        assert result.prompt_hash is not None

        # Verify window was created
        window = await registry.get_window("frozen-window")
        assert window is not None
        assert window.description == "Test freeze"
        assert "test" in window.tags

        # Verify session state changed to FROZEN
        frozen_session = await registry.get_session("test-session")
        assert frozen_session.state == SessionState.FROZEN

    async def test_freeze_session_not_found(self, window_manager):
        """Should raise error when session doesn't exist."""
        with pytest.raises(SessionNotFoundError):
            await window_manager.freeze(
                session_id="nonexistent",
                window_name="test-window",
            )

    async def test_freeze_window_already_exists(self, window_manager, registry):
        """Should raise error when window name already exists."""
        # Create session and freeze it
        await registry.create_session("s1", "model")
        await window_manager.freeze("s1", "existing-window")

        # Create another session and try to use same window name
        await registry.create_session("s2", "model")

        with pytest.raises(WindowAlreadyExistsError):
            await window_manager.freeze("s2", "existing-window")

    async def test_freeze_invalid_state(self, window_manager, registry):
        """Should raise error when session is in invalid state."""
        # Create and delete a session
        await registry.create_session("test-session", "model")
        await registry.update_session("test-session", state=SessionState.DELETED)

        with pytest.raises(InvalidStateTransitionError):
            await window_manager.freeze("test-session", "window")

    async def test_freeze_stores_prompt_prefix(
        self, window_manager, registry, kv_store
    ):
        """Should store the prompt prefix for later retrieval."""
        await registry.create_session("test-session", "model")

        await window_manager.freeze(
            session_id="test-session",
            window_name="prompt-test",
            prompt_prefix="Hello, I am a test prompt.",
        )

        # Verify prompt was stored
        stored_prompt = await window_manager._get_stored_prompt("prompt-test")
        assert stored_prompt == "Hello, I am a test prompt."

    async def test_freeze_computes_block_info(self, window_manager, registry):
        """Should compute block count and size estimates."""
        await registry.create_session("test-session", "model", token_count=1000)

        result = await window_manager.freeze(
            session_id="test-session",
            window_name="block-test",
        )

        # With 1000 tokens and 16-token blocks, expect ~63 blocks
        assert result.block_count > 0
        assert result.total_size_bytes > 0


# =============================================================================
# Test WindowManager.thaw
# =============================================================================


class TestWindowManagerThaw:
    """Tests for WindowManager.thaw operation."""

    async def test_thaw_existing_window(self, window_manager, registry):
        """Should thaw an existing window successfully."""
        # Create and freeze a session
        original = await registry.create_session("original", "llama-3.1-8b")
        await window_manager.freeze(
            session_id="original",
            window_name="thaw-test",
            prompt_prefix="Original prompt",
        )

        # Thaw it
        result = await window_manager.thaw(
            window_name="thaw-test",
            new_session_id="restored",
            warm_cache=False,  # Skip warming for faster test
        )

        assert result.success is True
        assert result.window_name == "thaw-test"
        assert result.session_id == "restored"
        assert result.cache_salt is not None

        # Verify new session was created
        session = await registry.get_session("restored")
        assert session is not None
        assert session.state == SessionState.ACTIVE
        assert session.metadata.get("source_window") == "thaw-test"
        assert session.metadata.get("original_cache_salt") == original.cache_salt

    async def test_thaw_auto_generates_session_id(self, window_manager, registry):
        """Should auto-generate session ID when not provided."""
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "auto-id-window")

        result = await window_manager.thaw(
            window_name="auto-id-window",
            warm_cache=False,
        )

        assert result.success is True
        assert result.session_id.startswith("thaw-auto-id-window-")

    async def test_thaw_window_not_found(self, window_manager):
        """Should raise error when window doesn't exist."""
        with pytest.raises(WindowNotFoundError):
            await window_manager.thaw("nonexistent-window")

    async def test_thaw_with_cache_warming(
        self, window_manager, registry, mock_vllm_client
    ):
        """Should warm cache when requested."""
        # Setup mock to return low prompt tokens (indicating cache hit)
        mock_vllm_client.generate = AsyncMock(
            return_value=GenerateResponse(
                text="test",
                prompt_tokens=5,  # Less than token_count, indicating cache hit
                completion_tokens=1,
                total_tokens=6,
                finish_reason="stop",
                model="test-model",
            )
        )

        await registry.create_session("original", "model", token_count=100)
        await window_manager.freeze(
            "original",
            "warm-test",
            prompt_prefix="Warming prompt",
        )

        result = await window_manager.thaw(
            window_name="warm-test",
            warm_cache=True,
        )

        assert result.success is True
        assert result.cache_hit is True
        mock_vllm_client.generate.assert_called_once()

    async def test_thaw_preserves_model(self, window_manager, registry):
        """Should preserve the model from the original window."""
        await registry.create_session("original", "llama-3.1-70b")
        await window_manager.freeze("original", "model-test")

        result = await window_manager.thaw("model-test", warm_cache=False)

        session = await registry.get_session(result.session_id)
        assert session.model == "llama-3.1-70b"


# =============================================================================
# Test Internal Methods
# =============================================================================


class TestWindowManagerInternals:
    """Tests for WindowManager internal methods."""

    async def test_compute_prompt_hash(self, window_manager):
        """Should compute deterministic hash from prompt and salt."""
        hash1 = window_manager._compute_prompt_hash("test prompt", "salt1")
        hash2 = window_manager._compute_prompt_hash("test prompt", "salt1")
        hash3 = window_manager._compute_prompt_hash("test prompt", "salt2")

        assert hash1 == hash2  # Same input = same hash
        assert hash1 != hash3  # Different salt = different hash

    async def test_estimate_cache_info(self, window_manager, registry):
        """Should estimate cache info from session."""
        session = await registry.create_session("test", "model", token_count=160)

        info = window_manager._estimate_cache_info(
            session=session,
            prompt_prefix="test",
            prompt_hash="abc123",
        )

        # 160 tokens / 16 per block = 10 blocks
        assert info.block_count == 10
        assert len(info.block_hashes) == 10
        assert info.estimated_size_bytes == 160 * 512  # 160 tokens * 512 bytes

    async def test_store_and_retrieve_prompt(self, window_manager, registry):
        """Should store and retrieve prompt prefix."""
        await registry.create_session("test", "model")
        await window_manager._store_prompt_prefix(
            "test-window",
            "Hello world",
            "test-salt",
        )

        prompt = await window_manager._get_stored_prompt("test-window")
        salt = await window_manager._get_stored_cache_salt("test-window")

        assert prompt == "Hello world"
        assert salt == "test-salt"

    async def test_derive_cache_salt(self, window_manager, registry):
        """Should derive deterministic cache_salt from window metadata."""
        await registry.create_session("test", "model")
        await window_manager.freeze("test", "derive-test")

        window = await registry.get_window("derive-test")
        salt = window_manager._derive_cache_salt(window)

        # Should be base64 encoded
        assert len(salt) > 20
        # Should be deterministic
        assert salt == window_manager._derive_cache_salt(window)


# =============================================================================
# Test Phase 4 Enhancements
# =============================================================================


class TestThawEnhancements:
    """Tests for Phase 4 thaw enhancements."""

    async def test_thaw_result_has_enhanced_metrics(self, window_manager, registry):
        """ThawResult should include enhanced metrics."""
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "metrics-test", prompt_prefix="Test")

        result = await window_manager.thaw("metrics-test", warm_cache=False)

        # Check all enhanced fields are present
        assert hasattr(result, "blocks_expected")
        assert hasattr(result, "blocks_found")
        assert hasattr(result, "cache_efficiency")
        assert hasattr(result, "model_compatible")
        assert hasattr(result, "warnings")
        assert isinstance(result.warnings, list)

    async def test_thaw_with_continuation_prompt(self, window_manager, registry):
        """Should store continuation prompt in session metadata."""
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "continuation-test")

        result = await window_manager.thaw(
            "continuation-test",
            warm_cache=False,
            continuation_prompt="Continue the conversation...",
        )

        session = await registry.get_session(result.session_id)
        assert (
            session.metadata.get("continuation_prompt")
            == "Continue the conversation..."
        )

    async def test_thaw_model_compatibility_check(
        self, window_manager, registry, mock_vllm_client
    ):
        """Should check model compatibility and report warnings."""
        # Setup mock to return empty model list
        mock_vllm_client.list_models = AsyncMock(return_value=[])

        await registry.create_session("original", "llama-3.1-8b")
        await window_manager.freeze("original", "model-check-test")

        result = await window_manager.thaw("model-check-test", warm_cache=False)

        # Should succeed but with warnings
        assert result.success is True
        assert result.model_compatible is False
        assert len(result.warnings) > 0
        assert any("No models available" in w for w in result.warnings)

    async def test_thaw_model_compatibility_with_variant(
        self, window_manager, registry, mock_vllm_client
    ):
        """Should accept compatible model variants."""
        from context_window_manager.core.vllm_client import ModelInfo

        # Setup mock to return a compatible variant
        mock_vllm_client.list_models = AsyncMock(
            return_value=[ModelInfo(id="llama-3.1-8b-instruct", owned_by="test")]
        )

        await registry.create_session("original", "llama-3.1-8b")
        await window_manager.freeze("original", "variant-test")

        result = await window_manager.thaw("variant-test", warm_cache=False)

        # Should succeed with compatibility warning
        assert result.success is True
        assert result.model_compatible is True
        assert any("compatible model variant" in w.lower() for w in result.warnings)

    async def test_thaw_verify_stored_blocks(self, window_manager, registry, kv_store):
        """Should verify and report stored block counts."""
        await registry.create_session("original", "model", token_count=160)
        await window_manager.freeze(
            "original", "blocks-test", prompt_prefix="Test prompt"
        )

        result = await window_manager.thaw("blocks-test", warm_cache=False)

        # Block counts should be populated
        # With 160 tokens / 16 per block = 10 blocks expected
        assert result.blocks_expected == 10

    async def test_thaw_cache_efficiency_calculation(
        self, window_manager, registry, mock_vllm_client
    ):
        """Should calculate cache efficiency from warming response."""
        # Setup mock to simulate partial cache hit (50% efficiency)
        mock_vllm_client.generate = AsyncMock(
            return_value=GenerateResponse(
                text="test",
                prompt_tokens=50,  # Half of expected 100
                completion_tokens=1,
                total_tokens=51,
                finish_reason="stop",
                model="test-model",
            )
        )

        await registry.create_session("original", "model", token_count=100)
        await window_manager.freeze("original", "efficiency-test", prompt_prefix="Test")

        result = await window_manager.thaw("efficiency-test", warm_cache=True)

        # Cache efficiency should be ~0.5 (50% from cache)
        assert result.cache_efficiency >= 0.4
        assert result.cache_efficiency <= 0.6

    async def test_thaw_warns_on_missing_prompt(self, window_manager, registry):
        """Should add warning when no stored prompt for warming."""
        await registry.create_session("original", "model")
        # Freeze without prompt_prefix
        await window_manager.freeze("original", "no-prompt-test")

        result = await window_manager.thaw("no-prompt-test", warm_cache=True)

        assert result.success is True
        assert any("warming" in w.lower() for w in result.warnings)

    async def test_thaw_result_to_dict_includes_warnings(
        self, window_manager, registry
    ):
        """ThawResult.to_dict should include warnings when present."""
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "warnings-test")

        result = await window_manager.thaw("warnings-test", warm_cache=False)

        result_dict = result.to_dict()
        assert "blocks_expected" in result_dict
        assert "blocks_found" in result_dict
        assert "cache_efficiency" in result_dict
        assert "model_compatible" in result_dict


class TestWarmCacheResult:
    """Tests for WarmCacheResult dataclass."""

    def test_warm_cache_result_success(self):
        """Should create successful WarmCacheResult."""
        from context_window_manager.core.window_manager import WarmCacheResult

        result = WarmCacheResult(
            success=True,
            cache_hit=True,
            prompt_tokens_processed=10,
            tokens_from_cache=90,
            cache_efficiency=0.9,
        )

        assert result.success is True
        assert result.cache_hit is True
        assert result.cache_efficiency == 0.9
        assert result.error is None

    def test_warm_cache_result_failure(self):
        """Should create failed WarmCacheResult with error."""
        from context_window_manager.core.window_manager import WarmCacheResult

        result = WarmCacheResult(
            success=False,
            error="Connection failed",
        )

        assert result.success is False
        assert result.cache_hit is False
        assert result.error == "Connection failed"


# =============================================================================
# Test CloneResult
# =============================================================================


class TestCloneResult:
    """Tests for CloneResult dataclass."""

    def test_to_dict_success(self):
        """Should convert successful result to dict."""

        result = CloneResult(
            success=True,
            source_window="original-window",
            new_window_name="cloned-window",
            block_count=10,
            total_size_bytes=51200,
            lineage=["root-window", "original-window"],
        )

        d = result.to_dict()

        assert d["success"] is True
        assert d["source_window"] == "original-window"
        assert d["new_window_name"] == "cloned-window"
        assert d["block_count"] == 10
        assert d["total_size_bytes"] == 51200
        assert d["lineage"] == ["root-window", "original-window"]
        assert d["error"] is None

    def test_to_dict_failure(self):
        """Should convert failed result to dict."""

        result = CloneResult(
            success=False,
            source_window="missing-window",
            new_window_name="clone",
            error="Source window not found",
        )

        d = result.to_dict()

        assert d["success"] is False
        assert d["error"] == "Source window not found"


# =============================================================================
# Test WindowManager.clone
# =============================================================================


class TestWindowManagerClone:
    """Tests for WindowManager.clone operation."""

    async def test_clone_existing_window(self, window_manager, registry):
        """Should clone an existing window successfully."""
        # Create and freeze a session
        await registry.create_session("original", "llama-3.1-8b")
        await window_manager.freeze(
            session_id="original",
            window_name="source-window",
            prompt_prefix="Original prompt content",
            description="The source window",
            tags=["source", "test"],
        )

        # Clone it
        result = await window_manager.clone(
            source_window="source-window",
            new_window_name="cloned-window",
            description="A cloned window",
            tags=["clone", "test"],
        )

        assert result.success is True
        assert result.source_window == "source-window"
        assert result.new_window_name == "cloned-window"
        assert result.block_count > 0
        assert result.lineage == ["source-window"]

        # Verify cloned window exists
        cloned = await registry.get_window("cloned-window")
        assert cloned is not None
        assert cloned.description == "A cloned window"
        assert "clone" in cloned.tags
        assert cloned.model == "llama-3.1-8b"

    async def test_clone_preserves_prompt(self, window_manager, registry):
        """Should preserve the original prompt in cloned window."""
        await registry.create_session("original", "model")
        await window_manager.freeze(
            "original",
            "source",
            prompt_prefix="This is the original prompt",
        )

        await window_manager.clone("source", "clone")

        # Verify cloned window has the same prompt
        original_prompt = await window_manager._get_stored_prompt("source")
        cloned_prompt = await window_manager._get_stored_prompt("clone")
        assert cloned_prompt == original_prompt
        assert cloned_prompt == "This is the original prompt"

    async def test_clone_source_not_found(self, window_manager):
        """Should raise error when source window doesn't exist."""
        with pytest.raises(WindowNotFoundError):
            await window_manager.clone("nonexistent", "clone")

    async def test_clone_target_already_exists(self, window_manager, registry):
        """Should raise error when target window name already exists."""
        await registry.create_session("s1", "model")
        await window_manager.freeze("s1", "window-a")

        await registry.create_session("s2", "model")
        await window_manager.freeze("s2", "window-b")

        with pytest.raises(WindowAlreadyExistsError):
            await window_manager.clone("window-a", "window-b")

    async def test_clone_inherits_tags_when_not_specified(
        self, window_manager, registry
    ):
        """Should inherit source tags when none specified."""
        await registry.create_session("original", "model")
        await window_manager.freeze(
            "original",
            "source",
            tags=["inherited", "tags"],
        )

        result = await window_manager.clone(
            source_window="source",
            new_window_name="clone",
            # No tags specified
        )

        assert result.success is True
        cloned = await registry.get_window("clone")
        assert "inherited" in cloned.tags
        assert "tags" in cloned.tags

    async def test_clone_lineage_chain(self, window_manager, registry):
        """Should track lineage through multiple clones."""
        # Create initial window
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "gen-0")

        # First clone
        result1 = await window_manager.clone("gen-0", "gen-1")
        assert result1.lineage == ["gen-0"]

        # Second clone (from first clone)
        result2 = await window_manager.clone("gen-1", "gen-2")
        assert result2.lineage == ["gen-0", "gen-1"]

        # Third clone (from second clone)
        result3 = await window_manager.clone("gen-2", "gen-3")
        assert result3.lineage == ["gen-0", "gen-1", "gen-2"]

    async def test_clone_preserves_cache_salt(self, window_manager, registry):
        """Should preserve the original cache_salt for cache restoration."""
        session = await registry.create_session("original", "model")
        await window_manager.freeze("original", "source", prompt_prefix="test")

        await window_manager.clone("source", "clone")

        source_salt = await window_manager._get_stored_cache_salt("source")
        clone_salt = await window_manager._get_stored_cache_salt("clone")
        assert clone_salt == source_salt
        assert clone_salt == session.cache_salt

    async def test_clone_with_default_description(self, window_manager, registry):
        """Should generate default description from source name."""
        await registry.create_session("original", "model")
        await window_manager.freeze("original", "source")

        await window_manager.clone(
            source_window="source",
            new_window_name="clone",
            # No description
        )

        cloned = await registry.get_window("clone")
        assert "Clone of source" in cloned.description


# =============================================================================
# Test Auto-Freeze
# =============================================================================


class TestAutoFreezePolicy:
    """Tests for AutoFreezePolicy dataclass."""

    def test_default_values(self):
        """Should have sensible defaults."""
        from context_window_manager.core.window_manager import AutoFreezePolicy

        policy = AutoFreezePolicy()

        assert policy.enabled is False
        assert policy.token_threshold == 0.75
        assert policy.token_count_threshold == 0
        assert policy.cooldown_seconds == 60
        assert "auto-freeze" in policy.tags
        assert policy.include_prompt is True

    def test_custom_values(self):
        """Should accept custom values."""
        from context_window_manager.core.window_manager import AutoFreezePolicy

        policy = AutoFreezePolicy(
            enabled=True,
            token_threshold=0.5,
            cooldown_seconds=120,
            tags=["custom"],
        )

        assert policy.enabled is True
        assert policy.token_threshold == 0.5
        assert policy.cooldown_seconds == 120
        assert "custom" in policy.tags


class TestAutoFreezeResult:
    """Tests for AutoFreezeResult dataclass."""

    def test_to_dict_triggered(self):
        """Should convert triggered result to dict."""
        from context_window_manager.core.window_manager import AutoFreezeResult

        result = AutoFreezeResult(
            triggered=True,
            window_name="auto-session-20260123",
            session_id="session-1",
            reason="Context usage at 80%",
            token_count=100000,
            threshold_percent=0.8,
        )

        d = result.to_dict()

        assert d["triggered"] is True
        assert d["window_name"] == "auto-session-20260123"
        assert d["session_id"] == "session-1"
        assert d["threshold_percent"] == 80.0
        assert d["error"] is None

    def test_to_dict_not_triggered(self):
        """Should convert non-triggered result to dict."""
        from context_window_manager.core.window_manager import AutoFreezeResult

        result = AutoFreezeResult(
            triggered=False,
            reason="Token threshold not exceeded",
            token_count=50000,
            threshold_percent=0.4,
        )

        d = result.to_dict()

        assert d["triggered"] is False
        assert d["threshold_percent"] == 40.0


class TestAutoFreezeManager:
    """Tests for AutoFreezeManager."""

    async def test_disabled_by_default(self, window_manager, registry):
        """Should not trigger when disabled."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=False),
        )

        result = await manager.check_and_freeze("session-1", 100000)

        assert result.triggered is False
        assert "disabled" in result.reason.lower()

    async def test_triggers_at_threshold(self, window_manager, registry):
        """Should trigger when threshold exceeded."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=True, token_threshold=0.75),
            max_context_tokens=100000,
        )

        # 80% usage should trigger
        result = await manager.check_and_freeze(
            "session-1", 80000, prompt_prefix="Test prompt"
        )

        assert result.triggered is True
        assert result.window_name is not None
        assert result.threshold_percent >= 0.75

    async def test_respects_cooldown(self, window_manager, registry):
        """Should not trigger within cooldown period."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=True, cooldown_seconds=300),
            max_context_tokens=100000,
        )

        # First trigger should work
        result1 = await manager.check_and_freeze("session-1", 80000)
        assert result1.triggered is True

        # Second trigger should be blocked by cooldown
        result2 = await manager.check_and_freeze("session-1", 85000)
        assert result2.triggered is False
        assert "cooldown" in result2.reason.lower()

    async def test_absolute_token_threshold(self, window_manager, registry):
        """Should trigger on absolute token count threshold."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(
                enabled=True,
                token_threshold=0.9,  # 90% - won't trigger
                token_count_threshold=50000,  # But absolute will
            ),
            max_context_tokens=100000,
        )

        # 50% usage but absolute threshold hit
        result = await manager.check_and_freeze("session-1", 50000)

        assert result.triggered is True

    async def test_below_threshold_no_trigger(self, window_manager, registry):
        """Should not trigger when below threshold."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=True, token_threshold=0.75),
            max_context_tokens=100000,
        )

        # 50% usage should not trigger
        result = await manager.check_and_freeze("session-1", 50000)

        assert result.triggered is False
        assert "not exceeded" in result.reason.lower()

    async def test_update_policy(self, window_manager):
        """Should update policy settings."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=False),
        )

        # Update policy
        manager.update_policy(enabled=True, token_threshold=0.5)

        assert manager.policy.enabled is True
        assert manager.policy.token_threshold == 0.5

    async def test_freeze_count_tracking(self, window_manager, registry):
        """Should track freeze counts per session."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        # Create two sessions to test counting
        await registry.create_session("session-1", "model")
        await registry.create_session("session-2", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=True, cooldown_seconds=0),  # No cooldown
            max_context_tokens=100000,
        )

        assert manager.get_freeze_count("session-1") == 0
        assert manager.get_freeze_count("session-2") == 0

        # First session freeze
        result1 = await manager.check_and_freeze("session-1", 80000)
        assert result1.triggered is True
        assert manager.get_freeze_count("session-1") == 1

        # Second session freeze
        result2 = await manager.check_and_freeze("session-2", 85000)
        assert result2.triggered is True
        assert manager.get_freeze_count("session-2") == 1

        # Session-1 count should be independent
        assert manager.get_freeze_count("session-1") == 1

    async def test_reset_session(self, window_manager, registry):
        """Should reset tracking for a session."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("session-1", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(enabled=True, cooldown_seconds=0),
            max_context_tokens=100000,
        )

        await manager.check_and_freeze("session-1", 80000)
        assert manager.get_freeze_count("session-1") == 1

        manager.reset_session("session-1")
        assert manager.get_freeze_count("session-1") == 0

    async def test_window_naming_pattern(self, window_manager, registry):
        """Should generate window names from pattern."""
        from context_window_manager.core.window_manager import (
            AutoFreezeManager,
            AutoFreezePolicy,
        )

        await registry.create_session("my-session", "model")

        manager = AutoFreezeManager(
            window_manager=window_manager,
            policy=AutoFreezePolicy(
                enabled=True,
                window_name_pattern="backup-{session_id}-{count}",
            ),
            max_context_tokens=100000,
        )

        result = await manager.check_and_freeze("my-session", 80000)

        assert result.triggered is True
        assert "backup-my-session-1" in result.window_name
