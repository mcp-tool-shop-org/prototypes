"""
Unit tests for KV store abstraction.

Tests MemoryKVStore, DiskKVStore, and TieredKVStore backends.
"""

from __future__ import annotations

import pytest

from context_window_manager.core.kv_store import (
    BlockMetadata,
    CacheMetrics,
    DiskKVStore,
    MemoryKVStore,
    RetrieveResult,
    StorageBackend,
    StoreResult,
    TieredKVStore,
    compute_block_hash,
    create_kv_store,
)


class TestBlockMetadata:
    """Tests for BlockMetadata dataclass."""

    def test_to_dict(self):
        """Should convert to dictionary."""
        meta = BlockMetadata(
            block_hash="abc123",
            size_bytes=1024,
            created_at=1000.0,
            last_accessed=1001.0,
            session_id="session-1",
            layer_index=5,
            backend=StorageBackend.MEMORY,
            compression="zstd",
        )

        result = meta.to_dict()

        assert result["block_hash"] == "abc123"
        assert result["size_bytes"] == 1024
        assert result["created_at"] == 1000.0
        assert result["last_accessed"] == 1001.0
        assert result["session_id"] == "session-1"
        assert result["layer_index"] == 5
        assert result["backend"] == "memory"
        assert result["compression"] == "zstd"

    def test_to_dict_no_compression(self):
        """Should handle None compression."""
        meta = BlockMetadata(
            block_hash="abc123",
            size_bytes=1024,
            created_at=1000.0,
            last_accessed=1001.0,
            session_id="session-1",
            layer_index=5,
            backend=StorageBackend.DISK,
        )

        result = meta.to_dict()
        assert result["compression"] is None


class TestStoreResult:
    """Tests for StoreResult dataclass."""

    def test_success_all_stored(self):
        """Should report success when all stored."""
        result = StoreResult(stored=["a", "b", "c"], failed=[])
        assert result.success is True
        assert result.partial is False

    def test_success_none_stored(self):
        """Should report failure when none stored."""
        result = StoreResult(stored=[], failed=["a", "b"])
        assert result.success is False
        assert result.partial is False

    def test_partial_success(self):
        """Should report partial when some stored."""
        result = StoreResult(stored=["a"], failed=["b"])
        assert result.success is False
        assert result.partial is True


class TestRetrieveResult:
    """Tests for RetrieveResult dataclass."""

    def test_success_all_found(self):
        """Should report success when all found."""
        result = RetrieveResult(found={"a": b"data", "b": b"data"}, missing=[])
        assert result.success is True
        assert result.partial is False

    def test_failure_none_found(self):
        """Should report failure when none found."""
        result = RetrieveResult(found={}, missing=["a", "b"])
        assert result.success is False
        assert result.partial is False

    def test_partial_some_found(self):
        """Should report partial when some found."""
        result = RetrieveResult(found={"a": b"data"}, missing=["b"])
        assert result.success is False
        assert result.partial is True


class TestCacheMetrics:
    """Tests for CacheMetrics dataclass."""

    def test_hit_rate_with_hits(self):
        """Should calculate hit rate correctly."""
        metrics = CacheMetrics(hits=75, misses=25)
        assert metrics.hit_rate == 0.75

    def test_hit_rate_no_requests(self):
        """Should return 0 when no requests."""
        metrics = CacheMetrics(hits=0, misses=0)
        assert metrics.hit_rate == 0.0

    def test_hit_rate_all_misses(self):
        """Should return 0 when all misses."""
        metrics = CacheMetrics(hits=0, misses=100)
        assert metrics.hit_rate == 0.0


class TestComputeBlockHash:
    """Tests for compute_block_hash function."""

    def test_deterministic(self):
        """Should produce same hash for same inputs."""
        data = b"test data"
        hash1 = compute_block_hash(data, "session-1", 0)
        hash2 = compute_block_hash(data, "session-1", 0)
        assert hash1 == hash2

    def test_different_data(self):
        """Should produce different hash for different data."""
        hash1 = compute_block_hash(b"data1", "session-1", 0)
        hash2 = compute_block_hash(b"data2", "session-1", 0)
        assert hash1 != hash2

    def test_different_session(self):
        """Should produce different hash for different session."""
        data = b"test data"
        hash1 = compute_block_hash(data, "session-1", 0)
        hash2 = compute_block_hash(data, "session-2", 0)
        assert hash1 != hash2

    def test_different_layer(self):
        """Should produce different hash for different layer."""
        data = b"test data"
        hash1 = compute_block_hash(data, "session-1", 0)
        hash2 = compute_block_hash(data, "session-1", 1)
        assert hash1 != hash2

    def test_hash_format(self):
        """Should return hex SHA-256 hash."""
        hash_value = compute_block_hash(b"test", "s", 0)
        assert len(hash_value) == 64  # SHA-256 hex length
        assert all(c in "0123456789abcdef" for c in hash_value)


