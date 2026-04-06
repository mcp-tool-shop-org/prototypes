---
title: Context Window Manager Handbook
description: Complete guide to CWM — lossless LLM context restoration via KV cache persistence.
sidebar:
  order: 0
---

Context Window Manager (CWM) solves the context exhaustion problem in LLM applications. Instead of losing your conversation history when context fills up, CWM lets you freeze, thaw, clone, and resume your sessions with zero information loss.

## How it's different

Unlike summarization or RAG approaches, CWM preserves actual KV cache tensors. Thaw a frozen window and the model resumes from the exact same cognitive state — no approximation.

## Stack

CWM leverages:
- **vLLM's prefix caching** with `cache_salt` for session isolation
- **LMCache** for tiered KV cache storage (GPU → CPU → Disk → Redis)
- **MCP protocol** for seamless integration with Claude Code and other clients
