"""
Performance optimization utilities for Context Window Manager.

Provides:
- Connection pooling for HTTP clients
- Async I/O optimization with semaphores
- Memory management utilities
- Caching decorators
"""

from __future__ import annotations

import asyncio
import contextlib
import functools
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Generic, TypeVar

import structlog

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

logger = structlog.get_logger()

T = TypeVar("T")


# =============================================================================
# Connection Pooling
# =============================================================================


@dataclass
class PoolConfig:
    """Configuration for connection pools."""

    max_connections: int = 10
    min_connections: int = 2
    max_idle_time: float = 60.0  # seconds
    connection_timeout: float = 30.0  # seconds
    acquire_timeout: float = 10.0  # seconds


class ConnectionPool(Generic[T]):
    """
    Generic async connection pool.

    Manages a pool of reusable connections with idle timeout and
    automatic scaling between min and max connections.
    """

    def __init__(
        self,
        factory: Callable[[], Awaitable[T]],
        validator: Callable[[T], Awaitable[bool]] | None = None,
        closer: Callable[[T], Awaitable[None]] | None = None,
        config: PoolConfig | None = None,
    ):
        """
        Initialize connection pool.

        Args:
            factory: Async function to create new connections
            validator: Optional function to validate connection health
            closer: Optional function to close connections
            config: Pool configuration
        """
        self.factory = factory
        self.validator = validator
        self.closer = closer
        self.config = config or PoolConfig()

        self._pool: asyncio.Queue[tuple[T, float]] = asyncio.Queue(
            maxsize=self.config.max_connections
        )
        self._size = 0
        self._lock = asyncio.Lock()
        self._closed = False

    async def acquire(self) -> T:
        """
        Acquire a connection from the pool.

        Returns a connection, either from the pool or newly created.

        Returns:
            A connection object

        Raises:
            asyncio.TimeoutError: If connection cannot be acquired in time
        """
        if self._closed:
            raise RuntimeError("Pool is closed")

        # Try to get from pool first
        try:
            conn, timestamp = self._pool.get_nowait()

            # Check if connection is still valid
            idle = time.time() - timestamp > self.config.max_idle_time
            if idle or (self.validator and not await self.validator(conn)):
                await self._close_connection(conn)
            else:
                return conn
        except asyncio.QueueEmpty:
            pass

        # Create new connection if under limit
        async with self._lock:
            if self._size < self.config.max_connections:
                conn = await asyncio.wait_for(
                    self.factory(),
                    timeout=self.config.connection_timeout,
                )
                self._size += 1
                return conn

        # Wait for a connection to become available
        conn, _ = await asyncio.wait_for(
            self._pool.get(),
            timeout=self.config.acquire_timeout,
        )
        return conn

    async def release(self, conn: T) -> None:
        """
        Return a connection to the pool.

        Args:
            conn: The connection to release
        """
        if self._closed:
            await self._close_connection(conn)
            return

        try:
            self._pool.put_nowait((conn, time.time()))
        except asyncio.QueueFull:
            # Pool is full, close the connection
            await self._close_connection(conn)

    async def _close_connection(self, conn: T) -> None:
        """Close a connection."""
        async with self._lock:
            self._size -= 1
        if self.closer:
            try:
                await self.closer(conn)
            except Exception as e:
                logger.warning("Error closing connection", error=str(e))

    async def close(self) -> None:
        """Close the pool and all connections."""
        self._closed = True

        # Close all pooled connections
        while not self._pool.empty():
            try:
                conn, _ = self._pool.get_nowait()
                await self._close_connection(conn)
            except asyncio.QueueEmpty:
                break

    @property
    def size(self) -> int:
        """Current number of connections (in-use + pooled)."""
        return self._size

    @property
    def available(self) -> int:
        """Number of connections available in pool."""
        return self._pool.qsize()


class PooledConnection(Generic[T]):
    """
    Context manager for pooled connections.

    Automatically acquires and releases connections.
    """

    def __init__(self, pool: ConnectionPool[T]):
        self.pool = pool
        self._conn: T | None = None

    async def __aenter__(self) -> T:
        self._conn = await self.pool.acquire()
        return self._conn

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._conn is not None:
            await self.pool.release(self._conn)
            self._conn = None
        return False


# =============================================================================
# Async Concurrency Control
# =============================================================================


class ConcurrencyLimiter:
    """
    Limits concurrent async operations.

    Uses semaphores to prevent resource exhaustion.
    """

    def __init__(
        self,
        max_concurrent: int = 10,
        name: str = "default",
    ):
        """
        Initialize concurrency limiter.

        Args:
            max_concurrent: Maximum concurrent operations
            name: Name for logging purposes
        """
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max_concurrent = max_concurrent
        self._name = name
        self._active = 0
        self._total = 0
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        """Acquire a slot for execution."""
        await self._semaphore.acquire()
        async with self._lock:
            self._active += 1
            self._total += 1

    async def release(self) -> None:
        """Release an execution slot."""
        self._semaphore.release()
        async with self._lock:
            self._active -= 1

    async def __aenter__(self):
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.release()
        return False

    @property
    def active(self) -> int:
        """Number of currently active operations."""
        return self._active

    @property
    def available(self) -> int:
        """Number of available slots."""
        return self._max_concurrent - self._active

    @property
    def total(self) -> int:
        """Total operations processed."""
        return self._total


