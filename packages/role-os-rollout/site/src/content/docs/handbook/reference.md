---
title: Reference
description: Complete reference for rollout doctrine, seam families, lock classifications, and org decisions.
sidebar:
  order: 4
---

## Lock Classifications

Every locked repo is classified by how the lock was achieved. Note that a repo can appear in more than one class (e.g., mcp-aside is both clean and architecture-held).

| Class | Count | Meaning | Repos |
|-------|-------|---------|-------|
| **Reference lock** | 1 | High-bar implementation, used as the standard | commandui |
| **Clean lock** | 6 | Architecture already held, no code repair needed | claude-guardian, polyglot-mcp, site-theme, artifact, ai-loadout, mcp-aside |
| **Repair lock** | 4 | Code fixes required before seam could be defended | role-os, claude-session-copilot, synthesis, repo-crawler-mcp |
| **Granularity-gap lock** | 2 | Truth is told but at insufficient granularity | multi-claude, registry-sync |
| **Architecture-held lock** | 2 | Existing architecture already met the standard | mcp-aside, brand |

## The 11 Seam Families

Each seam family describes a class of truth risk. When locking a repo, identify which family (or families) apply.

### 1. Lifecycle Truth
Session ownership, terminal passthrough, state transition boundaries. Reject changes that blur lifecycle boundaries or allow GUI drift in terminal-native products.

### 2. Contract Truth
Exit-code semantics, skip rules, gate pass/fail classification. Reject changes that weaken gate semantics or soften enforcement into advisory behavior.

### 3. Bootstrap Truth
Scaffold correctness, CLI/starter-pack synchronization, re-init safety. Reject changes that scaffold stale content or let CLI and docs drift apart.

### 4. Health/Budget Truth
Operator-facing reassurance must track machine-facing semantics. Reject changes that make human text friendlier while machine signals stay unchanged.

### 5. Dispatch Truth
Routing determinism, fallback visibility, selection explainability. Reject changes that make dispatch reasoning less explicit or blur primary selection with fallback.

### 6. Binding Truth
Bound vs inferred state, hook failure visibility, staleness signaling. Reject changes that make binding less explicit or introduce reassurance around uncertain binding.

### 7. Evaluator Truth
Borderline verdicts must degrade visibly under weak evidence. Reject changes that collapse ambiguous findings into clean verdicts.

### 8. Ephemeral Truth
TTL immutability, deduplication identity, resurrection prevention. Reject changes that allow expired state to surface or enable resurrection of dead state.

### 9. Mutation Truth
Per-action results, retry visibility, idempotency claims. Reject changes that collapse per-action results into aggregate-only output or hide retry behavior.

### 10. Discovery Truth
Completeness signaling, absence causes, cache freshness. Reject changes that make incomplete discovery share the same surface as complete discovery.

### 11. Identity Truth
Canonical vs derived assets, manifest integrity, naming separation. Reject changes that put non-canonical assets in canonical locations.

## Org-Wide Decisions

All 20 decisions live in `DECISIONS.md`. Key decisions promoted during the rollout:

| Decision | Source Repo |
|----------|-------------|
| Rollout ordering: shipcheck, then lockdown, then treatment | org-wide |
| Lockdown without shipcheck is valid for non-treatment repos | org-wide |
| Context file authoring: Claude drafts, human tightens, then lock | org-wide |
| Exit code semantics: 1 = checker failure, 2 = gate failure | shipcheck |
| Init --force must protect user content | role-os |
| Nested directory bugs in scaffold tools are blocking | role-os |
| Reassurance drift is reject-worthy (org-wide) | claude-guardian |
| Publish patch bumps immediately during rollout | org-wide |
| One seam minimum for lock, add more later | org-wide |
| Initialized is not locked | org-wide |
| No batch init (one repo at a time) | org-wide |
| Active truth defects block lock | claude-session-copilot |
| Evaluator outputs must degrade explicitly under weak evidence | synthesis |
| Ephemeral state must define identity, lifetime, resurrection | mcp-aside |
| Write-path systems must distinguish mutation outcomes | registry-sync |
| Discovery systems must distinguish incomplete from complete | repo-crawler-mcp |
| Brand systems must distinguish canonical from non-canonical | brand |
| Catalog systems must distinguish findings from ingestion events | repo-knowledge |
| Evidence systems must perform real provenance verification | dogfood-labs |
| Observability tools must distinguish config from runtime | claude-hook-debug |

## Context File Quality Bar

| File | Quality Bar |
|------|------------|
| `product-brief.md` | Testable statements. Must include anti-thesis (what the product must never become). |
| `repo-map.md` | A new contributor can copy-paste and orient. Seams documented with invariants and line numbers. |
| `brand-rules.md` | Concrete enough to enforce without follow-up questions. |
| `current-priorities.md` | Honest about current state. Must-preserve section names what cannot be traded away. |

## Re-Lock Triggers

A locked repo must be re-proven when:

- The seam's key files move
- Lifecycle or state ownership changes
- Validation path changes
- Core invariants change
- The proving packet's source-line anchors go stale
- A major refactor touches the protected seam

## Non-Waste Rule

A repo does not count as successful just because `.claude/` exists. Every repo must exit the lockdown process with at least one real, repo-specific asset:

- A repo-local workflow that can reject the wrong change
- A proving packet that traces real invariants
- An org-level decision promoted from repo truth
- A real bug found and fixed
- A named follow-up improvement packet for a truth concern that is not blocking

If a repo exits without any of these, the process failed on that repo.

## Follow-Up Packet Queue

Ranked by cross-org leverage and false-assurance risk:

| Priority | Packet | Repo | Type |
|----------|--------|------|------|
| High | REGSYNC-002 | registry-sync | Orphaned state visibility |
| High | REGSYNC-003 | registry-sync | Idempotency truth |
| High | BRAND-003 | brand | Audit enforcement in CI |
| Medium | CRAWLER-005 | repo-crawler-mcp | Permission/absence truth |
| Medium | SYNTHESIS-002 | synthesis | Weak-evidence signaling |
| Medium | BRAND-002 | brand | Existence validation migration |
| Medium | REGSYNC-004 | registry-sync | Failure classification |
| Medium | COPILOT-002 | claude-session-copilot | Hook capture truth |
| Medium | COPILOT-003 | claude-session-copilot | Resume freshness |
| Low | ARTIFACT-002 | artifact | Curator correction signaling |
| Low | AILOADOUT-002 | ai-loadout | Malformed layer signaling |
