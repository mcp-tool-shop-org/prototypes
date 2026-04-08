# Role OS Rollout

Private org-wide rollout control plane for [Role OS](https://github.com/mcp-tool-shop-org/role-os).

Product source lives in [`role-os`](https://github.com/mcp-tool-shop-org/role-os). This repo is operational state only -- it contains no runnable code, CLI source, or npm packages. It holds governance state: doctrine, decisions, repo classifications, work queues, and per-repo audit artifacts.

**Handbook:** [mcp-tool-shop-org.github.io/role-os-rollout](https://mcp-tool-shop-org.github.io/role-os-rollout/)

## Rollout results (v1)

The first org-wide rollout produced:

| Metric | Value |
|--------|-------|
| Repos locked | 15 |
| Seam families identified | 11 |
| Org decisions promoted | 21 |
| Repos requiring code repair | 4 (29%) |
| Patch bumps published during lockdown | 5 |
| Follow-up packets queued | 11 |

29% of locks required real code repair before the seam could be defended. The operating constitution is documented in `ROLLOUT-DOCTRINE-v1.md`.

## What lives here

| File | Purpose |
|------|---------|
| `DOCTRINE.md` | Rollout law and the 7-step lockdown checklist |
| `ROLLOUT-DOCTRINE-v1.md` | Operating constitution: 11 seam families, org decisions, lock classifications |
| `DECISIONS.md` | Org-wide reusable answers promoted from repo lockdowns |
| `WORK-QUEUE.md` | Current claims, completed locks, next repos |
| `REPO-INDEX.md` | Every org repo classified and tracked |
| `QA.md` | Shared question/answer ledger for multi-Claude coordination |
| `TRANSITION.md` | Post-rollout governance transition plan |
| `repos/<repo>/` | Per-repo audit drafts, questions, lock packets, status |

## What does not live here

- Role OS product source (lives in [`role-os`](https://github.com/mcp-tool-shop-org/role-os))
- Starter-pack source or CLI code
- Release docs or npm packages
- Anything that belongs to package shipping

## The rollout question

Every repo must answer before lock:

> What repo-specific law would generic orchestration miss, and what wrong change must the system be able to reject automatically?

## Operating rules

- One repo claimed at a time -- no batch init
- Every reusable answer lands in `DECISIONS.md`
- Initialized is not locked (context + seam law + proving packet = locked)
- Shipcheck before lockdown before treatment (for full-treatment repos)
- Publish patch bumps immediately when lockdown audits find code fixes
