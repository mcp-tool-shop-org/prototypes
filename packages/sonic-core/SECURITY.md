# Security Policy

## Threat Model

sonic-core is a local-only audio control plane. It communicates with sonic-runtime over stdio (no network sockets). There is no user authentication, no remote API, and no persistent storage of credentials.

**Attack surface:**
- File paths passed to the engine (WAV/OGG sources) — validated but not sandboxed
- Runtime binary path (SONIC_RUNTIME_PATH) — trusted, operator-configured
- ndjson-stdio protocol — local IPC only, no network exposure

**Out of scope:**
- Network-based attacks (no listening sockets in sonic-core itself)
- Authentication bypass (no auth layer exists; this is a local tool)

## No Telemetry

sonic-core collects no telemetry, analytics, or usage data. No network requests are made by the library itself.

## Reporting a Vulnerability

If you discover a security issue, please email [64996768+mcp-tool-shop@users.noreply.github.com](mailto:64996768+mcp-tool-shop@users.noreply.github.com) with details. We will respond within 7 days.

Please do not open public issues for security vulnerabilities.
