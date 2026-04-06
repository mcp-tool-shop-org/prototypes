---
title: Reference
description: Gateway API, resource governance, security model, environment variables, and directory structure.
sidebar:
  order: 3
---

This page is the technical reference for Claude ToolStack. It covers every gateway endpoint, the resource governance model, the complete security posture, all environment variables, and the project directory layout.

## Gateway API

All endpoints require the `x-api-key` header. The gateway binds to `127.0.0.1:8088` only — it is never exposed to the network.

### `GET /v1/status`

Returns gateway health and configuration, including version, active limits, and the list of allowed repos.

### `POST /v1/search/rg`

Ripgrep search with guardrails. Accepts a JSON body:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `repo` | string | required | `org/repo` identifier |
| `query` | string | required | Search pattern |
| `max_matches` | number | 200 | Bounds result count |
| `fixed_string` | boolean | false | Literal match (no regex) |
| `case_sensitive` | boolean | false | Case sensitivity |
| `path_globs` | string[] | — | File pattern filters |
| `extra_excludes` | string[] | — | Additional paths to skip |

Returns an array of matches, each with file path, line number, and content. Default excludes: `.git/`, `node_modules/`, `dist/`, `build/`, `target/`, `.next/`, `.turbo/`, `.cache/`, `vendor/`.

### `POST /v1/file/slice`

Fetch a range of lines from a file. Maximum 800 lines per request.

| Field | Type | Purpose |
|-------|------|---------|
| `repo` | string | `org/repo` identifier |
| `path` | string | File path relative to repo root |
| `start` | number | First line (1-indexed) |
| `end` | number | Last line (inclusive) |

### `POST /v1/index/ctags`

Trigger a ctags index build for a repo. This is asynchronous with a 600-second timeout. Returns exit code, stdout, and stderr.

### `POST /v1/symbol/ctags`

Query symbol definitions from the ctags index. Returns an array of objects with `name`, `file`, `excmd`, and `kind` fields.

### `POST /v1/run/job`

Run an allowlisted build, test, or lint preset. Only preset commands execute — there is no arbitrary exec.

| Field | Type | Purpose |
|-------|------|---------|
| `repo` | string | `org/repo` identifier |
| `job` | string | `test`, `build`, or `lint` |
| `preset` | string | `node`, `python`, `rust`, or `go` |

### `GET /v1/metrics`

Prometheus-format counters for monitoring. Tracks total requests, rate-limit 429s, docker exec calls and errors, truncations, and per-endpoint totals.

### Response conventions

All responses include an `X-Request-ID` header for end-to-end correlation. When a response exceeds the 512 KB cap, the gateway truncates it and sets `truncated: true` in the JSON body.

## Resource governance

systemd cgroup v2 slices enforce per-category memory budgets. Each slice has a `MemoryHigh` (soft limit — triggers reclaim pressure) and `MemoryMax` (hard limit — OOM kills the offending process, not your session).

| Slice | MemoryHigh | MemoryMax | Purpose |
|-------|-----------|-----------|---------|
| `claude-gw` | 2 GB | 4 GB | Gateway + socket proxy |
| `claude-index` | 6 GB | 10 GB | Indexers + search |
| `claude-lsp` | 8 GB | 16 GB | Language servers |
| `claude-build` | 10 GB | 18 GB | Build/test runners |
| `claude-vector` | 8 GB | 16 GB | Vector DB (optional) |

### How governance works

1. Docker containers are assigned to slices via `systemd.slice` in the Compose config
2. When a container approaches `MemoryHigh`, the kernel applies reclaim pressure — the process slows but stays alive
3. If the container hits `MemoryMax`, the kernel OOM-kills it — only the offending container dies, not your SSH session or other tools
4. zram swap (LZ4-compressed) provides additional headroom for compressible data like build artifacts

### Tuning for different hosts

The defaults assume 64 GB RAM. For smaller or larger hosts, adjust the slice files in `/etc/systemd/system/`:

```ini
# Example: reduce index slice for a 32 GB host
[Slice]
MemoryHigh=3G
MemoryMax=5G
```

After editing, reload systemd: `sudo systemctl daemon-reload`

## Security model

ToolStack uses defense-in-depth with multiple independent layers.

### Path jail

All file access goes through `realpath` validation:

- Repo paths must resolve to `/workspace/repos/<org>/<repo>`
- Null bytes are rejected
- Symlinks that escape the jail are rejected
- Allow/deny lists use glob patterns from the `ALLOWED_REPOS` and `DENIED_REPOS` variables
- Deny rules always take precedence