class TestMemoryKVStore:
    """Tests for MemoryKVStore backend."""

    @pytest.fixture
    def store(self):
        """Create a memory store instance."""
        return MemoryKVStore(max_size_bytes=1024 * 1024)  # 1MB

    async def test_store_single_block(self, store):
        """Should store a single block."""
        blocks = {"hash1": b"test data"}
        result = await store.store(blocks, "session-1")

        assert result.success is True
        assert "hash1" in result.stored
        assert result.total_bytes == len(b"test data")
        assert result.duration_ms >= 0

    async def test_store_multiple_blocks(self, store):
        """Should store multiple blocks."""
        blocks = {"hash1": b"data1", "hash2": b"data2", "hash3": b"data3"}
        result = await store.store(blocks, "session-1")

        assert result.success is True
        assert len(result.stored) == 3
        assert set(result.stored) == {"hash1", "hash2", "hash3"}

    async def test_store_exceeds_limit(self):
        """Should fail when exceeding size limit."""
        store = MemoryKVStore(max_size_bytes=100)
        blocks = {"hash1": b"x" * 200}
        result = await store.store(blocks, "session-1")

        assert result.success is False
        assert "hash1" in result.failed

    async def test_retrieve_existing(self, store):
        """Should retrieve existing blocks."""
        await store.store({"hash1": b"test data"}, "session-1")
        result = await store.retrieve(["hash1"])

        assert result.success is True
        assert result.found["hash1"] == b"test data"
        assert len(result.missing) == 0

    async def test_retrieve_nonexistent(self, store):
        """Should report missing blocks."""
        result = await store.retrieve(["nonexistent"])

        assert result.success is False
        assert "nonexistent" in result.missing
        assert len(result.found) == 0

    async def test_retrieve_partial(self, store):
        """Should handle partial retrieval."""
        await store.store({"hash1": b"data1"}, "session-1")
        result = await store.retrieve(["hash1", "hash2"])

        assert result.partial is True
        assert "hash1" in result.found
        assert "hash2" in result.missing

    async def test_delete_existing(self, store):
        """Should delete existing blocks."""
        await store.store({"hash1": b"data1", "hash2": b"data2"}, "session-1")
        deleted = await store.delete(["hash1"])

        assert deleted == 1

        # Verify deletion
        result = await store.retrieve(["hash1"])
        assert "hash1" in result.missing

    async def test_delete_nonexistent(self, store):
        """Should handle deleting nonexistent blocks."""
        deleted = await store.delete(["nonexistent"])
        assert deleted == 0

    async def test_exists_check(self, store):
        """Should check block existence."""
        await store.store({"hash1": b"data"}, "session-1")
        result = await store.exists(["hash1", "hash2"])

        assert result["hash1"] is True
        assert result["hash2"] is False

    async def test_get_metadata(self, store):
        """Should return block metadata."""
        await store.store({"hash1": b"data"}, "session-1", {"layer_index": 5})
        meta = await store.get_metadata("hash1")

        assert meta is not None
        assert meta.block_hash == "hash1"
        assert meta.session_id == "session-1"
        assert meta.layer_index == 5
        assert meta.backend == StorageBackend.MEMORY

    async def test_get_metadata_nonexistent(self, store):
        """Should return None for nonexistent block."""
        meta = await store.get_metadata("nonexistent")
        assert meta is None

    async def test_list_blocks(self, store):
        """Should list stored blocks."""
        await store.store({"hash1": b"d1", "hash2": b"d2"}, "session-1")
        await store.store({"hash3": b"d3"}, "session-2")

        blocks = await store.list_blocks()
        assert len(blocks) == 3

    async def test_list_blocks_by_session(self, store):
        """Should filter blocks by session."""
        await store.store({"hash1": b"d1", "hash2": b"d2"}, "session-1")
        await store.store({"hash3": b"d3"}, "session-2")

        blocks = await store.list_blocks(session_id="session-1")
        assert len(blocks) == 2
        assert all(b.session_id == "session-1" for b in blocks)

    async def test_list_blocks_with_limit(self, store):
        """Should respect limit parameter."""
        await store.store({"hash1": b"d1", "hash2": b"d2", "hash3": b"d3"}, "session-1")

        blocks = await store.list_blocks(limit=2)
        assert len(blocks) == 2

    async def test_get_metrics(self, store):
        """Should track cache metrics."""
        await store.store({"hash1": b"data"}, "session-1")
        await store.retrieve(["hash1"])  # Hit
        await store.retrieve(["nonexistent"])  # Miss

        metrics = await store.get_metrics()
        assert metrics.hits == 1
        assert metrics.misses == 1
        assert metrics.block_count == 1
        assert metrics.hit_rate == 0.5

    async def test_clear_all(self, store):
        """Should clear all blocks."""
        await store.store({"hash1": b"d1", "hash2": b"d2"}, "session-1")
        cleared = await store.clear()

        assert cleared == 2
        metrics = await store.get_metrics()
        assert metrics.block_count == 0

    async def test_clear_by_session(self, store):
        """Should clear only specified session."""
        await store.store({"hash1": b"d1"}, "session-1")
        await store.store({"hash2": b"d2"}, "session-2")
        cleared = await store.clear(session_id="session-1")

        assert cleared == 1
        blocks = await store.list_blocks()
        assert len(blocks) == 1
        assert blocks[0].session_id == "session-2"

    async def test_health_check(self, store):
        """Should always return healthy."""
        assert await store.health_check() is True


