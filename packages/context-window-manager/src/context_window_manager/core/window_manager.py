"""
Window Manager for Context Window Manager.

Orchestrates freeze and thaw operations, coordinating between
the session registry, KV store, and vLLM client.

The key insight is that vLLM's cache_salt mechanism provides session isolation:
- Each session has a unique cache_salt (base64-encoded 32-byte string)
- The salt is injected into block hashes, isolating the KV cache
- LMCache automatically persists blocks to configured storage backends
- Restoration works by making a request with the same cache_salt + prompt prefix

Freeze captures:
- Session metadata (model, token count, state)
- The cache_salt for KV cache isolation
- The prompt prefix that generated the cached KV state
- Block metadata (hashes computed from prompt + salt)

Thaw restores by:
- Loading window metadata
- Creating a new session with derived cache_salt
- Making a "warming" request with the original prompt prefix
- LMCache automatically loads the cached blocks
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, ClassVar

import structlog

from context_window_manager.core.kv_store import KVStoreBackend, compute_block_hash
from context_window_manager.core.session_registry import (
    Session,
    SessionRegistry,
    SessionState,
    Window,
)
from context_window_manager.core.storage_keys import (
    check_schema_compatibility,
    unwrap_metadata,
    validate_session_id,
    validate_window_name,
    window_lineage_key,
    window_metadata_key,
    window_prompt_key,
    wrap_metadata,
)
from context_window_manager.errors import (
    InvalidStateTransitionError,
    SessionNotFoundError,
    ValidationError,
    WindowAlreadyExistsError,
    WindowNotFoundError,
)

if TYPE_CHECKING:
    from context_window_manager.core.vllm_client import VLLMClient
    pass

logger = structlog.get_logger()


# =============================================================================
# Result Types
# =============================================================================


@dataclass
class FreezeResult:
    """Result of a freeze operation."""

    success: bool
    window_name: str
    session_id: str
    block_count: int = 0
    total_size_bytes: int = 0
    cache_salt: str = ""
    prompt_hash: str = ""
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for MCP response."""
        return {
            "success": self.success,
            "window_name": self.window_name,
            "session_id": self.session_id,
            "block_count": self.block_count,
            "total_size_bytes": self.total_size_bytes,
            "cache_salt": self.cache_salt[:16] + "..." if self.cache_salt else None,
            "prompt_hash": self.prompt_hash,
            "error": self.error,
        }


@dataclass
class CloneResult:
    """Result of a clone operation."""

    success: bool
    source_window: str
    new_window_name: str
    block_count: int = 0
    total_size_bytes: int = 0
    lineage: list[str] = field(default_factory=list)  # Ancestry chain
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for MCP response."""
        return {
            "success": self.success,
            "source_window": self.source_window,
            "new_window_name": self.new_window_name,
            "block_count": self.block_count,
            "total_size_bytes": self.total_size_bytes,
            "lineage": self.lineage,
            "error": self.error,
        }


@dataclass
class ThawResult:
    """Result of a thaw operation."""

    success: bool
    window_name: str
    session_id: str
    cache_salt: str = ""
    token_count: int = 0
    restoration_time_ms: int = 0
    cache_hit: bool = False
    # Enhanced metrics for Phase 4
    blocks_expected: int = 0
    blocks_found: int = 0
    cache_efficiency: float = 0.0  # Ratio of cached vs recomputed tokens
    model_compatible: bool = True
    warnings: list[str] = field(default_factory=list)
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for MCP response."""
        result = {
            "success": self.success,
            "window_name": self.window_name,
            "session_id": self.session_id,
            "cache_salt": self.cache_salt[:16] + "..." if self.cache_salt else None,
            "token_count": self.token_count,
            "restoration_time_ms": self.restoration_time_ms,
            "cache_hit": self.cache_hit,
            "blocks_expected": self.blocks_expected,
            "blocks_found": self.blocks_found,
            "cache_efficiency": round(self.cache_efficiency, 2),
            "model_compatible": self.model_compatible,
            "error": self.error,
        }
        if self.warnings:
            result["warnings"] = self.warnings
        return result


@dataclass
class WarmCacheResult:
    """Result of a cache warming operation."""

    success: bool
    cache_hit: bool = False
    prompt_tokens_processed: int = 0
    tokens_from_cache: int = 0
    cache_efficiency: float = 0.0  # 0.0 to 1.0
    error: str | None = None


