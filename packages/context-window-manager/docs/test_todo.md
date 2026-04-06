# Context Window Manager - Test Tracking

> **Purpose**: Comprehensive tracking of all tests - planned, in progress, passing, and failing.
> **Last Updated**: 2026-01-23

---

## 2026 Best Practices Applied

> **Sources**: [pytest-asyncio Tips](https://articles.mergify.com/pytest-asyncio-2/), [Async Test Patterns](https://tonybaloney.github.io/posts/async-test-patterns-for-pytest-and-unittest.html), [pytest-asyncio Guide](https://pytest-with-eric.com/pytest-advanced/pytest-asyncio/), [FastAPI Async Tests](https://fastapi.tiangolo.com/advanced/async-tests/)

This test suite follows 2026 async testing best practices:

1. **Always Use `@pytest.mark.asyncio`**: Without the marker, async tests pass without actually running. The `asyncio_mode = "auto"` in pytest.ini catches this.

2. **Use `AsyncMock` for Async Code**: Regular `Mock()` doesn't work for `async def` functions. Use `unittest.mock.AsyncMock` for proper async mocking.

3. **Async Fixtures with `@pytest_asyncio.fixture`**: Fixtures that need await must use the async fixture decorator, not the standard `@pytest.fixture`.

4. **Concurrent Test Preconditions**: Use `asyncio.gather()` in fixtures to run setup tasks concurrently, reducing test execution time.

5. **Avoid Deadlocks in Fixtures**: Order fixture dependencies carefully. Minimize shared state between async fixtures to prevent circular waits.

6. **Mock External Services**: Never hit real APIs in tests. Use `respx` for HTTP mocking, `AsyncMock` for internal dependencies.

7. **Test Error Paths**: Don't just test happy paths. Use `pytest.raises` with async code to verify exception handling works correctly.

8. **Descriptive Mock Names**: When dealing with nested async mocks, use clear naming to make test failures understandable.

---

## Test Philosophy

1. **Test-Driven Development**: Write tests before implementation where possible
2. **Layered Testing**: Unit → Integration → End-to-End
3. **Windows-First**: All tests must pass on Windows (our primary platform)
4. **Realistic Mocks**: Mock at boundaries, not internals
5. **Performance Tests**: Include latency/throughput tests from the start

---

## Test Categories

### Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Passing
- ❌ Failing
- 🔄 Flaky (needs attention)
- ⏭️ Skipped (blocked/deferred)

---

## Unit Tests

### Core: vLLM Client (`tests/unit/core/test_vllm_client.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| UC-001 | Client initialization with valid config | ✅ | `test_context_manager` |
| UC-002 | Client initialization with invalid URL | ⬜ | Should raise ConfigError |
| UC-003 | Health check - server available | ✅ | `test_health_check_success` |
| UC-004 | Health check - server unavailable | ✅ | `test_health_check_failure` |
| UC-005 | Generate request - basic prompt | ✅ | `test_generate_basic` |
| UC-006 | Generate request - with cache_salt | ✅ | `test_generate_with_cache_salt` |
| UC-007 | Generate request - timeout handling | ✅ | `test_timeout_raises` |
| UC-008 | Generate request - retry on 503 | ✅ | `test_server_errors_raise`, `test_retry_on_connection_error` |
| UC-009 | Generate request - no retry on 400 | ✅ | `test_client_errors_raise_value_error` |
| UC-010 | Connection pooling - reuse connections | ⬜ | Performance test |
| UC-011 | Async context manager cleanup | ✅ | `test_close_session` |
| UC-012 | Chat completion | ✅ | `test_chat_completion` |
| UC-013 | List models | ✅ | `test_list_models` |
| UC-014 | Model availability check | ✅ | `test_model_available` |
| UC-015 | Cache stats parsing | ✅ | `test_get_cache_stats`, `test_from_metrics_*` |
| UC-016 | GenerateResponse parsing | ✅ | `test_from_dict`, `test_from_dict_missing_*` |
| UC-017 | ChatResponse parsing | ✅ | `TestChatResponse` |
| UC-018 | Connection error handling | ✅ | `test_connection_error_raises` |

### Core: Session Registry (`tests/unit/core/test_session_registry.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| SR-001 | Create new session | ✅ | `test_create_session` |
| SR-002 | Create session - duplicate ID rejected | ✅ | `test_create_duplicate_session` |
| SR-003 | Get session by ID | ✅ | `test_get_session` |
| SR-004 | Get session - not found returns None | ✅ | `test_get_nonexistent_session` |
| SR-005 | Update session metadata | ✅ | `test_create_session_with_metadata` |
| SR-006 | Update session - state transitions valid | ✅ | `TestStateTransitions` (all valid transitions) |
| SR-007 | Update session - invalid state transition | ✅ | `TestStateTransitions` (invalid transitions) |
| SR-008 | Delete session - soft delete | ✅ | `test_delete_session` |
| SR-009 | Delete session - hard delete | ⬜ | Removes all data |
| SR-010 | List sessions - all | ✅ | `test_list_sessions` |
| SR-011 | List sessions - filter by state | ✅ | `test_list_sessions_by_state` |
| SR-012 | List sessions - filter by model | ✅ | `test_list_sessions_by_model` |
| SR-013 | List sessions - pagination | ⬜ | |
| SR-014 | Session expiry - auto-cleanup | ⬜ | |
| SR-015 | Persistence - survives restart | ⬜ | SQLite durability |
| SR-016 | Concurrent access - no race conditions | ✅ | `test_concurrent_operations` |
| SR-017 | Update token count | ✅ | `test_update_token_count` |
| SR-018 | Update nonexistent session | ✅ | `test_update_nonexistent_session` |
| SR-019 | Create window | ✅ | `test_create_window` |
| SR-020 | Create window - nonexistent session | ✅ | `test_create_window_nonexistent_session` |
| SR-021 | Get window by ID | ✅ | `test_get_window` |
| SR-022 | Get window by name | ✅ | `test_get_window_by_name` |
| SR-023 | List windows | ✅ | `test_list_windows` |
| SR-024 | List windows by tags | ✅ | `test_list_windows_by_tags` |
| SR-025 | Delete window | ✅ | `test_delete_window` |
| SR-026 | Delete nonexistent window | ✅ | `test_delete_nonexistent_window` |
| SR-027 | Session to_dict | ✅ | `TestSession.test_to_dict` |
| SR-028 | Session from_row | ✅ | `TestSession.test_from_row` |
| SR-029 | Window to_dict | ✅ | `TestWindow.test_to_dict` |
| SR-030 | Window from_row | ✅ | `TestWindow.test_from_row` |

### Core: KV Store (`tests/unit/core/test_kv_store.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| KV-001 | Initialize with memory backend | ✅ | `TestMemoryKVStore` fixture |
| KV-002 | Initialize with disk backend | ✅ | `TestDiskKVStore` fixture |
| KV-003 | Initialize with Redis backend | ⬜ | Not implemented yet |
| KV-004 | Store KV blocks - single block | ✅ | `test_store_single_block` |
| KV-005 | Store KV blocks - multiple blocks | ✅ | `test_store_multiple_blocks` |
| KV-006 | Store KV blocks - exceeds limit | ✅ | `test_store_exceeds_limit` |
| KV-007 | Retrieve KV blocks - cache hit | ✅ | `test_retrieve_existing` |
| KV-008 | Retrieve KV blocks - cache miss | ✅ | `test_retrieve_nonexistent` |
| KV-009 | Retrieve KV blocks - partial hit | ✅ | `test_retrieve_partial` |
| KV-010 | Block hash computation | ✅ | `TestComputeBlockHash` |
| KV-011 | Storage quota enforcement | ✅ | `test_store_exceeds_limit` |
| KV-012 | Tiered fallback - hot→warm→cold | ✅ | `TestTieredKVStore` |
| KV-013 | Compression - enabled | ⬜ | |
| KV-014 | Compression - disabled | ⬜ | |
| KV-015 | Deduplication - common prefixes | ⬜ | |
| KV-016 | Cleanup - clear all | ✅ | `test_clear_all` |
| KV-017 | Metrics - hit/miss tracking accurate | ✅ | `test_get_metrics` |
| KV-018 | Delete blocks | ✅ | `test_delete_existing`, `test_delete_nonexistent` |
| KV-019 | Check block existence | ✅ | `test_exists_check`, `test_exists_on_disk` |
| KV-020 | Get block metadata | ✅ | `test_get_metadata`, `test_get_metadata_nonexistent` |
| KV-021 | List blocks | ✅ | `test_list_blocks` |
| KV-022 | List blocks by session | ✅ | `test_list_blocks_by_session` |
| KV-023 | List blocks with limit | ✅ | `test_list_blocks_with_limit` |
| KV-024 | Clear by session | ✅ | `test_clear_by_session` |
| KV-025 | Health check | ✅ | `test_health_check` |
| KV-026 | Disk store creates directories | ✅ | `test_store_creates_directories` |
| KV-027 | Disk store metadata persistence | ✅ | `test_metadata_persisted` |
| KV-028 | Tiered store demotion on capacity | ✅ | `test_demotion_on_capacity` |
| KV-029 | Tiered store promotion on access | ✅ | `test_retrieve_promotes_from_warm` |
| KV-030 | Create store factory (memory) | ✅ | `test_create_memory_store` |
| KV-031 | Create store factory (disk) | ✅ | `test_create_disk_store` |
| KV-032 | Create store factory requires path | ✅ | `test_disk_requires_path` |
| KV-033 | BlockMetadata to_dict | ✅ | `TestBlockMetadata` |
| KV-034 | StoreResult properties | ✅ | `TestStoreResult` |
| KV-035 | RetrieveResult properties | ✅ | `TestRetrieveResult` |
| KV-036 | CacheMetrics hit_rate | ✅ | `TestCacheMetrics` |

### Core: Configuration (`tests/unit/test_config.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| CF-001 | Load from environment variables | ✅ | `test_load_from_env_*` |
| CF-002 | Load from config file (YAML) | ⬜ | |
| CF-003 | Load from config file (TOML) | ⬜ | |
| CF-004 | Environment overrides file | ⬜ | |
| CF-005 | Default values applied | ✅ | `test_default_values` (all config classes) |
| CF-006 | Validation - required fields | ⬜ | |
| CF-007 | Validation - type checking | ⬜ | |
| CF-008 | Validation - range checking | ✅ | `test_invalid_timeout_too_low`, `test_invalid_max_connections_zero` |
| CF-009 | Runtime update - allowed fields | ⬜ | |
| CF-010 | Runtime update - blocked fields | ⬜ | |
| CF-011 | LogLevel enum | ✅ | `TestLogLevel` |
| CF-012 | VLLMConfig defaults | ✅ | `TestVLLMConfig.test_default_values` |
| CF-013 | VLLMConfig custom values | ✅ | `TestVLLMConfig.test_custom_values` |
| CF-014 | StorageConfig defaults | ✅ | `TestStorageConfig.test_default_values` |
| CF-015 | StorageConfig path expansion | ✅ | `TestStorageConfig.test_path_expansion` |
| CF-016 | SecurityConfig defaults | ✅ | `TestSecurityConfig.test_default_values` |
| CF-017 | ResourceLimits defaults | ✅ | `TestResourceLimits.test_default_values` |
| CF-018 | Settings default creation | ✅ | `TestSettings.test_default_creation` |
| CF-019 | Settings nested access | ✅ | `TestSettings.test_nested_access` |
| CF-020 | Settings db_path expansion | ✅ | `TestSettings.test_db_path_expansion` |
| CF-021 | get_settings singleton | ✅ | `TestGetSettings.test_singleton_behavior` |
| CF-022 | reset_settings clears singleton | ✅ | `TestGetSettings.test_reset_clears_singleton` |

### Core: Errors (`tests/unit/test_errors.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| ER-001 | CWMError basic creation | ✅ | `TestCWMError.test_basic_creation` |
| ER-002 | CWMError with context | ✅ | `TestCWMError.test_with_context` |
| ER-003 | CWMError to_dict | ✅ | `TestCWMError.test_to_dict` |
| ER-004 | CWMError to_log_dict | ✅ | `TestCWMError.test_to_log_dict` |
| ER-005 | ValidationError | ✅ | `TestValidationError` |
| ER-006 | SessionNotFoundError | ✅ | `TestSessionNotFoundError` |
| ER-007 | WindowNotFoundError | ✅ | `TestWindowNotFoundError` |
| ER-008 | StateTransitionError | ✅ | `TestStateTransitionError` |
| ER-009 | KVStoreError | ✅ | `TestKVStoreError` |
| ER-010 | KVStoreConnectionError | ✅ | `TestKVStoreConnectionError` |
| ER-011 | KVStoreTimeoutError | ✅ | `TestKVStoreTimeoutError` |
| ER-012 | VLLMConnectionError | ✅ | `TestVLLMConnectionError` |
| ER-013 | VLLMTimeoutError | ✅ | `TestVLLMTimeoutError` |
| ER-014 | ResourceExhaustedError | ✅ | `TestResourceExhaustedError` |
| ER-015 | SecurityError | ✅ | `TestSecurityError` |
| ER-016 | All inherit from CWMError | ✅ | `TestErrorHierarchy.test_all_inherit_from_base` |
| ER-017 | Catchable by base class | ✅ | `TestErrorHierarchy.test_catchable_by_base_class` |
| ER-018 | Error codes follow format | ✅ | `TestErrorCodes.test_codes_follow_format` |
| ER-019 | Category codes correct | ✅ | `TestErrorCodes.test_category_codes` |

### MCP Server (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| MS-001 | get_state raises when not initialized | ✅ | `TestGetState.test_raises_when_not_initialized` |
| MS-002 | get_state returns state when initialized | ✅ | `TestGetState.test_returns_state_when_initialized` |

### MCP Tool: window_freeze (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TF-001 | Freeze creates session and window | ✅ | `TestWindowFreeze.test_freeze_new_session` |
| TF-002 | Freeze existing session | ✅ | `TestWindowFreeze.test_freeze_existing_session` |
| TF-003 | Freeze duplicate window raises | ✅ | `TestWindowFreeze.test_freeze_duplicate_window_raises` |
| TF-004 | Freeze - window name validation | ⬜ | |
| TF-005 | Freeze - storage failure handling | ⬜ | |
| TF-006 | Freeze - large session performance | ⬜ | Performance test |

### MCP Tool: window_thaw (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TT-001 | Thaw existing window | ✅ | `TestWindowThaw.test_thaw_existing_window` |
| TT-002 | Thaw auto-generates session ID | ✅ | `TestWindowThaw.test_thaw_auto_generates_session_id` |
| TT-003 | Thaw nonexistent window raises | ✅ | `TestWindowThaw.test_thaw_nonexistent_window_raises` |
| TT-004 | Thaw - model not available | ⬜ | |
| TT-005 | Thaw - corrupted blocks | ⬜ | |
| TT-006 | Thaw - performance within SLA | ⬜ | <2s for 8K context |

### MCP Tool: window_list (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TL-001 | List empty returns empty | ✅ | `TestWindowList.test_list_empty` |
| TL-002 | List multiple windows | ✅ | `TestWindowList.test_list_multiple_windows` |
| TL-003 | List with tag filter | ✅ | `TestWindowList.test_list_with_tag_filter` |
| TL-004 | List with limit | ✅ | `TestWindowList.test_list_with_limit` |
| TL-005 | List - sort options | ⬜ | |
| TL-006 | List - search by description | ⬜ | |

### MCP Tool: window_status (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TS-001 | Status for window | ✅ | `TestWindowStatus.test_status_for_window` |
| TS-002 | Status for session | ✅ | `TestWindowStatus.test_status_for_session` |
| TS-003 | Status both params error | ✅ | `TestWindowStatus.test_status_both_params_error` |
| TS-004 | Status no params error | ✅ | `TestWindowStatus.test_status_no_params_error` |
| TS-005 | Status nonexistent window raises | ✅ | `TestWindowStatus.test_status_nonexistent_window_raises` |
| TS-006 | Status nonexistent session raises | ✅ | `TestWindowStatus.test_status_nonexistent_session_raises` |

### MCP Tool: window_delete (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TD-001 | Delete window | ✅ | `TestWindowDelete.test_delete_window` |
| TD-002 | Delete nonexistent raises | ✅ | `TestWindowDelete.test_delete_nonexistent_raises` |
| TD-003 | Delete with blocks cleanup | ⬜ | |

### MCP Tool: session_list (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| SL-001 | List empty returns empty | ✅ | `TestSessionList.test_list_empty` |
| SL-002 | List multiple sessions | ✅ | `TestSessionList.test_list_multiple_sessions` |
| SL-003 | List with state filter | ✅ | `TestSessionList.test_list_with_state_filter` |
| SL-004 | List invalid state filter | ✅ | `TestSessionList.test_list_invalid_state_filter` |

### MCP Tool: cache_stats (`tests/unit/test_server.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| CS-001 | Cache stats basic | ✅ | `TestCacheStats.test_cache_stats_basic` |
| CS-002 | Cache stats with vLLM connected | ✅ | `TestCacheStats.test_cache_stats_with_vllm_connected` |

---

## Integration Tests

### vLLM Integration (`tests/integration/test_vllm_integration.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| IV-001 | Connect to live vLLM server | ⬜ | Requires running vLLM |
| IV-002 | Generate with prefix caching enabled | ⬜ | |
| IV-003 | Generate with cache_salt | ⬜ | |
| IV-004 | Verify KV cache hit on repeated prompt | ⬜ | |
| IV-005 | Multi-turn conversation caching | ⬜ | |

### LMCache Integration (`tests/integration/test_lmcache_integration.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| IL-001 | Connect to LMCache backend | ⬜ | |
| IL-002 | Store blocks to CPU | ⬜ | |
| IL-003 | Store blocks to disk | ⬜ | |
| IL-004 | Retrieve blocks from CPU | ⬜ | |
| IL-005 | Retrieve blocks from disk | ⬜ | |
| IL-006 | Block hash consistency with vLLM | ⬜ | Critical |

### MCP Integration (`tests/integration/test_mcp_integration.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| IM-001 | MCP client can call window_freeze | ⬜ | |
| IM-002 | MCP client can call window_thaw | ⬜ | |
| IM-003 | MCP client can call window_list | ⬜ | |
| IM-004 | MCP client can call window_status | ⬜ | |
| IM-005 | MCP client can call window_clone | ⬜ | |
| IM-006 | MCP client can call window_delete | ⬜ | |
| IM-007 | Error responses properly formatted | ⬜ | |

---

## End-to-End Tests

### Full Workflow (`tests/e2e/test_workflows.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| E2E-001 | Freeze and thaw workflow | ⬜ | Core use case |
| E2E-002 | Multi-turn freeze at threshold | ⬜ | |
| E2E-003 | Clone and diverge workflow | ⬜ | |
| E2E-004 | Delete and verify cleanup | ⬜ | |
| E2E-005 | Server restart - sessions persist | ⬜ | |
| E2E-006 | Concurrent freeze operations | ⬜ | |
| E2E-007 | Large context handling (32K+) | ⬜ | |

### Restoration Accuracy (`tests/e2e/test_restoration_accuracy.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| RA-001 | Restored context produces identical output | ⬜ | Deterministic test |
| RA-002 | Token-by-token comparison | ⬜ | |
| RA-003 | Attention pattern verification | ⬜ | Advanced |

---

## Performance Tests

### Benchmarks (`tests/performance/test_benchmarks.py`)

| Test ID | Description | Target | Status | Actual |
|---------|-------------|--------|--------|--------|
| PF-001 | Freeze latency (1K context) | <100ms | ⬜ | - |
| PF-002 | Freeze latency (8K context) | <500ms | ⬜ | - |
| PF-003 | Freeze latency (32K context) | <2s | ⬜ | - |
| PF-004 | Thaw latency (1K context) | <500ms | ⬜ | - |
| PF-005 | Thaw latency (8K context) | <2s | ⬜ | - |
| PF-006 | Thaw latency (32K context) | <5s | ⬜ | - |
| PF-007 | Storage size (8K context) | <50MB | ⬜ | - |
| PF-008 | Memory usage (10 warm sessions) | <2GB | ⬜ | - |
| PF-009 | Concurrent operations (10 freezes) | <5s total | ⬜ | - |

---

## Security Tests

### Security (`tests/security/test_security.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| SC-001 | Session isolation - no cross-access | ⬜ | |
| SC-002 | Input sanitization - window names | ⬜ | |
| SC-003 | Input sanitization - session IDs | ⬜ | |
| SC-004 | Path traversal prevention | ⬜ | |
| SC-005 | SQL injection prevention | ⬜ | |
| SC-006 | Audit log completeness | ⬜ | |

---

## Platform Tests

### Windows Specific (`tests/platform/test_windows.py`)

| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| PW-001 | Path handling (backslashes) | ⬜ | |
| PW-002 | File locking behavior | ⬜ | |
| PW-003 | Long path support (>260 chars) | ⬜ | |
| PW-004 | Process spawning (no fork) | ⬜ | |
| PW-005 | Signal handling (no SIGTERM) | ⬜ | |

---

## Test Infrastructure

### Fixtures Needed

- [ ] `mock_vllm_server` - Simulates vLLM API responses
- [ ] `mock_lmcache_backend` - Simulates KV storage
- [ ] `test_session` - Pre-created session for testing
- [ ] `frozen_window` - Pre-frozen window for thaw tests
- [ ] `large_context` - 32K token context for performance tests
- [ ] `mcp_client` - Client for MCP server testing

### Test Data

- [ ] Sample conversations (various lengths)
- [ ] Sample KV cache blocks (serialized)
- [ ] Corrupted block data (for error handling tests)

---

## Coverage Requirements

| Component | Target | Current | Notes |
|-----------|--------|---------|-------|
| `core/vllm_client.py` | 85% | ~80% | 26 tests implemented |
| `core/session_registry.py` | 90% | ~90% | 50 tests implemented |
| `core/kv_store.py` | 85% | ~85% | 55 tests implemented |
| `config.py` | 80% | ~75% | 18 tests implemented |
| `errors.py` | 90% | ~95% | 19 tests implemented |
| `server.py` | 80% | ~70% | 26 tests implemented |
| **Overall** | **85%** | **~75%** | Core + MCP server tested (188 tests) |

---

## Test Execution

### Commands

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=src/context_window_manager --cov-report=html

# Run unit tests only
pytest tests/unit/

# Run integration tests (requires running services)
pytest tests/integration/ --run-integration

# Run performance benchmarks
pytest tests/performance/ --benchmark

# Run specific test file
pytest tests/unit/core/test_session_registry.py -v

# Run tests matching pattern
pytest tests/ -k "freeze" -v
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml (planned)
- Unit tests: Every push
- Integration tests: Every PR
- Performance tests: Weekly
- Security tests: Every PR to main
```

---

## Notes & Observations

### Blockers
- None yet

### Flaky Tests
- None yet

### Technical Debt
- None yet

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-23 | Phase 2 complete - MCP server with 7 tools, 26 server tests, 188 total tests |
| 2026-01-23 | Phase 1 complete - All core modules tested (162 tests) |
| 2026-01-22 | Initial test plan created |