### Docker socket proxy

The Docker socket is never exposed directly to any container. A Tecnativa proxy sits between the gateway and the Docker daemon, filtering API calls:

**Allowed:** Container inspect, container exec (how the gateway delegates work to tool containers)

**Denied:** Image pull/push/build, volume create/remove, network create/remove, system info, and 14 other higher-risk endpoints. The proxy operates on an explicit allowlist — anything not listed is denied by default.

### Rate limiting

Token-bucket rate limiting per API key (default scope). Default: 2 requests per second with a burst of 10. Exceeding the limit returns HTTP 429. The scope and backend are configurable via `RATE_LIMIT_SCOPE` (`key` or `ip`) and `RATE_LIMIT_BACKEND` (`memory` or `redis`).

### Audit logging

All gateway requests are logged to a JSONL audit file with:

- Timestamp, endpoint, method, status code
- API key hash (SHA-256, never the raw key)
- Request ID for correlation
- Response size and truncation status

Audit logs rotate automatically by size (50 MB default, 5 backup files).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `API_KEY` | (required) | Gateway authentication key |
| `ALLOWED_REPOS` | `""` (deny all) | Comma-separated glob patterns for repo access |
| `DENIED_REPOS` | `""` | Explicit deny patterns (checked first) |
| `MAX_MATCHES` | `200` | Maximum ripgrep matches per search |
| `MAX_RESPONSE_BYTES` | `524288` (512 KB) | Hard cap on response payload size |
| `MAX_FILE_SLICE` | `800` | Maximum lines per file slice |
| `CTAGS_TIMEOUT` | `600` | Ctags index build timeout (seconds) |
| `RATE_LIMIT_RPS` | `2` | Requests per second per key+ip |
| `RATE_LIMIT_BURST` | `10` | Token bucket burst allowance |
| `CTS_SEMANTIC_MODEL` | `all-MiniLM-L6-v2` | Embedding model for semantic search |
| `RATE_LIMIT_SCOPE` | `key` | Rate limit scope (`key` or `ip`) |
| `RATE_LIMIT_BACKEND` | `memory` | Rate limit backend (`memory` or `redis`) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL when using redis rate-limit backend |
| `RG_THREADS` | `4` | Ripgrep thread count |
| `RG_CONCURRENCY` | `2` | Max concurrent ripgrep searches |
| `JOB_CONCURRENCY` | `1` | Max concurrent job runs |
| `REQUEST_TIMEOUT_SEC` | `20` | Per-request timeout (seconds) |
| `AUDIT_LOG_PATH` | `/audit/audit.jsonl` | Audit log file path |
| `AUDIT_LOG_MAX_MB` | `50` | Audit log rotation size (MB) |
| `AUDIT_LOG_BACKUPS` | `5` | Audit log backup file count |
| `BIND_HOST` | `127.0.0.1` | Gateway bind address |
| `BIND_PORT` | `8088` | Gateway port |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Directory structure

```
claude-toolstack/
  compose.yaml            # Docker Compose — all services + profiles
  .env.example            # Template for environment configuration
  pyproject.toml          # CLI packaging (cts)
  repos.yaml              # Declarative repo registry
  gateway/
    main.py               # FastAPI app — all routes, security, audit
    Dockerfile            # python:3.12-slim + ripgrep + tini
    requirements.txt      # 6 dependencies
  cts/                    # CLI client (zero deps for core)
    cli.py                # argparse commands (search, slice, symbol, ...)
    errors.py             # Structured error shape (CtsError)
    http.py               # Gateway HTTP client
    render.py             # json/text/claude renderers (v1+v2)
    bundle.py             # v2 bundle orchestrator (4 modes)
    ranking.py            # Path scoring, trace extraction, recency
    config.py             # Env + defaults
    semantic/             # Embedding-based search (optional dep)
      store.py            # SQLite vector store
      search.py           # Cosine similarity + narrowing
      candidates.py       # Candidate selection strategies
      config.py           # Semantic knobs
  tests/                  # 910+ unit tests (pytest)
  scripts/
    bootstrap.sh          # One-time host setup
    smoke-test.sh         # Endpoint verification
    health.sh             # Broader health checks
    verify.sh             # All quality gates in one command
  systemd/                # systemd slice unit files
  site/                   # Astro landing page + handbook
```
