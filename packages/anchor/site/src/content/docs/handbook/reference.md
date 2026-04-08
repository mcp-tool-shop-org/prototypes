---
title: Reference
description: Complete reference for Anchor's artifact types, states, commands, and link types.
sidebar:
  order: 4
---

## Artifact Types

| # | Type | Enum Value | Purpose |
|---|------|-----------|---------|
| 1 | Constitution | `constitution` | Product promise, fantasy, anti-goals, quality bar, failure condition |
| 2 | User Fantasy + Workflows | `user_fantasy_workflows` | Narrative workflows linked to constitution clauses |
| 3 | Feature Map | `feature_map` | Features with workflow justification and anti-goal checks |
| 4 | System Architecture | `system_architecture` | Systems, responsibilities, boundaries |
| 5 | UX State Map | `ux_state_map` | States, transitions, entry conditions |
| 6 | Phase Roadmap + Contracts | `phase_roadmap_contracts` | Phases with invariants and forbidden compromises |
| 7 | Acceptance Checklists | `acceptance_checklists` | Per-phase checklist groups |
| 8 | Drift Alarm Definitions | `drift_alarm_definitions` | Alarm types, triggers, severity, remediation |
| 9 | Execution Readiness Gate | `execution_readiness_gate` | Computed gate evaluation |

## Artifact States

| State | Description |
|-------|-------------|
| `draft` | Initial state — content is being authored |
| `complete` | All required fields filled, structural validation passes |
| `valid` | Structural + relational validation passes |
| `approved` | Human review confirms intent alignment |
| `stale` | Upstream dependency changed — requires reconciliation |

## Validation Layers

Each artifact is validated at three levels:

| Layer | What It Checks |
|-------|---------------|
| `structural` | Required fields present, content hashes valid |
| `relational` | Trace links present and endpoints resolve correctly |
| `intent` | Human review confirms alignment with constitution |

Validation status values: `pending`, `pass`, `fail`, `needs_amendment`.

## Trace Link Types

| Type | Direction | Meaning |
|------|-----------|---------|
| `justifies` | upstream → downstream | Requirement justifies a feature or design |
| `derives_from` | downstream → upstream | Design derives from a requirement |
| `implements` | downstream → upstream | System implements a feature |
| `depends_on` | peer → peer | Artifact depends on another artifact |
| `validated_by` | any → any | Artifact is validated by a checklist |
| `invalidated_by` | any → any | Artifact was invalidated by a change |

## Drift Alarm Types

| Type | Severity Range | What It Detects |
|------|---------------|-----------------|
| `traceability_drift` | Info → Blocking | Missing or broken trace links |
| `constitution_drift` | Warning → Blocking | Misalignment with constitution |
| `sequence_drift` | Warning → Blocking | Out-of-order artifact work |
| `quality_drift` | Info → Error | Below constitution quality bar |
| `scope_drift` | Warning → Blocking | Scope exceeds defined boundaries |

Severity levels: `info`, `warning`, `error`, `blocking`.

Alarm status values: `active`, `resolved`, `dismissed_for_amendment_context`.

## Amendment States

| State | Description |
|-------|-------------|
| `proposed` | Amendment drafted with rationale |
| `impact_assessed` | Blast radius computed |
| `applied` | Amendment takes effect, staleness propagated |
| `reconciliation_pending` | Affected artifacts need reconciliation |
| `completed` | All downstream artifacts reconciled |
| `abandoned` | Amendment withdrawn |

## Gate Blocking Checks

The readiness gate evaluates six conditions:

1. All artifacts in `approved` state
2. Zero stale artifacts
3. Zero active blocking drift alarms
4. All amendments completed or abandoned
5. All approvals against current constitution version
6. All required trace links present

## Tauri IPC Commands

Anchor exposes 30 commands through the Tauri IPC layer (22 read, 8 write):

**Read commands** include: get project snapshot, get artifact detail, evaluate readiness gate, get export preview, get project health, get recovery actions, get validation report, get impact analysis, get audit timeline, get trace links, get amendment status, and scenario listing.

**Write commands** include: transition artifact state, edit artifact content, create/remove trace links, propose/apply/complete amendments, and save/load project files.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open command palette (15 quick actions) |

The command palette provides access to scenario switching, artifact navigation, gate evaluation, export, and all major views.

## Audit Event Types

Anchor logs 19 event types in an append-only audit trail:

ProjectCreated, ConstitutionLocked, ArtifactCreated, ArtifactUpdated, ArtifactCompleted, ArtifactValidated, ArtifactApproved, ArtifactMarkedStale, TraceLinkCreated, TraceLinkRemoved, AmendmentStarted, AmendmentImpactAssessed, AmendmentApplied, DriftAlarmRaised, DriftAlarmResolved, ExportBlocked, ReadinessGateComputed, ReadinessGatePassed, ProjectExported.
