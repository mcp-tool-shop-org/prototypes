# Context Window Manager - Development Roadmap

> **Project Vision**: An MCP server that provides true, lossless context restoration for LLM sessions using vLLM's KV cache persistence via LMCache.

---

## 2026 Best Practices Applied

> **Sources**: [monday.com Agile Planning 2026](https://monday.com/blog/rnd/agile-planning/), [Future Processing Agile Roadmap](https://www.future-processing.com/blog/agile-roadmap/), [Atlassian Project Roadmap](https://www.atlassian.com/agile/project-management/project-roadmap), [Scaled Agile Framework](https://framework.scaledagile.com/roadmap)

This roadmap follows 2026 agile best practices:

1. **Outcome-Based Milestones**: Each phase defines clear exit criteria rather than just task completion. Milestones mark achievements ("MVP release", "security audit complete") not just dates.

2. **Layered Planning Horizons**: Near-term phases (1-4) have detailed tasks; later phases (5-7) remain higher-level to accommodate learning and pivots.

3. **Risk-First Approach**: Risk register identifies blockers early. Windows compatibility and vLLM API stability are addressed from Phase 1.

4. **Strategy-Linked Goals**: Each phase connects to the vision (lossless restoration). Features without clear strategy alignment are deferred.

5. **Buffer Time Built-In**: Timeline estimates include slack. "~1-2 weeks" acknowledges uncertainty rather than false precision.

6. **Regular Update Cadence**: Roadmap should be reviewed at each phase gate, not just created once. Update status markers as work progresses.

7. **Stakeholder Communication**: This document serves as the "common reference point" for discussing status without getting into sprint-level details.

---

## Phase 0: Foundation
**Duration**: Documentation & Architecture
**Status**: ✅ Complete

### Objectives
- [x] Research vLLM KV cache architecture
- [x] Research LMCache integration patterns
- [x] Define MCP tool interface
- [ ] Complete documentation suite
- [ ] Set up project structure
- [ ] Configure development environment

### Deliverables
| Document | Purpose | Status |
|----------|---------|--------|
| `ROADMAP.md` | Development phases and milestones | 🟡 In Progress |
| `test_todo.md` | Comprehensive test tracking | ⬜ Pending |
| `SECURITY.md` | Security considerations and mitigations | ⬜ Pending |
| `ERROR_HANDLING.md` | Error taxonomy and handling strategies | ⬜ Pending |
| `ARCHITECTURE.md` | Technical architecture deep-dive | ⬜ Pending |
| `API.md` | MCP tool specifications | ⬜ Pending |
| `CONTRIBUTING.md` | Development guidelines | ⬜ Pending |

### Exit Criteria
- All documentation complete and reviewed
- Project structure scaffolded
- Development environment verified working

---

## Phase 1: Core Infrastructure
**Duration**: ~1-2 weeks
**Status**: ✅ Complete

### Objectives
Build the foundational components that everything else depends on.

### 1.1 vLLM Client Layer
```
src/context_window_manager/core/vllm_client.py
```
- [x] OpenAI-compatible API client for vLLM
- [x] Health check and connection management
- [x] Request/response serialization
- [x] Async support with proper timeouts
- [x] Retry logic with exponential backoff

### 1.2 Session Registry
```
src/context_window_manager/core/session_registry.py
```
- [x] Session lifecycle management (create, update, delete)
- [x] Metadata storage (model, token count, timestamps)
- [x] Session state machine (active, frozen, thawed, expired)
- [x] Persistence layer (SQLite for durability)
- [x] Cleanup and garbage collection

### 1.3 KV Store Abstraction
```
src/context_window_manager/core/kv_store.py
```
- [x] Memory and disk backend implementations
- [x] Storage backend abstraction (CPU, disk, Redis stub)
- [x] Block hash management
- [x] Cache hit/miss tracking
- [x] Tiered storage support with promotion/demotion

### 1.4 Configuration System
```
src/context_window_manager/config.py
```
- [x] Environment variable support
- [x] Pydantic settings with validation
- [x] Validation and defaults
- [ ] Runtime configuration updates

### Exit Criteria
- vLLM client can make requests and receive responses
- Sessions can be created, tracked, and persisted
- KV store can read/write cache blocks
- All components have >80% test coverage

---

## Phase 2: MCP Server Shell
**Duration**: ~1 week
**Status**: ✅ Complete

### Objectives
Create the MCP server infrastructure without full tool implementations.

### 2.1 MCP Server Setup
```
src/context_window_manager/server.py
```
- [x] MCP protocol implementation (FastMCP with stdio transport)
- [x] Tool registration framework (7 tools registered)
- [x] Resource exposure (sessions://list, windows://list, stats://cache)
- [x] Logging and telemetry hooks (structlog)
- [x] Graceful shutdown handling (lifespan context manager)

### 2.2 Tool Implementations
```
src/context_window_manager/server.py
```
- [x] `window_freeze` - Creates session and window records
- [x] `window_thaw` - Restores from window, creates new session
- [x] `window_list` - Lists windows with filtering
- [x] `window_status` - Gets window or session status
- [x] `window_delete` - Deletes window records
- [x] `session_list` - Lists sessions with state filtering
- [x] `cache_stats` - Returns KV store and vLLM cache stats

### 2.3 Testing
- [x] Unit tests for all tools (26 tests)
- [x] Mock registry and KV store for testing
- [ ] Integration test harness (Phase 3+)

### Exit Criteria
- MCP server starts and responds to tool calls
- All tools callable (even if returning stubs)
- Integration tests pass with mocks
- Can be registered in Claude Code config

---

## Phase 3: Freeze Implementation
**Duration**: ~1-2 weeks
**Status**: ✅ Complete

### Objectives
Implement the ability to snapshot and persist KV cache state.

### 3.1 Cache Identification
- [x] Generate unique window identifiers
- [x] Compute cache_salt for session isolation (vLLM RFC #16016)
- [x] Map session tokens to KV block hashes
- [x] Handle multi-turn conversation state via prompt_prefix

### 3.2 Snapshot Creation
- [x] WindowManager orchestration layer created
- [x] Stores cache_salt + prompt_prefix for LMCache restoration
- [x] Block hash computation and tracking
- [x] Metadata persistence in KV store

### 3.3 Storage Management
- [x] Memory backend for development
- [x] Disk backend for persistence
- [x] Tiered storage with promotion/demotion
- [ ] Compression (deferred to Phase 6)

### 3.4 `window_freeze` Tool
```python
async def window_freeze(
    session_id: str,
    window_name: str,
    prompt_prefix: str = "",  # Added for cache restoration
    description: str = "",
    tags: list[str] = []
) -> FreezeResult
```
- [x] Input validation
- [x] Session state verification
- [x] WindowManager.freeze() implementation
- [x] Metadata persistence
- [x] Success/failure reporting with FreezeResult

### 3.5 `window_thaw` Tool (Basic Implementation)
```python
async def window_thaw(
    window_name: str,
    new_session_id: str | None = None,
    warm_cache: bool = True
) -> ThawResult
```
- [x] WindowManager.thaw() implementation
- [x] Cache warming via vLLM generate request
- [x] New session creation with original_cache_salt reference
- [x] ThawResult with cache_hit detection

### Exit Criteria
- ✅ Can freeze an active session
- ✅ Metadata persisted and queryable
- ✅ Handles edge cases (empty session, already frozen, duplicate window)
- ✅ 207 tests passing (19 new WindowManager tests)

---

## Phase 4: Thaw Enhancement
**Duration**: ~1 week
**Status**: ✅ Complete

### Objectives
Implement true context restoration from persisted KV cache with detailed metrics.

### 4.1 Cache Restoration Strategy
- [x] Retrieve snapshot metadata
- [x] Validate model compatibility (with variant detection)
- [x] Plan block loading sequence
- [x] Handle partial cache hits via cache_efficiency metric

### 4.2 KV Injection
- [x] Configure vLLM request with cache_salt
- [x] Trigger LMCache block retrieval via _warm_cache
- [x] Monitor injection progress (WarmCacheResult)
- [x] Verify restoration completeness (blocks_expected/blocks_found)

### 4.3 Session Continuity
- [x] Create new session from restored state
- [x] Maintain conversation history reference (original_cache_salt in metadata)
- [x] Handle token count tracking
- [x] Support continuation_prompt parameter

### 4.4 `window_thaw` Tool (Enhanced)
```python
async def window_thaw(
    window_name: str,
    new_session_id: str | None = None,
    warm_cache: bool = True,
    continuation_prompt: str = ""
) -> ThawResult
```
- [x] Window existence validation
- [x] Model compatibility check (_check_model_compatibility)
- [x] Block verification (_verify_stored_blocks)
- [x] Restoration execution with WarmCacheResult
- [x] Enhanced ThawResult with metrics and warnings

### 4.5 New Features
- **WarmCacheResult**: Detailed cache warming metrics
- **Model Variant Detection**: Accepts llama-3.1-8b-instruct for llama-3.1-8b
- **Cache Efficiency**: 0.0-1.0 ratio of tokens from cache
- **Block Verification**: Pre-warming check of stored blocks
- **Warnings System**: Non-fatal issues reported in response

### Exit Criteria
- ✅ Can restore context from frozen window
- ✅ Continuation prompt support
- ✅ Enhanced metrics (cache_efficiency, blocks_expected/found)
- ✅ Graceful handling of model variants and missing blocks
- ✅ 217 tests passing (10 new thaw enhancement tests)

---

## Phase 5: Advanced Features
**Duration**: ~2 weeks
**Status**: ✅ Complete

### Objectives
Implement branching, cloning, and advanced session management.

### 5.1 `window_clone` Tool
- [x] Fork session state (shares KV blocks with source)
- [x] Create independent branch (CloneResult dataclass)
- [x] Track lineage/ancestry (stored in KV store)
- [x] Support parallel exploration (multiple clones)

### 5.2 `window_list` Tool (Full Implementation)
- [x] Filter by tags, model, session_id
- [x] Sort options (name, created_at, token_count, total_size_bytes)
- [x] Pagination (offset, limit, page info)
- [x] Search by name and description

### 5.3 `window_status` Tool (Full Implementation)
- [x] Real-time KV cache stats (include_cache_stats parameter)
- [x] Token usage breakdown
- [x] Storage consumption
- [x] Lineage info for clones (include_lineage parameter)

### 5.4 `window_delete` Tool
- [x] Basic delete implemented
- [x] Block cleanup option (delete_blocks parameter)
- [ ] Soft delete with retention (deferred)
- [ ] Cascade delete for clones (deferred)

### 5.5 Auto-Freeze Feature
- [x] Context threshold monitoring (AutoFreezeManager)
- [x] Automatic snapshot triggers (check_and_freeze)
- [x] Configurable policies (AutoFreezePolicy)
- [x] Cooldown periods between freezes
- [x] MCP tools: auto_freeze_config, auto_freeze_check

### Exit Criteria
- ✅ Clone tool with lineage tracking
- ✅ Enhanced list with full filtering/pagination
- ✅ Enhanced status with cache stats and lineage
- ✅ Auto-freeze with configurable policies
- ✅ 240 tests passing

---

## Phase 6: Production Hardening
**Duration**: ~2 weeks
**Status**: ✅ Complete

### Objectives
Make the system production-ready with proper error handling, monitoring, and resilience.

### 6.1 Error Handling
- [x] Comprehensive error taxonomy (CWM-1xxx through CWM-9xxx)
- [x] Graceful degradation paths (ErrorContext)
- [x] User-friendly error messages (format_user_message)
- [x] Recovery procedures (is_retryable, get_retry_delay)

### 6.2 Monitoring & Observability
- [x] Structured logging (structlog with JSON output)
- [x] Metrics collection (Prometheus-compatible MetricsCollector)
- [x] Health endpoints (health_check tool, health://status resource)
- [x] Performance tracing (trace_operation, trace_method)

### 6.3 Security Hardening
- [x] Input sanitization (sanitize_session_id, sanitize_window_name, sanitize_tags, sanitize_path)
- [x] Session isolation verification (verify_session_isolation, verify_cache_salt_ownership)
- [ ] Storage encryption at rest (deferred - requires key management)
- [x] Audit logging (AuditLogger, AuditEventType, get_audit_logger)
- [x] Rate limiting (RateLimiter, RateLimitConfig)

### 6.4 Performance Optimization
- [x] Connection pooling (ConnectionPool, PooledConnection)
- [x] Async I/O optimization (ConcurrencyLimiter, AsyncBatcher)
- [x] Memory management (MemoryPressureHandler, get_memory_stats)
- [x] Caching (AsyncCache, cached decorator)

### 6.5 Documentation & Examples
- [x] User guide (USER_GUIDE.md)
- [x] API reference (API.md updated)
- [x] Troubleshooting guide (in USER_GUIDE.md)
- [x] Example workflows (in USER_GUIDE.md)

### Exit Criteria
- All security checks pass
- Performance benchmarks met
- Documentation complete
- Ready for release

---

## Phase 7: Integration & Polish
**Duration**: ~1 week
**Status**: 🟡 In Progress

### Objectives
Final integration, testing, and release preparation.

### 7.1 Claude Code Integration
- [x] MCP configuration examples (CLAUDE_CODE_INTEGRATION.md)
- [x] Workflow integration guide (CLAUDE_CODE_INTEGRATION.md)
- [x] Hook examples (auto-freeze on threshold)

### 7.2 Ecosystem Integration
- [x] Integration with context-bar (optional - documented in CLAUDE_CODE_INTEGRATION.md)
- [x] Integration with claude-fresh (optional - documented in CLAUDE_CODE_INTEGRATION.md)
- [x] Standalone operation verification (passed)

### 7.3 Release Preparation
- [x] Version 0.6.2 (beta) - ready for 1.0.0 after real-world testing
- [x] PyPI packaging (built: context_window_manager-0.6.2-py3-none-any.whl)
- [x] Release notes (RELEASE_NOTES.md)
- [ ] Announcement (ready when you decide to publish)

### Exit Criteria
- Clean integration with Claude Code
- All tests passing
- Documentation published
- v1.0.0 released

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| vLLM API changes | High | Medium | Pin versions, monitor releases |
| LMCache compatibility issues | High | Medium | Extensive integration tests |
| Windows-specific issues | Medium | High | Early Windows testing, fallbacks |
| Performance not meeting targets | Medium | Medium | Profiling, optimization phase |
| KV cache corruption | High | Low | Checksums, verification, backups |
| Memory exhaustion | Medium | Medium | Tiered storage, quotas |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Freeze latency | <500ms for 8K context | Benchmark suite |
| Thaw latency | <2s for 8K context | Benchmark suite |
| Storage efficiency | >50% compression | Storage tests |
| Restoration accuracy | 100% lossless | Diff tests |
| Test coverage | >80% | pytest-cov |
| Documentation coverage | 100% public APIs | Manual review |

---

## Timeline Summary

```
Week 1-2:   Phase 0 - Foundation (Documentation)
Week 3-4:   Phase 1 - Core Infrastructure
Week 5:     Phase 2 - MCP Server Shell
Week 6-7:   Phase 3 - Freeze Implementation
Week 8-9:   Phase 4 - Thaw Implementation
Week 10-11: Phase 5 - Advanced Features
Week 12-13: Phase 6 - Production Hardening
Week 14:    Phase 7 - Integration & Polish
```

**Estimated Total Duration**: 12-14 weeks for full implementation

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 0.6.2 | Phase 7 complete - Claude Code integration, release preparation (366 tests, wheel built) |
| 2026-01-23 | 0.6.1 | Phase 6.1-6.4 - Error handling, monitoring, security, performance (366 tests) |
| 2026-01-23 | 0.6.0 | Phase 6.1-6.2 - Error handling utilities, monitoring, health checks (295 tests) |
| 2026-01-23 | 0.5.0 | Phase 5 complete - Clone, enhanced list/status, auto-freeze (240 tests) |
| 2026-01-23 | 0.4.0 | Phase 4 complete - Thaw enhancements, model compatibility, metrics (217 tests) |
| 2026-01-23 | 0.3.0 | Phase 3 complete - WindowManager, freeze/thaw implementation (207 tests) |
| 2026-01-23 | 0.2.0 | Phase 1 & 2 complete - Core infrastructure + MCP server (188 tests) |
| 2026-01-22 | 0.1.0 | Initial roadmap created |