@dataclass
class CacheInfo:
    """Information about cached KV blocks for a session."""

    cache_salt: str
    prompt_prefix: str
    prompt_hash: str
    token_count: int
    block_count: int
    block_hashes: list[str] = field(default_factory=list)
    estimated_size_bytes: int = 0


# =============================================================================
# Window Manager
# =============================================================================


class WindowManager:
    """
    Orchestrates context window operations.

    Coordinates between SessionRegistry, KVStore, and VLLMClient
    to implement freeze, thaw, and related operations.

    The manager understands the vLLM + LMCache architecture:
    - cache_salt provides session isolation via hash injection
    - LMCache handles actual block persistence/retrieval
    - We track metadata and prompt prefixes for restoration
    """

    # Typical KV cache size per token per layer (approximate)
    # This varies by model but gives reasonable estimates
    BYTES_PER_TOKEN_ESTIMATE = 512  # Conservative estimate

    def __init__(
        self,
        registry: SessionRegistry,
        kv_store: KVStoreBackend,
        vllm_client: VLLMClient,
    ):
        """
        Initialize the window manager.

        Args:
            registry: Session and window metadata storage
            kv_store: KV cache block storage abstraction
            vllm_client: Client for vLLM API communication
        """
        self.registry = registry
        self.kv_store = kv_store
        self.vllm = vllm_client

    async def freeze(
        self,
        session_id: str,
        window_name: str,
        prompt_prefix: str = "",
        description: str = "",
        tags: list[str] | None = None,
    ) -> FreezeResult:
        """
        Freeze a session's context to a named window.

        This captures:
        1. Session metadata (model, cache_salt, token count)
        2. The prompt prefix that generated the KV cache
        3. Block hashes computed from the prompt + cache_salt

        The actual KV blocks are managed by LMCache, which automatically
        persists them to configured storage backends.

        Args:
            session_id: ID of the session to freeze
            window_name: Unique name for the frozen window
            prompt_prefix: The prompt text that generated the cached state
            description: Human-readable description
            tags: Tags for organization and filtering

        Returns:
            FreezeResult with operation outcome
        """
        tags = tags or []

        # Validate and normalize IDs before any operations
        session_id = validate_session_id(session_id)
        window_name = validate_window_name(window_name)

        log = logger.bind(session_id=session_id, window_name=window_name)
        log.info("Starting freeze operation")

        # Validate session exists
        session = await self.registry.get_session(session_id)
        if not session:
            log.warning("Session not found")
            raise SessionNotFoundError(session_id)

        # Validate session state allows freezing
        if session.state not in (SessionState.ACTIVE, SessionState.THAWED):
            log.warning("Invalid session state for freeze", state=session.state.value)
            raise InvalidStateTransitionError(
                session.state.value,
                SessionState.FROZEN.value,
            )

        # Check window name is available
        existing = await self.registry.get_window(window_name)
        if existing:
            log.warning("Window name already exists")
            raise WindowAlreadyExistsError(window_name)

        # Compute prompt hash for identification
        prompt_hash = self._compute_prompt_hash(prompt_prefix, session.cache_salt)

        # Estimate block information
        # In a full LMCache integration, we would query the cache for actual blocks
        cache_info = self._estimate_cache_info(
            session=session,
            prompt_prefix=prompt_prefix,
            prompt_hash=prompt_hash,
        )

        # Store block metadata in our KV store for tracking
        # (LMCache handles actual block persistence)
        await self._store_block_metadata(
            window_name=window_name,
            cache_info=cache_info,
        )

        # Create window record
        window = Window(
            name=window_name,
            session_id=session_id,
            description=description,
            tags=tags,
            block_count=cache_info.block_count,
            block_hashes=cache_info.block_hashes,
            total_size_bytes=cache_info.estimated_size_bytes,
            model=session.model,
            token_count=cache_info.token_count,
        )

        await self.registry.create_window(window)

        # Store the prompt prefix for thaw restoration
        await self._store_prompt_prefix(window_name, prompt_prefix, session.cache_salt)

        # Update session state to FROZEN
        await self.registry.update_session(
            session_id,
            state=SessionState.FROZEN,
            frozen_at=datetime.now(UTC),
        )

        log.info(
            "Freeze operation completed",
            block_count=cache_info.block_count,
            size_bytes=cache_info.estimated_size_bytes,
        )

        return FreezeResult(
            success=True,
            window_name=window_name,
            session_id=session_id,
            block_count=cache_info.block_count,
            total_size_bytes=cache_info.estimated_size_bytes,
            cache_salt=session.cache_salt,
            prompt_hash=prompt_hash,
        )

    async def thaw(
        self,
        window_name: str,
        new_session_id: str | None = None,
        warm_cache: bool = True,
        continuation_prompt: str = "",
    ) -> ThawResult:
        """
        Restore context from a frozen window.

        This:
        1. Loads window metadata (model, token count, cache_salt derivation)
        2. Validates model compatibility
        3. Verifies stored blocks are available
        4. Creates a new session with compatible cache_salt
        5. Optionally makes a warming request to trigger LMCache block loading

        Args:
            window_name: Name of the window to thaw
            new_session_id: Optional ID for new session (auto-generated if not provided)
            warm_cache: Whether to make a warming request to load cache
            continuation_prompt: Optional prompt to append after restoration

        Returns:
            ThawResult with operation outcome and detailed metrics
        """
        # Validate and normalize IDs before any operations
        window_name = validate_window_name(window_name)
        if new_session_id:
            new_session_id = validate_session_id(new_session_id)

        log = logger.bind(window_name=window_name)
        log.info("Starting thaw operation")

        warnings: list[str] = []

        # Get window metadata
        window = await self.registry.get_window(window_name)
        if not window:
            log.warning("Window not found")
            raise WindowNotFoundError(window_name)

        # Check model compatibility
        model_compatible, model_warnings = await self._check_model_compatibility(
            window.model
        )
        warnings.extend(model_warnings)

        if not model_compatible:
            log.warning("Model not compatible", model=window.model, warnings=warnings)
            # Don't fail - allow proceeding with warnings

        # Verify stored blocks
        blocks_expected, blocks_found = await self._verify_stored_blocks(window_name)
        if blocks_expected > 0 and blocks_found < blocks_expected:
            warnings.append(
                f"Only {blocks_found}/{blocks_expected} blocks found in storage"
            )

        # Generate session ID if not provided
        if not new_session_id:
            timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
            new_session_id = f"thaw-{window_name}-{timestamp}"

        # Get the original cache_salt for cache restoration
        # We store this separately but create a new unique salt for the session
        original_cache_salt = await self._get_stored_cache_salt(window_name)
        if not original_cache_salt:
            original_cache_salt = self._derive_cache_salt(window)
            warnings.append("Using derived cache_salt - original not stored")

        # Create new session with its own cache_salt
        # (cache_salt is unique per session in the database)
        session = await self.registry.create_session(
            session_id=new_session_id,
            model=window.model,
            token_count=window.token_count,
            metadata={
                "source_window": window_name,
                "thawed_at": datetime.now(UTC).isoformat(),
                "original_session_id": window.session_id,
                "original_cache_salt": original_cache_salt,
                "continuation_prompt": continuation_prompt
                if continuation_prompt
                else None,
            },
        )

        # For warming, use the original cache_salt so LMCache finds the blocks
        cache_salt = original_cache_salt

        # Initialize result metrics
        restoration_time_ms = 0
        cache_hit = False
        cache_efficiency = 0.0

        # Warm the cache by making a request with the original prompt
        if warm_cache:
            start_time = time.time()
            warm_result = await self._warm_cache(
                window=window,
                cache_salt=cache_salt,
            )
            restoration_time_ms = int((time.time() - start_time) * 1000)

            cache_hit = warm_result.cache_hit
            cache_efficiency = warm_result.cache_efficiency

            if warm_result.error:
                warnings.append(f"Cache warming issue: {warm_result.error}")

        log.info(
            "Thaw operation completed",
            new_session_id=new_session_id,
            cache_hit=cache_hit,
            cache_efficiency=cache_efficiency,
            restoration_time_ms=restoration_time_ms,
            warnings_count=len(warnings),
        )

        return ThawResult(
            success=True,
            window_name=window_name,
            session_id=new_session_id,
            cache_salt=session.cache_salt,
            token_count=window.token_count,
            restoration_time_ms=restoration_time_ms,
            cache_hit=cache_hit,
            blocks_expected=blocks_expected,
            blocks_found=blocks_found,
            cache_efficiency=cache_efficiency,
            model_compatible=model_compatible,
            warnings=warnings,
        )

    async def clone(
        self,
        source_window: str,
        new_window_name: str,
        description: str = "",
        tags: list[str] | None = None,
    ) -> CloneResult:
        """
        Clone an existing window to create an independent branch.

        This creates a new window that shares the same cached KV blocks
        but can be independently thawed and modified.

        Args:
            source_window: Name of the window to clone
            new_window_name: Name for the cloned window
            description: Description for the new window
            tags: Optional tags for the new window

        Returns:
            CloneResult with operation outcome
        """
        # Validate and normalize IDs before any operations
        source_window = validate_window_name(source_window)
        new_window_name = validate_window_name(new_window_name)

        log = logger.bind(source_window=source_window, new_window_name=new_window_name)
        log.info("Starting clone operation")

        # Get source window
        source = await self.registry.get_window(source_window)
        if not source:
            log.warning("Source window not found")
            raise WindowNotFoundError(source_window)

        # Check if target window already exists
        existing = await self.registry.get_window(new_window_name)
        if existing:
            log.warning("Target window already exists")
            raise WindowAlreadyExistsError(new_window_name)

        # Build lineage chain
        lineage = await self._get_window_lineage(source_window)
        lineage.append(source_window)  # Add source to lineage

        # Copy stored metadata (prompt, cache_salt)
        original_cache_salt = await self._get_stored_cache_salt(source_window)
        original_prompt = await self._get_stored_prompt(source_window)

        # Create new window record with same block references
        new_window = Window(
            name=new_window_name,
            session_id=source.session_id,  # Reference original session
            description=description or f"Clone of {source_window}",
            tags=tags or source.tags.copy(),
            block_count=source.block_count,
            block_hashes=source.block_hashes.copy(),
            total_size_bytes=source.total_size_bytes,
            model=source.model,
            token_count=source.token_count,
        )

        await self.registry.create_window(new_window)

        # Copy prompt and metadata to new window
        if original_prompt:
            await self._store_prompt_prefix(
                new_window_name,
                original_prompt,
                original_cache_salt or "",
            )

        # Store lineage metadata
        await self._store_window_lineage(new_window_name, lineage)

        log.info(
            "Clone operation completed",
            source_window=source_window,
            new_window_name=new_window_name,
            lineage_depth=len(lineage),
        )

        return CloneResult(
            success=True,
            source_window=source_window,
            new_window_name=new_window_name,
            block_count=source.block_count,
            total_size_bytes=source.total_size_bytes,
            lineage=lineage,
        )

    async def _get_window_lineage(self, window_name: str) -> list[str]:
        """Get the lineage (ancestry chain) for a window."""
        import json

        # Use centralized key naming
        lineage_key = window_lineage_key(window_name)
        result = await self.kv_store.retrieve([lineage_key])

        if not result.found:
            return []

        try:
            raw_data = result.found[lineage_key]
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8")

            envelope = json.loads(raw_data)

            # Handle both wrapped (new) and unwrapped (legacy) formats
            if "_schema_version" in envelope:
                _, data = unwrap_metadata(envelope)
                return data.get("lineage", [])
            else:
                # Legacy format: direct list
                return envelope if isinstance(envelope, list) else []
        except (json.JSONDecodeError, KeyError, ValidationError):
            return []

    async def _store_window_lineage(self, window_name: str, lineage: list[str]) -> None:
        """Store the lineage for a window."""
        import json

        # Use centralized key naming
        lineage_key = window_lineage_key(window_name)

        # Wrap with schema version
        envelope = wrap_metadata({"lineage": lineage})

        await self.kv_store.store(
            blocks={lineage_key: json.dumps(envelope).encode()},
            session_id=window_name,
        )

    # =========================================================================
    # Internal Methods
    # =========================================================================

    def _compute_prompt_hash(self, prompt: str, cache_salt: str) -> str:
        """Compute a hash of the prompt + cache_salt for identification."""
        content = f"{cache_salt}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _estimate_cache_info(
        self,
        session: Session,
        prompt_prefix: str,
        prompt_hash: str,
    ) -> CacheInfo:
        """
        Estimate cache information for a session.

        In a full LMCache integration, we would query the cache for actual blocks.
        For now, we estimate based on token count.
        """
        # Estimate token count from prompt if not in session
        token_count = session.token_count or len(prompt_prefix) // 4

        # Estimate block count (vLLM typically uses 16-token blocks)
        block_size = 16
        block_count = (token_count + block_size - 1) // block_size

        # Compute block hashes
        block_hashes = []
        for i in range(block_count):
            # Simulate block hash computation
            block_data = f"{session.cache_salt}:block:{i}"
            block_hash = compute_block_hash(
                block_data.encode(),
                session.id,
                layer_index=i,
            )
            block_hashes.append(block_hash)

        # Estimate total size
        estimated_size = token_count * self.BYTES_PER_TOKEN_ESTIMATE

        return CacheInfo(
            cache_salt=session.cache_salt,
            prompt_prefix=prompt_prefix,
            prompt_hash=prompt_hash,
            token_count=token_count,
            block_count=block_count,
            block_hashes=block_hashes,
            estimated_size_bytes=estimated_size,
        )

    async def _store_block_metadata(
        self,
        window_name: str,
        cache_info: CacheInfo,
    ) -> dict[str, Any]:
        """
        Store block metadata for tracking purposes.

        Returns metadata about what was stored.

        The metadata is wrapped with schema version info for forward compatibility.
        """
        import json

        # Use centralized key naming
        metadata_key = window_metadata_key(window_name)

        # Core metadata payload
        metadata = {
            "window_name": window_name,
            "cache_salt": cache_info.cache_salt,
            "prompt_hash": cache_info.prompt_hash,
            "token_count": cache_info.token_count,
            "block_count": cache_info.block_count,
            "block_hashes": cache_info.block_hashes,
        }

        # Wrap with schema version and timestamp
        envelope = wrap_metadata(metadata)

        # Store as dict of blocks (KV store API)
        await self.kv_store.store(
            blocks={metadata_key: json.dumps(envelope).encode()},
            session_id=window_name,
        )

        return metadata

    async def _store_prompt_prefix(
        self,
        window_name: str,
        prompt_prefix: str,
        cache_salt: str,
    ) -> None:
        """Store the prompt prefix for later restoration."""
        import json

        # Use centralized key naming
        prompt_key = window_prompt_key(window_name)
        prompt_data = {
            "prompt_prefix": prompt_prefix,
            "cache_salt": cache_salt,
        }

        # Wrap with schema version
        envelope = wrap_metadata(prompt_data)

        # Store as dict of blocks (KV store API)
        await self.kv_store.store(
            blocks={prompt_key: json.dumps(envelope).encode()},
            session_id=window_name,
        )

    async def _get_stored_cache_salt(self, window_name: str) -> str | None:
        """Retrieve the stored cache_salt for a window."""
        import json

        # Use centralized key naming
        prompt_key = window_prompt_key(window_name)
        result = await self.kv_store.retrieve([prompt_key])

        if not result.found:
            return None

        try:
            raw_data = result.found[prompt_key]
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8")

            envelope = json.loads(raw_data)

            # Handle both wrapped (new) and unwrapped (legacy) formats
            if "_schema_version" in envelope:
                _, data = unwrap_metadata(envelope)
            else:
                data = envelope

            return data.get("cache_salt")
        except (json.JSONDecodeError, KeyError, ValidationError):
            logger.warning(
                "Failed to retrieve cache_salt",
                window_name=window_name,
            )
            return None

    async def _get_stored_prompt(self, window_name: str) -> str | None:
        """Retrieve the stored prompt prefix for a window."""
        import json

        # Use centralized key naming
        prompt_key = window_prompt_key(window_name)
        result = await self.kv_store.retrieve([prompt_key])

        if not result.found:
            return None

        try:
            raw_data = result.found[prompt_key]
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode("utf-8")

            envelope = json.loads(raw_data)

            # Handle both wrapped (new) and unwrapped (legacy) formats
            if "_schema_version" in envelope:
                _, data = unwrap_metadata(envelope)
            else:
                data = envelope

            return data.get("prompt_prefix")
        except (json.JSONDecodeError, KeyError, ValidationError):
            logger.warning(
                "Failed to retrieve prompt",
                window_name=window_name,
            )
            return None

    def _derive_cache_salt(self, window: Window) -> str:
        """
        Derive a cache_salt that matches the original session.

        For true restoration, we need the exact salt. This is a fallback
        that creates a deterministic salt from window metadata.
        """
        import base64

        # Create deterministic salt from window metadata
        salt_input = f"{window.session_id}:{window.name}:{window.model}"
        salt_hash = hashlib.sha256(salt_input.encode()).digest()
        return base64.b64encode(salt_hash).decode()

    async def _check_model_available(self, model: str) -> bool:
        """Check if the model is available in vLLM."""
        try:
            return await self.vllm.model_available(model)
        except Exception as e:
            logger.debug("Could not check model availability", error=str(e))
            return False

    async def _check_model_compatibility(
        self,
        window_model: str,
        available_models: list[str] | None = None,
    ) -> tuple[bool, list[str]]:
        """
        Check if the window's model is compatible with available models.

        Returns (is_compatible, warnings).
        """
        warnings: list[str] = []

        if not window_model or window_model == "unknown":
            warnings.append(
                "Window has unknown model - compatibility cannot be verified"
            )
            return True, warnings

        # Get available models if not provided
        if available_models is None:
            try:
                models = await self.vllm.list_models()
                available_models = [m.id for m in models]
            except Exception as e:
                warnings.append(f"Could not fetch available models: {e}")
                return True, warnings  # Can't verify, proceed anyway

        if not available_models:
            warnings.append("No models available in vLLM")
            return False, warnings

        # Check exact match
        if window_model in available_models:
            return True, warnings

        # Check for compatible variants (e.g., llama-3.1-8b vs llama-3.1-8b-instruct)
        window_model_base = (
            window_model.lower().replace("-instruct", "").replace("-chat", "")
        )
        for available in available_models:
            available_base = (
                available.lower().replace("-instruct", "").replace("-chat", "")
            )
            if (
                window_model_base in available_base
                or available_base in window_model_base
            ):
                warnings.append(
                    f"Using compatible model variant: {available} (window used {window_model})"
                )
                return True, warnings

        warnings.append(
            f"Model '{window_model}' not found. Available: {', '.join(available_models)}"
        )
        return False, warnings

    # Track windows with corrupted metadata to log once per window per process
    _corrupted_metadata_logged: ClassVar[set[str]] = set()

    async def _verify_stored_blocks(self, window_name: str) -> tuple[int, int]:
        """
        Verify that stored blocks for a window are available.

        Returns (blocks_expected, blocks_found).

        Behavior:
        - Returns (0, 0) if metadata doesn't exist (normal case for new windows)
        - Returns (0, 0) and logs warning if metadata is corrupted (once per window)
        - Returns (0, 0) and logs warning if schema version is incompatible
        - Returns (expected, found) for valid metadata

        This method is designed to be safe and never raise exceptions.
        All error cases return a documented safe value and log appropriately.
        """
        import json

        # Use centralized key naming
        metadata_key = window_metadata_key(window_name)
        result = await self.kv_store.retrieve([metadata_key])

        if not result.found:
            return 0, 0

        try:
            raw_metadata = result.found[metadata_key]

            # Handle bytes vs string
            if isinstance(raw_metadata, bytes):
                raw_metadata = raw_metadata.decode("utf-8")

            envelope = json.loads(raw_metadata)

            # Check schema version compatibility
            schema_version, metadata = unwrap_metadata(envelope)
            is_compatible, warning = check_schema_compatibility(schema_version)

            if not is_compatible:
                # Log once per window per process to avoid spam
                if window_name not in self._corrupted_metadata_logged:
                    self._corrupted_metadata_logged.add(window_name)
                    logger.warning(
                        "Incompatible metadata schema version",
                        window_name=window_name,
                        stored_version=schema_version,
                        warning=warning,
                    )
                return 0, 0

            block_hashes = metadata.get("block_hashes", [])
            blocks_expected = len(block_hashes)

            if not block_hashes:
                return 0, 0

            # Check how many blocks exist
            blocks_result = await self.kv_store.retrieve(block_hashes)
            blocks_found = len(blocks_result.found)

            return blocks_expected, blocks_found

        except json.JSONDecodeError as e:
            # Corrupted JSON - log once per window to avoid spam
            if window_name not in self._corrupted_metadata_logged:
                self._corrupted_metadata_logged.add(window_name)
                logger.warning(
                    "Corrupted window metadata JSON",
                    window_name=window_name,
                    key=metadata_key,
                    error=str(e),
                )
            return 0, 0

        except (KeyError, TypeError, ValidationError) as e:
            # Malformed metadata structure - log once
            if window_name not in self._corrupted_metadata_logged:
                self._corrupted_metadata_logged.add(window_name)
                logger.warning(
                    "Malformed window metadata structure",
                    window_name=window_name,
                    key=metadata_key,
                    error=str(e),
                )
            return 0, 0

        except Exception as e:
            # Unexpected error - always log these
            logger.error(
                "Unexpected error verifying stored blocks",
                window_name=window_name,
                error=str(e),
                exc_info=True,
            )
            return 0, 0

    async def _warm_cache(
        self,
        window: Window,
        cache_salt: str,
    ) -> WarmCacheResult:
        """
        Warm the cache by making a request with the original prompt.

        This triggers LMCache to load the cached blocks.

        Returns WarmCacheResult with detailed metrics.
        """
        try:
            # Get the stored prompt prefix
            prompt = await self._get_stored_prompt(window.name)
            if not prompt:
                logger.debug("No stored prompt for warming", window=window.name)
                return WarmCacheResult(
                    success=False,
                    error="No stored prompt prefix for warming",
                )

            # Make a minimal generation request to warm the cache
            # The cache_salt tells LMCache which blocks to look for
            response = await self.vllm.generate(
                prompt=prompt,
                model=window.model,
                cache_salt=cache_salt,
                max_tokens=1,  # Minimal generation, just warming
            )

            # Estimate cache efficiency based on prompt tokens
            # If all tokens were cached, prompt_tokens should be ~0
            # If none were cached, prompt_tokens equals token_count
            expected_tokens = window.token_count or len(prompt) // 4
            prompt_tokens = response.prompt_tokens

            # Calculate how many tokens came from cache
            # This is a heuristic - actual cache hit detection requires vLLM metrics
            tokens_from_cache = max(0, expected_tokens - prompt_tokens)
            cache_efficiency = (
                tokens_from_cache / expected_tokens if expected_tokens > 0 else 0.0
            )
            cache_hit = cache_efficiency > 0.5  # More than half from cache = hit

            logger.debug(
                "Cache warming completed",
                window=window.name,
                prompt_tokens=prompt_tokens,
                expected_tokens=expected_tokens,
                tokens_from_cache=tokens_from_cache,
                cache_efficiency=cache_efficiency,
                cache_hit=cache_hit,
            )

            return WarmCacheResult(
                success=True,
                cache_hit=cache_hit,
                prompt_tokens_processed=prompt_tokens,
                tokens_from_cache=tokens_from_cache,
                cache_efficiency=cache_efficiency,
            )

        except Exception as e:
            logger.warning("Cache warming failed", error=str(e))
            return WarmCacheResult(
                success=False,
                error=str(e),
            )


