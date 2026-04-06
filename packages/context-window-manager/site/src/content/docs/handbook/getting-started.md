---
title: Getting Started
description: Install CWM and configure your vLLM + LMCache stack.
sidebar:
  order: 1
---

## Install

```bash
pip install cwm-mcp
```

Optional extras:

```bash
pip install cwm-mcp[redis]       # distributed storage
pip install cwm-mcp[lmcache]     # LMCache integration
pip install cwm-mcp[encryption]  # encrypted-at-rest
pip install cwm-mcp[all]         # everything
```

## Claude Code configuration

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

## vLLM server setup

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

## LMCache environment

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```
