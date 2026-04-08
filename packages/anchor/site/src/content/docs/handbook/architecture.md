---
title: Architecture
description: The artifact spine, state machine, traceability graph, and law engine that power Anchor.
sidebar:
  order: 2
---

## Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Backend | Rust (Tauri 2) | Final authority — validation, hashing, state transitions, export |
| Frontend | React 19 + TypeScript | Window into law — forms, graph, health dashboard, command palette |
| Storage | Local JSON with integrity hashing | No cloud dependency |
| Network | None | Fully local-first |

## The Artifact Spine

Every project contains exactly nine artifacts, worked in strict order:

1. **Constitution** — the throne: one-sentence promise, user fantasy, anti-goals, quality bar, failure condition
2. **User Fantasy + Workflows** — narrative + concrete workflow definitions linked to constitution clauses
3. **Feature Map** — features with upstream workflow justification and anti-goal conflict checks
4. **System Architecture** — systems, responsibilities, boundaries, feature implementation links
5. **UX State Map** — states, transitions, entry conditions, blocked actions
6. **Phase Roadmap + Contracts** — phases with inputs, outputs, invariants, forbidden compromises
7. **Acceptance Checklists** — per-phase checklist groups with constitution-linked items
8. **Drift Alarm Definitions** — alarm types, trigger conditions, severity, remediation templates
9. **Execution Readiness Gate** — computed (not authored) by the engine as the final judge

No additional first-class artifact types can be introduced without a schema version upgrade.

## Artifact State Machine

Every artifact moves through five states with ten legal transitions and four explicitly forbidden paths:

```
Draft → Complete → Valid → Approved
                                ↓
                              Stale ← (upstream change)
                                ↓
                       Complete → Valid → Approved (reconcile & re-approve)
```

**Legal transitions:** Draft→Complete, Complete→Draft, Complete→Valid, Valid→Complete, Valid→Approved, Approved→Stale, Stale→Complete, Stale→Valid, Stale→Approved (guarded).

**Forbidden transitions:** Draft→Approved, Draft→Valid, Complete→Approved, Approved→Draft. These are blocked regardless of context.

Three validation layers apply at each step:

- **Structural** — required fields present, hashes valid
- **Relational** — traceability links present and correct
- **Intent** — human review confirms alignment with constitution

## Bidirectional Traceability

Six link types enforce the dependency graph:

| Link Type | Direction | Purpose |
|-----------|-----------|---------|
| Justifies | upstream → downstream | "This requirement justifies that feature" |
| DerivesFrom | downstream → upstream | "This design derives from that requirement" |
| Implements | downstream → upstream | "This system implements that feature" |
| DependsOn | peer → peer | "This artifact depends on that artifact" |
| ValidatedBy | any → any | "This is validated by that checklist" |
| InvalidatedBy | any → any | "This was invalidated by that change" |

Every node must answer two questions: "what justifies this?" and "what depends on this?" Missing links trigger traceability drift alarms.

## The Law Engine

The Rust backend contains 12,400 lines across 21 modules. Key subsystems:

- **state_machine** — 5 states, 10 legal transitions, 4 forbidden, precondition validation
- **traceability** — bidirectional graph validation with 6 link rules
- **drift_rules** — 5-category drift alarm engine with rule provenance
- **stale_propagation** — recursive dependency walk (direct + transitive)
- **readiness_gate** — 6-check gate evaluator
- **export_compiler** — gate-guarded 14-file renderer + integrity attestation
- **recovery** — next-action engine with constitutional rule references
- **amendments** — formal change protocol with downstream reconciliation
- **persistence** — atomic save/load, corruption detection, dry-run diagnostics, auto-repair
- **validation** — per-artifact 3-layer validation reports
- **editing** — content editing with constraint enforcement
- **link_authoring** — trace link CRUD with legality checks

## UI Architecture

The React frontend (3,700 lines, 14 views) is aggressively subordinate to the engine:

- The UI never computes readiness — it only renders backend results
- The UI never invents state transitions — every transition goes through the Rust state machine
- Illegal actions are visible-but-disabled with reasons (not hidden)
- Every "why blocked?" answer is one click away
- The command palette (Ctrl+K) provides 15 quick actions

The 30 Tauri IPC commands break down as 22 read operations and 8 write operations.
