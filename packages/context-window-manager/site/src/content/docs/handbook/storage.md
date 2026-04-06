---
title: Storage & Architecture
description: Storage backends, session isolation, configuration, and production readiness.
sidebar:
  order: 3
---

## Storage backends

CWM supports five storage backends, selectable via configuration:

| Backend | Enum | Use case |
|---------|------|----------|
| **Memory** | `memory` | In-process; fastest, volatile, default fallback |
| **CPU** | -- | Managed via LMCache `LMCACHE_LOCAL_CPU` (up to `LMCACHE_MAX_LOCAL_CPU_SIZE` GB) |
| **Disk** | `disk` | Persistent, compressed, configurable path and size limit |
| **Redis** | `redis` | Distributed, shared across multiple CWM instances |
| **LMCache** | `lmcache` | Native vLLM KV cache connector via `LMCacheConnectorV1` |

The server picks the backend at startup based on settings:
- If `CWM_STORAGE_ENABLE_DISK=true` and a `disk_path` is configured, CWM uses the disk backend.
- Otherwise it falls back to the in-memory backend.
- Redis and LMCache are available through optional install extras (`cwm-mcp[redis]`, `cwm-mcp[lmcache]`).

## Configuration

All settings use the `CWM_` environment variable prefix and support nested configuration via `__` separators. A `.env` file is loaded automatically.

Key storage settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `CWM_STORAGE_ENABLE_CPU` | `true` | Enable CPU memory tier |
| `CWM_STORAGE_CPU_MAX_GB` | `8.0` | Max CPU memory for cache (GB) |
| `CWM_STORAGE_ENABLE_DISK` | `true` | Enable disk tier |
| `CWM_STORAGE_DISK_PATH` | `~/.cwm/storage` | Disk storage directory |
| `CWM_STORAGE_DISK_MAX_GB` | `50.0` | Max disk storage (GB) |
| `CWM_STORAGE_COMPRESSION` | `true` | Compress disk-stored blocks |
| `CWM_STORAGE_REDIS_URL` | -- | Redis URL for distributed tier |
| `CWM_DB_PATH` | `~/.cwm/cwm.db` | SQLite database for sessions and windows |

Resource limits:

| Variable | Default | Description |
|----------|---------|-------------|
| `CWM_LIMITS_MAX_CONTEXT_TOKENS` | `128000` | Max context size in tokens |
| `CWM_LIMITS_MAX_SESSIONS` | `100` | Max concurrent sessions |
| `CWM_LIMITS_MAX_WINDOWS` | `1000` | Max stored windows |
| `CWM_LIMITS_MAX_STORAGE_GB` | `100.0` | Total storage cap (GB) |
| `CWM_LIMITS_RATE_LIMIT_PER_MINUTE` | `60` | Operations per minute |

## Session isolation

Each session receives a unique `cache_salt`, ensuring:

- No cross-session data leakage
- Protection against timing attacks
- Clean separation between concurrent contexts

Security configuration is available via `CWM_SECURITY_*` variables, including optional encryption-at-rest (`CWM_SECURITY_ENCRYPTION_AT_REST`), TLS enforcement, and audit logging.

## Error taxonomy

All errors follow a structured format with a numeric code, human-readable message, retryability flag, and diagnostic context. Error families:

| Range | Category |
|-------|----------|
| CWM-1xxx | Validation (bad input) |
| CWM-2xxx | Not found (session/window/block) |
| CWM-3xxx | State (invalid transitions) |
| CWM-4xxx | Storage (read/write/quota/corruption) |
| CWM-5xxx | Connection (vLLM/LMCache/KV store) |
| CWM-6xxx | Timeout |
| CWM-7xxx | Resource (memory/rate/concurrency) |
| CWM-8xxx | Security (access/isolation) |

Retryable errors are flagged automatically; callers can use `is_retryable()` and `get_retry_delay()` for exponential backoff.

## Production status

- **446 tests** -- async coverage with pytest-asyncio, property-based tests via Hypothesis
- **7 completed phases** -- from core infrastructure through integration and polish
- **v1.0.1** -- current release
- **vLLM + LMCache stack** -- built on proven inference infrastructure

## Development

```bash
git clone https://github.com/mcp-tool-shop-org/context-window-manager
cd context-window-manager
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest tests/unit/
```
