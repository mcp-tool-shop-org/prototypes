# Context Window Manager - Edge Cases Documentation

> **Purpose**: Document known edge cases, race conditions, boundary conditions, and their handling strategies.
> **Last Updated**: 2026-01-23

---

## 2026 Best Practices Applied

> **Sources**: [vLLM KV Offloading Blog 2026](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html), [LMCache GitHub](https://github.com/LMCache/LMCache), [Cloudflare KV Concurrency](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [Fastly KV Store](https://www.fastly.com/blog/beyond-crud-advanced-features-of-fastlys-kv-store)

This document follows 2026 distributed systems and KV cache best practices:

1. **PagedAttention for Concurrency**: Organize KV cache into fixed-sized chunks allocated on-demand. Each attention head manages its own chunks, enabling scalable concurrent access without fragmentation.

2. **Generation Markers for Concurrent Updates**: Use version/generation markers to detect concurrent modifications and prevent silent overwrites.

3. **Insert-Only Semantics Where Possible**: Avoid race conditions by using append-only patterns. No locks, no complexity - just a flag enforcing single-write semantics.

4. **Eventual Consistency Awareness**: Changes may take time to propagate. Design for 60+ second visibility delays in distributed scenarios.

5. **Negative Lookup Caching**: "Key not found" results are also cached. Account for this when checking if newly created resources exist.

6. **Async Transfer Race Prevention**: vLLM 2026 fixes race conditions between KV offloading and model computation through careful synchronization.

7. **Idempotency for Retries**: Operations should be safely retryable. Use idempotency keys for non-idempotent operations.

8. **Graceful Degradation**: When edge cases occur, prefer partial success over complete failure where safe.

---

## Edge Case Categories

### Category Overview

| Category | Risk Level | Frequency | Impact |
|----------|------------|-----------|--------|
| Concurrency & Race Conditions | HIGH | Medium | Data corruption, lost updates |
| Boundary Conditions | MEDIUM | High | Unexpected behavior, crashes |
| Resource Exhaustion | HIGH | Low | Service unavailability |
| State Machine Violations | MEDIUM | Low | Inconsistent state |
| Network & Timing | HIGH | Medium | Partial operations, timeouts |
| Data Integrity | CRITICAL | Low | Silent corruption |

---

## Concurrency & Race Conditions

### EC-001: Concurrent Freeze on Same Session

**Scenario**: Two clients attempt to freeze the same session simultaneously.

**Risk**: Duplicate windows, inconsistent block storage, corrupted metadata.

**Detection**:
```python
# Attempt to acquire lock shows contention
async def freeze_with_lock(session_id: str, window_name: str):
    lock_key = f"freeze:{session_id}"

    if not await lock_manager.acquire(lock_key, timeout=5.0):
        raise ConcurrencyLimitError(
            f"Session {session_id} is already being frozen"
        )
```

**Handling**:
```python
class SessionRegistry:
    async def freeze_session(self, session_id: str, window_name: str):
        async with self.session_lock(session_id):
            # Check state AFTER acquiring lock
            session = await self.get_session(session_id)
            if session.state == SessionState.FROZEN:
                raise SessionAlreadyFrozenError(session_id)

            # Proceed with freeze
            await self._do_freeze(session, window_name)
```

**Prevention**:
- Use database-level row locking (`SELECT ... FOR UPDATE`)
- Implement distributed locks for multi-instance deployments
- Return "already in progress" error rather than waiting indefinitely

**Test Cases**: `EC-001-a` through `EC-001-d` in `tests/edge_cases/test_concurrency.py`

---

### EC-002: Concurrent Thaw of Same Window

**Scenario**: Multiple clients thaw the same window simultaneously, each expecting a unique session.

**Risk**: Resource exhaustion, duplicate sessions, confused state.

**Detection**:
```python
# Track active thaw operations
active_thaws: dict[str, asyncio.Event] = {}

async def thaw_window(window_name: str):
    if window_name in active_thaws:
        # Wait for existing thaw or return existing session
        await active_thaws[window_name].wait()
        return await get_recently_thawed_session(window_name)
```

**Handling**:
- First request proceeds, subsequent requests wait
- Return same session ID if thawed within deduplication window
- Or: Allow multiple thaws, each creates distinct session (document behavior)

**Test Cases**: `EC-002-a` through `EC-002-c`

---

### EC-003: Freeze During Active Generation

**Scenario**: User triggers freeze while vLLM is mid-generation.

**Risk**: Incomplete KV cache capture, inconsistent token count.

**Detection**:
```python
async def freeze_session(session_id: str, window_name: str):
    session = await self.get_session(session_id)

    if session.generation_in_progress:
        raise InvalidStateTransitionError(
            "Cannot freeze while generation is in progress. "
            "Wait for completion or cancel the generation."
        )
```

**Handling Options**:
1. **Block**: Reject freeze until generation completes
2. **Queue**: Queue freeze to execute after generation
3. **Snapshot**: Capture current state (may be incomplete)

**Recommended**: Option 1 (Block) - clearest semantics, no surprises.

**Test Cases**: `EC-003-a` through `EC-003-c`

---

### EC-004: Block Hash Collision

**Scenario**: Two different token sequences produce the same block hash (astronomically unlikely but possible).

**Risk**: Wrong KV cache loaded, corrupted generation.

**Detection**:
```python
# Store token prefix with block for verification
class KVBlock:
    hash: str
    data: bytes
    token_prefix: list[int]  # First N tokens for verification

async def verify_block(block: KVBlock, expected_tokens: list[int]) -> bool:
    return block.token_prefix == expected_tokens[:len(block.token_prefix)]
```

**Handling**:
- Store token prefix metadata with blocks
- Verify on retrieval
- Log collision if detected (for research)
- Fall back to recomputation on mismatch

**Probability**: ~2^-256 for SHA-256 hashes. Document but don't over-engineer.

**Test Cases**: `EC-004-a` (simulated collision)

---

### EC-005: Write-After-Write Race in Storage

**Scenario**: Two processes write to same storage location simultaneously.

**Risk**: Data corruption, lost writes.

**Detection**:
```python
# Use optimistic locking with version numbers
async def update_window_metadata(window_name: str, updates: dict, expected_version: int):
    result = await db.execute(
        """
        UPDATE windows
        SET metadata = ?, version = version + 1
        WHERE name = ? AND version = ?
        """,
        (updates, window_name, expected_version)
    )

    if result.rowcount == 0:
        raise ConcurrentModificationError(
            f"Window {window_name} was modified by another process"
        )
```

**Handling**:
- Optimistic locking with version numbers
- Retry with fresh read on conflict
- Use transactions for multi-step updates

**Test Cases**: `EC-005-a` through `EC-005-c`

---

## Boundary Conditions

### EC-010: Empty Session Freeze

**Scenario**: User attempts to freeze a session with zero tokens.

**Risk**: Meaningless window, wasted storage, confusing UX.

**Handling**:
```python
async def freeze_session(session_id: str, window_name: str):
    session = await self.get_session(session_id)

    if session.token_count == 0:
        raise ValidationError(
            "Cannot freeze empty session. "
            "At least one interaction required."
        )
```

**Test Cases**: `EC-010-a`

---

### EC-011: Maximum Context Size

**Scenario**: Session reaches model's maximum context length.

**Risk**: Truncation, generation failure, unclear behavior.

**Handling**:
```python
MAX_CONTEXT_TOKENS = {
    "llama-3.1-8b": 128_000,
    "llama-3.1-70b": 128_000,
    "mistral-7b": 32_000,
}

async def check_context_limit(session: Session):
    max_tokens = MAX_CONTEXT_TOKENS.get(session.model, 32_000)

    if session.token_count >= max_tokens * 0.95:
        logger.warning(
            f"Session {session.id} at {session.token_count}/{max_tokens} tokens"
        )
        return ContextWarning.NEAR_LIMIT

    if session.token_count >= max_tokens:
        return ContextWarning.AT_LIMIT

    return ContextWarning.OK
```

**Test Cases**: `EC-011-a` through `EC-011-c`

---

### EC-012: Window Name at Maximum Length

**Scenario**: User provides window name exactly at 128-character limit.

**Risk**: Off-by-one errors, storage issues.

**Handling**:
```python
WINDOW_NAME_MAX_LENGTH = 128

def validate_window_name(name: str) -> bool:
    if len(name) > WINDOW_NAME_MAX_LENGTH:
        raise ValidationError(
            f"Window name exceeds maximum length of {WINDOW_NAME_MAX_LENGTH}"
        )
    # Also check minimum
    if len(name) < 1:
        raise ValidationError("Window name cannot be empty")
    return True
```

**Test Cases**: `EC-012-a` (exactly 128), `EC-012-b` (129 chars)

---

### EC-013: Unicode in Identifiers

**Scenario**: User provides window name with unicode characters, emojis, or RTL text.

**Risk**: Storage issues, display problems, security (homograph attacks).

**Handling**:
```python
import unicodedata

def validate_window_name(name: str) -> bool:
    # Normalize unicode
    normalized = unicodedata.normalize("NFKC", name)

    # Only allow ASCII alphanumeric + underscore + hyphen
    if not WINDOW_NAME_PATTERN.match(normalized):
        raise ValidationError(
            "Window name must contain only ASCII letters, numbers, "
            "underscores, and hyphens"
        )

    return True
```

**Test Cases**: `EC-013-a` (emoji), `EC-013-b` (homograph), `EC-013-c` (RTL)

---

### EC-014: Zero-Size KV Blocks

**Scenario**: KV block serialization produces zero bytes.

**Risk**: Storage corruption, divide-by-zero in metrics.

**Handling**:
```python
async def store_block(block: KVBlock):
    if len(block.data) == 0:
        logger.warning(f"Skipping zero-size block: {block.hash}")
        return StoreResult(stored=[], skipped=[block.hash])

    # Proceed with storage
```

**Test Cases**: `EC-014-a`

---

## Resource Exhaustion

### EC-020: Storage Quota Exceeded

**Scenario**: User attempts to freeze when storage is full.

**Risk**: Partial writes, corrupted state.

**Handling**:
```python
async def freeze_session(session_id: str, window_name: str):
    session = await self.get_session(session_id)
    estimated_size = estimate_storage_size(session)

    # Check quota BEFORE starting
    if not await self.kv_store.has_capacity(estimated_size):
        available = await self.kv_store.get_available_space()
        raise StorageQuotaExceededError(
            f"Insufficient storage. Need {estimated_size}MB, "
            f"have {available}MB. Delete unused windows to free space."
        )
```

**Test Cases**: `EC-020-a` (exactly full), `EC-020-b` (just under), `EC-020-c` (way over)

---

### EC-021: Too Many Active Sessions

**Scenario**: User creates sessions without closing them.

**Risk**: Memory exhaustion, performance degradation.

**Handling**:
```python
MAX_ACTIVE_SESSIONS = 100

async def create_session(self, **kwargs):
    active_count = await self.count_sessions(state=SessionState.ACTIVE)

    if active_count >= MAX_ACTIVE_SESSIONS:
        oldest = await self.get_oldest_active_session()
        raise ResourceError(
            f"Maximum active sessions ({MAX_ACTIVE_SESSIONS}) reached. "
            f"Oldest session: {oldest.id} (created {oldest.created_at}). "
            f"Freeze or delete sessions to continue."
        )
```

**Test Cases**: `EC-021-a`

---

### EC-022: Memory Pressure During Thaw

**Scenario**: System runs low on memory while loading KV blocks.

**Risk**: OOM killer, partial restoration, system instability.

**Handling**:
```python
import psutil

async def thaw_window(window_name: str):
    window = await self.get_window(window_name)
    estimated_memory = window.total_size_bytes * 1.5  # Safety margin

    available_memory = psutil.virtual_memory().available

    if estimated_memory > available_memory * 0.8:
        raise MemoryExhaustedError(
            f"Insufficient memory for restoration. "
            f"Need ~{estimated_memory // 1024 // 1024}MB, "
            f"available {available_memory // 1024 // 1024}MB"
        )
```

**Test Cases**: `EC-022-a` (simulated low memory)

---

## State Machine Violations

### EC-030: Invalid State Transition

**Scenario**: Attempt to thaw an active session, or freeze a deleted session.

**Risk**: Inconsistent state, data loss.

**Handling**:
```python
STATE_TRANSITIONS = {
    SessionState.ACTIVE: {SessionState.FROZEN, SessionState.EXPIRED, SessionState.DELETED},
    SessionState.FROZEN: {SessionState.THAWED, SessionState.DELETED},
    SessionState.THAWED: {SessionState.ACTIVE, SessionState.FROZEN, SessionState.DELETED},
    SessionState.EXPIRED: {SessionState.DELETED},
    SessionState.DELETED: set(),  # Terminal state
}

async def transition_state(session_id: str, new_state: SessionState):
    session = await self.get_session(session_id)

    allowed = STATE_TRANSITIONS.get(session.state, set())
    if new_state not in allowed:
        raise InvalidStateTransitionError(
            f"Cannot transition from {session.state} to {new_state}. "
            f"Allowed transitions: {allowed}"
        )
```

**Test Cases**: `EC-030-a` through `EC-030-f` (all invalid transitions)

---

### EC-031: Orphaned Windows

**Scenario**: Parent session deleted but windows remain.

**Risk**: Dangling references, cleanup issues.

**Handling**:
```python
async def delete_session(session_id: str, cascade: bool = False):
    windows = await self.get_windows_for_session(session_id)

    if windows and not cascade:
        raise StateError(
            f"Session has {len(windows)} associated windows. "
            f"Use cascade=True to delete them, or delete windows first."
        )

    if cascade:
        for window in windows:
            await self.delete_window(window.name)

    await self._delete_session(session_id)
```

**Test Cases**: `EC-031-a` (orphan prevention), `EC-031-b` (cascade delete)

---

## Network & Timing

### EC-040: vLLM Server Restart During Operation

**Scenario**: vLLM server restarts while freeze/thaw is in progress.

**Risk**: Partial operation, lost KV cache, inconsistent state.

**Handling**:
```python
async def freeze_with_recovery(session_id: str, window_name: str):
    checkpoint = await create_operation_checkpoint("freeze", session_id)

    try:
        result = await self._do_freeze(session_id, window_name)
        await checkpoint.complete()
        return result

    except VLLMConnectionError:
        logger.error(f"vLLM connection lost during freeze: {session_id}")
        await checkpoint.mark_interrupted()

        # Don't leave partial state
        await self._rollback_freeze(window_name)
        raise OperationInterruptedError(
            "Freeze interrupted by server disconnect. "
            "Session state preserved, please retry."
        )
```

**Test Cases**: `EC-040-a` (disconnect during freeze), `EC-040-b` (disconnect during thaw)

---

### EC-041: Timeout During Large Context Thaw

**Scenario**: Thawing 128K context takes longer than timeout.

**Risk**: Partial restoration, wasted resources.

**Handling**:
```python
# Scale timeout with context size
def calculate_thaw_timeout(token_count: int) -> float:
    base_timeout = 30.0  # seconds
    tokens_per_second = 10_000  # expected throughput

    estimated_time = token_count / tokens_per_second
    timeout = max(base_timeout, estimated_time * 2)  # 2x safety margin

    return min(timeout, 300.0)  # Cap at 5 minutes

async def thaw_window(window_name: str):
    window = await self.get_window(window_name)
    timeout = calculate_thaw_timeout(window.token_count)

    async with asyncio.timeout(timeout):
        return await self._do_thaw(window)
```

**Test Cases**: `EC-041-a` (large context), `EC-041-b` (timeout behavior)

---

### EC-042: Clock Skew Between Components

**Scenario**: Different servers have different system times.

**Risk**: Incorrect ordering, premature expiry, confusing timestamps.

**Handling**:
```python
# Use monotonic time for durations
import time

start = time.monotonic()
# ... operation ...
duration = time.monotonic() - start

# Use UTC for all stored timestamps
from datetime import datetime, timezone

created_at = datetime.now(timezone.utc)

# Don't rely on timestamp ordering across machines
# Use sequence numbers or logical clocks for ordering
```

**Test Cases**: `EC-042-a` (simulated skew)

---

## Data Integrity

### EC-050: Corrupted KV Block Data

**Scenario**: Storage corruption causes invalid block data.

**Risk**: Generation garbage, crashes, security issues.

**Handling**:
```python
import hashlib

class KVBlock:
    hash: str
    data: bytes
    checksum: str  # SHA-256 of data

    def verify(self) -> bool:
        computed = hashlib.sha256(self.data).hexdigest()
        return computed == self.checksum

async def retrieve_block(block_hash: str) -> KVBlock:
    block = await self.storage.get(block_hash)

    if not block.verify():
        logger.error(f"Block corruption detected: {block_hash}")
        raise StorageCorruptionError(
            f"Data integrity check failed for block {block_hash[:16]}..."
        )

    return block
```

**Test Cases**: `EC-050-a` (bit flip), `EC-050-b` (truncation), `EC-050-c` (wrong data)

---

### EC-051: Database Corruption

**Scenario**: SQLite database becomes corrupted.

**Risk**: Complete data loss, unrecoverable state.

**Handling**:
```python
async def health_check(self) -> HealthResult:
    try:
        # SQLite integrity check
        result = await self.db.execute("PRAGMA integrity_check")
        if result != "ok":
            return HealthResult(
                healthy=False,
                error="Database integrity check failed",
                recovery="Restore from backup or reinitialize"
            )
    except Exception as e:
        return HealthResult(
            healthy=False,
            error=f"Database error: {e}",
            recovery="Check database file permissions and disk space"
        )

    return HealthResult(healthy=True)
```

**Prevention**:
- Regular backups
- WAL mode for crash resistance
- Periodic integrity checks

**Test Cases**: `EC-051-a` (simulated corruption)

---

### EC-052: Partial Write on Disk Full

**Scenario**: Disk fills up mid-write.

**Risk**: Incomplete files, corrupted blocks.

**Handling**:
```python
async def write_block_atomic(path: Path, data: bytes):
    # Write to temp file first
    temp_path = path.with_suffix(".tmp")

    try:
        async with aiofiles.open(temp_path, "wb") as f:
            await f.write(data)
            await f.flush()
            os.fsync(f.fileno())  # Ensure written to disk

        # Atomic rename
        temp_path.rename(path)

    except OSError as e:
        # Clean up temp file
        temp_path.unlink(missing_ok=True)
        raise StorageWriteError(f"Failed to write block: {e}")
```

**Test Cases**: `EC-052-a` (simulated disk full)

---

## Edge Case Test Matrix

### Priority Levels

| Priority | Description | Test Frequency |
|----------|-------------|----------------|
| P0 | Data loss or corruption possible | Every commit |
| P1 | Service disruption possible | Every PR |
| P2 | Degraded experience | Weekly |
| P3 | Cosmetic or rare | Monthly |

### Test Coverage

| Edge Case | Priority | Unit Test | Integration Test | E2E Test |
|-----------|----------|-----------|------------------|----------|
| EC-001 | P0 | ✅ | ✅ | ✅ |
| EC-002 | P1 | ✅ | ✅ | ⬜ |
| EC-003 | P1 | ✅ | ✅ | ⬜ |
| EC-004 | P3 | ✅ | ⬜ | ⬜ |
| EC-005 | P0 | ✅ | ✅ | ✅ |
| EC-010 | P2 | ✅ | ⬜ | ⬜ |
| EC-011 | P1 | ✅ | ✅ | ⬜ |
| EC-012 | P2 | ✅ | ⬜ | ⬜ |
| EC-013 | P1 | ✅ | ⬜ | ⬜ |
| EC-014 | P2 | ✅ | ⬜ | ⬜ |
| EC-020 | P0 | ✅ | ✅ | ✅ |
| EC-021 | P1 | ✅ | ✅ | ⬜ |
| EC-022 | P1 | ✅ | ⬜ | ⬜ |
| EC-030 | P0 | ✅ | ✅ | ⬜ |
| EC-031 | P1 | ✅ | ✅ | ⬜ |
| EC-040 | P0 | ✅ | ✅ | ✅ |
| EC-041 | P1 | ✅ | ✅ | ⬜ |
| EC-042 | P2 | ✅ | ⬜ | ⬜ |
| EC-050 | P0 | ✅ | ✅ | ✅ |
| EC-051 | P0 | ✅ | ✅ | ⬜ |
| EC-052 | P0 | ✅ | ✅ | ⬜ |

---

## Recovery Procedures

### Automatic Recovery

These edge cases trigger automatic recovery:

| Edge Case | Recovery Action |
|-----------|-----------------|
| EC-040 | Rollback partial freeze, preserve session |
| EC-041 | Retry with extended timeout |
| EC-050 | Skip corrupted block, log for manual review |

### Manual Recovery

These require operator intervention:

| Edge Case | Recovery Steps |
|-----------|----------------|
| EC-051 | 1. Stop server 2. Restore from backup 3. Verify integrity 4. Restart |
| EC-052 | 1. Free disk space 2. Run cleanup 3. Retry operation |
| EC-031 | 1. List orphaned windows 2. Delete or reassign |

---

## Monitoring & Alerting

### Metrics to Track

```python
# Prometheus metrics for edge case monitoring
edge_case_occurrences = Counter(
    "cwm_edge_case_total",
    "Count of edge case occurrences",
    ["edge_case_id", "outcome"]  # outcome: handled, failed, recovered
)

concurrent_operations = Gauge(
    "cwm_concurrent_operations",
    "Current concurrent operations",
    ["operation_type"]
)

storage_utilization = Gauge(
    "cwm_storage_utilization_ratio",
    "Storage utilization ratio",
    ["tier"]  # cpu, disk, redis
)
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Storage utilization | >80% | >95% |
| Concurrent operations | >50 | >90 |
| Edge case rate | >1/min | >10/min |
| Corruption events | >0 | >0 |

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-23 | Initial edge cases documentation |
