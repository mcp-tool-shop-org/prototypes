# Context Window Manager - Architecture Documentation

> **Purpose**: Deep technical documentation of system architecture, component interactions, and design decisions.
> **Last Updated**: 2026-01-22

---

## 2026 Best Practices Applied

> **Sources**: [MCP Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture), [ByteBridge MCP in Production](https://bytebridge.medium.com/what-it-takes-to-run-mcp-model-context-protocol-in-production-3bbf19413f69), [Builder.io Best MCP Servers 2026](https://www.builder.io/blog/best-mcp-servers-2026), [TrueFoundry MCP Registry](https://www.truefoundry.com/blog/what-is-mcp-registry-and-why-you-cant-run-agents-without-one), [vLLM KV Cache Best Practices](https://docs.vllm.ai/en/stable/configuration/optimization/), [llm-d Distributed KV Cache](https://llm-d.ai/blog/kvcache-wins-you-can-see)

This architecture follows 2026 MCP and vLLM best practices:

1. **Single-Purpose Server Design**: One MCP server = one capability domain (context management). Keeps blast radius small and makes security scoping easier.

2. **Stateless Where Possible**: MCP tool handlers don't hold state. All state lives in the session registry (SQLite) and KV store (LMCache). Makes testing and debugging simpler.

3. **Fail Predictably**: Structured error responses that LLMs can interpret. Every error has a code, message, and retryable flag.

4. **Gateway-Ready Architecture**: Design anticipates MCP Registry/Gateway patterns. Sessions are isolated, tools are idempotent where possible.

5. **KV Cache Tiering**: Following vLLM Q1 2026 recommendations - CPU cache with zero-cost miss, async transfers, tiered fallback to disk. Reserve 40-60% of GPU memory for active inference, offload cold cache.

6. **FP8 KV Cache Consideration**: Architecture supports future FP8 quantization of stored blocks (2x storage efficiency with minimal accuracy loss).

7. **Distributed Cache Awareness**: Design supports future llm-d integration for distributed scheduling based on cache locality.

8. **Logging for Observability**: Structured logging with tool name, duration, errors. Prometheus-compatible metrics planned.

---

## System Overview

The Context Window Manager (CWM) is an MCP server that provides lossless context restoration for LLM sessions by leveraging vLLM's KV cache persistence through LMCache.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Claude Code / MCP Client                       │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ MCP Protocol (stdio)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Context Window Manager (MCP Server)                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Tool Layer                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ freeze   │ │  thaw    │ │  list    │ │ status   │ ...      │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │   │
│  └───────┼────────────┼────────────┼────────────┼────────────────┘   │
│          │            │            │            │                     │
│  ┌───────┴────────────┴────────────┴────────────┴────────────────┐   │
│  │                      Core Services                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │   Session    │  │   Window     │  │    KV        │        │   │
│  │  │   Registry   │  │   Manager    │  │   Store      │        │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │   │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┘   │
│            │                 │                 │                      │
│  ┌─────────┴─────────────────┴─────────────────┴─────────────────┐   │
│  │                     Infrastructure Layer                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │   SQLite     │  │   vLLM       │  │   LMCache    │        │   │
│  │  │   (metadata) │  │   Client     │  │   Client     │        │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐       ┌───────────────────┐
        │   vLLM Server     │       │   Storage Backend │
        │   + LMCache       │       │   (CPU/Disk/Redis)│
        │   KV Connector    │       │                   │
        └───────────────────┘       └───────────────────┘
```

---

## Component Deep Dive

### 1. MCP Server Layer

**File**: `src/context_window_manager/server.py`

The MCP server is the entry point, handling:
- Protocol negotiation
- Tool registration and dispatch
- Resource exposure
- Lifecycle management

```python
class ContextWindowManagerServer:
    """
    MCP Server for Context Window Manager.

    Responsibilities:
    - Handle MCP protocol communication (stdio transport)
    - Register and dispatch tool calls
    - Expose resources (session list, stats)
    - Manage graceful shutdown
    """

    def __init__(self, config: Config):
        self.config = config
        self.registry = SessionRegistry(config.db_path)
        self.kv_store = KVStore(config.storage_config)
        self.vllm_client = VLLMClient(config.vllm_url)

        # Initialize MCP server
        self.mcp = Server("context-window-manager")
        self._register_tools()
        self._register_resources()

    def _register_tools(self):
        """Register all MCP tools."""
        self.mcp.add_tool(
            name="window_freeze",
            description="Snapshot current session context to persistent storage",
            input_schema=FREEZE_SCHEMA,
            handler=self._handle_freeze
        )
        # ... other tools

    async def run(self):
        """Run the MCP server."""
        async with stdio_server() as (read, write):
            await self.mcp.run(read, write, self._create_init_options())
```

### 2. Session Registry

**File**: `src/context_window_manager/core/session_registry.py`

Manages session lifecycle and metadata persistence.

```python
class SessionState(Enum):
    """Session state machine states."""
    ACTIVE = "active"        # Session is being used
    FROZEN = "frozen"        # Session has been snapshotted
    THAWED = "thawed"        # Session restored from snapshot
    EXPIRED = "expired"      # Session timed out
    DELETED = "deleted"      # Soft-deleted

# Valid state transitions
STATE_TRANSITIONS = {
    SessionState.ACTIVE: {SessionState.FROZEN, SessionState.EXPIRED, SessionState.DELETED},
    SessionState.FROZEN: {SessionState.THAWED, SessionState.DELETED},
    SessionState.THAWED: {SessionState.ACTIVE, SessionState.FROZEN, SessionState.DELETED},
    SessionState.EXPIRED: {SessionState.DELETED},
    SessionState.DELETED: set(),  # Terminal state
}
```

**Database Schema**:

```sql
-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL DEFAULT 'active',
    model TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    cache_salt TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    frozen_at TIMESTAMP,
    metadata JSON
);

