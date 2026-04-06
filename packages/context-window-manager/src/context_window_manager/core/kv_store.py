"""
KV Store abstraction for Context Window Manager.

Provides a unified interface for KV cache storage operations,
with support for multiple backends (LMCache, local disk, Redis).
"""

from __future__ import annotations

import abc
import asyncio
import contextlib
import hashlib
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import TYPE_CHECKING, Any

import aiofiles
import aiofiles.os
import structlog

if TYPE_CHECKING:
    from collections.abc import Sequence

logger = structlog.get_logger()


class StorageBackend(str, Enum):
    """Available storage backends."""

    MEMORY = "memory"
    DISK = "disk"
    LMCACHE = "lmcache"
    REDIS = "redis"


@dataclass
class BlockMetadata:
    """Metadata for a stored KV cache block."""

    block_hash: str
    size_bytes: int
    created_at: float
    last_accessed: float
    session_id: str
    layer_index: int
    backend: StorageBackend
    compression: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "block_hash": self.block_hash,
            "size_bytes": self.size_bytes,
            "created_at": self.created_at,
            "last_accessed": self.last_accessed,
            "session_id": self.session_id,
            "layer_index": self.layer_index,
            "backend": self.backend.value,
            "compression": self.compression,
        }


@dataclass
class StoreResult:
    """Result of a store operation."""

    stored: list[str]  # Successfully stored block hashes
    failed: list[str]  # Failed block hashes
    total_bytes: int = 0
    duration_ms: float = 0.0

    @property
    def success(self) -> bool:
        """Whether all blocks were stored successfully."""
        return len(self.failed) == 0

    @property
    def partial(self) -> bool:
        """Whether some blocks were stored."""
        return len(self.stored) > 0 and len(self.failed) > 0


@dataclass
class RetrieveResult:
    """Result of a retrieve operation."""

    found: dict[str, bytes]  # block_hash -> data
    missing: list[str]  # Block hashes not found
    duration_ms: float = 0.0

    @property
    def success(self) -> bool:
        """Whether all requested blocks were found."""
        return len(self.missing) == 0

    @property
    def partial(self) -> bool:
        """Whether some blocks were found."""
        return len(self.found) > 0 and len(self.missing) > 0


@dataclass
class CacheMetrics:
    """Cache performance metrics."""

    hits: int = 0
    misses: int = 0
    total_bytes_stored: int = 0
    total_bytes_retrieved: int = 0
    block_count: int = 0
    evictions: int = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


