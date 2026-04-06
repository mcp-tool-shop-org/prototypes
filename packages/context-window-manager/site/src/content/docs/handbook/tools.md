---
title: MCP Tools
description: Complete reference for all CWM tools — window operations, session management, monitoring, and auto-freeze.
sidebar:
  order: 2
---

## Window operations

| Tool | Description |
|------|-------------|
| `window_freeze` | Snapshot session context to persistent storage |
| `window_thaw` | Restore context from a saved window |
| `window_list` | List available windows with filtering, sorting, and pagination |
| `window_status` | Get detailed session or window info with optional cache stats and lineage |
| `window_clone` | Branch a context for parallel exploration |
| `window_delete` | Remove a saved window and optionally delete its cached KV blocks |

### window_freeze

Captures the KV cache state of a session and persists it under a named window.

```
> window_freeze session_abc123 my-coding-project
```

Parameters:
- `session_id` (required) -- the active session to freeze
- `window_name` (required) -- unique name (alphanumeric, hyphens, underscores)
- `prompt_prefix` -- conversation prompt that generated this state
- `description` -- human-readable label
- `tags` -- list of strings for filtering later

### window_thaw

Restores a frozen window into a new (or specified) session. Returns `cache_salt`, `cache_hit`, and `cache_efficiency` so you can verify restoration quality.

```
> window_thaw my-coding-project
```

Parameters:
- `window_name` (required) -- name of the frozen window
- `new_session_id` -- optional; auto-generated if omitted
- `warm_cache` -- pre-warm the cache by replaying the prompt (default `true`)
- `continuation_prompt` -- optional prompt to continue after restoration

### window_clone

Creates an independent copy of a window. The clone shares the same cached KV blocks but can be thawed and modified independently.

```
> window_clone my-coding-project my-project-v2
```

Parameters:
- `source_window` (required) -- window to clone
- `new_window_name` (required) -- name for the clone
- `description`, `tags` -- optional metadata

### window_list

Returns windows with pagination. Supports tag, model, session, and free-text search filters.

```
> window_list
```

Parameters:
- `tags`, `model`, `session_id`, `search` -- filters
- `sort_by` -- one of `name`, `created_at`, `token_count`, `total_size_bytes`
- `sort_order` -- `asc` or `desc`
- `limit` (max 100), `offset` -- pagination

### window_status

Query a single window or session. Optionally include `include_cache_stats` or `include_lineage` for deeper inspection.

```
> window_status my-coding-project
```

### window_delete

Removes the window record. Pass `delete_blocks: true` to also purge its cached KV blocks from storage.

```
> window_delete my-coding-project
```

---

## Session management

| Tool | Description |
|------|-------------|
| `session_list` | List sessions with optional state and model filters |

### session_list

Filter by state (`active`, `frozen`, `thawed`, `expired`, `deleted`) and model name.

```
> session_list
```

---

## Monitoring

| Tool | Description |
|------|-------------|
| `cache_stats` | KV cache hit rate, stored blocks, and storage usage |
| `health_check` | System health for kv_store, vLLM, and registry components |
| `get_metrics_data` | Export metrics in JSON or Prometheus format |

### cache_stats

Returns block counts, byte totals, hit/miss rates for both the local KV store and the connected vLLM server.

### health_check

Reports overall health (`healthy`, `degraded`, `unhealthy`), uptime, and per-component latency. Pass a `component` name to check a single subsystem.

### get_metrics_data

Export all collected metrics. Set `format` to `"prometheus"` for a Prometheus-compatible text export.

---

## Auto-freeze

| Tool | Description |
|------|-------------|
| `auto_freeze_config` | View or update the automatic freeze policy |
| `auto_freeze_check` | Evaluate a session against thresholds and trigger freeze if needed |

### auto_freeze_config

Call with no arguments to read the current policy. Pass fields to update:

- `enabled` -- toggle auto-freeze on/off
- `token_threshold` -- percentage of max context (0--1, default 0.75)
- `token_count_threshold` -- absolute token count trigger (0 = disabled)
- `cooldown_seconds` -- minimum gap between auto-freezes (default 60)
- `window_name_pattern` -- supports `{session_id}`, `{timestamp}`, `{count}`
- `tags` -- tags applied to auto-frozen windows
- `include_prompt` -- include the prompt prefix when freezing

### auto_freeze_check

Provide `session_id` and the current `token_count`. If thresholds are exceeded and cooldown has elapsed, an automatic freeze is performed.

---

## MCP Resources

CWM also exposes read-only MCP resources:

| URI | Description |
|-----|-------------|
| `sessions://list` | Active sessions summary |
| `windows://list` | Saved windows summary |
| `stats://cache` | Cache statistics |
| `health://status` | System health report |
