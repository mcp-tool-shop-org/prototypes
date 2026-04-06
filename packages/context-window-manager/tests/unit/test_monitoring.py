"""
Unit tests for monitoring module.

Tests metrics collection, health checks, and performance tracing.
"""

from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from context_window_manager.monitoring import (
    ComponentHealth,
    HealthChecker,
    HealthStatus,
    MetricsCollector,
    SystemHealth,
    check_kv_store_health,
    check_registry_health,
    check_vllm_health,
    get_metrics,
    trace_operation,
)


class TestHealthStatus:
    """Tests for HealthStatus enum."""

    def test_all_statuses_defined(self):
        """Should have healthy, degraded, and unhealthy statuses."""
        assert HealthStatus.HEALTHY.value == "healthy"
        assert HealthStatus.DEGRADED.value == "degraded"
        assert HealthStatus.UNHEALTHY.value == "unhealthy"


class TestComponentHealth:
    """Tests for ComponentHealth dataclass."""

    def test_to_dict(self):
        """Should convert to dictionary."""
        health = ComponentHealth(
            name="test",
            status=HealthStatus.HEALTHY,
            message="All good",
            latency_ms=5.5,
            metadata={"key": "value"},
        )
        result = health.to_dict()

        assert result["name"] == "test"
        assert result["status"] == "healthy"
        assert result["message"] == "All good"
        assert result["latency_ms"] == 5.5
        assert result["metadata"] == {"key": "value"}
        assert "last_check" in result

    def test_default_values(self):
        """Should have sensible defaults."""
        health = ComponentHealth(name="test", status=HealthStatus.HEALTHY)
        assert health.message == ""
        assert health.latency_ms == 0.0
        assert health.metadata == {}


class TestSystemHealth:
    """Tests for SystemHealth dataclass."""

    def test_to_dict(self):
        """Should convert to dictionary with all components."""
        components = [
            ComponentHealth(name="db", status=HealthStatus.HEALTHY),
            ComponentHealth(name="cache", status=HealthStatus.DEGRADED),
        ]
        health = SystemHealth(
            status=HealthStatus.DEGRADED,
            components=components,
            uptime_seconds=3600.5,
            version="1.0.0",
        )
        result = health.to_dict()

        assert result["status"] == "degraded"
        assert result["uptime_seconds"] == 3600.5
        assert result["version"] == "1.0.0"
        assert len(result["components"]) == 2
        assert "timestamp" in result


class TestMetricsCollector:
    """Tests for MetricsCollector class."""

    @pytest.fixture
    def collector(self):
        """Create a fresh metrics collector."""
        return MetricsCollector()

    @pytest.mark.asyncio
    async def test_inc_counter(self, collector):
        """Should increment counter values."""
        await collector.inc_counter("requests", 1)
        await collector.inc_counter("requests", 2)

        metrics = await collector.get_all_metrics()
        counter = next((m for m in metrics if m.name == "requests"), None)
        assert counter is not None
        assert counter.value == 3
        assert counter.metric_type == "counter"

    @pytest.mark.asyncio
    async def test_counter_with_labels(self, collector):
        """Should track counters with different labels separately."""
        await collector.inc_counter("http_requests", labels={"status": "200"})
        await collector.inc_counter("http_requests", labels={"status": "500"})
        await collector.inc_counter("http_requests", labels={"status": "200"})

        metrics = await collector.get_all_metrics()
        requests_200 = next(
            (m for m in metrics if m.labels.get("status") == "200"), None
        )
        requests_500 = next(
            (m for m in metrics if m.labels.get("status") == "500"), None
        )

        assert requests_200.value == 2
        assert requests_500.value == 1

    @pytest.mark.asyncio
    async def test_set_gauge(self, collector):
        """Should set gauge values."""
        await collector.set_gauge("temperature", 72.5)
        await collector.set_gauge("temperature", 73.0)

        metrics = await collector.get_all_metrics()
        gauge = next((m for m in metrics if m.name == "temperature"), None)
        assert gauge.value == 73.0  # Last value set
        assert gauge.metric_type == "gauge"

    @pytest.mark.asyncio
    async def test_observe_histogram(self, collector):
        """Should record histogram observations."""
        for i in range(10):
            await collector.observe_histogram("latency", i * 10)

        metrics = await collector.get_all_metrics()
        count = next((m for m in metrics if m.name == "latency_count"), None)
        total = next((m for m in metrics if m.name == "latency_sum"), None)
        p50 = next((m for m in metrics if m.name == "latency_p50"), None)
        p99 = next((m for m in metrics if m.name == "latency_p99"), None)

        assert count.value == 10
        assert total.value == 450  # 0 + 10 + 20 + ... + 90
        assert p50 is not None
        assert p99 is not None

    @pytest.mark.asyncio
    async def test_export_prometheus(self, collector):
        """Should export in Prometheus format."""
        await collector.inc_counter(
            "http_requests_total",
            labels={"method": "GET"},
            help_text="Total HTTP requests",
        )
        await collector.set_gauge(
            "active_connections", 42, help_text="Active connections"
        )

        output = await collector.export_prometheus()

        assert "# HELP" in output
        assert "http_requests_total" in output
        assert "active_connections 42" in output

    @pytest.mark.asyncio
    async def test_reset(self, collector):
        """Should reset all metrics."""
        await collector.inc_counter("counter")
        await collector.set_gauge("gauge", 100)

        await collector.reset()

        metrics = await collector.get_all_metrics()
        assert len(metrics) == 0