# =============================================================================
# Auto-Freeze Manager
# =============================================================================


@dataclass
class AutoFreezePolicy:
    """Configuration for automatic context freezing."""

    enabled: bool = False
    # Token threshold (0-1) at which to trigger auto-freeze
    token_threshold: float = 0.75  # 75% of context used
    # Absolute token count threshold
    token_count_threshold: int = 0  # 0 = disabled, use percentage
    # Minimum time between auto-freezes (seconds)
    cooldown_seconds: int = 60
    # Window naming pattern (supports {session_id}, {timestamp}, {count})
    window_name_pattern: str = "auto-{session_id}-{timestamp}"
    # Tags to add to auto-frozen windows
    tags: list[str] = field(default_factory=lambda: ["auto-freeze"])
    # Include prompt prefix in freeze (captures conversation state)
    include_prompt: bool = True


@dataclass
class AutoFreezeResult:
    """Result of an auto-freeze check."""

    triggered: bool
    window_name: str | None = None
    session_id: str | None = None
    reason: str = ""
    token_count: int = 0
    threshold_percent: float = 0.0
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for MCP response."""
        return {
            "triggered": self.triggered,
            "window_name": self.window_name,
            "session_id": self.session_id,
            "reason": self.reason,
            "token_count": self.token_count,
            "threshold_percent": round(self.threshold_percent * 100, 1),
            "error": self.error,
        }


class AutoFreezeManager:
    """
    Manages automatic context freezing based on configured policies.

    The manager monitors session token counts and triggers freezes
    when thresholds are exceeded, respecting cooldown periods.
    """

    def __init__(
        self,
        window_manager: WindowManager,
        policy: AutoFreezePolicy | None = None,
        max_context_tokens: int = 128000,  # Default context window size
    ):
        """
        Initialize the auto-freeze manager.

        Args:
            window_manager: WindowManager instance for freeze operations
            policy: Auto-freeze policy configuration
            max_context_tokens: Maximum context window size for threshold calculation
        """
        self.window_manager = window_manager
        self.policy = policy or AutoFreezePolicy()
        self.max_context_tokens = max_context_tokens
        self._last_freeze_times: dict[str, float] = {}
        self._freeze_counts: dict[str, int] = {}

    def update_policy(self, **kwargs: Any) -> AutoFreezePolicy:
        """Update policy settings."""
        for key, value in kwargs.items():
            if hasattr(self.policy, key):
                setattr(self.policy, key, value)
        return self.policy

    async def check_and_freeze(
        self,
        session_id: str,
        token_count: int,
        prompt_prefix: str = "",
    ) -> AutoFreezeResult:
        """
        Check if auto-freeze should trigger and perform it if needed.

        Args:
            session_id: Session to check
            token_count: Current token count for the session
            prompt_prefix: Current conversation/prompt content

        Returns:
            AutoFreezeResult indicating whether freeze was triggered
        """
        log = logger.bind(session_id=session_id, token_count=token_count)

        # Check if auto-freeze is enabled
        if not self.policy.enabled:
            return AutoFreezeResult(
                triggered=False,
                reason="Auto-freeze is disabled",
            )

        # Check if threshold is exceeded
        threshold_exceeded, threshold_percent = self._check_threshold(token_count)

        if not threshold_exceeded:
            return AutoFreezeResult(
                triggered=False,
                reason="Token threshold not exceeded",
                token_count=token_count,
                threshold_percent=threshold_percent,
            )

        # Check cooldown
        if not self._check_cooldown(session_id):
            return AutoFreezeResult(
                triggered=False,
                reason="Within cooldown period",
                token_count=token_count,
                threshold_percent=threshold_percent,
            )

        # Generate window name
        window_name = self._generate_window_name(session_id)

        log.info(
            "Auto-freeze triggered",
            window_name=window_name,
            threshold_percent=threshold_percent,
        )

        # Perform the freeze
        try:
            freeze_result = await self.window_manager.freeze(
                session_id=session_id,
                window_name=window_name,
                prompt_prefix=prompt_prefix if self.policy.include_prompt else "",
                description=f"Auto-frozen at {threshold_percent * 100:.1f}% context usage",
                tags=self.policy.tags.copy(),
            )

            # Update tracking
            self._last_freeze_times[session_id] = time.time()
            self._freeze_counts[session_id] = self._freeze_counts.get(session_id, 0) + 1

            if freeze_result.success:
                return AutoFreezeResult(
                    triggered=True,
                    window_name=window_name,
                    session_id=session_id,
                    reason=f"Context usage at {threshold_percent * 100:.1f}%",
                    token_count=token_count,
                    threshold_percent=threshold_percent,
                )
            else:
                return AutoFreezeResult(
                    triggered=False,
                    reason="Freeze operation failed",
                    token_count=token_count,
                    threshold_percent=threshold_percent,
                    error=freeze_result.error,
                )

        except Exception as e:
            log.warning("Auto-freeze failed", error=str(e))
            return AutoFreezeResult(
                triggered=False,
                reason="Freeze operation failed",
                token_count=token_count,
                threshold_percent=threshold_percent,
                error=str(e),
            )

    def _check_threshold(self, token_count: int) -> tuple[bool, float]:
        """Check if token threshold is exceeded. Returns (exceeded, percent)."""
        # Calculate percentage of context used
        threshold_percent = token_count / self.max_context_tokens

        # Check absolute threshold first if set
        if self.policy.token_count_threshold > 0:
            if token_count >= self.policy.token_count_threshold:
                return True, threshold_percent

        # Check percentage threshold
        if threshold_percent >= self.policy.token_threshold:
            return True, threshold_percent

        return False, threshold_percent

    def _check_cooldown(self, session_id: str) -> bool:
        """Check if cooldown period has passed. Returns True if OK to freeze."""
        last_freeze = self._last_freeze_times.get(session_id)
        if last_freeze is None:
            return True

        elapsed = time.time() - last_freeze
        return elapsed >= self.policy.cooldown_seconds

    def _generate_window_name(self, session_id: str) -> str:
        """Generate a unique window name based on policy pattern."""
        timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
        count = self._freeze_counts.get(session_id, 0) + 1

        return self.policy.window_name_pattern.format(
            session_id=session_id[:16] if len(session_id) > 16 else session_id,
            timestamp=timestamp,
            count=count,
        )

    def get_freeze_count(self, session_id: str) -> int:
        """Get the number of auto-freezes for a session."""
        return self._freeze_counts.get(session_id, 0)

    def reset_session(self, session_id: str) -> None:
        """Reset tracking for a session."""
        self._last_freeze_times.pop(session_id, None)
        self._freeze_counts.pop(session_id, None)
