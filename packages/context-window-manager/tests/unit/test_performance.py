"""
Unit tests for performance module.

Tests connection pooling, concurrency control, caching, and memory management.
"""

from __future__ import annotations

import asyncio

import pytest

from context_window_manager.performance import (
    AsyncBatcher,
    AsyncCache,
    ConcurrencyLimiter,
    ConnectionPool,
    MemoryPressureHandler,
    MemoryStats,
    PoolConfig,
    PooledConnection,
    cached,
    get_memory_stats,
    limit_concurrency,
)


class TestConnectionPool:
    """Tests for ConnectionPool class."""

    @pytest.fixture
    def pool(self):
        """Create a connection pool with mock factory."""
        connection_count = 0

        async def factory():
            nonlocal connection_count
            connection_count += 1
            return {"id": connection_count}

        async def validator(conn):
            return True

        async def closer(conn):
            pass

        return ConnectionPool(
            factory=factory,
            validator=validator,
            closer=closer,
            config=PoolConfig(max_connections=3, min_connections=1),
        )

    @pytest.mark.asyncio
    async def test_acquire_creates_connection(self, pool):
        """Should create new connection when pool is empty."""
        conn = await pool.acquire()
        assert conn["id"] == 1
        assert pool.size == 1

    @pytest.mark.asyncio
    async def test_release_returns_to_pool(self, pool):
        """Should return connection to pool."""
        conn = await pool.acquire()
        await pool.release(conn)
        assert pool.available == 1

    @pytest.mark.asyncio
    async def test_reuses_connections(self, pool):
        """Should reuse released connections."""
        conn1 = await pool.acquire()
        await pool.release(conn1)

        conn2 = await pool.acquire()
        assert conn1 == conn2  # Same connection reused

    @pytest.mark.asyncio
    async def test_max_connections_limit(self, pool):
        """Should respect max connections limit."""
        conns = []
        for _ in range(3):
            conn = await pool.acquire()
            conns.append(conn)

        assert pool.size == 3

        # Next acquire should timeout
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(pool.acquire(), timeout=0.1)

    @pytest.mark.asyncio
    async def test_close_pool(self, pool):
        """Should close all connections when pool is closed."""
        await pool.acquire()
        await pool.close()

        with pytest.raises(RuntimeError):
            await pool.acquire()


class TestPooledConnection:
    """Tests for PooledConnection context manager."""

    @pytest.mark.asyncio
    async def test_acquires_and_releases(self):
        """Should acquire on enter and release on exit."""

        async def factory():
            return {"id": 1}

        pool = ConnectionPool(factory=factory)

        async with PooledConnection(pool) as conn:
            assert conn["id"] == 1
            assert pool.available == 0

        assert pool.available == 1


class TestConcurrencyLimiter:
    """Tests for ConcurrencyLimiter class."""

    @pytest.mark.asyncio
    async def test_limits_concurrent_operations(self):
        """Should limit concurrent operations."""
        limiter = ConcurrencyLimiter(max_concurrent=2)
        active_at_peak = 0

        async def task():
            nonlocal active_at_peak
            async with limiter:
                active_at_peak = max(active_at_peak, limiter.active)
                await asyncio.sleep(0.1)

        await asyncio.gather(*[task() for _ in range(5)])

        assert active_at_peak <= 2
        assert limiter.total == 5

    @pytest.mark.asyncio
    async def test_available_slots(self):
        """Should track available slots correctly."""
        limiter = ConcurrencyLimiter(max_concurrent=3)

        assert limiter.available == 3

        async with limiter:
            assert limiter.available == 2
            assert limiter.active == 1

        assert limiter.available == 3


class TestLimitConcurrencyDecorator:
    """Tests for limit_concurrency decorator."""

    @pytest.mark.asyncio
    async def test_decorator_limits_concurrency(self):
        """Should limit concurrent calls to decorated function."""
        limiter = ConcurrencyLimiter(max_concurrent=2)
        call_count = 0

        @limit_concurrency(limiter)
        async def limited_func():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.05)
            return call_count

        results = await asyncio.gather(*[limited_func() for _ in range(5)])

        assert len(results) == 5
        assert limiter.total == 5


class TestAsyncBatcher:
    """Tests for AsyncBatcher class."""

    @pytest.mark.asyncio
    async def test_batches_requests(self):
        """Should batch multiple requests together."""
        batches = []

        async def handler(items):
            batches.append(items)
            return [f"result-{i}" for i in items]

        batcher = AsyncBatcher(
            batch_handler=handler,
            max_batch_size=3,
            max_wait_time=0.5,
        )

        # Submit items quickly to get batched
        results = await asyncio.gather(*[batcher.submit(i) for i in range(3)])

        assert results == ["result-0", "result-1", "result-2"]
        assert len(batches) == 1  # All in one batch

    @pytest.mark.asyncio
    async def test_flushes_on_timeout(self):
        """Should flush batch after timeout."""
        batches = []

        async def handler(items):
            batches.append(items)
            return [f"result-{i}" for i in items]

        batcher = AsyncBatcher(
            batch_handler=handler,
            max_batch_size=10,
            max_wait_time=0.1,
        )

        result = await batcher.submit(1)
        assert result == "result-1"
        assert len(batches) == 1


