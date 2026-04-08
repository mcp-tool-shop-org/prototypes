# nexus-suite

Governance, attestation, and routing infrastructure for MCP tool ecosystems.

## What It Does

A Python monorepo containing the core building blocks for governed MCP tool execution: request routing, attestation signing/verification, and governance policy enforcement.

## Components

| Component | Description |
|-----------|-------------|
| **nexus-router** | Request routing and dispatch |
| **nexus-attest** | Attestation signing and verification |
| **nexus-control** | Governance policy control plane |
| **nexus-router-adapter-stdout** | Debug adapter for stdout transport |
| **nexus-router-adapter-http** | HTTP/REST dispatch adapter |
| **nexus-router-adapter-template** | Template for custom adapters |

## Quick Start

```bash
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite/src/nexus-router
pip install -e .
pytest
```

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/nexus-suite)
- [nexus-router](https://github.com/mcp-tool-shop-org/nexus-router) — standalone router
- [nexus-attest](https://github.com/mcp-tool-shop-org/nexus-attest) — standalone attestation
- [MCP Tool Shop](https://github.com/mcp-tool-shop-org)
