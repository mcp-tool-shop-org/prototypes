# Context Window Manager - Error Handling Guide

> **Purpose**: Define error taxonomy, handling strategies, and recovery procedures.
> **Last Updated**: 2026-01-22

---

## 2026 Best Practices Applied

> **Sources**: [Python asyncio-dev docs](https://docs.python.org/3/library/asyncio-dev.html), [Piccolo asyncio exceptions](https://piccolo-orm.com/blog/exception-handling-in-asyncio/), [Async Python Best Practices](https://www.linkedin.com/advice/0/what-best-practices-error-handling-async-python-mbnie), [Honeybadger Python Exception Handling](https://www.honeybadger.io/blog/a-guide-to-exception-handling-in-python/)

This document follows 2026 Python async error handling best practices:

1. **Try-Except at Every Level**: Catch exceptions in individual coroutines AND have a top-level handler. `asyncio.run()` surfaces uncaught exceptions, but explicit handling is better.

2. **Use `asyncio.gather` with `return_exceptions=True`**: When running parallel operations, collect exceptions without stopping other tasks. Process all results/errors at the end.

3. **Preserve Tracebacks**: Exceptions that bubble up lose context. Use `logger.exception()` to capture full tracebacks before re-raising.

4. **Cancel Sibling Tasks on Failure**: When one task fails, cancel related tasks to prevent cascading errors and clean up resources.

5. **Catch Specific Exceptions**: Avoid bare `except Exception:`. Catch specific error types to handle them appropriately and let unexpected errors surface.

6. **Enable Debug Mode in Development**: Use `PYTHONASYNCIODEBUG=1` or `asyncio.run(main(), debug=True)` to catch unawaited coroutines and slow callbacks.

7. **Use Async Context Managers**: `async with` ensures proper cleanup even when exceptions occur. Essential for database connections, HTTP sessions, and file handles.

8. **Structured Error Responses**: Errors returned via MCP must be JSON-serializable with error codes. Internal details stay in logs, not responses.

---

## Error Philosophy

1. **Fail Fast**: Detect errors early, at the boundary
2. **Fail Gracefully**: Provide useful feedback, maintain system stability
3. **Fail Safely**: Never expose sensitive data in errors
4. **Recover When Possible**: Automatic retry for transient failures
5. **Log Everything**: Full context for debugging, sanitized for users

---

## Error Taxonomy

### Error Hierarchy

```
CWMError (base)
├── ValidationError
│   ├── InvalidSessionIdError
│   ├── InvalidWindowNameError
│   ├── InvalidParameterError
│   └── SchemaValidationError
├── NotFoundError
│   ├── SessionNotFoundError
│   ├── WindowNotFoundError
│   └── BlockNotFoundError
├── StateError
│   ├── InvalidStateTransitionError
│   ├── SessionAlreadyFrozenError
│   ├── SessionNotActiveError
│   └── WindowAlreadyExistsError
├── StorageError
│   ├── StorageWriteError
│   ├── StorageReadError
│   ├── StorageQuotaExceededError
│   └── StorageCorruptionError
├── ConnectionError
│   ├── VLLMConnectionError
│   ├── LMCacheConnectionError
│   └── RedisConnectionError
├── TimeoutError
│   ├── VLLMTimeoutError
│   ├── StorageTimeoutError
│   └── OperationTimeoutError
├── ResourceError
│   ├── MemoryExhaustedError
│   ├── RateLimitExceededError
│   └── ConcurrencyLimitError
└── SecurityError
    ├── AccessDeniedError
    ├── InvalidCredentialsError
    └── SessionIsolationError
```

### Error Codes

| Code | Category | Description |
|------|----------|-------------|
| CWM-1xxx | Validation | Input validation failures |
| CWM-2xxx | Not Found | Resource lookup failures |
| CWM-3xxx | State | State machine violations |
| CWM-4xxx | Storage | Persistence layer errors |
| CWM-5xxx | Connection | Network/service errors |
| CWM-6xxx | Timeout | Operation timeouts |
| CWM-7xxx | Resource | Resource exhaustion |
| CWM-8xxx | Security | Security violations |
| CWM-9xxx | Internal | Unexpected errors |

---

## Error Definitions

### Validation Errors (CWM-1xxx)

```python
class ValidationError(CWMError):
    """Base class for validation errors."""
    pass

class InvalidSessionIdError(ValidationError):
    """
    Code: CWM-1001
    Cause: Session ID doesn't match required pattern
    User Message: "Invalid session ID format"
    Recovery: Provide valid session ID (alphanumeric, 1-64 chars)
    """
    code = "CWM-1001"

class InvalidWindowNameError(ValidationError):
    """
    Code: CWM-1002
    Cause: Window name doesn't match required pattern
    User Message: "Invalid window name format"
    Recovery: Provide valid window name (alphanumeric, 1-128 chars)
    """
    code = "CWM-1002"

class InvalidParameterError(ValidationError):
    """
    Code: CWM-1003
    Cause: Tool parameter has invalid type or value
    User Message: "Invalid parameter: {param_name}"
    Recovery: Check parameter requirements in API docs
    """
    code = "CWM-1003"
```

### Not Found Errors (CWM-2xxx)

```python
class NotFoundError(CWMError):
    """Base class for resource not found errors."""
    pass

class SessionNotFoundError(NotFoundError):
    """
    Code: CWM-2001
    Cause: Referenced session doesn't exist
    User Message: "Session not found: {session_id}"
    Recovery: Verify session ID, check if session was deleted
    """
    code = "CWM-2001"

class WindowNotFoundError(NotFoundError):
    """
    Code: CWM-2002
    Cause: Referenced window doesn't exist
    User Message: "Window not found: {window_name}"
    Recovery: Use window_list to see available windows
    """
    code = "CWM-2002"

class BlockNotFoundError(NotFoundError):
    """
    Code: CWM-2003
    Cause: KV cache block missing from storage
    User Message: "Some context data is unavailable"
    Recovery: Window may be corrupted, consider re-freezing
    """
    code = "CWM-2003"
```

### State Errors (CWM-3xxx)

```python
class StateError(CWMError):
    """Base class for state machine errors."""
    pass

class InvalidStateTransitionError(StateError):
    """
    Code: CWM-3001
    Cause: Attempted invalid state transition
    User Message: "Cannot perform this operation in current state"
    Recovery: Check session state with window_status
    """
    code = "CWM-3001"

class SessionAlreadyFrozenError(StateError):
    """
    Code: CWM-3002
    Cause: Attempted to freeze already-frozen session
    User Message: "Session is already frozen"
    Recovery: Use existing frozen window or thaw first
    """
    code = "CWM-3002"

class WindowAlreadyExistsError(StateError):
    """
    Code: CWM-3003
    Cause: Window name already in use
    User Message: "Window name already exists: {window_name}"
    Recovery: Choose different name or delete existing window
    """
    code = "CWM-3003"
```

### Storage Errors (CWM-4xxx)

```python
class StorageError(CWMError):
    """Base class for storage errors."""
    pass

class StorageWriteError(StorageError):
    """
    Code: CWM-4001
    Cause: Failed to write to storage backend
    User Message: "Failed to save context data"
    Recovery: Check storage health, retry operation
    Retry: Yes, with exponential backoff
    """
    code = "CWM-4001"
    retryable = True

class StorageReadError(StorageError):
    """
    Code: CWM-4002
    Cause: Failed to read from storage backend
    User Message: "Failed to load context data"
    Recovery: Check storage health, verify window exists
    Retry: Yes, with exponential backoff
    """
    code = "CWM-4002"
    retryable = True

class StorageQuotaExceededError(StorageError):
    """
    Code: CWM-4003
    Cause: Storage quota exceeded
    User Message: "Storage quota exceeded"
    Recovery: Delete old windows to free space
    Retry: No
    """
    code = "CWM-4003"
    retryable = False

class StorageCorruptionError(StorageError):
    """
    Code: CWM-4004
    Cause: Data integrity check failed
    User Message: "Context data is corrupted"
    Recovery: Delete and re-freeze from source
    Retry: No
    """
    code = "CWM-4004"
    retryable = False
```

### Connection Errors (CWM-5xxx)

```python
class ConnectionError(CWMError):
    """Base class for connection errors."""
    pass

class VLLMConnectionError(ConnectionError):
    """
    Code: CWM-5001
    Cause: Cannot connect to vLLM server
    User Message: "Cannot connect to inference server"
    Recovery: Verify vLLM server is running and accessible
    Retry: Yes, with exponential backoff
    """
    code = "CWM-5001"
    retryable = True

class LMCacheConnectionError(ConnectionError):
    """
    Code: CWM-5002
    Cause: Cannot connect to LMCache backend
    User Message: "Cannot connect to cache backend"
    Recovery: Verify LMCache configuration
    Retry: Yes, with exponential backoff
    """
    code = "CWM-5002"
    retryable = True
```

### Timeout Errors (CWM-6xxx)

```python
class TimeoutError(CWMError):
    """Base class for timeout errors."""
    pass

class VLLMTimeoutError(TimeoutError):
    """
    Code: CWM-6001
    Cause: vLLM request exceeded timeout
    User Message: "Inference server request timed out"
    Recovery: Retry with smaller context, check server load
    Retry: Yes, once
    """
    code = "CWM-6001"
    retryable = True
    max_retries = 1

class OperationTimeoutError(TimeoutError):
    """
    Code: CWM-6002
    Cause: Overall operation exceeded timeout
    User Message: "Operation timed out"
    Recovery: Retry operation, consider smaller context
    Retry: Yes, once
    """
    code = "CWM-6002"
    retryable = True
    max_retries = 1
```

### Resource Errors (CWM-7xxx)

```python
class ResourceError(CWMError):
    """Base class for resource exhaustion errors."""
    pass

class MemoryExhaustedError(ResourceError):
    """
    Code: CWM-7001
    Cause: Insufficient memory for operation
    User Message: "Insufficient memory"
    Recovery: Free memory by deleting unused windows
    Retry: No (without freeing resources)
    """
    code = "CWM-7001"
    retryable = False

class RateLimitExceededError(ResourceError):
    """
    Code: CWM-7002
    Cause: Too many requests in time window
    User Message: "Rate limit exceeded, try again in {seconds}s"
    Recovery: Wait and retry
    Retry: Yes, after delay
    """
    code = "CWM-7002"
    retryable = True
```

### Security Errors (CWM-8xxx)

```python
class SecurityError(CWMError):
    """Base class for security errors."""
    pass

class AccessDeniedError(SecurityError):
    """
    Code: CWM-8001
    Cause: Caller lacks permission for operation
    User Message: "Access denied"
    Recovery: Verify permissions, use correct credentials
    Retry: No
    Log Level: WARNING (potential attack)
    """
    code = "CWM-8001"
    retryable = False
    log_level = "WARNING"
```

---

## Error Handling Patterns

### 1. Input Validation (Fail Fast)

```python
async def window_freeze(session_id: str, window_name: str) -> FreezeResult:
    """
    Validate all inputs before any processing.
    """
    # Validate inputs first - fail fast
    validate_session_id(session_id)  # Raises InvalidSessionIdError
    validate_window_name(window_name)  # Raises InvalidWindowNameError

    # Check preconditions
    session = await registry.get(session_id)
    if not session:
        raise SessionNotFoundError(session_id)
    if session.state == SessionState.FROZEN:
        raise SessionAlreadyFrozenError(session_id)

    # Check for name collision
    if await registry.window_exists(window_name):
        raise WindowAlreadyExistsError(window_name)

    # Proceed with operation...
```

### 2. Retry with Backoff

```python
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((StorageWriteError, StorageReadError))
)
async def store_kv_blocks(blocks: list[KVBlock]) -> None:
    """
    Store KV blocks with automatic retry on transient failures.
    """
    try:
        await kv_store.write(blocks)
    except Exception as e:
        logger.warning(f"Storage write failed, will retry: {e}")
        raise StorageWriteError(str(e)) from e
```

### 3. Graceful Degradation

```python
async def window_thaw(window_name: str) -> ThawResult:
    """
    Attempt full restoration, degrade gracefully on partial failure.
    """
    window = await registry.get_window(window_name)

    # Try to load all blocks
    loaded_blocks = []
    missing_blocks = []

    for block_hash in window.block_hashes:
        try:
            block = await kv_store.get(block_hash)
            loaded_blocks.append(block)
        except BlockNotFoundError:
            missing_blocks.append(block_hash)

    if missing_blocks:
        if len(missing_blocks) == len(window.block_hashes):
            # Complete failure - can't proceed
            raise StorageCorruptionError(
                f"All blocks missing for window {window_name}"
            )
        else:
            # Partial failure - warn but continue
            logger.warning(
                f"Partial restoration: {len(missing_blocks)} blocks missing"
            )
            return ThawResult(
                success=True,
                partial=True,
                warning=f"{len(missing_blocks)} blocks could not be restored"
            )

    return ThawResult(success=True, partial=False)
```

### 4. Transaction-like Operations

```python
async def window_freeze_transactional(
    session_id: str,
    window_name: str
) -> FreezeResult:
    """
    Freeze with rollback on failure.
    """
    # Start transaction
    transaction_id = generate_transaction_id()

    try:
        # Step 1: Create window metadata
        await registry.create_window(
            window_name,
            transaction_id=transaction_id
        )

        # Step 2: Store KV blocks
        blocks = await extract_kv_blocks(session_id)
        await kv_store.write(blocks, transaction_id=transaction_id)

        # Step 3: Update session state
        await registry.update_session_state(
            session_id,
            SessionState.FROZEN,
            transaction_id=transaction_id
        )

        # Commit transaction
        await registry.commit(transaction_id)

        return FreezeResult(success=True, window_name=window_name)

    except Exception as e:
        # Rollback on any failure
        logger.error(f"Freeze failed, rolling back: {e}")
        await registry.rollback(transaction_id)
        raise
```

### 5. Error Context Preservation

```python
class CWMError(Exception):
    """Base error with context preservation."""

    def __init__(
        self,
        message: str,
        code: str = None,
        context: dict = None,
        cause: Exception = None
    ):
        super().__init__(message)
        self.code = code or getattr(self.__class__, 'code', 'CWM-9999')
        self.context = context or {}
        self.cause = cause
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> dict:
        """Serialize for logging/response."""
        return {
            "error": self.__class__.__name__,
            "message": str(self),
            "code": self.code,
            "timestamp": self.timestamp.isoformat(),
            # Don't include context in user response (may have sensitive data)
        }

    def to_log_dict(self) -> dict:
        """Full context for logging."""
        return {
            **self.to_dict(),
            "context": self.context,
            "cause": str(self.cause) if self.cause else None,
            "traceback": traceback.format_exc()
        }
```

---

## MCP Error Response Format

### Standard Error Response

```python
def format_mcp_error(error: CWMError) -> dict:
    """
    Format error for MCP tool response.

    MCP expects errors in a specific format.
    """
    return {
        "isError": True,
        "content": [
            {
                "type": "text",
                "text": json.dumps({
                    "error": error.code,
                    "message": str(error),
                    "retryable": getattr(error, 'retryable', False)
                })
            }
        ]
    }
```

### Example Error Responses

```json
// Validation Error
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\"error\": \"CWM-1001\", \"message\": \"Invalid session ID format\", \"retryable\": false}"
  }]
}

// Transient Storage Error
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\"error\": \"CWM-4001\", \"message\": \"Failed to save context data\", \"retryable\": true}"
  }]
}

// Rate Limit Error
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "{\"error\": \"CWM-7002\", \"message\": \"Rate limit exceeded, try again in 30s\", \"retryable\": true}"
  }]
}
```

---

## Logging Strategy

### Log Levels by Error Type

| Error Type | Log Level | Alerts |
|------------|-----------|--------|
| ValidationError | INFO | No |
| NotFoundError | INFO | No |
| StateError | INFO | No |
| StorageError | WARNING | On repeated failures |
| ConnectionError | WARNING | On repeated failures |
| TimeoutError | WARNING | On repeated failures |
| ResourceError | WARNING | Yes |
| SecurityError | WARNING/ERROR | Yes |
| Internal Error | ERROR | Yes |

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

async def window_freeze(session_id: str, window_name: str):
    log = logger.bind(
        operation="window_freeze",
        session_id=session_id,
        window_name=window_name
    )

    try:
        log.info("Starting freeze operation")
        result = await do_freeze(session_id, window_name)
        log.info("Freeze completed",
                 blocks_stored=result.block_count,
                 duration_ms=result.duration_ms)
        return result

    except CWMError as e:
        log.warning("Freeze failed",
                    error_code=e.code,
                    error_message=str(e))
        raise

    except Exception as e:
        log.error("Unexpected error during freeze",
                  exc_info=True)
        raise InternalError(str(e)) from e
```

---

## Recovery Procedures

### Storage Corruption Recovery

```
1. Identify corrupted window(s)
   $ cwm diagnose --check-integrity

2. Attempt block-level recovery
   $ cwm repair --window <name> --attempt-recovery

3. If recovery fails, delete corrupted window
   $ cwm delete --window <name> --force

4. Re-freeze from source if session still active
   $ cwm freeze --session <id> --window <name>
```

### Connection Recovery

```
1. Check service health
   $ cwm health --verbose

2. Test individual components
   $ cwm test-connection --vllm
   $ cwm test-connection --lmcache

3. Restart affected services
   $ systemctl restart vllm
   $ systemctl restart lmcache

4. Verify recovery
   $ cwm health
```

### Data Recovery from Backup

```
1. List available backups
   $ cwm backup list

2. Restore specific window
   $ cwm backup restore --window <name> --timestamp <ts>

3. Verify restoration
   $ cwm status --window <name>
```

---

## Testing Error Handling

### Error Injection Tests

```python
@pytest.mark.parametrize("error_type,expected_code", [
    (StorageWriteError, "CWM-4001"),
    (StorageReadError, "CWM-4002"),
    (VLLMConnectionError, "CWM-5001"),
])
async def test_error_handling(error_type, expected_code, mock_storage):
    """Verify errors are properly caught and formatted."""
    mock_storage.write.side_effect = error_type("test error")

    result = await window_freeze("session-1", "test-window")

    assert result["isError"] is True
    error_data = json.loads(result["content"][0]["text"])
    assert error_data["error"] == expected_code
```

### Chaos Testing

```python
async def test_partial_storage_failure():
    """Test graceful degradation on partial failures."""
    # Simulate 30% block write failures
    with chaos.inject_failures(kv_store.write, failure_rate=0.3):
        result = await window_freeze("session-1", "test-window")

    # Should still succeed (with possible warnings)
    assert result.success
```

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-22 | Initial error handling documentation |