class TestHealthChecker:
    """Tests for HealthChecker class."""

    @pytest.fixture
    def checker(self):
        """Create a health checker."""
        return HealthChecker(version="1.0.0-test")

    @pytest.mark.asyncio
    async def test_check_unknown_component(self, checker):
        """Should return unhealthy for unknown components."""
        result = await checker.check_component("unknown")
        assert result.status == HealthStatus.UNHEALTHY
        assert "Unknown component" in result.message

    @pytest.mark.asyncio
    async def test_register_and_check(self, checker):
        """Should register and run health checks."""

        async def healthy_check() -> ComponentHealth:
            return ComponentHealth(
                name="test",
                status=HealthStatus.HEALTHY,
                message="All good",
            )

        checker.register_check("test", healthy_check)
        result = await checker.check_component("test")

        assert result.status == HealthStatus.HEALTHY
        assert result.latency_ms >= 0

    @pytest.mark.asyncio
    async def test_check_all_healthy(self, checker):
        """Should return healthy when all components are healthy."""

        async def healthy_check() -> ComponentHealth:
            return ComponentHealth(name="a", status=HealthStatus.HEALTHY)

        checker.register_check("a", healthy_check)
        checker.register_check("b", healthy_check)

        health = await checker.check_all()
        assert health.status == HealthStatus.HEALTHY
        assert len(health.components) == 2

    @pytest.mark.asyncio
    async def test_check_all_degraded(self, checker):
        """Should return degraded when any component is degraded."""

        async def healthy() -> ComponentHealth:
            return ComponentHealth(name="a", status=HealthStatus.HEALTHY)

        async def degraded() -> ComponentHealth:
            return ComponentHealth(name="b", status=HealthStatus.DEGRADED)

        checker.register_check("a", healthy)
        checker.register_check("b", degraded)

        health = await checker.check_all()
        assert health.status == HealthStatus.DEGRADED

    @pytest.mark.asyncio
    async def test_check_all_unhealthy(self, checker):
        """Should return unhealthy when any component is unhealthy."""

        async def healthy() -> ComponentHealth:
            return ComponentHealth(name="a", status=HealthStatus.HEALTHY)

        async def unhealthy() -> ComponentHealth:
            return ComponentHealth(name="b", status=HealthStatus.UNHEALTHY)

        checker.register_check("a", healthy)
        checker.register_check("b", unhealthy)

        health = await checker.check_all()
        assert health.status == HealthStatus.UNHEALTHY

    @pytest.mark.asyncio
    async def test_check_timeout(self, checker):
        """Should handle check timeouts."""

        async def slow_check() -> ComponentHealth:
            await asyncio.sleep(10)  # Will timeout
            return ComponentHealth(name="slow", status=HealthStatus.HEALTHY)

        checker.register_check("slow", slow_check)
        result = await checker.check_component("slow")

        assert result.status == HealthStatus.UNHEALTHY
        assert "timed out" in result.message.lower()

    @pytest.mark.asyncio
    async def test_liveness(self, checker):
        """Liveness should always return True."""
        assert await checker.liveness() is True

    @pytest.mark.asyncio
    async def test_readiness_healthy(self, checker):
        """Readiness should return True when healthy."""

        async def healthy() -> ComponentHealth:
            return ComponentHealth(name="a", status=HealthStatus.HEALTHY)

        checker.register_check("a", healthy)
        assert await checker.readiness() is True

    @pytest.mark.asyncio
    async def test_readiness_unhealthy(self, checker):
        """Readiness should return False when unhealthy."""

        async def unhealthy() -> ComponentHealth:
            return ComponentHealth(name="a", status=HealthStatus.UNHEALTHY)

        checker.register_check("a", unhealthy)
        assert await checker.readiness() is False

    def test_uptime(self, checker):
        """Uptime should be non-negative."""
        assert checker.uptime_seconds >= 0


