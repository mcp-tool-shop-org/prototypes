# Context Window Manager - API Reference

> **Purpose**: Complete specification of MCP tools and their parameters.
> **Last Updated**: 2026-01-23
> **MCP Version**: 2025-11-25
> **CWM Version**: 0.6.1

---

## 2026 Best Practices Applied

> **Sources**: [OpenAPI Best Practices](https://learn.openapis.org/best-practices.html), [Gravitee OpenAPI Guide](https://www.gravitee.io/blog/openapi-specification-structure-best-practices), [Treblle API Governance 2026](https://treblle.com/blog/api-governance-best-practices), [APImatic OpenAPI Practices](https://www.apimatic.io/blog/2022/11/14-best-practices-to-write-openapi-for-better-api-consumption)

This API specification follows 2026 design and documentation best practices:

1. **Design-First Approach**: Schema defined before implementation. The OpenAPI Initiative emphasizes this because code-first often creates APIs that can't be properly described.

2. **Specific Schemas Over Generic**: Every parameter has explicit types, patterns, and constraints. No "object" or "any" types - everything is precisely specified.

3. **Global Schema Definitions**: Reusable schemas defined in `components/schemas` and referenced via `$ref`. Avoids inline schemas that generate poor names in code generators.

4. **Human-Readable Names**: Parameter and schema names are descriptive but concise. IDs are unambiguous (`session_id` not `id`).

5. **Meaningful Examples**: All schemas include non-empty, realistic examples. Tools use these for test case generation and documentation.

6. **Fewer Parameters Per Operation**: Each tool has <10 parameters, with <4 required on average. Simpler interfaces lead to more consistent usage.

7. **Standard Format Fields**: Using established formats (`date-time`, patterns for IDs) rather than inventing custom conventions.

8. **Error Schema Standardization**: All errors return the same structure (`code`, `message`, `retryable`) for predictable client handling.

---

## Overview

The Context Window Manager exposes the following MCP tools:

| Tool | Description |
|------|-------------|
| `window_freeze` | Snapshot session context to persistent storage |
| `window_thaw` | Restore context from a saved window |
| `window_list` | List available context windows |
| `window_status` | Get detailed status of a session or window |
| `window_clone` | Create a branch from an existing window |
| `window_delete` | Remove a saved window |
| `session_list` | List all sessions with optional filtering |
| `cache_stats` | Get KV cache and vLLM statistics |
| `health_check` | Get system health status |
| `get_metrics_data` | Get Prometheus-compatible metrics |

---

## Tools

### window_freeze

Snapshot the current session's KV cache state to persistent storage, creating a named "window" that can be restored later.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "ID of the active session to freeze",
      "pattern": "^[a-zA-Z0-9_-]{1,64}$"
    },
    "window_name": {
      "type": "string",
      "description": "Name for the saved context window (must be unique)",
      "pattern": "^[a-zA-Z0-9_-]{1,128}$"
    },
    "description": {
      "type": "string",
      "description": "Optional description of what this context contains",
      "maxLength": 1000
    },
    "tags": {
      "type": "array",
      "description": "Optional tags for filtering and organization",
      "items": {
        "type": "string",
        "pattern": "^[a-zA-Z0-9_-]{1,32}$"
      },
      "maxItems": 10
    }
  },
  "required": ["session_id", "window_name"]
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the freeze operation succeeded"
    },
    "window_name": {
      "type": "string",
      "description": "Name of the created window"
    },
    "block_count": {
      "type": "integer",
      "description": "Number of KV cache blocks stored"
    },
    "total_size_bytes": {
      "type": "integer",
      "description": "Total size of stored context in bytes"
    },
    "token_count": {
      "type": "integer",
      "description": "Number of tokens in the frozen context"
    },
    "storage_tier": {
      "type": "string",
      "enum": ["cpu", "disk", "redis"],
      "description": "Storage tier where blocks were saved"
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_freeze",
  "arguments": {
    "session_id": "session_abc123",
    "window_name": "my-coding-project",
    "description": "Working on the authentication module refactor",
    "tags": ["coding", "auth", "refactor"]
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"window_name\": \"my-coding-project\", \"block_count\": 42, \"total_size_bytes\": 15728640, \"token_count\": 8192, \"storage_tier\": \"cpu\"}"
  }]
}
```

#### Errors

| Code | Condition |
|------|-----------|
| CWM-1001 | Invalid session_id format |
| CWM-1002 | Invalid window_name format |
| CWM-2001 | Session not found |
| CWM-3002 | Session already frozen |
| CWM-3003 | Window name already exists |
| CWM-4001 | Storage write failed |
| CWM-4003 | Storage quota exceeded |

---

### window_thaw

Restore context from a previously saved window. This creates a new session with the restored KV cache state, allowing seamless continuation.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "window_name": {
      "type": "string",
      "description": "Name of the window to restore",
      "pattern": "^[a-zA-Z0-9_-]{1,128}$"
    },
    "new_session_id": {
      "type": "string",
      "description": "Optional ID for the restored session (auto-generated if not provided)",
      "pattern": "^[a-zA-Z0-9_-]{1,64}$"
    },
    "continuation_prompt": {
      "type": "string",
      "description": "Optional prompt to send after restoration",
      "maxLength": 10000
    }
  },
  "required": ["window_name"]
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the thaw operation succeeded"
    },
    "session_id": {
      "type": "string",
      "description": "ID of the restored session"
    },
    "window_name": {
      "type": "string",
      "description": "Name of the window that was restored"
    },
    "token_count": {
      "type": "integer",
      "description": "Number of tokens in the restored context"
    },
    "restoration_time_ms": {
      "type": "integer",
      "description": "Time taken to restore context in milliseconds"
    },
    "partial": {
      "type": "boolean",
      "description": "True if some blocks could not be restored"
    },
    "warning": {
      "type": "string",
      "description": "Warning message if partial restoration"
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_thaw",
  "arguments": {
    "window_name": "my-coding-project",
    "continuation_prompt": "Let's continue working on the authentication module."
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"session_id\": \"thaw_my-coding-project_1706000000\", \"window_name\": \"my-coding-project\", \"token_count\": 8192, \"restoration_time_ms\": 1250, \"partial\": false}"
  }]
}
```

