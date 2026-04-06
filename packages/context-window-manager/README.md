<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/context-window-manager/readme.png" alt="Context Window Manager" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/cwm-mcp/"><img src="https://img.shields.io/pypi/v/cwm-mcp" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/context-window-manager/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

> **Lossless context restoration for LLM sessions via KV cache persistence**

---

## What is this?

Context Window Manager (CWM) is an MCP server that solves the **context exhaustion problem** in LLM applications. Instead of losing your conversation history when context fills up, CWM lets you:

- **Freeze** your current context to persistent storage
- **Thaw** it back later with zero information loss
- **Clone** contexts to explore different conversation branches
- **Resume** exactly where you left off

Unlike summarization or RAG approaches, CWM preserves the actual KV cache tensors, giving you **true, lossless restoration**.

---

## How it works

```
Traditional Approach (Lossy):
┌─────────────────────────────────────────────┐
│ Context fills up → Summarize → Lose details │
└─────────────────────────────────────────────┘

CWM Approach (Lossless):
┌──────────────────────────────────────────────────────────────┐
│ Context fills up → Freeze KV cache → Store tensors → Thaw   │
│                                                    ↓        │
│                              Exact restoration, zero loss   │
└──────────────────────────────────────────────────────────────┘
```

CWM leverages:
- **vLLM's prefix caching** with `cache_salt` for session isolation
- **LMCache** for tiered KV cache storage (GPU → CPU → Disk → Redis)
- **MCP protocol** for seamless integration with Claude Code and other MCP clients

---

## Quick Start

### Prerequisites

- Python 3.11+
- vLLM server with prefix caching enabled
- LMCache configured with vLLM

### Installation

```bash
pip install cwm-mcp
```

### Configuration

Add to your Claude Code settings (`.claude/settings.json`):

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

### Usage

```
# Freeze your current session
> window_freeze session_abc123 my-coding-project

# Later, restore it
> window_thaw my-coding-project

# List all saved windows
> window_list

# Check status
> window_status my-coding-project
```

---

## Features

### Core Operations

| Tool | Description |
|------|-------------|
| `window_freeze` | Snapshot session context to storage |
| `window_thaw` | Restore context from a saved window |
| `window_list` | List available windows with filtering and pagination |
| `window_status` | Get detailed session/window info with optional cache stats |
| `window_clone` | Branch a context for exploration |
| `window_delete` | Remove a saved window and optionally its cached blocks |

### Session & Monitoring

| Tool | Description |
|------|-------------|
| `session_list` | List sessions with state and model filters |
| `cache_stats` | Get KV cache hit rate, block counts, and storage usage |
| `health_check` | Check system health (kv_store, vLLM, registry) |
| `get_metrics_data` | Export metrics in JSON or Prometheus format |
| `auto_freeze_config` | Configure automatic context freezing policy |
| `auto_freeze_check` | Check and trigger auto-freeze for a session |

### Storage Tiers

CWM automatically manages storage across tiers:

1. **Memory** - In-process, fastest (default fallback)
2. **CPU Memory** - Fast, configurable capacity (default 8 GB)
3. **Disk** - Large capacity, compressed (default 50 GB)
4. **Redis** - Distributed, shared across instances (optional)
5. **LMCache** - Native vLLM KV cache integration (optional)

### Session Isolation

Each session gets a unique `cache_salt`, ensuring:
- No cross-session data leakage
- Protection against timing attacks
- Clean separation of contexts

---

## Documentation

| Document | Description |
|----------|-------------|
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Getting started and workflows |
| [API.md](docs/API.md) | Complete API reference |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture deep-dive |
| [SECURITY.md](docs/SECURITY.md) | Security considerations |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Error taxonomy and handling |
| [ROADMAP.md](docs/ROADMAP.md) | Development phases and milestones |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Development guidelines |

---

## Requirements

### vLLM Server Configuration

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### LMCache Environment

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## Development

```bash
# Clone and setup
git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
cd context-window-manager
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager
```

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

---

## Roadmap

- [x] Phase 0: Documentation & Architecture
- [x] Phase 1: Core Infrastructure
- [x] Phase 2: MCP Server Shell
- [x] Phase 3: Freeze Implementation
- [x] Phase 4: Thaw Implementation
- [x] Phase 5: Advanced Features (clone, auto-freeze)
- [x] Phase 6: Production Hardening
- [x] Phase 7: Integration & Polish

See [ROADMAP.md](docs/ROADMAP.md) for details.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [vLLM](https://github.com/vllm-project/vllm) - High-throughput LLM serving
- [LMCache](https://github.com/LMCache/LMCache) - KV cache persistence layer
- [Model Context Protocol](https://modelcontextprotocol.io/) - Integration standard
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - Inspiration for context management

---

## Status

**v1.0.1** - Production release. CI consolidated (2 workflows). 446 tests passing.

---

## Security & Data Scope

Context Window Manager is a **local-first** MCP server for KV cache persistence.

- **Data accessed:** Reads/writes KV cache snapshots to local SQLite. Communicates with local vLLM server for cache operations.
- **Data NOT accessed:** No telemetry. No cloud services. No credential storage. Cache data stays on-machine.
- **Permissions:** File system read/write for SQLite database. Network access to local vLLM server only.

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