class TestTraceOperation:
    """Tests for trace_operation context manager."""

    @pytest.fixture(autouse=True)
    async def reset_metrics(self):
        """Reset metrics before each test."""
        await get_metrics().reset()

    @pytest.mark.asyncio
    async def test_successful_operation(self):
        """Should record successful operation metrics."""
        async with trace_operation("test_op", log_result=False) as trace:
            trace["result"] = "success"

        metrics = get_metrics()
        all_metrics = await metrics.get_all_metrics()

        # Should have duration and count metrics
        assert any("cwm_operation_duration_ms" in m.name for m in all_metrics)
        assert any("cwm_operation_total" in m.name for m in all_metrics)

    @pytest.mark.asyncio
    async def test_failed_operation(self):
        """Should record failed operation metrics."""
        with pytest.raises(ValueError):
            async with trace_operation("failing_op", log_result=False):
                raise ValueError("Test error")

        metrics = get_metrics()
        all_metrics = await metrics.get_all_metrics()

        # Should have error metrics
        error_metric = next(
            (m for m in all_metrics if m.labels.get("status") == "error"), None
        )
        assert error_metric is not None

    @pytest.mark.asyncio
    async def test_timing_recorded(self):
        """Should record operation timing."""
        async with trace_operation("timed_op", log_result=False) as trace:
            await asyncio.sleep(0.01)  # Small delay

        assert "elapsed_ms" in trace
        assert trace["elapsed_ms"] > 0


class TestComponentHealthChecks:
    """Tests for standard health check functions."""

    @pytest.mark.asyncio
    async def test_kv_store_healthy(self):
        """Should return healthy when KV store is working."""
        mock_store = MagicMock()
        mock_store.health = AsyncMock(return_value=True)
        mock_metrics = MagicMock()
        mock_metrics.block_count = 10
        mock_metrics.total_bytes_stored = 1024
        mock_metrics.hit_rate = 0.95
        mock_store.get_metrics = AsyncMock(return_value=mock_metrics)

        result = await check_kv_store_health(mock_store)

        assert result.status == HealthStatus.HEALTHY
        assert result.metadata["block_count"] == 10

    @pytest.mark.asyncio
    async def test_kv_store_unhealthy(self):
        """Should return unhealthy when KV store fails."""
        mock_store = MagicMock()
        mock_store.health = AsyncMock(return_value=False)

        result = await check_kv_store_health(mock_store)

        assert result.status == HealthStatus.UNHEALTHY

    @pytest.mark.asyncio
    async def test_vllm_healthy(self):
        """Should return healthy when vLLM is responsive."""
        mock_client = MagicMock()
        mock_client.health = AsyncMock(return_value=True)
        mock_model = MagicMock()
        mock_model.id = "test-model"
        mock_client.list_models = AsyncMock(return_value=[mock_model])

        result = await check_vllm_health(mock_client)

        assert result.status == HealthStatus.HEALTHY
        assert "test-model" in result.metadata["models"]

    @pytest.mark.asyncio
    async def test_vllm_degraded(self):
        """Should return degraded when vLLM is not available."""
        mock_client = MagicMock()
        mock_client.health = AsyncMock(side_effect=Exception("Connection refused"))

        result = await check_vllm_health(mock_client)

        assert result.status == HealthStatus.DEGRADED

    @pytest.mark.asyncio
    async def test_registry_healthy(self):
        """Should return healthy when registry is working."""
        mock_registry = MagicMock()
        mock_registry.list_sessions = AsyncMock(return_value=[])

        result = await check_registry_health(mock_registry)

        assert result.status == HealthStatus.HEALTHY

    @pytest.mark.asyncio
    async def test_registry_unhealthy(self):
        """Should return unhealthy when registry fails."""
        mock_registry = MagicMock()
        mock_registry.list_sessions = AsyncMock(side_effect=Exception("DB error"))

        result = await check_registry_health(mock_registry)

        assert result.status == HealthStatus.UNHEALTHY


class TestGetMetrics:
    """Tests for global metrics accessor."""

    def test_returns_collector(self):
        """Should return a MetricsCollector instance."""
        metrics = get_metrics()
        assert isinstance(metrics, MetricsCollector)

    def test_returns_same_instance(self):
        """Should return the same instance each time."""
        metrics1 = get_metrics()
        metrics2 = get_metrics()
        assert metrics1 is metrics2
