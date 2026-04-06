"""
MCP Server for Context Window Manager.

This module implements the MCP server that exposes context window management
tools to MCP clients like Claude Code.

Tools:
- window_freeze: Snapshot session KV cache to persistent storage
- window_thaw: Restore context from a saved window
- window_list: List available windows with filtering
- window_status: Get detailed session/window status
- window_delete: Remove a window and its cached blocks

Resources:
- sessions://list: List of active sessions
- windows://list: List of saved windows
- stats://cache: KV cache statistics
"""

from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import structlog
from mcp.server import FastMCP

from context_window_manager.config import Settings, load_settings
from context_window_manager.core.kv_store import (
    KVStoreBackend,
    StorageBackend,
    create_kv_store,
)
from context_window_manager.core.session_registry import (
    SessionRegistry,
    SessionState,
)
from context_window_manager.core.vllm_client import VLLMClient
from context_window_manager.core.window_manager import (
    AutoFreezeManager,
    AutoFreezePolicy,
    WindowManager,
)
from context_window_manager.errors import (
    ErrorContext,
    SessionNotFoundError,
    WindowNotFoundError,
)
from context_window_manager.monitoring import (
    HealthChecker,
    check_kv_store_health,
    check_registry_health,
    check_vllm_health,
    get_metrics,
)

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logger = structlog.get_logger()


# =============================================================================
# Server State
# =============================================================================


@dataclass
class ServerState:
    """Container for server runtime state."""

    settings: Settings
    registry: SessionRegistry
    kv_store: KVStoreBackend
    vllm_client: VLLMClient
    window_manager: WindowManager
    auto_freeze_manager: AutoFreezeManager
    health_checker: HealthChecker


# Global state - initialized during lifespan
_state: ServerState | None = None


def get_state() -> ServerState:
    """Get the current server state."""
    if _state is None:
        raise RuntimeError("Server not initialized")
    return _state


# =============================================================================
# Lifespan Management
# =============================================================================


@asynccontextmanager
async def lifespan(_app: FastMCP) -> AsyncIterator[None]:
    """Manage server lifecycle - initialize and cleanup resources."""
    global _state

    settings = load_settings()
    settings.ensure_directories()

    logger.info(
        "Starting Context Window Manager",
        version="0.1.0",
        db_path=str(settings.db_path),
        vllm_url=settings.vllm.url,
    )

    # Initialize components
    registry = SessionRegistry(settings.db_path)
    await registry.initialize()

    # Create KV store based on config
    if settings.storage.enable_disk and settings.storage.disk_path:
        kv_store = await create_kv_store(
            StorageBackend.DISK,
            storage_path=settings.storage.disk_path,
        )
    else:
        kv_store = await create_kv_store(StorageBackend.MEMORY)

    vllm_client = VLLMClient(settings.vllm)

    # Create the WindowManager orchestration layer
    window_manager = WindowManager(
        registry=registry,
        kv_store=kv_store,
        vllm_client=vllm_client,
    )

    # Create the AutoFreezeManager with default policy (disabled)
    auto_freeze_manager = AutoFreezeManager(
        window_manager=window_manager,
        policy=AutoFreezePolicy(enabled=False),
        max_context_tokens=settings.limits.max_context_tokens,
    )

    # Create the HealthChecker and register component checks
    health_checker = HealthChecker(version="0.6.0")
    health_checker.register_check("kv_store", lambda: check_kv_store_health(kv_store))
    health_checker.register_check("vllm", lambda: check_vllm_health(vllm_client))
    health_checker.register_check("registry", lambda: check_registry_health(registry))

    _state = ServerState(
        settings=settings,
        registry=registry,
        kv_store=kv_store,
        vllm_client=vllm_client,
        window_manager=window_manager,
        auto_freeze_manager=auto_freeze_manager,
        health_checker=health_checker,
    )

    logger.info("Server components initialized")

    try:
        yield
    finally:
        # Cleanup
        logger.info("Shutting down Context Window Manager")
        await vllm_client.close()
        await registry.close()
        _state = None
        logger.info("Shutdown complete")