#### Errors

| Code | Condition |
|------|-----------|
| CWM-1002 | Invalid window_name format |
| CWM-2002 | Window not found |
| CWM-4002 | Storage read failed |
| CWM-4004 | Storage corruption (blocks missing/invalid) |
| CWM-5001 | vLLM connection failed |
| CWM-6001 | vLLM timeout |

---

### window_list

List available context windows with optional filtering.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "tags": {
      "type": "array",
      "description": "Filter by tags (AND logic)",
      "items": {"type": "string"}
    },
    "model": {
      "type": "string",
      "description": "Filter by model name"
    },
    "created_after": {
      "type": "string",
      "format": "date-time",
      "description": "Filter windows created after this timestamp"
    },
    "created_before": {
      "type": "string",
      "format": "date-time",
      "description": "Filter windows created before this timestamp"
    },
    "sort_by": {
      "type": "string",
      "enum": ["name", "created_at", "token_count", "size"],
      "default": "created_at",
      "description": "Sort field"
    },
    "sort_order": {
      "type": "string",
      "enum": ["asc", "desc"],
      "default": "desc",
      "description": "Sort order"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 20,
      "description": "Maximum number of results"
    },
    "offset": {
      "type": "integer",
      "minimum": 0,
      "default": 0,
      "description": "Pagination offset"
    },
    "search": {
      "type": "string",
      "description": "Search in window names and descriptions"
    }
  }
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "windows": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "description": {"type": "string"},
          "tags": {"type": "array", "items": {"type": "string"}},
          "model": {"type": "string"},
          "token_count": {"type": "integer"},
          "size_bytes": {"type": "integer"},
          "created_at": {"type": "string", "format": "date-time"},
          "parent_window": {"type": "string", "nullable": true}
        }
      }
    },
    "total": {
      "type": "integer",
      "description": "Total number of windows matching filters"
    },
    "has_more": {
      "type": "boolean",
      "description": "Whether more results are available"
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_list",
  "arguments": {
    "tags": ["coding"],
    "sort_by": "created_at",
    "sort_order": "desc",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"windows\": [{\"name\": \"my-coding-project\", \"description\": \"Working on auth module\", \"tags\": [\"coding\", \"auth\"], \"model\": \"llama-3.1-8b\", \"token_count\": 8192, \"size_bytes\": 15728640, \"created_at\": \"2026-01-22T10:30:00Z\", \"parent_window\": null}], \"total\": 1, \"has_more\": false}"
  }]
}
```

---

### window_status

Get detailed status information about a session or window.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "session_id": {
      "type": "string",
      "description": "ID of session to query (mutually exclusive with window_name)"
    },
    "window_name": {
      "type": "string",
      "description": "Name of window to query (mutually exclusive with session_id)"
    },
    "include_blocks": {
      "type": "boolean",
      "default": false,
      "description": "Include detailed block information"
    }
  },
  "oneOf": [
    {"required": ["session_id"]},
    {"required": ["window_name"]}
  ]
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["session", "window"],
      "description": "Whether this is a session or window"
    },
    "id": {
      "type": "string",
      "description": "Session ID or window name"
    },
    "state": {
      "type": "string",
      "enum": ["active", "frozen", "thawed", "expired"],
      "description": "Current state"
    },
    "model": {
      "type": "string",
      "description": "Model used"
    },
    "token_count": {
      "type": "integer",
      "description": "Number of tokens"
    },
    "kv_cache": {
      "type": "object",
      "properties": {
        "block_count": {"type": "integer"},
        "total_size_bytes": {"type": "integer"},
        "storage_tier": {"type": "string"},
        "hit_rate": {"type": "number", "description": "Cache hit rate (0-1)"}
      }
    },
    "timestamps": {
      "type": "object",
      "properties": {
        "created_at": {"type": "string", "format": "date-time"},
        "updated_at": {"type": "string", "format": "date-time"},
        "frozen_at": {"type": "string", "format": "date-time", "nullable": true}
      }
    },
    "blocks": {
      "type": "array",
      "description": "Block details (only if include_blocks=true)",
      "items": {
        "type": "object",
        "properties": {
          "hash": {"type": "string"},
          "size_bytes": {"type": "integer"},
          "storage_tier": {"type": "string"}
        }
      }
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_status",
  "arguments": {
    "window_name": "my-coding-project"
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"type\": \"window\", \"id\": \"my-coding-project\", \"state\": \"frozen\", \"model\": \"llama-3.1-8b\", \"token_count\": 8192, \"kv_cache\": {\"block_count\": 42, \"total_size_bytes\": 15728640, \"storage_tier\": \"cpu\", \"hit_rate\": 0.95}, \"timestamps\": {\"created_at\": \"2026-01-22T10:30:00Z\", \"updated_at\": \"2026-01-22T10:30:00Z\", \"frozen_at\": \"2026-01-22T10:30:00Z\"}}"
  }]
}
```