def limit_concurrency(limiter: ConcurrencyLimiter):
    """
    Decorator to limit concurrency of async functions.

    Args:
        limiter: The concurrency limiter to use

    Usage:
        limiter = ConcurrencyLimiter(max_concurrent=5)

        @limit_concurrency(limiter)
        async def my_function():
            ...
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            async with limiter:
                return await func(*args, **kwargs)

        return wrapper

    return decorator


# =============================================================================
# Async Batching
# =============================================================================


class AsyncBatcher(Generic[T]):
    """
    Batches multiple async requests into single operations.

    Useful for reducing overhead when many small requests are made.
    """

    def __init__(
        self,
        batch_handler: Callable[[list[T]], Awaitable[list[Any]]],
        max_batch_size: int = 100,
        max_wait_time: float = 0.1,  # seconds
    ):
        """
        Initialize async batcher.

        Args:
            batch_handler: Function to process a batch of items
            max_batch_size: Maximum items per batch
            max_wait_time: Maximum time to wait for batch to fill
        """
        self._batch_handler = batch_handler
        self._max_batch_size = max_batch_size
        self._max_wait_time = max_wait_time

        self._pending: list[tuple[T, asyncio.Future]] = []
        self._lock = asyncio.Lock()
        self._timer: asyncio.Task | None = None

    async def submit(self, item: T) -> Any:
        """
        Submit an item for batched processing.

        Args:
            item: The item to process

        Returns:
            The result for this item
        """
        future: asyncio.Future = asyncio.Future()

        async with self._lock:
            self._pending.append((item, future))

            # Start timer if first item
            if len(self._pending) == 1:
                self._timer = asyncio.create_task(self._wait_and_flush())

            # Flush if batch is full
            if len(self._pending) >= self._max_batch_size:
                await self._flush()

        return await future

    async def _wait_and_flush(self) -> None:
        """Wait for timeout then flush."""
        await asyncio.sleep(self._max_wait_time)
        async with self._lock:
            if self._pending:
                await self._flush()

    async def _flush(self) -> None:
        """Process the pending batch."""
        if not self._pending:
            return

        # Cancel timer if running
        if self._timer and not self._timer.done():
            self._timer.cancel()
            self._timer = None

        batch = self._pending
        self._pending = []

        items = [item for item, _ in batch]
        futures = [future for _, future in batch]

        try:
            results = await self._batch_handler(items)
            for future, result in zip(futures, results, strict=False):
                future.set_result(result)
        except Exception as e:
            for future in futures:
                if not future.done():
                    future.set_exception(e)


# =============================================================================
# Caching
# =============================================================================


@dataclass
class CacheEntry(Generic[T]):
    """A cached value with metadata."""

    value: T
    created_at: float
    expires_at: float
    hits: int = 0


class AsyncCache(Generic[T]):
    """
    Async-safe in-memory cache with TTL.

    Thread-safe and supports optional size limits.
    """

    def __init__(
        self,
        default_ttl: float = 60.0,  # seconds
        max_size: int | None = 1000,
    ):
        """
        Initialize async cache.

        Args:
            default_ttl: Default time-to-live in seconds
            max_size: Maximum cache entries (None for unlimited)
        """
        self._cache: dict[str, CacheEntry[T]] = {}
        self._default_ttl = default_ttl
        self._max_size = max_size
        self._lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0

    async def get(self, key: str) -> T | None:
        """
        Get a value from cache.

        Args:
            key: The cache key

        Returns:
            The cached value or None if not found/expired
        """
        async with self._lock:
            entry = self._cache.get(key)

            if entry is None:
                self._misses += 1
                return None

            if time.time() > entry.expires_at:
                del self._cache[key]
                self._misses += 1
                return None

            entry.hits += 1
            self._hits += 1
            return entry.value

    async def set(self, key: str, value: T, ttl: float | None = None) -> None:
        """
        Set a value in cache.

        Args:
            key: The cache key
            value: The value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        async with self._lock:
            # Evict if at max size
            if self._max_size and len(self._cache) >= self._max_size:
                await self._evict_oldest()

            now = time.time()
            self._cache[key] = CacheEntry(
                value=value,
                created_at=now,
                expires_at=now + (ttl or self._default_ttl),
            )

    async def delete(self, key: str) -> bool:
        """
        Delete a value from cache.

        Args:
            key: The cache key

        Returns:
            True if key was deleted, False if not found
        """
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    async def clear(self) -> int:
        """
        Clear all cached values.

        Returns:
            Number of entries cleared
        """
        async with self._lock:
            count = len(self._cache)
            self._cache.clear()
            return count

    async def _evict_oldest(self) -> None:
        """Evict the oldest cache entry."""
        if not self._cache:
            return

        oldest_key = min(
            self._cache.keys(),
            key=lambda k: self._cache[k].created_at,
        )
        del self._cache[oldest_key]

    @property
    def size(self) -> int:
        """Current number of cached entries."""
        return len(self._cache)

    @property
    def hit_rate(self) -> float:
        """Cache hit rate (0.0 to 1.0)."""
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    def stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self._cache),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self.hit_rate,
            "max_size": self._max_size,
            "default_ttl": self._default_ttl,
        }


