---
title: Taste Compiler Handbook
description: Complete guide to compiling product taste into enforceable constraints.
sidebar:
  order: 0
---

Taste Compiler closes the gap between fast AI code generation and product identity preservation.

**Input:** A human-authored Taste Source — principles, anti-examples, flows, budgets, forbidden patterns written in YAML.

**Output:** A compiled Taste Pack — a versioned, machine-readable JSON artifact that constrains AI-generated work.

**Enforcement:** 6 evaluators check generated code against the pack and report violations with evidence, rationale, and suggested fixes.

## Why it exists

AI code generation produces output fast. It does not preserve product identity, UX safety, or design coherence. Without constraints, AI-generated interfaces drift toward generic dashboards, inconsistent typography, raw hex colors, and unsafe interaction patterns.

Taste Compiler makes taste enforceable. The pack changes what gets built — constrained runs produce structurally different solutions (read-only surfaces instead of editing panels, informational advisories instead of action-heavy dashboards).

## Proof

All 6 artifact classes are live-proven across 7 paired trials on 3 real repositories:

| Metric | Value |
|--------|-------|
| Trials | 7 paired (baseline vs constrained) |
| Repositories | 3 (GlyphStudio, CommandUI, World Forge) |
| Baseline violations | 245 |
| Constrained violations | 0 |
| Artifact classes proven | 6 of 6 |

## Next steps

- [Getting Started](./getting-started/) — install and run your first check
- [Artifact Classes](./artifact-classes/) — understand the 6 violation categories
- [CLI Reference](./cli-reference/) — all commands and flags
- [Architecture](./architecture/) — how the packages fit together
- [Security](./security/) — threat model and data boundaries
