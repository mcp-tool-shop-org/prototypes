---
title: Drift & Recovery
description: How Anchor detects drift, propagates staleness, and computes recovery paths.
sidebar:
  order: 3
---

## Drift Alarm Engine

Anchor detects five categories of drift, each with rule provenance and remediation paths:

| Category | What It Catches |
|----------|----------------|
| **Traceability Drift** | Missing required trace links, orphan artifacts without upstream justification |
| **Constitution Drift** | Artifacts that conflict with or no longer align with the constitution |
| **Sequence Drift** | Artifacts worked out of order or dependencies violated |
| **Quality Drift** | Artifacts that fall below the quality bar defined in the constitution |
| **Scope Drift** | Features or systems that exceed the defined scope or conflict with anti-goals |

Each alarm has a severity level: Info, Warning, Error, or Blocking. Only Blocking alarms prevent export.

Alarms carry rule provenance — they reference the specific constitutional clause or gate rule that triggered them, plus a remediation template explaining how to resolve the issue.

## Stale Propagation

When an upstream artifact changes, Anchor walks the dependency graph and marks all downstream artifacts as Stale. This is automatic and recursive:

- **Direct staleness** — an artifact's immediate upstream dependency changed
- **Transitive staleness** — a dependency of a dependency changed, propagating through the graph
- **Nuclear invalidation** — a constitution amendment triggers staleness on every downstream artifact

Stale artifacts must be reconciled (edited, revalidated, and reapproved) before the readiness gate can clear. The recovery engine tells you exactly which artifacts are stale and in what order to address them.

## Amendment Protocol

Constitutions can change, but change is formal. The amendment lifecycle has five states:

1. **Proposed** — the change is drafted with rationale
2. **ImpactAssessed** — the blast radius is computed (which artifacts are affected, what links break)
3. **Applied** — the amendment takes effect, triggering stale propagation
4. **ReconciliationPending** — all affected artifacts must be reconciled
5. **Completed** — all downstream artifacts are reconciled and reapproved

An amendment can also be **Abandoned** at any point before completion.

The impact analysis runs before the amendment is applied, so you see the full blast radius before committing to the change.

## Readiness Gate

The execution readiness gate runs six blocking checks:

1. **Artifact states** — all nine artifacts must be in the Approved state
2. **Stale artifacts** — zero stale artifacts allowed
3. **Drift alarms** — zero active blocking alarms
4. **Amendment completion** — all amendments must be Completed or Abandoned
5. **Approval currency** — all approvals must be against the current constitution version
6. **Traceability completeness** — all required trace links must be present

The gate is computed, not authored. It produces a detailed evaluation with:
- Overall status (Blocked or Ready)
- List of blocking reasons with rule provenance
- Stale artifact summary
- Outdated approval list
- Active blocking alarm details
- Export manifest preview

## Recovery Engine

For any project state, the recovery engine computes a prioritized list of actions to reach gate-ready. Each action includes:

- **Action type** — EditContent, TransitionState, AddTraceLink, Revalidate, Reapprove, ReconcileStale, or ProposeAmendment
- **Target artifact** — which artifact to act on
- **Priority** — computed ordering based on the dependency graph
- **Prerequisites** — what must be done before this action
- **Rule clause** — the specific constitutional rule requiring this action (e.g., "No stale artifact may be present at export time")
- **Why first** — explanation of why this action is prioritized above others

The recovery engine is the GPS — the operator should never need to guess what to do next.

## Export Package

Once the gate clears, the export compiler produces a 14-file package:

- `project.json` — machine-readable canonical source
- `constitution.md` — the product constitution
- `artifacts/*.md` — one file per artifact type (9 files)
- `reports/traceability-matrix.md` — full traceability report
- `reports/audit-log.md` — append-only event history
- `reports/drift-report.md` — drift alarm history
- `reports/execution-readiness-report.md` — gate evaluation details

The package includes an integrity attestation with per-artifact content hash chains, proving every artifact was Approved, all trace links were present, and no blocking drift alarms were active at export time.