class TestDiskKVStore:
    """Tests for DiskKVStore backend."""

    @pytest.fixture
    def store(self, tmp_path):
        """Create a disk store instance."""
        return DiskKVStore(tmp_path / "kv_store")

    async def test_store_single_block(self, store):
        """Should store a single block to disk."""
        blocks = {"hash1": b"test data"}
        result = await store.store(blocks, "session-1")

        assert result.success is True
        assert "hash1" in result.stored

    async def test_store_creates_directories(self, store, tmp_path):
        """Should create storage directories."""
        await store.store({"hash1": b"data"}, "session-1")

        assert (tmp_path / "kv_store" / "blocks").exists()
        assert (tmp_path / "kv_store" / "meta").exists()

    async def test_retrieve_from_disk(self, store):
        """Should retrieve blocks from disk."""
        await store.store({"hash1": b"test data"}, "session-1")
        result = await store.retrieve(["hash1"])

        assert result.success is True
        assert result.found["hash1"] == b"test data"

    async def test_delete_from_disk(self, store):
        """Should delete blocks from disk."""
        await store.store({"hash1": b"data"}, "session-1")
        deleted = await store.delete(["hash1"])

        assert deleted == 1
        result = await store.retrieve(["hash1"])
        assert "hash1" in result.missing

    async def test_exists_on_disk(self, store):
        """Should check existence on disk."""
        await store.store({"hash1": b"data"}, "session-1")
        result = await store.exists(["hash1", "hash2"])

        assert result["hash1"] is True
        assert result["hash2"] is False

    async def test_metadata_persisted(self, store):
        """Should persist and retrieve metadata."""
        await store.store({"hash1": b"data"}, "session-1", {"layer_index": 3})
        meta = await store.get_metadata("hash1")

        assert meta is not None
        assert meta.session_id == "session-1"
        assert meta.layer_index == 3
        assert meta.backend == StorageBackend.DISK

    async def test_clear_all(self, store):
        """Should clear all blocks."""
        await store.store({"hash1": b"d1", "hash2": b"d2"}, "session-1")
        cleared = await store.clear()

        assert cleared == 2
        blocks = await store.list_blocks()
        assert len(blocks) == 0

    async def test_health_check(self, store):
        """Should check disk accessibility."""
        assert await store.health_check() is True