def cached(
    cache: AsyncCache,
    key_fn: Callable[..., str] | None = None,
    ttl: float | None = None,
):
    """
    Decorator for caching async function results.

    Args:
        cache: The cache to use
        key_fn: Optional function to generate cache key from args
        ttl: Optional TTL override

    Usage:
        cache = AsyncCache()

        @cached(cache)
        async def expensive_operation(id: str):
            ...
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Generate cache key
            key = key_fn(*args, **kwargs) if key_fn else f"{func.__name__}:{args}:{kwargs}"

            # Try cache
            result = await cache.get(key)
            if result is not None:
                return result

            # Call function and cache result
            result = await func(*args, **kwargs)
            await cache.set(key, result, ttl)
            return result

        return wrapper

    return decorator


# =============================================================================
# Memory Management
# =============================================================================


@dataclass
class MemoryStats:
    """Memory usage statistics."""

    rss_bytes: int  # Resident set size
    vms_bytes: int  # Virtual memory size
    percent: float  # Memory percentage
    available_bytes: int  # System available memory


def get_memory_stats() -> MemoryStats:
    """
    Get current memory usage statistics.

    Returns:
        MemoryStats object with current memory info
    """
    try:
        import psutil

        process = psutil.Process()
        mem_info = process.memory_info()
        system_mem = psutil.virtual_memory()

        return MemoryStats(
            rss_bytes=mem_info.rss,
            vms_bytes=mem_info.vms,
            percent=process.memory_percent(),
            available_bytes=system_mem.available,
        )
    except ImportError:
        # psutil not available, return zeros
        return MemoryStats(
            rss_bytes=0,
            vms_bytes=0,
            percent=0.0,
            available_bytes=0,
        )


class MemoryPressureHandler:
    """
    Monitors memory pressure and triggers cleanup.

    Registers callbacks that are invoked when memory usage
    exceeds thresholds.
    """

    def __init__(
        self,
        warning_threshold: float = 0.75,  # 75% memory usage
        critical_threshold: float = 0.90,  # 90% memory usage
        check_interval: float = 30.0,  # seconds
    ):
        """
        Initialize memory pressure handler.

        Args:
            warning_threshold: Memory % that triggers warning
            critical_threshold: Memory % that triggers critical cleanup
            check_interval: How often to check memory
        """
        self._warning_threshold = warning_threshold
        self._critical_threshold = critical_threshold
        self._check_interval = check_interval

        self._warning_callbacks: list[Callable[[], Awaitable[None]]] = []
        self._critical_callbacks: list[Callable[[], Awaitable[None]]] = []
        self._monitor_task: asyncio.Task | None = None
        self._running = False

    def on_warning(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Register a callback for warning-level memory pressure."""
        self._warning_callbacks.append(callback)

    def on_critical(self, callback: Callable[[], Awaitable[None]]) -> None:
        """Register a callback for critical-level memory pressure."""
        self._critical_callbacks.append(callback)

    async def start(self) -> None:
        """Start memory monitoring."""
        if self._running:
            return

        self._running = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())

    async def stop(self) -> None:
        """Stop memory monitoring."""
        self._running = False
        if self._monitor_task:
            self._monitor_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._monitor_task

    async def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        while self._running:
            try:
                stats = get_memory_stats()
                percent = stats.percent / 100.0

                if percent >= self._critical_threshold:
                    logger.warning(
                        "Critical memory pressure",
                        memory_percent=stats.percent,
                    )
                    for callback in self._critical_callbacks:
                        try:
                            await callback()
                        except Exception as e:
                            logger.error("Memory callback error", error=str(e))

                elif percent >= self._warning_threshold:
                    logger.info(
                        "Warning memory pressure",
                        memory_percent=stats.percent,
                    )
                    for callback in self._warning_callbacks:
                        try:
                            await callback()
                        except Exception as e:
                            logger.error("Memory callback error", error=str(e))

                await asyncio.sleep(self._check_interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Memory monitor error", error=str(e))
                await asyncio.sleep(self._check_interval)

    async def check_now(self) -> MemoryStats:
        """
        Check memory immediately.

        Returns:
            Current memory statistics
        """
        stats = get_memory_stats()
        percent = stats.percent / 100.0

        if percent >= self._critical_threshold:
            for callback in self._critical_callbacks:
                await callback()
        elif percent >= self._warning_threshold:
            for callback in self._warning_callbacks:
                await callback()

        return stats
