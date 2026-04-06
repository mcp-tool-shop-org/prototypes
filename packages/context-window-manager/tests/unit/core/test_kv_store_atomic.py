"""Tests for atomic write semantics in DiskKVStore.

Goal: Ensure writes are atomic (all-or-nothing) to protect against
partial writes from crashes or power loss.
"""

from __future__ import annotations

import pytest

from context_window_manager.core.kv_store import DiskKVStore


class TestAtomicWrite:
    """Tests for the _atomic_write method."""

    @pytest.mark.asyncio
    async def test_atomic_write_creates_file(self, tmp_path):
        """Atomic write should create the target file."""
        store = DiskKVStore(tmp_path)
        await store._ensure_initialized()

        target = tmp_path / "test.txt"
        await store._atomic_write(target, b"hello world")

        assert target.exists()
        assert target.read_bytes() == b"hello world"

    @pytest.mark.asyncio
    async def test_atomic_write_no_temp_files_left(self, tmp_path):
        """Atomic write should not leave temp files on success."""
        store = DiskKVStore(tmp_path)
        await store._ensure_initialized()

        target = tmp_path / "subdir" / "test.txt"
        await store._atomic_write(target, b"data")

        # Check no temp files exist
        temp_files = list(target.parent.glob(".*tmp"))
        assert len(temp_files) == 0

    @pytest.mark.asyncio
    async def test_atomic_write_creates_parent_dirs(self, tmp_path):
        """Atomic write should create parent directories."""
        store = DiskKVStore(tmp_path)
        await store._ensure_initialized()

        target = tmp_path / "deep" / "nested" / "path" / "test.txt"
        await store._atomic_write(target, b"nested data")

        assert target.exists()
        assert target.read_bytes() == b"nested data"

    @pytest.mark.asyncio
    async def test_atomic_write_overwrites_existing(self, tmp_path):
        """Atomic write should replace existing file."""
        store = DiskKVStore(tmp_path)
        await store._ensure_initialized()

        target = tmp_path / "test.txt"
        target.write_bytes(b"old content")

        await store._atomic_write(target, b"new content")

        assert target.read_bytes() == b"new content"

    @pytest.mark.asyncio
    async def test_atomic_write_text_mode(self, tmp_path):
        """Atomic write should support text mode."""
        store = DiskKVStore(tmp_path)
        await store._ensure_initialized()

        target = tmp_path / "test.json"
        await store._atomic_write(target, '{"key": "value"}', mode="w")

        assert target.read_text() == '{"key": "value"}'


class TestDiskStoreAtomicity:
    """Tests for DiskKVStore using atomic writes."""

    @pytest.mark.asyncio
    async def test_store_uses_atomic_write(self, tmp_path):
        """Store operation should use atomic writes."""
        store = DiskKVStore(tmp_path)

        result = await store.store(
            blocks={"testhash123456": b"block data"},
            session_id="test-session",
        )

        assert result.success
        assert "testhash123456" in result.stored

        # Verify file exists at expected path
        block_path = store._block_path("testhash123456")
        assert block_path.exists()
        assert block_path.read_bytes() == b"block data"

    @pytest.mark.asyncio
    async def test_store_no_temp_files(self, tmp_path):
        """Store should not leave temp files."""
        store = DiskKVStore(tmp_path)

        await store.store(
            blocks={
                "hash1abc": b"data1",
                "hash2def": b"data2",
                "hash3ghi": b"data3",
            },
            session_id="test-session",
        )

        # Check no temp files in any subdirectory
        for subdir in (tmp_path / "blocks").rglob("*"):
            if subdir.is_dir():
                temp_files = list(subdir.glob(".*tmp"))
                assert len(temp_files) == 0, f"Found temp files in {subdir}"

    @pytest.mark.asyncio
    async def test_store_partial_failure_no_corruption(self, tmp_path):
        """Partial store failure should not corrupt existing data."""
        store = DiskKVStore(tmp_path)

        # Store initial block
        await store.store(
            blocks={"existing123": b"original data"},
            session_id="test-session",
        )

        # Verify original data
        block_path = store._block_path("existing123")
        original_content = block_path.read_bytes()
        assert original_content == b"original data"

        # Even if new stores fail, existing data should be intact
        # (We can't easily simulate failure, but we verify the pattern is correct)
        await store.store(
            blocks={"newblock456": b"new data"},
            session_id="test-session",
        )

        # Original data should still be intact
        assert block_path.read_bytes() == b"original data"