---

### window_clone

Create a copy of an existing window for parallel exploration or branching.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "source_window": {
      "type": "string",
      "description": "Name of the window to clone",
      "pattern": "^[a-zA-Z0-9_-]{1,128}$"
    },
    "target_window": {
      "type": "string",
      "description": "Name for the cloned window",
      "pattern": "^[a-zA-Z0-9_-]{1,128}$"
    },
    "description": {
      "type": "string",
      "description": "Optional description for the clone",
      "maxLength": 1000
    },
    "tags": {
      "type": "array",
      "description": "Optional tags (inherits from source if not provided)",
      "items": {"type": "string"}
    }
  },
  "required": ["source_window", "target_window"]
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "source_window": {
      "type": "string"
    },
    "target_window": {
      "type": "string"
    },
    "shared_blocks": {
      "type": "integer",
      "description": "Number of blocks shared (not duplicated)"
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_clone",
  "arguments": {
    "source_window": "my-coding-project",
    "target_window": "my-coding-project-experiment",
    "description": "Trying alternative auth approach"
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"source_window\": \"my-coding-project\", \"target_window\": \"my-coding-project-experiment\", \"shared_blocks\": 42}"
  }]
}
```

---

### window_delete

Delete a saved context window.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "window_name": {
      "type": "string",
      "description": "Name of the window to delete",
      "pattern": "^[a-zA-Z0-9_-]{1,128}$"
    },
    "force": {
      "type": "boolean",
      "default": false,
      "description": "Force deletion without confirmation"
    },
    "delete_blocks": {
      "type": "boolean",
      "default": true,
      "description": "Also delete KV cache blocks (false keeps them for other windows)"
    }
  },
  "required": ["window_name"]
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean"
    },
    "window_name": {
      "type": "string"
    },
    "blocks_deleted": {
      "type": "integer",
      "description": "Number of KV blocks deleted"
    },
    "space_freed_bytes": {
      "type": "integer",
      "description": "Storage space freed"
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "window_delete",
  "arguments": {
    "window_name": "old-experiment",
    "force": true
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"window_name\": \"old-experiment\", \"blocks_deleted\": 35, \"space_freed_bytes\": 12582912}"
  }]
}
```

---

### session_list

