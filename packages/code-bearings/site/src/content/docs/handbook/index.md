---
title: Code Bearings Handbook
description: Complete guide to source-grounded review, learning, and control for modern codebases.
sidebar:
  order: 0
---

Code Bearings indexes your TypeScript project into a graph of files, symbols, modules, and dependencies — then projects that truth onto every surface where you need it.

## Product Thesis

**Truth stays canonical. AI helps explain, teach, and project. The human stays in charge.**

Code Bearings never fabricates information. Every claim in a change brief, module card, or hover tooltip traces back to source code evidence. Purpose modes (Bug Hunter, Learning, Architecture, Exploration) are lenses over the same canonical truth — they help you think differently, not see differently.

## Three Packages

| Package | Role |
|---------|------|
| `@code-bearings/core` | Shared product logic — extraction, graph, review, rendering |
| `@code-bearings/cli` | Command-line interface |
| `@code-bearings/vscode` | VS Code extension |

Core owns truth. CLI is thin. Extension is thin. No forked product.

## Three Layers of Truth

| Layer | What | Example |
|-------|------|---------|
| **A. Extracted Truth** | Facts from source code | "Function X calls function Y" |
| **B. Derived Structure** | Computed from Layer A | "Module M has fan-in 7, risk score 25" |
| **C. Human Narration** | Explanations over A+B | "This change removes error handling from a high-traffic path" |

## Next Steps

- [Beginners Guide](/code-bearings/handbook/beginners/) — your first 5 minutes with Code Bearings
- [Getting Started](/code-bearings/handbook/getting-started/) — install, index, review, and explore
- [CLI Reference](/code-bearings/handbook/reference/) — all commands and options
- [Architecture](/code-bearings/handbook/architecture/) — how Code Bearings works internally
- [Security](/code-bearings/handbook/security/) — threat model and security posture
