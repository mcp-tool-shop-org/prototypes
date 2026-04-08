---
title: StressKit MCP Handbook
description: Complete guide to health and security testing for MCP servers.
---

Welcome to the **StressKit MCP** handbook. This guide covers everything you need to validate the health, performance, and security of your MCP servers.

## Contents

- [Getting Started](./getting-started/) — Installation, running your first check, configuring targets
- [Reference](./reference/) — CLI commands, profiles, finding codes, report schema, architecture
- [Beginners](./beginners/) — First-time walkthrough from zero to your first passing report

## What is StressKit MCP?

StressKit MCP is a Python CLI that tests MCP (Model Context Protocol) servers for protocol compliance, operational readiness, security posture, and trust model adherence. It answers the question: "Is this MCP server safe enough to run, and predictable enough to depend on, under real workloads?"

### What it does

- **Protocol Compliance** (`mcp-core`) — Verifies MCP handshake, tool schemas, error format, capability honesty, smoke invocation, schema rejection, and timeout behavior (7 of 11 checks implemented)
- **Operational Readiness** (`mcp-ops`) — Tests stability under increasing concurrency with tiered ramp-ups (1 of 12 checks implemented)
- **Security Posture** (`mcp-secure`) — Validates auth gates, path traversal, injection, and secret leakage (15 checks defined, implementation planned)
- **Trust Model** (`mcp-trust`) — Checks command transparency, source pinning, and permission scope (11 checks defined, implementation planned)
- **Evidence Generation** — Produces structured JSON reports with finding codes, severity levels, repro bundles, and a 0-100 score

### Why StressKit?

Most MCP servers are tested manually or not at all. StressKit gives you repeatable, automated evidence that your server handles load, rejects bad input, and follows the MCP protocol correctly. The JSON output and exit codes integrate directly into CI pipelines.