List all sessions with optional state filtering.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "state_filter": {
      "type": "string",
      "enum": ["active", "frozen", "thawed", "expired"],
      "description": "Filter by session state"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50,
      "description": "Maximum number of results"
    }
  }
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "sessions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "model": {"type": "string"},
          "state": {"type": "string"},
          "created_at": {"type": "string", "format": "date-time"},
          "token_count": {"type": "integer"}
        }
      }
    },
    "count": {"type": "integer"}
  }
}
```

#### Example

**Request:**
```json
{
  "name": "session_list",
  "arguments": {
    "state_filter": "active"
  }
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"sessions\": [{\"id\": \"session_abc123\", \"model\": \"llama-3.1-8b\", \"state\": \"active\", \"created_at\": \"2026-01-23T10:00:00Z\", \"token_count\": 4096}], \"count\": 1}"
  }]
}
```

---

### cache_stats

Get KV cache and vLLM statistics.

#### Input Schema

```json
{
  "type": "object",
  "properties": {}
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "kv_store": {
      "type": "object",
      "properties": {
        "total_blocks": {"type": "integer"},
        "total_bytes": {"type": "integer"},
        "hit_rate": {"type": "number"}
      }
    },
    "vllm": {
      "type": "object",
      "properties": {
        "connected": {"type": "boolean"},
        "hit_rate": {"type": "number"},
        "cached_tokens": {"type": "integer"}
      }
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "cache_stats",
  "arguments": {}
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"kv_store\": {\"total_blocks\": 150, \"total_bytes\": 52428800, \"hit_rate\": 0.92}, \"vllm\": {\"connected\": true, \"hit_rate\": 0.85, \"cached_tokens\": 50000}}"
  }]
}
```

---

### health_check

Get comprehensive system health status.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "component": {
      "type": "string",
      "description": "Check specific component (kv_store, vllm, registry)"
    }
  }
}
```

#### Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "status": {
      "type": "string",
      "enum": ["healthy", "degraded", "unhealthy"]
    },
    "uptime_seconds": {"type": "number"},
    "version": {"type": "string"},
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "status": {"type": "string"},
          "message": {"type": "string"},
          "latency_ms": {"type": "number"}
        }
      }
    }
  }
}
```

#### Example

**Request:**
```json
{
  "name": "health_check",
  "arguments": {}
}
```

**Response:**
```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\": true, \"status\": \"healthy\", \"uptime_seconds\": 3600.5, \"version\": \"0.6.1\", \"components\": [{\"name\": \"kv_store\", \"status\": \"healthy\", \"message\": \"OK\", \"latency_ms\": 2.5}, {\"name\": \"registry\", \"status\": \"healthy\", \"message\": \"OK\", \"latency_ms\": 1.2}]}"
  }]
}
```

---

### get_metrics_data

Get Prometheus-compatible metrics.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "format": {
      "type": "string",
      "enum": ["prometheus", "json"],
      "default": "prometheus",
      "description": "Output format"
    }
  }
}
```

#### Output Schema (JSON format)

```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "metrics": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "type": {"type": "string"},
          "value": {"type": "number"},
          "labels": {"type": "object"}
        }
      }
    }
  }
}
```

#### Example (Prometheus format)

**Request:**
```json
{
  "name": "get_metrics_data",
  "arguments": {"format": "prometheus"}
}
```

**Response:**
```text
# HELP cwm_operation_total Total operations
# TYPE cwm_operation_total counter
cwm_operation_total{operation="window_freeze",status="success"} 42
cwm_operation_total{operation="window_thaw",status="success"} 18
# HELP cwm_operation_duration_ms Operation duration
# TYPE cwm_operation_duration_ms histogram
cwm_operation_duration_ms_p50{operation="window_freeze"} 125.5
cwm_operation_duration_ms_p99{operation="window_freeze"} 450.2
```

---

## Resources

The server also exposes MCP resources for discovery and monitoring.

### cwm://windows

List of all available windows.

**URI**: `cwm://windows`
**MIME Type**: `application/json`

### cwm://sessions

List of all active sessions.

**URI**: `cwm://sessions`
**MIME Type**: `application/json`

### cwm://stats

Server statistics and health information.

**URI**: `cwm://stats`
**MIME Type**: `application/json`

### health://status

Real-time system health status.

**URI**: `health://status`
**MIME Type**: `application/json`

Returns:
```json
{
  "status": "healthy",
  "uptime_seconds": 3600.5,
  "version": "0.6.1",
  "components": [
    {"name": "kv_store", "status": "healthy"},
    {"name": "registry", "status": "healthy"},
    {"name": "vllm", "status": "degraded"}
  ]
}
```