-- Windows table (frozen snapshots)
CREATE TABLE windows (
    name TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    description TEXT,
    tags JSON,
    block_count INTEGER NOT NULL,
    block_hashes JSON NOT NULL,
    total_size_bytes INTEGER NOT NULL,
    model TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_window TEXT,  -- For clone lineage
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Audit log
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event TEXT NOT NULL,
    session_id TEXT,
    window_name TEXT,
    details JSON,
    severity TEXT DEFAULT 'INFO'
);

-- Indexes
CREATE INDEX idx_sessions_state ON sessions(state);
CREATE INDEX idx_sessions_cache_salt ON sessions(cache_salt);
CREATE INDEX idx_windows_session ON windows(session_id);
CREATE INDEX idx_windows_created ON windows(created_at);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

### 3. KV Store

**File**: `src/context_window_manager/core/kv_store.py`

Abstracts KV cache storage operations, interfacing with LMCache.

```python
class KVStore:
    """
    KV Cache storage abstraction.

    Provides a unified interface for storing and retrieving KV cache blocks
    across different storage backends (CPU, disk, Redis).
    """

    def __init__(self, config: StorageConfig):
        self.config = config
        self.backends = self._init_backends()
        self.metrics = KVStoreMetrics()

    def _init_backends(self) -> list[StorageBackend]:
        """Initialize storage backends in priority order."""
        backends = []

        if self.config.enable_cpu:
            backends.append(CPUBackend(
                max_size_gb=self.config.cpu_max_gb
            ))

        if self.config.enable_disk:
            backends.append(DiskBackend(
                path=self.config.disk_path,
                max_size_gb=self.config.disk_max_gb,
                compression=self.config.compression
            ))

        if self.config.redis_url:
            backends.append(RedisBackend(
                url=self.config.redis_url,
                prefix=self.config.redis_prefix
            ))

        return backends

    async def store(
        self,
        blocks: list[KVBlock],
        window_name: str
    ) -> StoreResult:
        """
        Store KV blocks to the appropriate backend.

        Blocks are stored to the first available backend with capacity.
        Falls back to lower tiers if higher tiers are full.
        """
        stored = []
        failed = []

        for block in blocks:
            for backend in self.backends:
                try:
                    if await backend.has_capacity(block.size):
                        await backend.put(block.hash, block.data)
                        stored.append(block.hash)
                        self.metrics.record_write(backend.name, block.size)
                        break
                except StorageError as e:
                    logger.warning(f"Backend {backend.name} failed: {e}")
                    continue
            else:
                failed.append(block.hash)

        return StoreResult(stored=stored, failed=failed)

    async def retrieve(
        self,
        block_hashes: list[str]
    ) -> RetrieveResult:
        """
        Retrieve KV blocks from storage.

        Searches backends in priority order until block is found.
        """
        found = {}
        missing = []

        for block_hash in block_hashes:
            for backend in self.backends:
                try:
                    data = await backend.get(block_hash)
                    if data:
                        found[block_hash] = data
                        self.metrics.record_hit(backend.name)
                        break
                except StorageError:
                    continue
            else:
                missing.append(block_hash)
                self.metrics.record_miss()

        return RetrieveResult(found=found, missing=missing)
```

