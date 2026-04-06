---
title: Beginner's Guide
description: A from-scratch introduction to Context Window Manager for first-time users.
sidebar:
  order: 99
---

## What is this tool?

Context Window Manager (CWM) is an MCP server that lets you **freeze** and **thaw** LLM conversation contexts. When a language model runs, it builds an internal data structure called a KV (key-value) cache that represents everything the model has "read" so far. CWM captures those tensors, stores them on disk or in memory, and restores them later so the model picks up exactly where it left off -- no summarization, no information loss.

Think of it like hibernate on a laptop: the full state is saved, and when you resume, everything is still there.

## Who is this for?

CWM is designed for developers and power users who:

- Run local LLMs via **vLLM** and want to pause/resume long sessions.
- Need to **branch** a conversation to explore alternatives without losing the original.
- Want to avoid re-processing thousands of tokens every time they restart a session.
- Build MCP-integrated workflows in **Claude Code** or other MCP clients.

You do **not** need CWM if you only use hosted APIs (like the Claude API) that manage context for you, or if your conversations are short enough that replaying from scratch is trivial.

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Python | 3.11+ | Required |
| vLLM | Recent release with prefix caching | Must run with `--enable-prefix-caching` |
| LMCache | Latest | Provides the tiered KV cache storage layer |
| pip | -- | For installing `cwm-mcp` |
| Hardware | GPU with enough VRAM for your model | CWM itself is lightweight; the model is the bottleneck |

Optional: Redis (for distributed storage) or the `cryptography` package (for encryption-at-rest).

## Your first 5 minutes

### 1. Install CWM

```bash
pip install cwm-mcp
```

### 2. Start your vLLM server

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### 3. Configure your MCP client

Add this to `.claude/settings.json` (or the equivalent for your MCP client):

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

### 4. Freeze a session

After some conversation, save your context:

```
> window_freeze session_abc123 my-first-window
```

### 5. Thaw it later

In a new session, restore exactly where you left off:

```
> window_thaw my-first-window
```

The response includes a `cache_salt` and `cache_efficiency` score so you can verify the restoration worked.

## Common mistakes

| Mistake | What happens | Fix |
|---------|-------------|-----|
| Forgetting `--enable-prefix-caching` on vLLM | Freeze succeeds but thaw cannot restore the cache | Restart vLLM with the flag |
| Reusing a window name | `WindowAlreadyExistsError` (CWM-3003) | Pick a unique name, or delete the old window first |
| Not setting `CWM_VLLM_URL` | Server starts but cannot reach vLLM | Set the env variable to your vLLM address |
| Thawing on a different model | The KV cache layout does not match | Use the same model that produced the freeze |
| Expecting CWM to work with hosted APIs | CWM requires local vLLM access | Use CWM only with self-hosted vLLM |

## Next steps

- **[Getting Started](/handbook/getting-started/)** -- install extras (Redis, encryption) and configure storage tiers.
- **[MCP Tools](/handbook/tools/)** -- full reference for all 12 tools, including auto-freeze and monitoring.
- **[Storage & Architecture](/handbook/storage/)** -- storage backends, configuration variables, error taxonomy.
- **Clone a window** -- try `window_clone my-first-window experiment-branch` to explore branching.
- **Enable auto-freeze** -- use `auto_freeze_config` to have CWM save your context automatically when token usage hits a threshold.

## Glossary

| Term | Definition |
|------|------------|
| **KV cache** | Key-value tensors that store the model's "memory" of everything processed so far in a session. |
| **Freeze** | Save the KV cache state of a session to persistent storage under a named window. |
| **Thaw** | Restore a previously frozen window into a new session, recovering the exact KV cache state. |
| **Window** | A named snapshot of a session's KV cache. Windows can be listed, cloned, and deleted. |
| **Session** | A running conversation context identified by a unique ID. Sessions have states: active, frozen, thawed, expired, deleted. |
| **cache_salt** | A unique per-session token that isolates one session's cache from another in vLLM. |
| **Clone** | Create a copy of a window. The clone shares cached blocks but evolves independently once thawed. |
| **Auto-freeze** | A policy that triggers a freeze automatically when token usage exceeds a configurable threshold. |
| **LMCache** | An external library that provides tiered KV cache storage (GPU, CPU, disk, Redis) for vLLM. |
| **MCP** | Model Context Protocol -- the integration standard that lets CWM expose tools to clients like Claude Code. |
| **Block** | The unit of KV cache data stored and retrieved. Each window contains one or more blocks. |
| **Lineage** | The ancestry chain of a cloned window, tracking which window it was derived from. |