# =============================================================================
# MCP Server Setup
# =============================================================================


mcp = FastMCP(
    name="context-window-manager",
    instructions="""
Context Window Manager provides tools to freeze and restore LLM context windows.

Use these tools to:
- Save your current conversation context as a "window" (freeze)
- Restore a previously saved context to continue where you left off (thaw)
- List and manage saved windows
- Check status of sessions and cache

This enables lossless context restoration - when you thaw a window, the LLM
gets the exact same KV cache state, not just a text summary.
""",
    lifespan=lifespan,
)


# =============================================================================
# Tool Implementations
# =============================================================================


@mcp.tool()
async def window_freeze(
    session_id: str,
    window_name: str,
    prompt_prefix: str = "",
    description: str = "",
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    Freeze the current session context as a named window.

    This captures the session's KV cache state and persists it for later restoration.
    The frozen window can be thawed to restore the exact context state.

    Args:
        session_id: The session to freeze (from current conversation)
        window_name: Unique name for this window (alphanumeric, hyphens, underscores)
        prompt_prefix: The conversation prompt that generated this context state
        description: Human-readable description of the context state
        tags: Optional tags for organization and filtering

    Returns:
        Information about the created window including block count and size.
    """
    state = get_state()

    async with ErrorContext(
        "window_freeze",
        logger=logger,
        session_id=session_id,
        window_name=window_name,
    ):
        logger.info(
            "Freezing window",
            session_id=session_id,
            window_name=window_name,
        )

        # Ensure session exists before freezing
        session = await state.registry.get_session(session_id)
        if not session:
            # Create a new session for this freeze operation
            session = await state.registry.create_session(
                session_id=session_id,
                model="unknown",  # Will be updated when we integrate with vLLM
            )

        # Use WindowManager for the actual freeze operation
        result = await state.window_manager.freeze(
            session_id=session_id,
            window_name=window_name,
            prompt_prefix=prompt_prefix,
            description=description,
            tags=tags,
        )

        logger.info(
            "Window frozen successfully",
            window_name=window_name,
            session_id=session_id,
            block_count=result.block_count,
        )

        return {
            **result.to_dict(),
            "description": description,
            "tags": tags or [],
            "message": f"Window '{window_name}' created from session '{session_id}'",
        }


@mcp.tool()
async def window_thaw(
    window_name: str,
    new_session_id: str | None = None,
    warm_cache: bool = True,
    continuation_prompt: str = "",
) -> dict[str, Any]:
    """
    Restore context from a frozen window.

    This loads the KV cache state from the window into a new or existing session,
    enabling true lossless context continuation.

    Args:
        window_name: Name of the window to restore
        new_session_id: Optional new session ID (auto-generated if not provided)
        warm_cache: Whether to pre-warm the cache by replaying the prompt (default: True)
        continuation_prompt: Optional prompt to continue the conversation after restoration

    Returns:
        Information about the restored session including:
        - cache_salt: Use this in vLLM requests to access restored context
        - cache_hit: Whether the KV cache was successfully restored
        - cache_efficiency: Ratio of tokens loaded from cache (0.0 to 1.0)
        - blocks_expected/blocks_found: Block restoration metrics
        - warnings: Any issues encountered during restoration
    """
    state = get_state()

    async with ErrorContext(
        "window_thaw",
        logger=logger,
        window_name=window_name,
        new_session_id=new_session_id,
    ):
        logger.info("Thawing window", window_name=window_name)

        # Use WindowManager for the actual thaw operation
        result = await state.window_manager.thaw(
            window_name=window_name,
            new_session_id=new_session_id,
            warm_cache=warm_cache,
            continuation_prompt=continuation_prompt,
        )

        # Get window for additional metadata
        window = await state.registry.get_window(window_name)

        logger.info(
            "Window thawed successfully",
            window_name=window_name,
            new_session_id=result.session_id,
            cache_hit=result.cache_hit,
            cache_efficiency=result.cache_efficiency,
        )

        return {
            **result.to_dict(),
            "model": window.model if window else "unknown",
            "block_count": window.block_count if window else 0,
            "message": f"Context restored from '{window_name}' to session '{result.session_id}'",
            "instructions": "Use the cache_salt in your vLLM requests to access the restored context",
        }


@mcp.tool()
async def window_clone(
    source_window: str,
    new_window_name: str,
    description: str = "",
    tags: list[str] | None = None,
) -> dict[str, Any]:
    """
    Clone an existing window to create an independent branch.

    This creates a new window that shares the same cached KV blocks as the source,
    allowing you to explore different conversation paths from the same starting point.
    The cloned window can be independently thawed and modified.

    Args:
        source_window: Name of the window to clone
        new_window_name: Name for the new cloned window
        description: Description for the cloned window
        tags: Optional tags for the cloned window

    Returns:
        Information about the cloned window including lineage (ancestry chain).
    """
    state = get_state()

    async with ErrorContext(
        "window_clone",
        logger=logger,
        source_window=source_window,
        new_window_name=new_window_name,
    ):
        logger.info(
            "Cloning window",
            source_window=source_window,
            new_window_name=new_window_name,
        )

        result = await state.window_manager.clone(
            source_window=source_window,
            new_window_name=new_window_name,
            description=description,
            tags=tags,
        )

        # Get source window for additional info
        source = await state.registry.get_window(source_window)

        logger.info(
            "Window cloned successfully",
            source_window=source_window,
            new_window_name=new_window_name,
            lineage_depth=len(result.lineage),
        )

        return {
            **result.to_dict(),
            "model": source.model if source else "unknown",
            "token_count": source.token_count if source else 0,
            "message": f"Created clone '{new_window_name}' from '{source_window}'",
            "instructions": "Use window_thaw to restore the cloned context",
        }


@mcp.tool()
async def window_list(
    tags: list[str] | None = None,
    model: str | None = None,
    session_id: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 20,
    offset: int = 0,
) -> dict[str, Any]:
    """
    List available windows with filtering, sorting, and pagination.

    Args:
        tags: Filter by tags (windows must have all specified tags)
        model: Filter by model name
        session_id: Filter by source session ID
        search: Search in window names and descriptions
        sort_by: Sort field (name, created_at, token_count, total_size_bytes)
        sort_order: Sort order (asc, desc)
        limit: Maximum number of results (default 20, max 100)
        offset: Pagination offset for fetching subsequent pages

    Returns:
        List of windows with metadata and pagination info.
    """
    state = get_state()

    # Validate sort parameters
    valid_sort_fields = {"name", "created_at", "token_count", "total_size_bytes"}
    if sort_by not in valid_sort_fields:
        return {
            "success": False,
            "error": f"Invalid sort_by: {sort_by}. Valid options: {', '.join(sorted(valid_sort_fields))}",
        }

    if sort_order not in ("asc", "desc"):
        return {
            "success": False,
            "error": f"Invalid sort_order: {sort_order}. Valid options: asc, desc",
        }

    # Clamp limit to reasonable range
    limit = max(1, min(limit, 100))

    windows, total = await state.registry.list_windows(
        tags=tags,
        model=model,
        session_id=session_id,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )

    # Calculate pagination info
    page = (offset // limit) + 1 if limit > 0 else 1
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    has_next = offset + limit < total
    has_prev = offset > 0

    return {
        "success": True,
        "windows": [w.to_dict() for w in windows],
        "total": total,
        "limit": limit,
        "offset": offset,
        "page": page,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_prev": has_prev,
    }


@mcp.tool()
async def window_status(
    window_name: str | None = None,
    session_id: str | None = None,
    include_cache_stats: bool = False,
    include_lineage: bool = False,
) -> dict[str, Any]:
    """
    Get detailed status of a window or session with optional extended info.

    Provide either window_name or session_id (not both).

    Args:
        window_name: Name of window to check
        session_id: Session ID to check
        include_cache_stats: Include KV cache storage statistics
        include_lineage: Include lineage/ancestry info for cloned windows

    Returns:
        Detailed status information with optional cache stats and lineage.
    """
    state = get_state()

    if window_name and session_id:
        return {
            "success": False,
            "error": "Provide either window_name or session_id, not both",
        }

    if not window_name and not session_id:
        return {
            "success": False,
            "error": "Provide either window_name or session_id",
        }

    if window_name:
        window = await state.registry.get_window(window_name)
        if not window:
            raise WindowNotFoundError(window_name)

        result: dict[str, Any] = {
            "success": True,
            "type": "window",
            "window": window.to_dict(),
        }

        # Add cache statistics if requested
        if include_cache_stats:
            cache_stats = await _get_window_cache_stats(state, window_name)
            result["cache_stats"] = cache_stats

        # Add lineage if requested
        if include_lineage:
            lineage = await _get_window_lineage_info(state, window_name)
            result["lineage"] = lineage

        return result

    if session_id:
        session = await state.registry.get_session(session_id)
        if not session:
            raise SessionNotFoundError(session_id)

        # Get windows for this session
        windows = await state.registry.get_windows_for_session(session_id)

        result = {
            "success": True,
            "type": "session",
            "session": session.to_dict(),
            "windows": [w.to_dict() for w in windows],
            "window_count": len(windows),
        }

        # Add aggregate cache stats for session
        if include_cache_stats:
            total_blocks = sum(w.block_count for w in windows)
            total_size = sum(w.total_size_bytes for w in windows)
            result["cache_stats"] = {
                "total_blocks": total_blocks,
                "total_size_bytes": total_size,
                "window_count": len(windows),
            }

        return result

    return {"success": False, "error": "Invalid state"}


async def _get_window_cache_stats(
    state: ServerState, window_name: str
) -> dict[str, Any]:
    """Get cache statistics for a specific window."""
    import json

    # Get stored metadata
    metadata_key = f"window:{window_name}:metadata"
    result = await state.kv_store.retrieve([metadata_key])

    if not result.found:
        return {
            "stored": False,
            "error": "No cache metadata found",
        }

    try:
        metadata = json.loads(result.found[metadata_key])
        block_hashes = metadata.get("block_hashes", [])

        # Check which blocks are still in cache
        if block_hashes:
            blocks_result = await state.kv_store.retrieve(block_hashes)
            blocks_found = len(blocks_result.found)
        else:
            blocks_found = 0

        return {
            "stored": True,
            "token_count": metadata.get("token_count", 0),
            "block_count": metadata.get("block_count", 0),
            "blocks_available": blocks_found,
            "cache_complete": blocks_found == len(block_hashes),
            "created_at": metadata.get("created_at"),
        }
    except (json.JSONDecodeError, KeyError) as e:
        return {
            "stored": False,
            "error": f"Failed to parse cache metadata: {e}",
        }


async def _get_window_lineage_info(
    state: ServerState, window_name: str
) -> dict[str, Any]:
    """Get lineage information for a window."""
    import json

    lineage_key = f"window:{window_name}:lineage"
    result = await state.kv_store.retrieve([lineage_key])

    if not result.found:
        return {
            "is_clone": False,
            "ancestors": [],
            "depth": 0,
        }

    try:
        lineage = json.loads(result.found[lineage_key])
        return {
            "is_clone": len(lineage) > 0,
            "ancestors": lineage,
            "depth": len(lineage),
            "root_window": lineage[0] if lineage else window_name,
            "parent_window": lineage[-1] if lineage else None,
        }
    except (json.JSONDecodeError, KeyError):
        return {
            "is_clone": False,
            "ancestors": [],
            "depth": 0,
        }


@mcp.tool()
async def window_delete(
    window_name: str,
    delete_blocks: bool = False,
) -> dict[str, Any]:
    """
    Delete a window.

    Args:
        window_name: Name of the window to delete
        delete_blocks: If True, also delete the cached KV blocks (default: False)

    Returns:
        Confirmation of deletion.
    """
    state = get_state()

    async with ErrorContext(
        "window_delete",
        logger=logger,
        window_name=window_name,
        delete_blocks=delete_blocks,
    ):
        logger.info(
            "Deleting window", window_name=window_name, delete_blocks=delete_blocks
        )

        window = await state.registry.get_window(window_name)
        if not window:
            raise WindowNotFoundError(window_name)

        # Delete KV blocks if requested
        if delete_blocks and window.block_hashes:
            for block_hash in window.block_hashes:
                await state.kv_store.delete(block_hash)
            logger.info(
                "Deleted KV blocks",
                window_name=window_name,
                block_count=len(window.block_hashes),
            )

        # Delete the window record
        await state.registry.delete_window(window_name)

        return {
            "success": True,
            "window_name": window_name,
            "blocks_deleted": delete_blocks,
            "message": f"Window '{window_name}' deleted",
        }


@mcp.tool()
async def session_list(
    state_filter: str | None = None,
    model: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    """
    List sessions with optional filtering.

    Args:
        state_filter: Filter by state (active, frozen, thawed, expired, deleted)
        model: Filter by model name
        limit: Maximum number of results

    Returns:
        List of sessions with metadata.
    """
    server_state = get_state()

    # Convert state filter string to enum
    session_state = None
    if state_filter:
        try:
            session_state = SessionState(state_filter.lower())
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid state: {state_filter}. Valid states: active, frozen, thawed, expired, deleted",
            }

    sessions = await server_state.registry.list_sessions(
        state=session_state,
        model=model,
        limit=limit,
    )

    return {
        "success": True,
        "sessions": [s.to_dict() for s in sessions],
        "count": len(sessions),
        "limit": limit,
    }


@mcp.tool()
async def cache_stats() -> dict[str, Any]:
    """
    Get KV cache statistics.

    Returns:
        Cache hit rate, stored blocks, and storage usage.
    """
    state = get_state()

    # Get KV store metrics
    kv_metrics = await state.kv_store.get_metrics()

    # Try to get vLLM cache stats
    vllm_stats = None
    try:
        if await state.vllm_client.health():
            vllm_stats = await state.vllm_client.get_cache_stats()
    except Exception as e:
        logger.debug("Could not get vLLM stats", error=str(e))

    return {
        "success": True,
        "kv_store": {
            "total_blocks": kv_metrics.block_count,
            "total_size_bytes": kv_metrics.total_bytes_stored,
            "hit_rate": kv_metrics.hit_rate,
            "hits": kv_metrics.hits,
            "misses": kv_metrics.misses,
        },
        "vllm": {
            "connected": vllm_stats is not None,
            "hit_rate": vllm_stats.hit_rate if vllm_stats else None,
            "cached_tokens": vllm_stats.num_cached_tokens if vllm_stats else None,
        },
    }


@mcp.tool()
async def health_check(
    component: str | None = None,
) -> dict[str, Any]:
    """
    Check health status of the system or a specific component.

    Args:
        component: Specific component to check (kv_store, vllm, registry).
                   If not provided, checks all components.

    Returns:
        Health status including:
        - status: overall health (healthy, degraded, unhealthy)
        - uptime_seconds: how long the server has been running
        - components: individual component health status
    """
    state = get_state()

    if component:
        # Check single component
        result = await state.health_checker.check_component(component)
        return {
            "success": True,
            **result.to_dict(),
        }

    # Check all components
    health = await state.health_checker.check_all()
    return {
        "success": True,
        **health.to_dict(),
    }


@mcp.tool()
async def get_metrics_data(
    format: str = "json",
) -> dict[str, Any] | str:
    """
    Get collected metrics data.

    Args:
        format: Output format - "json" for structured data or "prometheus" for text format.

    Returns:
        Metrics data in the requested format including:
        - Operation counts and durations
        - Error rates
        - Cache statistics
    """
    metrics = get_metrics()

    if format == "prometheus":
        prometheus_text = await metrics.export_prometheus()
        return {
            "success": True,
            "format": "prometheus",
            "content": prometheus_text,
        }

    # JSON format
    all_metrics = await metrics.get_all_metrics()
    return {
        "success": True,
        "format": "json",
        "metrics": [
            {
                "name": m.name,
                "value": m.value,
                "type": m.metric_type,
                "labels": m.labels,
                "help": m.help_text,
            }
            for m in all_metrics
        ],
    }


@mcp.tool()
async def auto_freeze_config(
    enabled: bool | None = None,
    token_threshold: float | None = None,
    token_count_threshold: int | None = None,
    cooldown_seconds: int | None = None,
    window_name_pattern: str | None = None,
    tags: list[str] | None = None,
    include_prompt: bool | None = None,
) -> dict[str, Any]:
    """
    Configure automatic context freezing policy.

    Call with no arguments to get current configuration.
    Pass values to update specific settings.

    Args:
        enabled: Enable or disable auto-freeze
        token_threshold: Percentage (0-1) of context to trigger freeze (default 0.75)
        token_count_threshold: Absolute token count to trigger freeze (0 = disabled)
        cooldown_seconds: Minimum seconds between auto-freezes (default 60)
        window_name_pattern: Pattern for window names ({session_id}, {timestamp}, {count})
        tags: Tags to add to auto-frozen windows
        include_prompt: Whether to include prompt prefix when freezing

    Returns:
        Current auto-freeze configuration.
    """
    state = get_state()
    manager = state.auto_freeze_manager

    # Build updates dict from provided arguments
    updates: dict[str, Any] = {}
    if enabled is not None:
        updates["enabled"] = enabled
    if token_threshold is not None:
        if not (0.0 < token_threshold <= 1.0):
            return {
                "success": False,
                "error": "token_threshold must be between 0 and 1",
            }
        updates["token_threshold"] = token_threshold
    if token_count_threshold is not None:
        if token_count_threshold < 0:
            return {
                "success": False,
                "error": "token_count_threshold must be non-negative",
            }
        updates["token_count_threshold"] = token_count_threshold
    if cooldown_seconds is not None:
        if cooldown_seconds < 0:
            return {
                "success": False,
                "error": "cooldown_seconds must be non-negative",
            }
        updates["cooldown_seconds"] = cooldown_seconds
    if window_name_pattern is not None:
        updates["window_name_pattern"] = window_name_pattern
    if tags is not None:
        updates["tags"] = tags
    if include_prompt is not None:
        updates["include_prompt"] = include_prompt

    # Apply updates if any
    if updates:
        manager.update_policy(**updates)
        logger.info("Auto-freeze policy updated", updates=updates)

    # Return current configuration
    policy = manager.policy
    return {
        "success": True,
        "policy": {
            "enabled": policy.enabled,
            "token_threshold": policy.token_threshold,
            "token_count_threshold": policy.token_count_threshold,
            "cooldown_seconds": policy.cooldown_seconds,
            "window_name_pattern": policy.window_name_pattern,
            "tags": policy.tags,
            "include_prompt": policy.include_prompt,
        },
        "max_context_tokens": manager.max_context_tokens,
    }


@mcp.tool()
async def auto_freeze_check(
    session_id: str,
    token_count: int,
    prompt_prefix: str = "",
) -> dict[str, Any]:
    """
    Check if auto-freeze should trigger and perform it if thresholds are exceeded.

    This tool is designed to be called periodically or after context updates
    to check if automatic freezing should occur.

    Args:
        session_id: Session ID to check
        token_count: Current token count for the session
        prompt_prefix: Current conversation/prompt content (optional)

    Returns:
        Result indicating whether freeze was triggered, with details.
    """
    state = get_state()

    # Verify session exists
    session = await state.registry.get_session(session_id)
    if not session:
        return {
            "success": False,
            "error": f"Session not found: {session_id}",
        }

    # Check and potentially trigger auto-freeze
    result = await state.auto_freeze_manager.check_and_freeze(
        session_id=session_id,
        token_count=token_count,
        prompt_prefix=prompt_prefix,
    )

    return {
        "success": True,
        **result.to_dict(),
    }


# =============================================================================
# Resources
# =============================================================================


@mcp.resource("sessions://list")
async def list_sessions_resource() -> str:
    """List all active sessions."""
    state = get_state()
    sessions = await state.registry.list_sessions(limit=100)

    lines = ["# Active Sessions\n"]
    for s in sessions:
        lines.append(
            f"- **{s.id}** ({s.state.value}): {s.model}, {s.token_count} tokens"
        )

    return "\n".join(lines)


@mcp.resource("windows://list")
async def list_windows_resource() -> str:
    """List all saved windows."""
    state = get_state()
    windows, _ = await state.registry.list_windows(limit=100)

    lines = ["# Saved Windows\n"]
    for w in windows:
        tags_str = ", ".join(w.tags) if w.tags else "none"
        lines.append(
            f"- **{w.name}**: {w.description or 'No description'} (tags: {tags_str})"
        )

    return "\n".join(lines)


@mcp.resource("stats://cache")
async def cache_stats_resource() -> str:
    """Get cache statistics."""
    state = get_state()
    metrics = await state.kv_store.get_metrics()

    return f"""# Cache Statistics

- Total Blocks: {metrics.block_count}
- Total Size: {metrics.total_bytes_stored / 1024:.2f} KB
- Hit Rate: {metrics.hit_rate:.1%}
- Hits: {metrics.hits}
- Misses: {metrics.misses}
"""


@mcp.resource("health://status")
async def health_status_resource() -> str:
    """Get system health status."""
    state = get_state()
    health = await state.health_checker.check_all()

    lines = [f"# System Health: {health.status.value.upper()}\n"]
    lines.append(f"- Version: {health.version}")
    lines.append(f"- Uptime: {health.uptime_seconds:.0f} seconds")
    lines.append(f"- Timestamp: {health.timestamp.isoformat()}\n")
    lines.append("## Components\n")

    for component in health.components:
        emoji = (
            "✅"
            if component.status.value == "healthy"
            else "⚠️"
            if component.status.value == "degraded"
            else "❌"
        )
        lines.append(
            f"- {emoji} **{component.name}**: {component.status.value} ({component.latency_ms:.1f}ms)"
        )
        if component.message:
            lines.append(f"  - {component.message}")

    return "\n".join(lines)


# =============================================================================
# Server Entry Point
# =============================================================================


async def run_server() -> None:
    """
    Run the Context Window Manager MCP server.

    This is the main entry point that starts the server on stdio transport.
    """
    # Configure structured logging for stderr (stdout is for MCP protocol)
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.BoundLogger,
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stderr),
    )

    logger.info("Starting MCP server on stdio")

    try:
        await mcp.run_stdio_async()
    except KeyboardInterrupt:
        logger.info("Received interrupt, shutting down")
    except Exception as e:
        logger.error("Server error", error=str(e))
        raise


def main() -> None:
    """Synchronous entry point."""
    asyncio.run(run_server())


if __name__ == "__main__":
    main()
