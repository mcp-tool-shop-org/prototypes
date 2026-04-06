"""Atomic commit behavior tests for window metadata + blocks.

Goal:
- Partial writes must never be considered valid windows.
- Metadata-only or blocks-only states must fail closed.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock

import pytest

from context_window_manager.core.kv_store import MemoryKVStore
from context_window_manager.core.session_registry import SessionRegistry
from context_window_manager.core.storage_keys import window_metadata_key, wrap_metadata
from context_window_manager.core.window_manager import WindowManager


@pytest.mark.asyncio
async def test_metadata_without_blocks_is_invalid(tmp_path):
    """Metadata exists but referenced blocks don't - should return (expected, 0)."""
    kv = MemoryKVStore()
    registry = SessionRegistry(tmp_path / "registry.db")
    vllm = MagicMock()

    wm = WindowManager(registry=registry, kv_store=kv, vllm_client=vllm)

    window_id = "w-metadata-only"

    # Use centralized key naming and wrap with schema version
    metadata_key = window_metadata_key(window_id)
    metadata = wrap_metadata({
        "window_name": window_id,
        "block_count": 3,
        "block_hashes": ["hash-a", "hash-b", "hash-c"],
    })

    await kv.store(
        blocks={metadata_key: json.dumps(metadata).encode()},
        session_id=window_id,
    )

    expected, found = await wm._verify_stored_blocks(window_id)

    # Metadata expects 3 blocks but none exist
    assert expected == 3
    assert found == 0


@pytest.mark.asyncio
async def test_blocks_without_metadata_is_invalid(tmp_path):
    """Blocks exist but no metadata - should return (0, 0)."""
    kv = MemoryKVStore()
    registry = SessionRegistry(tmp_path / "registry.db")
    vllm = MagicMock()

    wm = WindowManager(registry=registry, kv_store=kv, vllm_client=vllm)

    window_id = "w-blocks-only"

    # Store blocks directly without metadata
    await kv.store(
        blocks={
            f"window:{window_id}:block:a": b"content-a",
            f"window:{window_id}:block:b": b"content-b",
        },
        session_id=window_id,
    )

    expected, found = await wm._verify_stored_blocks(window_id)

    # Fail closed: blocks exist but metadata missing -> (0, 0)
    assert expected == 0
    assert found == 0


@pytest.mark.asyncio
async def test_partial_block_commit_is_invalid(tmp_path):
    """Metadata references 3 blocks but only 2 exist - should detect partial state."""
    kv = MemoryKVStore()
    registry = SessionRegistry(tmp_path / "registry.db")
    vllm = MagicMock()

    wm = WindowManager(registry=registry, kv_store=kv, vllm_client=vllm)

    window_id = "w-partial"

    # Use centralized key naming and wrap with schema version
    metadata_key = window_metadata_key(window_id)
    block_hashes = ["hash-a", "hash-b", "hash-c"]
    metadata = wrap_metadata({
        "window_name": window_id,
        "block_count": 3,
        "block_hashes": block_hashes,
    })

    # Store metadata and only 2 of 3 blocks
    await kv.store(
        blocks={
            metadata_key: json.dumps(metadata).encode(),
            "hash-a": b"content-a",
            "hash-b": b"content-b",
            # hash-c intentionally missing
        },
        session_id=window_id,
    )

    expected, found = await wm._verify_stored_blocks(window_id)

    # Metadata expects 3 blocks but only 2 exist
    assert expected == 3
    assert found == 2
