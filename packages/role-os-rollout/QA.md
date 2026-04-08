# Role OS Rollout — Shared QA Ledger

Questions and answers that affect multiple repos. Any Claude working on rollout must read this before starting a repo.

---

## Q: When does a repo need re-proving after lockdown?

**Asked:** 2026-03-24 (doctrine review)
**Answered:** 2026-03-24

Re-prove when:
- The seam's key files move
- Lifecycle or state ownership changes
- Validation path changes
- Core invariants change
- The proving packet's source-line anchors go stale
- A major refactor touches the protected seam

Lock is a living status, not a one-time stamp.

---

## Q: Can two Claudes work on the same repo simultaneously?

**Asked:** 2026-03-24 (rollout planning)
**Answered:** 2026-03-24

No, unless phases are explicitly split and non-overlapping. One Claude claims one repo at a time. Claim goes in WORK-QUEUE.md.

---

## Q: What if a rollout question affects a repo I'm not working on?

**Asked:** 2026-03-24 (rollout planning)
**Answered:** 2026-03-24

Write it to org QA.md (this file). Do not improvise past a seam-law question. Wait for a human answer if the question is judgment-dependent.
