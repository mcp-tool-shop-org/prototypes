"""
Monitoring and observability for Context Window Manager.

Provides:
- Prometheus-compatible metrics collection
- Health check endpoints
- Performance tracing with timing decorators
- Structured logging configuration
"""

from __future__ import annotations

import asyncio
import time
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from functools import wraps
from typing import TYPE_CHECKING, Any

import structlog

if TYPE_CHECKING:
    from collections.abc import AsyncIterator, Awaitable, Callable

logger = structlog.get_logger()


# =============================================================================
# Health Check Types
# =============================================================================


class HealthStatus(Enum):
    """Health check status values."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


@dataclass
class ComponentHealth:
    """Health status for a single component."""

    name: str
    status: HealthStatus
    message: str = ""
    latency_ms: float = 0.0
    last_check: datetime = field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "name": self.name,
            "status": self.status.value,
            "message": self.message,
            "latency_ms": round(self.latency_ms, 2),
            "last_check": self.last_check.isoformat(),
            "metadata": self.metadata,
        }


@dataclass
class SystemHealth:
    """Aggregated health status for all components."""

    status: HealthStatus
    components: list[ComponentHealth]
    uptime_seconds: float
    version: str
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "status": self.status.value,
            "uptime_seconds": round(self.uptime_seconds, 2),
            "version": self.version,
            "timestamp": self.timestamp.isoformat(),
            "components": [c.to_dict() for c in self.components],
        }


# =============================================================================
# Metrics Collection
# =============================================================================


@dataclass
class MetricValue:
    """A single metric value with labels."""

    name: str
    value: float
    labels: dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    help_text: str = ""
    metric_type: str = "gauge"  # gauge, counter, histogram


class MetricsCollector:
    """
    Collects and exposes Prometheus-compatible metrics.

    Provides counters, gauges, and histograms for observability.
    """

    def __init__(self):
        self._counters: dict[str, float] = {}
        self._gauges: dict[str, float] = {}
        self._histograms: dict[str, list[float]] = {}
        self._labels: dict[str, dict[str, str]] = {}
        self._help_texts: dict[str, str] = {}
        self._lock = asyncio.Lock()

    async def inc_counter(
        self,
        name: str,
        value: float = 1.0,
        labels: dict[str, str] | None = None,
        help_text: str = "",
    ) -> None:
        """Increment a counter metric."""
        async with self._lock:
            key = self._make_key(name, labels)
            self._counters[key] = self._counters.get(key, 0) + value
            if labels:
                self._labels[key] = labels
            if help_text:
                self._help_texts[name] = help_text

    async def set_gauge(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
        help_text: str = "",
    ) -> None:
        """Set a gauge metric value."""
        async with self._lock:
            key = self._make_key(name, labels)
            self._gauges[key] = value
            if labels:
                self._labels[key] = labels
            if help_text:
                self._help_texts[name] = help_text

    async def observe_histogram(
        self,
        name: str,
        value: float,
        labels: dict[str, str] | None = None,
        help_text: str = "",
    ) -> None:
        """Record a histogram observation."""
        async with self._lock:
            key = self._make_key(name, labels)
            if key not in self._histograms:
                self._histograms[key] = []
            self._histograms[key].append(value)
            # Keep only last 1000 observations per metric
            if len(self._histograms[key]) > 1000:
                self._histograms[key] = self._histograms[key][-1000:]
            if labels:
                self._labels[key] = labels
            if help_text:
                self._help_texts[name] = help_text

    def _make_key(self, name: str, labels: dict[str, str] | None) -> str:
        """Create a unique key for metric name + labels."""
        if not labels:
            return name
        label_str = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"

    async def get_all_metrics(self) -> list[MetricValue]:
        """Get all collected metrics."""
        async with self._lock:
            metrics = []

            for key, value in self._counters.items():
                name = key.split("{")[0]
                metrics.append(
                    MetricValue(
                        name=name,
                        value=value,
                        labels=self._labels.get(key, {}),
                        help_text=self._help_texts.get(name, ""),
                        metric_type="counter",
                    )
                )

            for key, value in self._gauges.items():
                name = key.split("{")[0]
                metrics.append(
                    MetricValue(
                        name=name,
                        value=value,
                        labels=self._labels.get(key, {}),
                        help_text=self._help_texts.get(name, ""),
                        metric_type="gauge",
                    )
                )

            for key, values in self._histograms.items():
                name = key.split("{")[0]
                if values:
                    # Compute histogram statistics
                    sorted_vals = sorted(values)
                    metrics.extend(
                        [
                            MetricValue(
                                name=f"{name}_count",
                                value=len(values),
                                labels=self._labels.get(key, {}),
                                metric_type="counter",
                            ),
                            MetricValue(
                                name=f"{name}_sum",
                                value=sum(values),
                                labels=self._labels.get(key, {}),
                                metric_type="counter",
                            ),
                            MetricValue(
                                name=f"{name}_p50",
                                value=sorted_vals[len(sorted_vals) // 2],
                                labels=self._labels.get(key, {}),
                                metric_type="gauge",
                            ),
                            MetricValue(
                                name=f"{name}_p99",
                                value=sorted_vals[int(len(sorted_vals) * 0.99)],
                                labels=self._labels.get(key, {}),
                                metric_type="gauge",
                            ),
                        ]
                    )

            return metrics

    async def export_prometheus(self) -> str:
        """Export metrics in Prometheus text format."""
        metrics = await self.get_all_metrics()
        lines = []
        seen_help = set()

        for metric in metrics:
            base_name = metric.name.rsplit("_", 1)[0]
            if base_name not in seen_help and metric.help_text:
                lines.append(f"# HELP {base_name} {metric.help_text}")
                lines.append(f"# TYPE {base_name} {metric.metric_type}")
                seen_help.add(base_name)

            if metric.labels:
                label_str = ",".join(f'{k}="{v}"' for k, v in metric.labels.items())
                lines.append(f"{metric.name}{{{label_str}}} {metric.value}")
            else:
                lines.append(f"{metric.name} {metric.value}")

        return "\n".join(lines)

    async def reset(self) -> None:
        """Reset all metrics (mainly for testing)."""
        async with self._lock:
            self._counters.clear()
            self._gauges.clear()
            self._histograms.clear()
            self._labels.clear()


# Global metrics collector
_metrics = MetricsCollector()


def get_metrics() -> MetricsCollector:
    """Get the global metrics collector."""
    return _metrics


# =============================================================================
# Performance Tracing
# =============================================================================


@asynccontextmanager
async def trace_operation(
    operation: str,
    labels: dict[str, str] | None = None,
    log_result: bool = True,
) -> AsyncIterator[dict[str, Any]]:
    """
    Context manager for tracing async operations.

    Records timing and success/failure metrics.

    Usage:
        async with trace_operation("freeze_window", {"session_id": "123"}) as trace:
            result = await do_work()
            trace["blocks"] = result.block_count
    """
    start_time = time.perf_counter()
    trace_data: dict[str, Any] = {"start_time": start_time}
    metrics = get_metrics()
    merged_labels = {**(labels or {}), "operation": operation}

    try:
        yield trace_data
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        trace_data["elapsed_ms"] = elapsed_ms
        trace_data["success"] = True

        await metrics.observe_histogram(
            "cwm_operation_duration_ms",
            elapsed_ms,
            merged_labels,
            "Operation duration in milliseconds",
        )
        await metrics.inc_counter(
            "cwm_operation_total",
            labels={**merged_labels, "status": "success"},
            help_text="Total operations",
        )

        if log_result:
            logger.info(
                f"Operation completed: {operation}",
                elapsed_ms=round(elapsed_ms, 2),
                **{
                    k: v
                    for k, v in trace_data.items()
                    if k not in ("start_time", "elapsed_ms", "success")
                },
            )

    except Exception as e:
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        trace_data["elapsed_ms"] = elapsed_ms
        trace_data["success"] = False
        trace_data["error"] = str(e)

        await metrics.observe_histogram(
            "cwm_operation_duration_ms",
            elapsed_ms,
            merged_labels,
            "Operation duration in milliseconds",
        )
        await metrics.inc_counter(
            "cwm_operation_total",
            labels={**merged_labels, "status": "error"},
            help_text="Total operations",
        )

        logger.error(
            f"Operation failed: {operation}",
            elapsed_ms=round(elapsed_ms, 2),
            error=str(e),
            error_type=type(e).__name__,
        )
        raise


def trace_method(operation: str | None = None):
    """
    Decorator for tracing async methods.

    Usage:
        @trace_method("freeze")
        async def freeze(self, ...):
            ...
    """

    def decorator(func: Callable[..., Awaitable[Any]]) -> Callable[..., Awaitable[Any]]:
        op_name = operation or func.__name__

        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            async with trace_operation(op_name, log_result=False):
                return await func(*args, **kwargs)

        return wrapper

    return decorator


# =============================================================================
# Health Checker
# =============================================================================


class HealthChecker:
    """
    Performs health checks on system components.

    Provides liveness and readiness probes.
    """

    def __init__(self, version: str = "0.6.0"):
        self._start_time = time.time()
        self._version = version
        self._checks: dict[str, Callable[[], Awaitable[ComponentHealth]]] = {}

    def register_check(
        self, name: str, check: Callable[[], Awaitable[ComponentHealth]]
    ) -> None:
        """Register a health check function."""
        self._checks[name] = check

    @property
    def uptime_seconds(self) -> float:
        """Get server uptime in seconds."""
        return time.time() - self._start_time

    async def check_component(self, name: str) -> ComponentHealth:
        """Run a single component health check."""
        if name not in self._checks:
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Unknown component: {name}",
            )

        start = time.perf_counter()
        try:
            result = await asyncio.wait_for(self._checks[name](), timeout=5.0)
            result.latency_ms = (time.perf_counter() - start) * 1000
            return result
        except TimeoutError:
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message="Health check timed out",
                latency_ms=(time.perf_counter() - start) * 1000,
            )
        except Exception as e:
            return ComponentHealth(
                name=name,
                status=HealthStatus.UNHEALTHY,
                message=f"Health check failed: {e}",
                latency_ms=(time.perf_counter() - start) * 1000,
            )

    async def check_all(self) -> SystemHealth:
        """Run all registered health checks."""
        components = await asyncio.gather(
            *[self.check_component(name) for name in self._checks]
        )

        # Determine overall status
        if all(c.status == HealthStatus.HEALTHY for c in components):
            status = HealthStatus.HEALTHY
        elif any(c.status == HealthStatus.UNHEALTHY for c in components):
            status = HealthStatus.UNHEALTHY
        else:
            status = HealthStatus.DEGRADED

        return SystemHealth(
            status=status,
            components=list(components),
            uptime_seconds=self.uptime_seconds,
            version=self._version,
        )

    async def liveness(self) -> bool:
        """Liveness probe - is the server running?"""
        return True

    async def readiness(self) -> bool:
        """Readiness probe - is the server ready to accept requests?"""
        health = await self.check_all()
        return health.status != HealthStatus.UNHEALTHY


# =============================================================================
# Standard Health Check Functions
# =============================================================================


async def check_kv_store_health(kv_store) -> ComponentHealth:
    """Health check for KV store."""
    try:
        health = await kv_store.health()
        if health:
            metrics = await kv_store.get_metrics()
            return ComponentHealth(
                name="kv_store",
                status=HealthStatus.HEALTHY,
                message="KV store is operational",
                metadata={
                    "block_count": metrics.block_count,
                    "total_bytes": metrics.total_bytes_stored,
                    "hit_rate": round(metrics.hit_rate, 4),
                },
            )
        return ComponentHealth(
            name="kv_store",
            status=HealthStatus.UNHEALTHY,
            message="KV store health check failed",
        )
    except Exception as e:
        return ComponentHealth(
            name="kv_store",
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )


async def check_vllm_health(vllm_client) -> ComponentHealth:
    """Health check for vLLM server."""
    try:
        healthy = await vllm_client.health()
        if healthy:
            models = await vllm_client.list_models()
            return ComponentHealth(
                name="vllm",
                status=HealthStatus.HEALTHY,
                message="vLLM server is responsive",
                metadata={"models": [m.id for m in models]},
            )
        return ComponentHealth(
            name="vllm",
            status=HealthStatus.DEGRADED,
            message="vLLM server not responding",
        )
    except Exception as e:
        return ComponentHealth(
            name="vllm",
            status=HealthStatus.DEGRADED,  # Degraded, not unhealthy - can operate without vLLM
            message=f"vLLM not available: {e}",
        )


async def check_registry_health(registry) -> ComponentHealth:
    """Health check for session registry."""
    try:
        # Try a simple query
        await registry.list_sessions(limit=1)
        return ComponentHealth(
            name="registry",
            status=HealthStatus.HEALTHY,
            message="Session registry is operational",
        )
    except Exception as e:
        return ComponentHealth(
            name="registry",
            status=HealthStatus.UNHEALTHY,
            message=str(e),
        )


# =============================================================================
# Structured Logging Configuration
# =============================================================================


def configure_logging(
    level: str = "INFO",
    json_output: bool = True,
    include_timestamp: bool = True,
) -> None:
    """
    Configure structured logging for the application.

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR)
        json_output: If True, output JSON; otherwise, use console format
        include_timestamp: Include ISO timestamp in log entries
    """
    import sys

    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if include_timestamp:
        processors.insert(0, structlog.processors.TimeStamper(fmt="iso"))

    if json_output:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
        cache_logger_on_first_use=True,
    )

    # Set the log level
    import logging

    logging.basicConfig(level=getattr(logging, level.upper(), logging.INFO))
