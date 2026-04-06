# Context Window Manager

Lossless context restoration for LLM sessions via KV cache persistence.

## Overview

Context Window Manager (CWM) is an MCP server that solves the context exhaustion problem in LLM applications. When a conversation's context window fills up, traditional approaches summarize or truncate, losing information. CWM instead persists the actual KV cache tensors and restores them on demand, achieving true lossless restoration.

## Key Capabilities

- **Freeze** -- Snapshot a live session's KV cache to persistent storage (CPU memory, disk, or Redis).
- **Thaw** -- Restore a previously frozen context with zero information loss.
- **Clone** -- Branch a context window to explore different conversation paths.
- **Session isolation** -- Each session receives a unique `cache_salt`, preventing cross-session data leakage.

## Architecture

CWM sits between your MCP client (e.g. Claude Code) and a vLLM server with LMCache enabled:

```
MCP Client  -->  CWM (MCP Server)  -->  vLLM + LMCache
                   |
                   v
              Storage Tiers
           (CPU / Disk / Redis)
```

The server exposes six MCP tools: `window_freeze`, `window_thaw`, `window_list`, `window_status`, `window_clone`, and `window_delete`.

## Quick Start

Install from PyPI:

```bash
pip install context-window-manager
```

Configure in your MCP client settings:

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

## Prerequisites

- Python 3.11+
- vLLM with prefix caching enabled
- LMCache configured with vLLM

## Documentation

- [User Guide](USER_GUIDE.md) -- Getting started and workflows
- [API Reference](API.md) -- Complete tool and parameter reference
- [Architecture](ARCHITECTURE.md) -- Technical deep-dive
- [Security](SECURITY.md) -- Threat model and mitigations
- [Error Handling](ERROR_HANDLING.md) -- Error taxonomy
- [Contributing](CONTRIBUTING.md) -- Development guidelines

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/context-window-manager)
- [PyPI Package](https://pypi.org/project/cwm-mcp/)
- [Issue Tracker](https://github.com/mcp-tool-shop-org/context-window-manager/issues)

## License

MIT