### 4. vLLM Client

**File**: `src/context_window_manager/core/vllm_client.py`

Handles communication with vLLM server.

```python
class VLLMClient:
    """
    Async client for vLLM OpenAI-compatible API.

    Handles:
    - Request/response serialization
    - Connection pooling
    - Retry logic for transient failures
    - Cache salt injection for session isolation
    """

    def __init__(self, base_url: str, config: VLLMConfig = None):
        self.base_url = base_url.rstrip('/')
        self.config = config or VLLMConfig()
        self._session: aiohttp.ClientSession = None

    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout),
            connector=aiohttp.TCPConnector(
                limit=self.config.max_connections,
                keepalive_timeout=30
            )
        )
        return self

    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()

    async def generate(
        self,
        prompt: str,
        model: str,
        cache_salt: str = None,
        **kwargs
    ) -> GenerateResponse:
        """
        Generate completion with optional cache salt for session isolation.
        """
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            **kwargs
        }

        # Inject cache_salt for prefix cache isolation
        if cache_salt:
            payload["extra_body"] = {"cache_salt": cache_salt}

        response = await self._request("POST", "/v1/completions", payload)
        return GenerateResponse.from_dict(response)

    async def get_cache_stats(self) -> CacheStats:
        """Get prefix cache statistics from vLLM."""
        response = await self._request("GET", "/metrics")
        return self._parse_cache_metrics(response)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(VLLMConnectionError)
    )
    async def _request(
        self,
        method: str,
        endpoint: str,
        payload: dict = None
    ) -> dict:
        """Make HTTP request with retry."""
        url = f"{self.base_url}{endpoint}"

        try:
            async with self._session.request(
                method,
                url,
                json=payload
            ) as response:
                if response.status >= 500:
                    raise VLLMConnectionError(f"Server error: {response.status}")
                if response.status >= 400:
                    error = await response.text()
                    raise VLLMError(f"Request failed: {error}")
                return await response.json()

        except aiohttp.ClientError as e:
            raise VLLMConnectionError(str(e)) from e
```

### 5. Window Manager

**File**: `src/context_window_manager/core/window_manager.py`

Coordinates freeze/thaw operations across components.

```python
class WindowManager:
    """
    Orchestrates context window operations.

    Coordinates between SessionRegistry, KVStore, and VLLMClient
    to implement freeze, thaw, clone, and other operations.
    """

    def __init__(
        self,
        registry: SessionRegistry,
        kv_store: KVStore,
        vllm_client: VLLMClient
    ):
        self.registry = registry
        self.kv_store = kv_store
        self.vllm = vllm_client

    async def freeze(
        self,
        session_id: str,
        window_name: str,
        description: str = "",
        tags: list[str] = None
    ) -> FreezeResult:
        """
        Freeze a session's context to a named window.

        Process:
        1. Validate session exists and is active
        2. Validate window name is available
        3. Extract KV block hashes from session
        4. Trigger LMCache persistence
        5. Store window metadata
        6. Update session state
        """
        # Validation
        session = await self.registry.get_session(session_id)
        if not session:
            raise SessionNotFoundError(session_id)
        if session.state != SessionState.ACTIVE:
            raise InvalidStateTransitionError(
                f"Cannot freeze session in state {session.state}"
            )
        if await self.registry.window_exists(window_name):
            raise WindowAlreadyExistsError(window_name)

        # Extract block information
        # This uses the cache_salt to identify blocks for this session
        block_info = await self._get_session_blocks(session)

        # Ensure blocks are persisted to LMCache storage
        store_result = await self.kv_store.store(
            block_info.blocks,
            window_name
        )

        if store_result.failed:
            logger.warning(
                f"Some blocks failed to store: {len(store_result.failed)}"
            )

        # Create window record
        window = Window(
            name=window_name,
            session_id=session_id,
            description=description,
            tags=tags or [],
            block_count=len(block_info.blocks),
            block_hashes=[b.hash for b in block_info.blocks],
            total_size_bytes=sum(b.size for b in block_info.blocks),
            model=session.model,
            token_count=session.token_count
        )

        await self.registry.create_window(window)

        # Update session state
        await self.registry.update_session(
            session_id,
            state=SessionState.FROZEN,
            frozen_at=datetime.utcnow()
        )

        return FreezeResult(
            success=True,
            window_name=window_name,
            block_count=window.block_count,
            total_size_bytes=window.total_size_bytes
        )

    async def thaw(
        self,
        window_name: str,
        new_session_id: str = None,
        continuation_prompt: str = ""
    ) -> ThawResult:
        """
        Restore context from a frozen window.

        Process:
        1. Validate window exists
        2. Verify model availability
        3. Create new session with same cache_salt derivation
        4. Make request to vLLM (triggers LMCache block retrieval)
        5. Return restored session
        """
        window = await self.registry.get_window(window_name)
        if not window:
            raise WindowNotFoundError(window_name)

        # Verify model is available
        if not await self.vllm.model_available(window.model):
            raise ModelNotAvailableError(window.model)

        # Create new session or use provided ID
        session_id = new_session_id or f"thaw_{window_name}_{int(time.time())}"

        # Generate cache_salt that will match the stored blocks
        cache_salt = self._derive_cache_salt(window)

        # Create session record
        session = Session(
            id=session_id,
            state=SessionState.THAWED,
            model=window.model,
            token_count=window.token_count,
            cache_salt=cache_salt
        )
        await self.registry.create_session(session)

        # Trigger context restoration by making a request
        # The cache_salt causes vLLM/LMCache to look up stored blocks
        prompt = continuation_prompt or "[Context restored. Continue.]"

        start_time = time.time()
        response = await self.vllm.generate(
            prompt=prompt,
            model=window.model,
            cache_salt=cache_salt,
            max_tokens=1  # Minimal generation, just warming cache
        )
        restoration_time = time.time() - start_time

        return ThawResult(
            success=True,
            session_id=session_id,
            token_count=window.token_count,
            restoration_time_ms=int(restoration_time * 1000)
        )
```