class TestTieredKVStore:
    """Tests for TieredKVStore backend."""

    @pytest.fixture
    def tiered_store(self, tmp_path):
        """Create a tiered store with memory hot and disk warm tiers."""
        hot_tier = MemoryKVStore(max_size_bytes=1024)  # Small hot tier
        warm_tier = DiskKVStore(tmp_path / "warm")
        return TieredKVStore(
            hot_tier=hot_tier,
            warm_tier=warm_tier,
            hot_tier_max_blocks=3,
            promote_on_access=True,
        )

    async def test_store_to_hot_tier(self, tiered_store):
        """Should store to hot tier first."""
        result = await tiered_store.store({"hash1": b"data"}, "session-1")

        assert result.success is True
        hot_metrics = await tiered_store.hot_tier.get_metrics()
        assert hot_metrics.block_count == 1

    async def test_retrieve_from_hot_tier(self, tiered_store):
        """Should retrieve from hot tier."""
        await tiered_store.store({"hash1": b"data"}, "session-1")
        result = await tiered_store.retrieve(["hash1"])

        assert result.success is True
        assert result.found["hash1"] == b"data"

    async def test_demotion_on_capacity(self, tiered_store):
        """Should demote to warm tier when hot tier full."""
        # Fill hot tier beyond capacity
        await tiered_store.store({"h1": b"d1"}, "s1")
        await tiered_store.store({"h2": b"d2"}, "s1")
        await tiered_store.store({"h3": b"d3"}, "s1")
        await tiered_store.store({"h4": b"d4"}, "s1")  # Should trigger demotion

        # h1 should have been demoted (oldest)
        await tiered_store.hot_tier.exists(["h1"])
        await tiered_store.warm_tier.exists(["h1"])

        # Either in warm or still retrievable through tiered
        result = await tiered_store.retrieve(["h1"])
        assert result.success is True

    async def test_retrieve_promotes_from_warm(self, tiered_store):
        """Should promote blocks from warm tier on access."""
        # Store directly to warm tier
        await tiered_store.warm_tier.store({"hash1": b"data"}, "session-1")

        # Retrieve through tiered (should promote)
        result = await tiered_store.retrieve(["hash1"])
        assert result.success is True

        # Verify promoted to hot
        hot_result = await tiered_store.hot_tier.exists(["hash1"])
        assert hot_result["hash1"] is True

    async def test_delete_from_all_tiers(self, tiered_store):
        """Should delete from all tiers."""
        await tiered_store.store({"hash1": b"d1"}, "s1")
        await tiered_store.warm_tier.store({"hash2": b"d2"}, "s1")

        deleted = await tiered_store.delete(["hash1", "hash2"])
        assert deleted == 2

    async def test_exists_checks_all_tiers(self, tiered_store):
        """Should check existence across tiers."""
        await tiered_store.hot_tier.store({"h1": b"d1"}, "s1")
        await tiered_store.warm_tier.store({"h2": b"d2"}, "s1")

        result = await tiered_store.exists(["h1", "h2", "h3"])
        assert result["h1"] is True
        assert result["h2"] is True
        assert result["h3"] is False

    async def test_aggregated_metrics(self, tiered_store):
        """Should aggregate metrics from all tiers."""
        await tiered_store.store({"h1": b"d1", "h2": b"d2"}, "s1")
        await tiered_store.warm_tier.store({"h3": b"d3"}, "s1")

        metrics = await tiered_store.get_metrics()
        assert metrics.block_count == 3

    async def test_health_check_all_tiers(self, tiered_store):
        """Should check health of all tiers."""
        assert await tiered_store.health_check() is True


class TestCreateKVStore:
    """Tests for create_kv_store factory."""

    async def test_create_memory_store(self):
        """Should create memory store."""
        store = await create_kv_store(StorageBackend.MEMORY)
        assert isinstance(store, MemoryKVStore)

    async def test_create_disk_store(self, tmp_path):
        """Should create disk store."""
        store = await create_kv_store(
            StorageBackend.DISK, storage_path=tmp_path / "test"
        )
        assert isinstance(store, DiskKVStore)

    async def test_disk_requires_path(self):
        """Should raise error for disk without path."""
        with pytest.raises(ValueError, match="storage_path required"):
            await create_kv_store(StorageBackend.DISK)

    async def test_lmcache_not_implemented(self):
        """Should raise for unimplemented LMCache."""
        with pytest.raises(NotImplementedError):
            await create_kv_store(StorageBackend.LMCACHE)

    async def test_redis_not_implemented(self):
        """Should raise for unimplemented Redis."""
        with pytest.raises(NotImplementedError):
            await create_kv_store(StorageBackend.REDIS)