class KVStoreBackend(abc.ABC):
    """Abstract base class for KV store backends."""

    @abc.abstractmethod
    async def store(
        self,
        blocks: dict[str, bytes],
        session_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> StoreResult:
        """
        Store KV cache blocks.

        Args:
            blocks: Mapping of block_hash -> block_data.
            session_id: Session these blocks belong to.
            metadata: Optional additional metadata.

        Returns:
            StoreResult with operation details.
        """
        ...

    @abc.abstractmethod
    async def retrieve(
        self,
        block_hashes: Sequence[str],
    ) -> RetrieveResult:
        """
        Retrieve KV cache blocks by hash.

        Args:
            block_hashes: List of block hashes to retrieve.

        Returns:
            RetrieveResult with found blocks and missing hashes.
        """
        ...

    @abc.abstractmethod
    async def delete(
        self,
        block_hashes: Sequence[str],
    ) -> int:
        """
        Delete KV cache blocks.

        Args:
            block_hashes: List of block hashes to delete.

        Returns:
            Number of blocks deleted.
        """
        ...

    @abc.abstractmethod
    async def exists(
        self,
        block_hashes: Sequence[str],
    ) -> dict[str, bool]:
        """
        Check if blocks exist.

        Args:
            block_hashes: List of block hashes to check.

        Returns:
            Mapping of block_hash -> exists.
        """
        ...

    @abc.abstractmethod
    async def get_metadata(
        self,
        block_hash: str,
    ) -> BlockMetadata | None:
        """
        Get metadata for a block.

        Args:
            block_hash: The block hash.

        Returns:
            BlockMetadata if found, None otherwise.
        """
        ...

    @abc.abstractmethod
    async def list_blocks(
        self,
        session_id: str | None = None,
        limit: int = 100,
    ) -> list[BlockMetadata]:
        """
        List stored blocks.

        Args:
            session_id: Optional filter by session.
            limit: Maximum number of blocks to return.

        Returns:
            List of BlockMetadata.
        """
        ...

    @abc.abstractmethod
    async def get_metrics(self) -> CacheMetrics:
        """Get cache performance metrics."""
        ...

    @abc.abstractmethod
    async def clear(self, session_id: str | None = None) -> int:
        """
        Clear stored blocks.

        Args:
            session_id: Optional filter - only clear this session's blocks.

        Returns:
            Number of blocks cleared.
        """
        ...

    @abc.abstractmethod
    async def health_check(self) -> bool:
        """Check if backend is healthy and accessible."""
        ...


class MemoryKVStore(KVStoreBackend):
    """
    In-memory KV store backend.

    Useful for testing and development. Not persistent across restarts.
    """

    def __init__(self, max_size_bytes: int = 1024 * 1024 * 1024):  # 1GB default
        """
        Initialize memory store.

        Args:
            max_size_bytes: Maximum total size of stored data.
        """
        self.max_size_bytes = max_size_bytes
        self._blocks: dict[str, bytes] = {}
        self._metadata: dict[str, BlockMetadata] = {}
        self._metrics = CacheMetrics()
        self._lock = asyncio.Lock()

    async def store(
        self,
        blocks: dict[str, bytes],
        session_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> StoreResult:
        """Store blocks in memory."""
        start = time.monotonic()
        stored = []
        failed = []
        total_bytes = 0

        async with self._lock:
            for block_hash, data in blocks.items():
                # Check size limit
                if self._metrics.total_bytes_stored + len(data) > self.max_size_bytes:
                    failed.append(block_hash)
                    continue

                self._blocks[block_hash] = data
                self._metadata[block_hash] = BlockMetadata(
                    block_hash=block_hash,
                    size_bytes=len(data),
                    created_at=time.time(),
                    last_accessed=time.time(),
                    session_id=session_id,
                    layer_index=metadata.get("layer_index", 0) if metadata else 0,
                    backend=StorageBackend.MEMORY,
                )
                self._metrics.total_bytes_stored += len(data)
                self._metrics.block_count += 1
                stored.append(block_hash)
                total_bytes += len(data)

        duration = (time.monotonic() - start) * 1000
        return StoreResult(
            stored=stored,
            failed=failed,
            total_bytes=total_bytes,
            duration_ms=duration,
        )

    async def retrieve(
        self,
        block_hashes: Sequence[str],
    ) -> RetrieveResult:
        """Retrieve blocks from memory."""
        start = time.monotonic()
        found = {}
        missing = []

        async with self._lock:
            for block_hash in block_hashes:
                if block_hash in self._blocks:
                    found[block_hash] = self._blocks[block_hash]
                    self._metadata[block_hash].last_accessed = time.time()
                    self._metrics.hits += 1
                    self._metrics.total_bytes_retrieved += len(self._blocks[block_hash])
                else:
                    missing.append(block_hash)
                    self._metrics.misses += 1

        duration = (time.monotonic() - start) * 1000
        return RetrieveResult(
            found=found,
            missing=missing,
            duration_ms=duration,
        )

    async def delete(
        self,
        block_hashes: Sequence[str],
    ) -> int:
        """Delete blocks from memory."""
        deleted = 0
        async with self._lock:
            for block_hash in block_hashes:
                if block_hash in self._blocks:
                    size = len(self._blocks[block_hash])
                    del self._blocks[block_hash]
                    del self._metadata[block_hash]
                    self._metrics.total_bytes_stored -= size
                    self._metrics.block_count -= 1
                    deleted += 1
        return deleted

    async def exists(
        self,
        block_hashes: Sequence[str],
    ) -> dict[str, bool]:
        """Check if blocks exist in memory."""
        async with self._lock:
            return {h: h in self._blocks for h in block_hashes}

    async def get_metadata(
        self,
        block_hash: str,
    ) -> BlockMetadata | None:
        """Get block metadata."""
        async with self._lock:
            return self._metadata.get(block_hash)

    async def list_blocks(
        self,
        session_id: str | None = None,
        limit: int = 100,
    ) -> list[BlockMetadata]:
        """List stored blocks."""
        async with self._lock:
            blocks = list(self._metadata.values())
            if session_id:
                blocks = [b for b in blocks if b.session_id == session_id]
            return blocks[:limit]

    async def get_metrics(self) -> CacheMetrics:
        """Get cache metrics."""
        async with self._lock:
            return CacheMetrics(
                hits=self._metrics.hits,
                misses=self._metrics.misses,
                total_bytes_stored=self._metrics.total_bytes_stored,
                total_bytes_retrieved=self._metrics.total_bytes_retrieved,
                block_count=self._metrics.block_count,
                evictions=self._metrics.evictions,
            )

    async def clear(self, session_id: str | None = None) -> int:
        """Clear stored blocks."""
        async with self._lock:
            if session_id:
                to_delete = [
                    h for h, m in self._metadata.items() if m.session_id == session_id
                ]
                for h in to_delete:
                    size = len(self._blocks[h])
                    del self._blocks[h]
                    del self._metadata[h]
                    self._metrics.total_bytes_stored -= size
                    self._metrics.block_count -= 1
                return len(to_delete)
            else:
                count = len(self._blocks)
                self._blocks.clear()
                self._metadata.clear()
                self._metrics = CacheMetrics()
                return count

    async def health_check(self) -> bool:
        """Memory store is always healthy."""
        return True


class DiskKVStore(KVStoreBackend):
    """
    Disk-based KV store backend.

    Stores blocks as files in a directory structure.
    Suitable for larger caches that don't fit in memory.
    """

    def __init__(
        self,
        storage_path: Path,
        max_size_bytes: int = 10 * 1024 * 1024 * 1024,  # 10GB default
    ):
        """
        Initialize disk store.

        Args:
            storage_path: Directory for storing blocks.
            max_size_bytes: Maximum total storage size.
        """
        self.storage_path = Path(storage_path)
        self.max_size_bytes = max_size_bytes
        self._metrics = CacheMetrics()
        self._lock = asyncio.Lock()
        self._initialized = False

    async def _ensure_initialized(self) -> None:
        """Ensure storage directory exists."""
        if not self._initialized:
            await aiofiles.os.makedirs(self.storage_path, exist_ok=True)
            await aiofiles.os.makedirs(self.storage_path / "blocks", exist_ok=True)
            await aiofiles.os.makedirs(self.storage_path / "meta", exist_ok=True)
            self._initialized = True

    def _block_path(self, block_hash: str) -> Path:
        """Get file path for a block."""
        # Use first 2 chars as subdirectory for better filesystem performance
        subdir = block_hash[:2]
        return self.storage_path / "blocks" / subdir / block_hash

    def _meta_path(self, block_hash: str) -> Path:
        """Get file path for block metadata."""
        subdir = block_hash[:2]
        return self.storage_path / "meta" / subdir / f"{block_hash}.json"

    async def _atomic_write(self, path: Path, data: bytes | str, mode: str = "wb") -> None:
        """
        Write data atomically using temp file + rename pattern.

        This ensures that either the full file is written or nothing is,
        protecting against partial writes from crashes or power loss.

        Steps:
        1. Write to a temp file in the same directory
        2. Flush and fsync the file
        3. Rename atomically to final path
        """
        import os
        import uuid

        # Ensure parent directory exists
        await aiofiles.os.makedirs(path.parent, exist_ok=True)

        # Create temp file in same directory (required for atomic rename)
        temp_path = path.parent / f".{path.name}.{uuid.uuid4().hex[:8]}.tmp"

        try:
            # Write to temp file
            async with aiofiles.open(temp_path, mode) as f:  # type: ignore[call-overload]
                if isinstance(data, str):
                    await f.write(data)
                else:
                    await f.write(data)
                # Flush to OS buffer
                await f.flush()
                # Sync to disk (critical for durability)
                os.fsync(f.fileno())

            # Atomic rename (POSIX guarantees this is atomic on same filesystem)
            # On Windows, this may fail if target exists, so we remove first
            if os.name == "nt" and path.exists():
                await aiofiles.os.remove(path)
            await aiofiles.os.rename(temp_path, path)

        except Exception:
            # Clean up temp file on failure
            with contextlib.suppress(OSError):
                await aiofiles.os.remove(temp_path)
            raise

    async def store(
        self,
        blocks: dict[str, bytes],
        session_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> StoreResult:
        """
        Store blocks to disk atomically.

        Each block is written atomically using temp file + rename pattern.
        This ensures that either a block is fully written or not at all,
        protecting against partial writes from crashes or power loss.
        """
        import json

        await self._ensure_initialized()
        start = time.monotonic()
        stored = []
        failed = []
        total_bytes = 0

        for block_hash, data in blocks.items():
            try:
                block_path = self._block_path(block_hash)
                meta_path = self._meta_path(block_hash)

                # Prepare metadata
                block_meta = BlockMetadata(
                    block_hash=block_hash,
                    size_bytes=len(data),
                    created_at=time.time(),
                    last_accessed=time.time(),
                    session_id=session_id,
                    layer_index=metadata.get("layer_index", 0) if metadata else 0,
                    backend=StorageBackend.DISK,
                )

                # Write block data atomically
                await self._atomic_write(block_path, data, mode="wb")

                # Write metadata atomically
                await self._atomic_write(
                    meta_path,
                    json.dumps(block_meta.to_dict()),
                    mode="w",
                )

                async with self._lock:
                    self._metrics.total_bytes_stored += len(data)
                    self._metrics.block_count += 1

                stored.append(block_hash)
                total_bytes += len(data)

            except OSError as e:
                logger.warning(
                    "Failed to store block",
                    block_hash=block_hash,
                    error=str(e),
                )
                failed.append(block_hash)

        duration = (time.monotonic() - start) * 1000
        return StoreResult(
            stored=stored,
            failed=failed,
            total_bytes=total_bytes,
            duration_ms=duration,
        )

    async def retrieve(
        self,
        block_hashes: Sequence[str],
    ) -> RetrieveResult:
        """Retrieve blocks from disk."""
        await self._ensure_initialized()
        start = time.monotonic()
        found = {}
        missing = []

        for block_hash in block_hashes:
            block_path = self._block_path(block_hash)
            try:
                async with aiofiles.open(block_path, "rb") as f:
                    data = await f.read()
                found[block_hash] = data

                async with self._lock:
                    self._metrics.hits += 1
                    self._metrics.total_bytes_retrieved += len(data)

            except FileNotFoundError:
                missing.append(block_hash)
                async with self._lock:
                    self._metrics.misses += 1
            except OSError as e:
                logger.warning(
                    "Failed to retrieve block",
                    block_hash=block_hash,
                    error=str(e),
                )
                missing.append(block_hash)
                async with self._lock:
                    self._metrics.misses += 1

        duration = (time.monotonic() - start) * 1000
        return RetrieveResult(
            found=found,
            missing=missing,
            duration_ms=duration,
        )

    async def delete(
        self,
        block_hashes: Sequence[str],
    ) -> int:
        """Delete blocks from disk."""
        await self._ensure_initialized()
        deleted = 0

        for block_hash in block_hashes:
            block_path = self._block_path(block_hash)
            meta_path = self._meta_path(block_hash)
            try:
                # Get size before deleting
                try:
                    stat = await aiofiles.os.stat(block_path)
                    size = stat.st_size
                except FileNotFoundError:
                    size = 0

                # Delete files
                with contextlib.suppress(FileNotFoundError):
                    await aiofiles.os.remove(block_path)
                with contextlib.suppress(FileNotFoundError):
                    await aiofiles.os.remove(meta_path)

                if size > 0:
                    async with self._lock:
                        self._metrics.total_bytes_stored -= size
                        self._metrics.block_count -= 1
                    deleted += 1

            except OSError as e:
                logger.warning(
                    "Failed to delete block",
                    block_hash=block_hash,
                    error=str(e),
                )

        return deleted

    async def exists(
        self,
        block_hashes: Sequence[str],
    ) -> dict[str, bool]:
        """Check if blocks exist on disk."""
        await self._ensure_initialized()
        result = {}
        for block_hash in block_hashes:
            block_path = self._block_path(block_hash)
            try:
                await aiofiles.os.stat(block_path)
                result[block_hash] = True
            except FileNotFoundError:
                result[block_hash] = False
        return result

    async def get_metadata(
        self,
        block_hash: str,
    ) -> BlockMetadata | None:
        """Get block metadata from disk."""
        import json

        await self._ensure_initialized()
        meta_path = self._meta_path(block_hash)
        try:
            async with aiofiles.open(meta_path) as f:
                data = json.loads(await f.read())
            return BlockMetadata(
                block_hash=data["block_hash"],
                size_bytes=data["size_bytes"],
                created_at=data["created_at"],
                last_accessed=data["last_accessed"],
                session_id=data["session_id"],
                layer_index=data["layer_index"],
                backend=StorageBackend(data["backend"]),
                compression=data.get("compression"),
            )
        except (FileNotFoundError, json.JSONDecodeError, KeyError):
            return None

    async def list_blocks(
        self,
        session_id: str | None = None,
        limit: int = 100,
    ) -> list[BlockMetadata]:
        """List stored blocks."""
        await self._ensure_initialized()
        blocks = []

        meta_dir = self.storage_path / "meta"
        try:
            for subdir in await aiofiles.os.listdir(meta_dir):
                subdir_path = meta_dir / subdir
                if not (await aiofiles.os.path.isdir(subdir_path)):
                    continue

                for filename in await aiofiles.os.listdir(subdir_path):
                    if not filename.endswith(".json"):
                        continue

                    block_hash = filename[:-5]
                    meta = await self.get_metadata(block_hash)
                    if meta:
                        if session_id is None or meta.session_id == session_id:
                            blocks.append(meta)
                            if len(blocks) >= limit:
                                return blocks
        except FileNotFoundError:
            pass

        return blocks

    async def get_metrics(self) -> CacheMetrics:
        """Get cache metrics."""
        async with self._lock:
            return CacheMetrics(
                hits=self._metrics.hits,
                misses=self._metrics.misses,
                total_bytes_stored=self._metrics.total_bytes_stored,
                total_bytes_retrieved=self._metrics.total_bytes_retrieved,
                block_count=self._metrics.block_count,
                evictions=self._metrics.evictions,
            )

    async def clear(self, session_id: str | None = None) -> int:
        """Clear stored blocks."""
        await self._ensure_initialized()

        if session_id:
            blocks = await self.list_blocks(session_id=session_id, limit=10000)
            return await self.delete([b.block_hash for b in blocks])
        else:
            import shutil

            count = self._metrics.block_count
            # Remove and recreate directories
            shutil.rmtree(self.storage_path / "blocks", ignore_errors=True)
            shutil.rmtree(self.storage_path / "meta", ignore_errors=True)
            self._initialized = False
            async with self._lock:
                self._metrics = CacheMetrics()
            await self._ensure_initialized()
            return count

    async def health_check(self) -> bool:
        """Check if disk storage is accessible."""
        try:
            await self._ensure_initialized()
            test_path = self.storage_path / ".health_check"
            async with aiofiles.open(test_path, "w") as f:
                await f.write("ok")
            await aiofiles.os.remove(test_path)
            return True
        except OSError:
            return False


class TieredKVStore(KVStoreBackend):
    """
    Tiered KV store with automatic promotion/demotion.

    Implements a multi-tier storage hierarchy:
    1. Hot tier (memory) - frequently accessed blocks
    2. Warm tier (disk) - less frequently accessed blocks
    3. Cold tier (optional, e.g., Redis/S3) - archival storage

    Blocks are automatically promoted on access and demoted based on LRU.
    """

    def __init__(
        self,
        hot_tier: KVStoreBackend,
        warm_tier: KVStoreBackend,
        cold_tier: KVStoreBackend | None = None,
        hot_tier_max_blocks: int = 1000,
        promote_on_access: bool = True,
    ):
        """
        Initialize tiered store.

        Args:
            hot_tier: Fast, small-capacity tier (e.g., memory).
            warm_tier: Medium speed, larger capacity (e.g., disk).
            cold_tier: Optional slow, large capacity (e.g., Redis/S3).
            hot_tier_max_blocks: Max blocks in hot tier before demotion.
            promote_on_access: Whether to promote blocks on access.
        """
        self.hot_tier = hot_tier
        self.warm_tier = warm_tier
        self.cold_tier = cold_tier
        self.hot_tier_max_blocks = hot_tier_max_blocks
        self.promote_on_access = promote_on_access
        self._access_order: list[str] = []  # LRU tracking
        self._lock = asyncio.Lock()

    async def store(
        self,
        blocks: dict[str, bytes],
        session_id: str,
        metadata: dict[str, Any] | None = None,
    ) -> StoreResult:
        """Store to hot tier, demoting if needed."""
        # Check if we need to demote some blocks first
        async with self._lock:
            hot_metrics = await self.hot_tier.get_metrics()
            if hot_metrics.block_count + len(blocks) > self.hot_tier_max_blocks:
                # Demote oldest blocks
                demote_count = (
                    hot_metrics.block_count + len(blocks) - self.hot_tier_max_blocks
                )
                await self._demote_blocks(demote_count)

        # Store to hot tier
        result = await self.hot_tier.store(blocks, session_id, metadata)

        # Track access order
        async with self._lock:
            for block_hash in result.stored:
                if block_hash in self._access_order:
                    self._access_order.remove(block_hash)
                self._access_order.append(block_hash)

        return result

    async def _demote_blocks(self, count: int) -> None:
        """Demote oldest blocks from hot to warm tier."""
        if count <= 0:
            return

        to_demote = self._access_order[:count]
        if not to_demote:
            return

        # Retrieve from hot tier
        result = await self.hot_tier.retrieve(to_demote)

        # Store to warm tier
        if result.found:
            # Get session IDs from metadata
            for block_hash, data in result.found.items():
                meta = await self.hot_tier.get_metadata(block_hash)
                session_id = meta.session_id if meta else "unknown"
                await self.warm_tier.store(
                    {block_hash: data},
                    session_id,
                    {"layer_index": meta.layer_index if meta else 0},
                )

            # Delete from hot tier
            await self.hot_tier.delete(list(result.found.keys()))

            # Update access order
            for h in result.found:
                if h in self._access_order:
                    self._access_order.remove(h)

    async def retrieve(
        self,
        block_hashes: Sequence[str],
    ) -> RetrieveResult:
        """Retrieve from tiers, checking hot -> warm -> cold."""
        start = time.monotonic()
        found: dict[str, bytes] = {}
        missing = list(block_hashes)

        # Check hot tier
        hot_result = await self.hot_tier.retrieve(missing)
        found.update(hot_result.found)
        missing = hot_result.missing

        # Check warm tier for missing
        if missing:
            warm_result = await self.warm_tier.retrieve(missing)
            found.update(warm_result.found)
            missing = warm_result.missing

            # Promote to hot tier if configured
            if self.promote_on_access and warm_result.found:
                for block_hash, data in warm_result.found.items():
                    meta = await self.warm_tier.get_metadata(block_hash)
                    session_id = meta.session_id if meta else "unknown"
                    await self.hot_tier.store(
                        {block_hash: data},
                        session_id,
                        {"layer_index": meta.layer_index if meta else 0},
                    )

        # Check cold tier for missing
        if missing and self.cold_tier:
            cold_result = await self.cold_tier.retrieve(missing)
            found.update(cold_result.found)
            missing = cold_result.missing

            # Promote to warm tier
            if cold_result.found:
                for block_hash, data in cold_result.found.items():
                    meta = await self.cold_tier.get_metadata(block_hash)
                    session_id = meta.session_id if meta else "unknown"
                    await self.warm_tier.store(
                        {block_hash: data},
                        session_id,
                        {"layer_index": meta.layer_index if meta else 0},
                    )

        # Update access order
        async with self._lock:
            for h in found:
                if h in self._access_order:
                    self._access_order.remove(h)
                self._access_order.append(h)

        duration = (time.monotonic() - start) * 1000
        return RetrieveResult(
            found=found,
            missing=missing,
            duration_ms=duration,
        )

    async def delete(
        self,
        block_hashes: Sequence[str],
    ) -> int:
        """Delete from all tiers."""
        deleted = await self.hot_tier.delete(block_hashes)
        deleted += await self.warm_tier.delete(block_hashes)
        if self.cold_tier:
            deleted += await self.cold_tier.delete(block_hashes)

        async with self._lock:
            for h in block_hashes:
                if h in self._access_order:
                    self._access_order.remove(h)

        return deleted

    async def exists(
        self,
        block_hashes: Sequence[str],
    ) -> dict[str, bool]:
        """Check existence across all tiers."""
        result = await self.hot_tier.exists(block_hashes)

        # Check warm tier for unknowns
        unknown = [h for h, exists in result.items() if not exists]
        if unknown:
            warm_exists = await self.warm_tier.exists(unknown)
            result.update(warm_exists)

        # Check cold tier
        if self.cold_tier:
            unknown = [h for h, exists in result.items() if not exists]
            if unknown:
                cold_exists = await self.cold_tier.exists(unknown)
                result.update(cold_exists)

        return result

    async def get_metadata(
        self,
        block_hash: str,
    ) -> BlockMetadata | None:
        """Get metadata from any tier."""
        meta = await self.hot_tier.get_metadata(block_hash)
        if meta:
            return meta

        meta = await self.warm_tier.get_metadata(block_hash)
        if meta:
            return meta

        if self.cold_tier:
            return await self.cold_tier.get_metadata(block_hash)

        return None

    async def list_blocks(
        self,
        session_id: str | None = None,
        limit: int = 100,
    ) -> list[BlockMetadata]:
        """List blocks from all tiers."""
        blocks = []

        blocks.extend(await self.hot_tier.list_blocks(session_id, limit))
        if len(blocks) < limit:
            blocks.extend(
                await self.warm_tier.list_blocks(session_id, limit - len(blocks))
            )
        if self.cold_tier and len(blocks) < limit:
            blocks.extend(
                await self.cold_tier.list_blocks(session_id, limit - len(blocks))
            )

        return blocks[:limit]

    async def get_metrics(self) -> CacheMetrics:
        """Aggregate metrics from all tiers."""
        hot = await self.hot_tier.get_metrics()
        warm = await self.warm_tier.get_metrics()

        metrics = CacheMetrics(
            hits=hot.hits + warm.hits,
            misses=hot.misses + warm.misses,
            total_bytes_stored=hot.total_bytes_stored + warm.total_bytes_stored,
            total_bytes_retrieved=hot.total_bytes_retrieved
            + warm.total_bytes_retrieved,
            block_count=hot.block_count + warm.block_count,
            evictions=hot.evictions + warm.evictions,
        )

        if self.cold_tier:
            cold = await self.cold_tier.get_metrics()
            metrics.hits += cold.hits
            metrics.misses += cold.misses
            metrics.total_bytes_stored += cold.total_bytes_stored
            metrics.total_bytes_retrieved += cold.total_bytes_retrieved
            metrics.block_count += cold.block_count
            metrics.evictions += cold.evictions

        return metrics

    async def clear(self, session_id: str | None = None) -> int:
        """Clear all tiers."""
        count = await self.hot_tier.clear(session_id)
        count += await self.warm_tier.clear(session_id)
        if self.cold_tier:
            count += await self.cold_tier.clear(session_id)

        if session_id is None:
            async with self._lock:
                self._access_order.clear()

        return count

    async def health_check(self) -> bool:
        """Check all tiers are healthy."""
        hot_healthy = await self.hot_tier.health_check()
        warm_healthy = await self.warm_tier.health_check()

        if self.cold_tier:
            cold_healthy = await self.cold_tier.health_check()
            return hot_healthy and warm_healthy and cold_healthy

        return hot_healthy and warm_healthy


def compute_block_hash(data: bytes, session_id: str, layer_index: int) -> str:
    """
    Compute a unique hash for a KV cache block.

    Args:
        data: The block data.
        session_id: Session ID for namespacing.
        layer_index: Layer index in the model.

    Returns:
        SHA-256 hash string.
    """
    hasher = hashlib.sha256()
    hasher.update(session_id.encode())
    hasher.update(str(layer_index).encode())
    hasher.update(data)
    return hasher.hexdigest()


async def create_kv_store(
    backend: StorageBackend,
    storage_path: Path | None = None,
    **kwargs: Any,
) -> KVStoreBackend:
    """
    Factory function to create a KV store backend.

    Args:
        backend: The backend type to create.
        storage_path: Path for disk-based backends.
        **kwargs: Additional backend-specific arguments.

    Returns:
        Configured KVStoreBackend instance.

    Raises:
        ValueError: If backend type is unsupported.
    """
    if backend == StorageBackend.MEMORY:
        return MemoryKVStore(**kwargs)

    elif backend == StorageBackend.DISK:
        if storage_path is None:
            raise ValueError("storage_path required for disk backend")
        return DiskKVStore(storage_path, **kwargs)

    elif backend == StorageBackend.LMCACHE:
        raise NotImplementedError("LMCache backend not yet implemented")

    elif backend == StorageBackend.REDIS:
        raise NotImplementedError("Redis backend not yet implemented")

    else:
        raise ValueError(f"Unsupported backend: {backend}")