---

## Data Flow Diagrams

### Freeze Operation

```
┌──────────┐      ┌─────────┐      ┌──────────┐      ┌─────────┐      ┌─────────┐
│  Client  │      │   MCP   │      │  Window  │      │   KV    │      │ Session │
│          │      │ Server  │      │ Manager  │      │  Store  │      │ Registry│
└────┬─────┘      └────┬────┘      └────┬─────┘      └────┬────┘      └────┬────┘
     │                 │                │                 │                 │
     │ window_freeze   │                │                 │                 │
     │ (session_id,    │                │                 │                 │
     │  window_name)   │                │                 │                 │
     │────────────────►│                │                 │                 │
     │                 │                │                 │                 │
     │                 │ freeze()       │                 │                 │
     │                 │───────────────►│                 │                 │
     │                 │                │                 │                 │
     │                 │                │ get_session()   │                 │
     │                 │                │────────────────────────────────────►
     │                 │                │                 │                 │
     │                 │                │◄────────────────────────────────────
     │                 │                │    Session      │                 │
     │                 │                │                 │                 │
     │                 │                │ window_exists() │                 │
     │                 │                │────────────────────────────────────►
     │                 │                │                 │                 │
     │                 │                │◄────────────────────────────────────
     │                 │                │    false        │                 │
     │                 │                │                 │                 │
     │                 │                │ store(blocks)   │                 │
     │                 │                │────────────────►│                 │
     │                 │                │                 │                 │
     │                 │                │                 │ [persist to     │
     │                 │                │                 │  CPU/Disk]      │
     │                 │                │                 │                 │
     │                 │                │◄────────────────│                 │
     │                 │                │   StoreResult   │                 │
     │                 │                │                 │                 │
     │                 │                │ create_window() │                 │
     │                 │                │────────────────────────────────────►
     │                 │                │                 │                 │
     │                 │                │ update_session()│                 │
     │                 │                │────────────────────────────────────►
     │                 │                │                 │                 │
     │                 │◄───────────────│                 │                 │
     │                 │  FreezeResult  │                 │                 │
     │                 │                │                 │                 │
     │◄────────────────│                │                 │                 │
     │  MCP Response   │                │                 │                 │
     │                 │                │                 │                 │
```

### Thaw Operation