class TestAsyncCache:
    """Tests for AsyncCache class."""

    @pytest.fixture
    def cache(self):
        """Create a cache for testing."""
        return AsyncCache(default_ttl=1.0, max_size=10)

    @pytest.mark.asyncio
    async def test_get_set(self, cache):
        """Should get and set values."""
        await cache.set("key1", "value1")
        result = await cache.get("key1")
        assert result == "value1"

    @pytest.mark.asyncio
    async def test_returns_none_for_missing(self, cache):
        """Should return None for missing keys."""
        result = await cache.get("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_expires_after_ttl(self, cache):
        """Should expire values after TTL."""
        await cache.set("key1", "value1", ttl=0.05)
        await asyncio.sleep(0.1)
        result = await cache.get("key1")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete(self, cache):
        """Should delete values."""
        await cache.set("key1", "value1")
        deleted = await cache.delete("key1")
        assert deleted is True

        result = await cache.get("key1")
        assert result is None

    @pytest.mark.asyncio
    async def test_clear(self, cache):
        """Should clear all values."""
        await cache.set("key1", "value1")
        await cache.set("key2", "value2")

        count = await cache.clear()
        assert count == 2
        assert cache.size == 0

    @pytest.mark.asyncio
    async def test_max_size_eviction(self, cache):
        """Should evict oldest when max size reached."""
        cache._max_size = 3

        for i in range(5):
            await cache.set(f"key{i}", f"value{i}")
            await asyncio.sleep(0.01)  # Ensure different timestamps

        assert cache.size == 3
        # Oldest entries should be evicted
        assert await cache.get("key0") is None
        assert await cache.get("key1") is None

    @pytest.mark.asyncio
    async def test_hit_rate(self, cache):
        """Should track hit rate."""
        await cache.set("key1", "value1")

        await cache.get("key1")  # hit
        await cache.get("key1")  # hit
        await cache.get("key2")  # miss

        assert cache.hit_rate == 2 / 3

    @pytest.mark.asyncio
    async def test_stats(self, cache):
        """Should return stats."""
        await cache.set("key1", "value1")
        await cache.get("key1")

        stats = cache.stats()
        assert stats["size"] == 1
        assert stats["hits"] == 1
        assert stats["max_size"] == 10


class TestCachedDecorator:
    """Tests for cached decorator."""

    @pytest.mark.asyncio
    async def test_caches_results(self):
        """Should cache function results."""
        cache = AsyncCache()
        call_count = 0

        @cached(cache)
        async def expensive_func(x):
            nonlocal call_count
            call_count += 1
            return x * 2

        result1 = await expensive_func(5)
        result2 = await expensive_func(5)

        assert result1 == 10
        assert result2 == 10
        assert call_count == 1  # Only called once

    @pytest.mark.asyncio
    async def test_custom_key_fn(self):
        """Should use custom key function."""
        cache = AsyncCache()

        @cached(cache, key_fn=lambda x, y: f"{x}:{y}")
        async def func(x, y):
            return x + y

        await func(1, 2)
        await func(1, 2)

        assert cache.size == 1


class TestMemoryStats:
    """Tests for memory stats."""

    def test_get_memory_stats(self):
        """Should return memory stats."""
        stats = get_memory_stats()
        assert isinstance(stats, MemoryStats)
        # May be zeros if psutil not available


class TestMemoryPressureHandler:
    """Tests for MemoryPressureHandler class."""

    @pytest.mark.asyncio
    async def test_registers_callbacks(self):
        """Should register warning and critical callbacks."""
        handler = MemoryPressureHandler()

        warning_called = False
        critical_called = False

        async def warning_callback():
            nonlocal warning_called
            warning_called = True

        async def critical_callback():
            nonlocal critical_called
            critical_called = True

        handler.on_warning(warning_callback)
        handler.on_critical(critical_callback)

        assert len(handler._warning_callbacks) == 1
        assert len(handler._critical_callbacks) == 1

    @pytest.mark.asyncio
    async def test_check_now_returns_stats(self):
        """Should return memory stats on check."""
        handler = MemoryPressureHandler()
        stats = await handler.check_now()
        assert isinstance(stats, MemoryStats)

    @pytest.mark.asyncio
    async def test_start_stop(self):
        """Should start and stop monitoring."""
        handler = MemoryPressureHandler(check_interval=0.1)

        await handler.start()
        assert handler._running is True

        await handler.stop()
        assert handler._running is False
