# Rollout → Governance Transition

**Date:** 2026-03-24
**Status:** Rollout phase complete. Governance phase begins.

## What was completed

- 15 repos locked across 11 seam families
- 21 org-wide decisions promoted
- ROLLOUT-DOCTRINE-v1 published as operating constitution
- 4 repos required code repair before lock (29% repair rate)
- 5 published patch bumps shipped during lockdown
- 11 follow-up packets queued

## What comes next (three tracks)

### Track 1: Doctrine as pre-lock intake

Every new repo entering lockdown should start with:
- Seam family selection (from the 11 documented families)
- Expected liar-path identification
- Draft reject-pattern template (from doctrine examples)
- Anticipated lock class target (reference, clean, repair, architecture-held)

This prevents future repos from entering as undefined surfaces.

### Track 2: Machine-checkable gates from high-confidence decisions

Best candidates for automation (highest cross-org leverage):
- Incomplete vs complete discovery surface distinction
- Cached vs fresh data distinction
- Canonical vs derived identity separation
- Materially different mutation outcomes must not share success surface
- Weak/borderline evaluator outputs must degrade explicitly

These are the beginnings of Doctrine v2 as policy enforcement.

### Track 3: Follow-up packet queue ranked by doctrine value

Do not process FIFO. Rank by cross-org leverage + false-assurance risk.

**Top tier (highest doctrine value):**
1. REGSYNC-002 — mutation residue visibility (orphaned state)
2. REGSYNC-003 — idempotency truth
3. CRAWLER-005 — permission/absence truth in discovery (Tier 1/2)
4. BRAND-003 — audit enforcement in identity (CI gate)
5. SYNTHESIS-002 — weak-evidence signaling in evaluator surfaces

**Second tier:**
6. BRAND-002 — migrate existence validation
7. REGSYNC-004 — failure classification
8. COPILOT-002 — stronger hook capture truth
9. COPILOT-003 — deeper resume freshness

**Lower priority:**
10. ARTIFACT-002 — Curator correction signaling
11. AILOADOUT-002 — malformed layer signaling

## Next artifact to produce

**DOCTRINE-ADOPTION-PLAN-v1** — turns the constitution into operating policy:
- Which org decisions become mandatory for new repos now
- Which require template support
- Which can be CI/policy-checked
- Which remain reviewer judgment
- How follow-up packets are prioritized
- When a repo deserves re-lock vs follow-up only

## The value shift

From: finding truth defects repo by repo
To: making it harder for new repos to create them in the first place