```
┌──────────┐      ┌─────────┐      ┌──────────┐      ┌─────────┐      ┌─────────┐
│  Client  │      │   MCP   │      │  Window  │      │  vLLM   │      │ LMCache │
│          │      │ Server  │      │ Manager  │      │ Client  │      │         │
└────┬─────┘      └────┬────┘      └────┬─────┘      └────┬────┘      └────┬────┘
     │                 │                │                 │                 │
     │ window_thaw     │                │                 │                 │
     │ (window_name)   │                │                 │                 │
     │────────────────►│                │                 │                 │
     │                 │                │                 │                 │
     │                 │ thaw()         │                 │                 │
     │                 │───────────────►│                 │                 │
     │                 │                │                 │                 │
     │                 │                │ [lookup window] │                 │
     │                 │                │                 │                 │
     │                 │                │ [derive         │                 │
     │                 │                │  cache_salt]    │                 │
     │                 │                │                 │                 │
     │                 │                │ generate()      │                 │
     │                 │                │ (with salt)     │                 │
     │                 │                │────────────────►│                 │
     │                 │                │                 │                 │
     │                 │                │                 │ [check cache]   │
     │                 │                │                 │────────────────►│
     │                 │                │                 │                 │
     │                 │                │                 │◄────────────────│
     │                 │                │                 │  [KV blocks]    │
     │                 │                │                 │                 │
     │                 │                │                 │ [inject KV      │
     │                 │                │                 │  into attention]│
     │                 │                │                 │                 │
     │                 │                │◄────────────────│                 │
     │                 │                │   Response      │                 │
     │                 │                │                 │                 │
     │                 │◄───────────────│                 │                 │
     │                 │  ThawResult    │                 │                 │
     │                 │  (session_id)  │                 │                 │
     │                 │                │                 │                 │
     │◄────────────────│                │                 │                 │
     │  MCP Response   │                │                 │                 │
     │                 │                │                 │                 │
```

---

## Key Design Decisions

### 1. Why cache_salt for Session Isolation?

**Decision**: Use vLLM's `cache_salt` feature to isolate sessions.

**Alternatives Considered**:
- Separate model instances (too resource intensive)
- Manual KV cache management (complex, error-prone)
- Token-based namespace (doesn't integrate with vLLM caching)

**Rationale**:
- Native vLLM feature, well-tested
- Zero overhead when cache misses
- Provides security isolation (timing attack prevention)
- Hash-based lookup is O(1)

### 2. Why SQLite for Metadata?

**Decision**: Use SQLite for session and window metadata.

**Alternatives Considered**:
- JSON files (no ACID, race conditions)
- Redis (adds dependency, overkill for metadata)
- PostgreSQL (too heavy for single-node)

**Rationale**:
- ACID transactions for data integrity
- Zero configuration required
- Excellent Windows support
- Sufficient performance for metadata operations
- Built into Python (no extra dependencies)

### 3. Why Tiered Storage?

**Decision**: Support CPU → Disk → Redis storage fallback.

**Alternatives Considered**:
- Single storage backend (inflexible)
- User-configured single backend (complexity for users)

**Rationale**:
- GPU memory is precious, shouldn't store cold caches
- CPU memory is fast but limited
- Disk provides capacity for many windows
- Redis enables distributed setups (future)
- Automatic fallback simplifies user experience

### 4. Why Separate Freeze/Thaw Instead of Auto-Restore?

**Decision**: Explicit freeze/thaw commands rather than automatic.

**Alternatives Considered**:
- Automatic snapshot on context threshold
- Transparent restoration (hide from user)

**Rationale**:
- User control over what gets preserved
- Explicit naming aids discoverability
- Supports branching/cloning use cases
- Predictable behavior
- Auto-freeze can be added as optional feature later

---

## Performance Considerations

### Memory Usage

| Component | Typical Usage | Maximum |
|-----------|---------------|---------|
| MCP Server | ~50 MB | 200 MB |
| Session Registry (SQLite) | ~10 MB | 100 MB |
| KV Store metadata | ~1 MB per window | 10 MB |
| KV blocks (CPU tier) | Configurable | 8 GB default |

### Latency Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| window_freeze (8K context) | <500ms | Dominated by block serialization |
| window_thaw (8K context) | <2s | Dominated by block retrieval |
| window_list | <50ms | SQLite query |
| window_status | <100ms | SQLite + LMCache query |

### Scalability Limits

| Dimension | Soft Limit | Hard Limit |
|-----------|------------|------------|
| Concurrent sessions | 100 | 1000 |
| Stored windows | 1000 | 10000 |
| Context size | 128K tokens | Model limit |
| Storage per window | ~500 MB | 2 GB |

---

## Future Architecture Considerations

### Multi-Model Support
Current architecture supports this via `model` field in sessions/windows.

### Distributed Deployment
- Replace SQLite with PostgreSQL
- Use Redis for distributed KV storage
- Add load balancing for MCP servers

### Streaming Thaw
- Progressive context restoration
- Prioritize recent context
- Background loading of older blocks

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-22 | Initial architecture documentation |
