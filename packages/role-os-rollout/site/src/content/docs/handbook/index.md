---
title: Role OS Rollout Handbook
description: Operational handbook for the org-wide Role OS rollout control plane.
sidebar:
  order: 0
---

The Role OS Rollout repo is the **operational control plane** for deploying [Role OS](https://github.com/mcp-tool-shop-org/role-os) across every repository in the `mcp-tool-shop-org` organization.

It does not contain product code, CLI source, or npm packages. It contains **governance state**: doctrine, decisions, repo classifications, work queues, per-repo audit artifacts, and lockdown proving packets.

## Key Concept: Initialized Is Not Locked

Running `npx role-os init` scaffolds the generic spine (agents, schemas, policies, workflows, context templates). That is step 1, not the finish line.

**Locked** means:

- All 4 context files filled with repo-specific truth
- Highest-risk architecture seam documented as first-class law
- Repo-local workflow exists with explicit reject conditions
- Proving packet passed with invariants traced to source
- The system can reject the wrong change at multiple independent levels

## The Rollout Question

Every repo must answer this before lock:

> What repo-specific law would generic orchestration miss, and what wrong change must the system be able to reject automatically?

## Rollout Results (v1)

The first org-wide rollout produced:

| Metric | Value |
|--------|-------|
| Repos locked | 15 |
| Org decisions promoted | 21 |
| Seam families identified | 11 |
| Repos requiring code repair | 4 (29%) |
| Patch bumps published during lockdown | 5 |
| Follow-up packets queued | 11 |

## Files in This Repo

| File | Purpose |
|------|---------|
| `DOCTRINE.md` | Rollout law and the 7-step lockdown checklist |
| `ROLLOUT-DOCTRINE-v1.md` | Operating constitution: seam families, decisions, classifications |
| `DECISIONS.md` | Org-wide reusable answers promoted from repo lockdowns |
| `WORK-QUEUE.md` | Current claims, completed locks, next repos |
| `REPO-INDEX.md` | Every org repo classified and tracked |
| `QA.md` | Shared question/answer ledger for multi-Claude coordination |
| `TRANSITION.md` | Post-rollout governance transition plan |
| `repos/<repo>/` | Per-repo audit drafts, questions, lock packets, status |
