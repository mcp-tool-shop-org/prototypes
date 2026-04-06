---
title: brain-dev Handbook
description: Intelligence layer for developer insights — 9 analysis tools, AST-based test generation, security vulnerability detection, and more via MCP.
sidebar:
  order: 0
---

brain-dev is a Python MCP server that provides AI-powered code analysis through 9 specialized tools. It connects to your AI coding assistant (Claude Desktop, Claude Code, or any MCP client) and gives it the ability to analyze coverage gaps, generate tests, run security audits, suggest refactoring, and more.

## What you get

- **Coverage analysis** that compares observed behavior patterns against your test suite to surface the gaps that matter most.
- **AST-based test generation** that produces pytest files with proper mocks, fixtures, and imports that actually compile and run.
- **Security auditing** aligned with OWASP patterns, detecting SQL injection, command injection, hardcoded secrets, path traversal, and insecure crypto with CWE references.
- **Refactoring suggestions** that spot complexity hotspots, duplicated logic, and naming inconsistencies.
- **UX insights** extracted from usage patterns -- dropoff points, error clusters, and behavior anomalies.
- **Documentation gap detection** that finds missing docstrings and generates templated stubs.

## Architecture

brain-dev uses AST-based analysis focused on Python codebases. All tools are async-first and designed for graceful degradation -- missing dependencies never crash the server. The server communicates over stdio using the standard MCP protocol.

```
┌─────────────────────────────────────────────┐
│              MCP Client (Claude)             │
└──────────────────┬──────────────────────────┘
                   │ stdio / JSON-RPC
┌──────────────────▼──────────────────────────┐
│              brain-dev server                │
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Analyzers   │  │    Generators       │  │
│  │              │  │                     │  │
│  │ coverage     │  │ tests_generate      │  │
│  │ behavior     │  │ smart_tests         │  │
│  │ refactor     │  │ docs_generate       │  │
│  │ ux_insights  │  │                     │  │
│  │ security     │  │                     │  │
│  └──────────────┘  └─────────────────────┘  │
│                                             │
│  ┌──────────────┐                           │
│  │  Utility     │                           │
│  │  brain_stats │                           │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
```

## Next steps

- [Getting Started](/brain-dev/handbook/getting-started/) -- install, configure, and run your first analysis.
- [Tools Reference](/brain-dev/handbook/tools/) -- full details on all 9 tools with usage examples.
- [Security Patterns](/brain-dev/handbook/security-patterns/) -- vulnerability classes detected and architecture details.
