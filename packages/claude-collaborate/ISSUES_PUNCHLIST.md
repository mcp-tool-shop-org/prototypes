# Claude Collaborate — Performance-Focused GitHub Issues Punch List

One issue per bullet. Each includes acceptance criteria inline.

## P0 — Must-fix (throughput correctness)

### ~~Issue: Add file I/O locking around JSONL read+clear operations~~ (RESOLVED in v1.0.4)
**Priority:** P0
**Area:** ws_bridge.py file bridge
**Status:** Resolved in v1.0.4 — asyncio.Lock added to prevent message file race conditions.

**Problem:** `get_messages()` / `get_claude_responses()` read the JSONL file and then immediately clear it. Concurrent writers (WebSocket handler, HTTP endpoint, or external Claude process) can interleave writes and cause lost messages or corrupt reads.

**Work:**
- Introduce an `asyncio.Lock` (module-level) used by:
  - message append
  - response append
  - get+clear read operations
- Ensure lock covers the read loop and the clear/write step.

**Acceptance criteria:**
- Under concurrent append+read, no messages are lost and JSON remains parseable.
- Unit test simulates interleaving with a monkeypatched write during read and asserts expected outcomes (or uses lock to prevent interleaving).

---

### Issue: Bound file growth with rotation/size caps
**Priority:** P0  
**Area:** durability/perf

**Problem:** If consumers stop reading, JSONL files can grow unbounded, making read+clear expensive and risking disk bloat.

**Work:**
- Add max-size (e.g., 10MB) and rotate:
  - `messages.jsonl` -> `messages.jsonl.1`
  - `claude_responses.jsonl` -> `claude_responses.jsonl.1`
- Optionally keep last N rotations.

**Acceptance criteria:**
- When file exceeds max-size, rotation occurs and system continues functioning.
- Rotation does not drop the most recent message.
- Unit test writes >max-size and asserts rotation occurred.

---

## P1 — High leverage (latency + scalability)

### Issue: Replace “read whole file then clear” with incremental offsets (tail semantics)
**Priority:** P1  
**Area:** file bridge performance

**Problem:** Reading and parsing the entire JSONL file each poll is O(N) per request. For long sessions or frequent polling, this scales poorly.

**Work:**
- Maintain a cursor/offset (in memory or small sidecar file):
  - only read new bytes since last read
  - truncate/compact periodically
- Preserve the current semantics as a fallback mode.

**Acceptance criteria:**
- In steady state, polling reads only appended messages, not historical messages.
- Unit test: after initial read, append messages and verify next read returns only new ones.

---

### Issue: Add batching and backpressure for WebSocket broadcasts
**Priority:** P1  
**Area:** broadcast scalability

**Problem:** `broadcast_to_clients()` sends each message immediately. Under high-volume streams, this can overwhelm slow clients and increase memory usage.

**Work:**
- Add an optional broadcast queue and batch flush (e.g., every 25–50ms or max N messages).
- Drop or coalesce low-priority updates when clients lag.

**Acceptance criteria:**
- Under rapid send, server remains responsive and queue is bounded.
- Deterministic behavior: ordering preserved for messages in same batch.
- Unit test uses dummy clients and asserts batching sends expected counts.

---

### ~~Issue: Avoid storing duplicate message state (remove or cap message_queue)~~ (RESOLVED in v1.0.4)
**Priority:** P1
**Area:** memory/perf
**Status:** Resolved in v1.0.4 — `message_queue` removed from the codebase.

**Problem:** `message_queue` duplicates what is already in the file but is never consumed in this script, increasing memory footprint.

**Work:**
- Remove `message_queue`, or cap it (ring buffer) and provide a consumer API.

**Acceptance criteria:**
- Memory does not grow with session length due to redundant queue.
- If queue retained, it is capped and documented.

---

## P2 — Maintainability & performance regressions

### Issue: Add non-flaky perf regression tests (call-count/behavior based)
**Priority:** P2  
**Area:** tests

**Problem:** Timing-based perf tests are flaky. Use behavioral assertions instead.

**Work:**
- Keep tests that assert:
  - files are cleared exactly once after read
  - closed clients are skipped
  - read path is single-pass line iteration (no double parsing)

**Acceptance criteria:**
- Perf regression tests pass reliably in CI without wall-clock thresholds.

---

### Issue: Make polling API explicit and document recommended poll interval
**Priority:** P2  
**Area:** docs/perf

**Problem:** Aggressive polling can cause needless file reads and JSON parsing.

**Work:**
- Document recommended poll interval and limits.
- Add server-side rate limiting for `/api/messages` and `/ws` message types (optional).

**Acceptance criteria:**
- README includes recommended poll interval and scaling notes.
- Optional: basic per-client rate limit prevents abuse without breaking normal use.