---

## Error Codes

All errors follow a consistent format:

```json
{
  "code": "CWM-XXXX",
  "message": "Human-readable description",
  "retryable": true,
  "context": {}
}
```

### Error Categories

| Range | Category | Description |
|-------|----------|-------------|
| CWM-1XXX | Validation | Input validation failures |
| CWM-2XXX | Not Found | Resource not found |
| CWM-3XXX | State | Invalid state transitions |
| CWM-4XXX | Storage | Storage operations failed |
| CWM-5XXX | Connection | External service connections |
| CWM-6XXX | Timeout | Operation timeouts |
| CWM-9XXX | Internal | Unexpected internal errors |

### Complete Error Code Reference

| Code | Name | Retryable | Description |
|------|------|-----------|-------------|
| CWM-1001 | InvalidSessionIdError | No | Session ID format invalid |
| CWM-1002 | InvalidWindowNameError | No | Window name format invalid |
| CWM-1003 | InvalidParameterError | No | Parameter validation failed |
| CWM-2001 | SessionNotFoundError | No | Session does not exist |
| CWM-2002 | WindowNotFoundError | No | Window does not exist |
| CWM-2003 | BlockNotFoundError | Yes | KV cache block missing |
| CWM-3001 | SessionAlreadyExistsError | No | Session ID already in use |
| CWM-3002 | SessionNotActiveError | No | Session not in active state |
| CWM-3003 | WindowAlreadyExistsError | No | Window name already in use |
| CWM-4001 | StorageWriteError | Yes | Failed to write to storage |
| CWM-4002 | StorageReadError | Yes | Failed to read from storage |
| CWM-4003 | StorageQuotaExceededError | No | Storage quota exceeded |
| CWM-4004 | StorageCorruptionError | No | Data integrity check failed |
| CWM-5001 | VLLMConnectionError | Yes | Cannot connect to vLLM |
| CWM-5002 | VLLMResponseError | Yes | Invalid vLLM response |
| CWM-6001 | TimeoutError | Yes | Operation timed out |
| CWM-9001 | InternalError | No | Unexpected internal error |
| CWM-9002 | SecurityError | No | Security violation detected |

### Retry Behavior

For retryable errors, use exponential backoff:

```python
delay = min(base_delay * (2 ** attempt), max_delay)
# Default: base_delay=1.0s, max_delay=60.0s
```

---

## Session States

Sessions transition through these states:

```
┌─────────┐     freeze      ┌────────┐
│  ACTIVE │ ───────────────→│ FROZEN │
└─────────┘                 └────────┘
     ↑                           │
     │         thaw              │
     └───────────────────────────┘
```

| State | Description | Allowed Operations |
|-------|-------------|-------------------|
| `active` | Session is live, accepting requests | freeze |
| `frozen` | Session saved to persistent storage | thaw, clone, delete |
| `thawed` | Restored from frozen state | freeze |
| `expired` | Session timed out (read-only) | clone, delete |

---

## Security

### Input Validation

All inputs are sanitized to prevent:
- **Path traversal**: `../` patterns rejected
- **Shell injection**: `;`, `|`, `` ` ``, `$()` patterns rejected
- **SQL injection**: Common SQL keywords in IDs rejected

### Session Isolation

Each session operates in isolation:
- Sessions cannot access other sessions' data directly
- Cross-session cloning requires explicit window references
- All cross-session access is logged for audit

### Rate Limiting

Default limits (configurable):
- 60 requests/minute per session
- 1000 requests/hour per session

When rate limited, responses include:
```json
{
  "error": "Rate limit exceeded",
  "retry_after_seconds": 45
}
```

### Audit Logging

Security events are logged with full context:
- Session creation/deletion
- Window operations
- Injection attempts
- Isolation violations
- Access denials

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CWM_VLLM_URL` | vLLM server URL | `http://localhost:8000` |
| `CWM_DB_PATH` | SQLite database path | `~/.cwm/cwm.db` |
| `CWM_STORAGE_PATH` | Disk storage path | `~/.cwm/storage` |
| `CWM_CPU_CACHE_GB` | CPU tier size in GB | `8` |
| `CWM_DISK_CACHE_GB` | Disk tier size in GB | `50` |
| `CWM_LOG_LEVEL` | Logging level | `INFO` |

### Claude Code Configuration

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-23 | 0.6.1 | Added session_list, cache_stats, health_check, get_metrics_data tools. Added error codes, session states, security documentation. |
| 2026-01-22 | 0.1.0 | Initial API specification |
