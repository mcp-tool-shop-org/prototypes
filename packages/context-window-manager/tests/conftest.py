"""
Shared pytest fixtures for Context Window Manager tests.

This module provides common fixtures used across unit, integration,
and end-to-end tests.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock

import pytest

if TYPE_CHECKING:
    from pathlib import Path
    pass


# =============================================================================
# Path Fixtures
# =============================================================================


@pytest.fixture
def temp_db(tmp_path: Path) -> Path:
    """Temporary database file for testing."""
    return tmp_path / "test.db"


@pytest.fixture
def temp_storage(tmp_path: Path) -> Path:
    """Temporary storage directory for testing."""
    storage_path = tmp_path / "storage"
    storage_path.mkdir()
    return storage_path


# =============================================================================
# Configuration Fixtures
# =============================================================================


@pytest.fixture
def test_vllm_config():
    """Test vLLM configuration."""
    from context_window_manager.config import VLLMConfig

    return VLLMConfig(
        url="http://localhost:8000",
        timeout=5.0,
        max_connections=5,
    )


@pytest.fixture
def test_storage_config(temp_storage: Path):
    """Test storage configuration."""
    from context_window_manager.config import StorageConfig

    return StorageConfig(
        enable_cpu=True,
        cpu_max_gb=1.0,
        enable_disk=True,
        disk_path=temp_storage,
        disk_max_gb=1.0,
        compression=False,
    )


@pytest.fixture
def test_settings(test_vllm_config, test_storage_config, temp_db):
    """Complete test settings."""
    from context_window_manager.config import Settings

    return Settings(
        db_path=temp_db,
        log_level="DEBUG",
        vllm=test_vllm_config,
        storage=test_storage_config,
    )


# =============================================================================
# Mock Fixtures
# =============================================================================


@pytest.fixture
def mock_vllm_client() -> AsyncMock:
    """Mock vLLM client for unit tests."""
    from context_window_manager.core.vllm_client import GenerateResponse

    client = AsyncMock()

    # Default successful response
    client.generate.return_value = GenerateResponse(
        text="test output",
        prompt_tokens=100,
        completion_tokens=10,
        total_tokens=110,
        finish_reason="stop",
        model="llama-3.1-8b",
    )

    client.health.return_value = True
    client.model_available.return_value = True

    return client


@pytest.fixture
def mock_kv_store() -> AsyncMock:
    """Mock KV store for unit tests."""
    from context_window_manager.core.kv_store import RetrieveResult, StoreResult

    store = AsyncMock()

    # Default successful responses
    store.store.return_value = StoreResult(
        stored=["hash1", "hash2", "hash3"],
        failed=[],
        total_bytes=3000,
        duration_ms=10.0,
    )

    store.retrieve.return_value = RetrieveResult(
        found={"hash1": b"data1", "hash2": b"data2"},
        missing=[],
        duration_ms=5.0,
    )

    store.health_check.return_value = True

    return store


@pytest.fixture
def mock_session_registry() -> AsyncMock:
    """Mock session registry for unit tests."""
    registry = AsyncMock()

    # Default responses
    registry.get_session.return_value = None
    registry.get_window.return_value = None
    registry.list_sessions.return_value = []
    registry.list_windows.return_value = []

    return registry


# =============================================================================
# Sample Data Fixtures
# =============================================================================


@pytest.fixture
def sample_session_id() -> str:
    """Valid sample session ID."""
    return "test-session-123"


@pytest.fixture
def sample_window_name() -> str:
    """Valid sample window name."""
    return "my-test-window"


@pytest.fixture
def sample_block_hashes() -> list[str]:
    """Sample KV cache block hashes."""
    return [
        "a" * 64,
        "b" * 64,
        "c" * 64,
    ]


@pytest.fixture
def sample_block_data() -> dict[str, bytes]:
    """Sample KV cache block data."""
    return {
        "a" * 64: b"block data 1" * 100,
        "b" * 64: b"block data 2" * 100,
        "c" * 64: b"block data 3" * 100,
    }


# =============================================================================
# Integration Test Markers
# =============================================================================


def pytest_configure(config: pytest.Config) -> None:
    """Register custom markers."""
    config.addinivalue_line(
        "markers",
        "integration: marks tests requiring external services (vLLM, LMCache)",
    )
    config.addinivalue_line(
        "markers",
        "benchmark: marks performance benchmark tests",
    )
    config.addinivalue_line(
        "markers",
        "slow: marks tests as slow running",
    )


def pytest_collection_modifyitems(
    config: pytest.Config,
    items: list[pytest.Item],
) -> None:
    """Skip integration tests unless --run-integration is passed."""
    if not config.getoption("--run-integration", default=False):
        skip_integration = pytest.mark.skip(
            reason="Need --run-integration option to run"
        )
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)


def pytest_addoption(parser: pytest.Parser) -> None:
    """Add custom command-line options."""
    parser.addoption(
        "--run-integration",
        action="store_true",
        default=False,
        help="Run integration tests",
    )
    parser.addoption(
        "--benchmark",
        action="store_true",
        default=False,
        help="Run benchmark tests",
    )
