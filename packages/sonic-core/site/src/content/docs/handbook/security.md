---
title: Security
description: Threat model, attack surface, and security posture.
sidebar:
  order: 4
---

## Threat model

sonic-core is a **local-only** audio control plane. It communicates with sonic-runtime over stdio — no network sockets are opened by the library itself.

### Attack surface

| Surface | Risk | Mitigation |
|---------|------|------------|
| File paths (audio sources) | Path traversal | Validated but not sandboxed — operator controls source paths |
| Runtime binary path | Arbitrary execution | Operator-configured via `SONIC_RUNTIME_PATH` |
| ndjson-stdio protocol | Message injection | Local IPC only — no network exposure |
| MCP service (stdio) | Unauthorized tool calls | MCP transport is stdio — access controlled by the host process |

### Out of scope

- **Network attacks** — sonic-core opens no listening sockets
- **Authentication bypass** — no auth layer exists; this is a local development tool
- **Supply chain** — standard npm dependency tree; no post-install scripts

## No telemetry

sonic-core collects **no telemetry**, analytics, or usage data. No network requests are made by the library. The runtime binary (sonic-runtime) is equally offline — it communicates only over stdin/stdout with its parent process.

## Reporting vulnerabilities

If you discover a security issue, email [64996768+mcp-tool-shop@users.noreply.github.com](mailto:64996768+mcp-tool-shop@users.noreply.github.com). We will respond within 7 days.

Do not open public issues for security vulnerabilities.
