---
title: Getting Started
description: How to use the rollout control plane to lock a repo with Role OS.
sidebar:
  order: 1
---

This guide walks you through using the rollout control plane to take a repo from unstarted to locked.

## Prerequisites

- Access to the `mcp-tool-shop-org` GitHub organization
- [Role OS](https://github.com/mcp-tool-shop-org/role-os) installed (`npm install -g role-os` or use `npx`)
- Familiarity with the repo you are locking

## Step 1: Claim a Repo

Open `WORK-QUEUE.md` in this repo. Find an unclaimed repo and mark it claimed with your name and date.

**Rules:**
- One repo claimed at a time (no batch init)
- Every reusable answer lands in `DECISIONS.md`
- Initialized is not locked

## Step 2: Classify the Repo

Check `REPO-INDEX.md` for the repo's classification:

| Classification | What to do |
|---------------|------------|
| **full treatment** | Shipcheck first, then lockdown, then treatment (strict order) |
| **lock candidate** | Full lockdown with proving packet (shipcheck not required) |
| **init only** | Standard init + context fill, no seam law needed yet |
| **deferred** | Not in rollout scope (archived, stale, or test fork) |

For full-treatment repos, the ordering is non-negotiable: `shipcheck -> lockdown -> treatment`. See the [Reference](/role-os-rollout/handbook/reference/) page for lock classification details.

## Step 3: Initialize

Run from the target repo's root directory:

```bash
npx role-os init
```

This scaffolds agents, schemas, policies, workflows, and context templates into the target repo's `.claude/` directory.

**Important:** This is step 1, not the finish line. A repo with scaffolded files is "initialized," not "locked." See the [Beginners](/role-os-rollout/handbook/beginners/) page for the distinction.

## Step 4: Fill Context Files

Fill all 4 context files with repo-specific truth:

| File | Purpose |
|------|---------|
| `context/product-brief.md` | What this is, thesis, anti-thesis, non-goals |
| `context/repo-map.md` | Stack, structure, key files, risky seams |
| `context/brand-rules.md` | Tone, domain language, forbidden metaphors |
| `context/current-priorities.md` | Active work, blocked items, must-preserve invariants |

**Authoring model:** Claude drafts from repo truth. Human pressure-tests and tightens. Then lock.

## Step 5: Identify the Highest-Risk Seam

Ask: *Where would generic orchestration cause the most damage if it treated this as implementation detail instead of product law?*

Examples from the rollout:
- **CommandUI:** raw play lifecycle (terminal passthrough, session ownership)
- **Shipcheck:** exit-code contract (checker failure vs gate failure)
- **Brand:** identity truth (canonical vs derived assets)

## Step 6: Write a Repo-Local Workflow

Place in `.claude/workflows/`. Must include:
- **Use when** — specific file paths and behavior changes that trigger it
- **Required chain** — the smallest valid set of roles
- **Required review checks** — concrete checklist items
- **Reject criteria** — automatic reject conditions (hard gates, not guidelines)
- **Doctrine references** — links to the specs that govern the seam

## Step 7: Run a Proving Packet

The packet must:
1. Trace every invariant from the workflow to specific source lines
2. Verify routing recommends the correct chain for seam-touching changes
3. Describe at least one hypothetical violation and confirm it would be rejected
4. Produce a verdict: accept (locked) or reject (gaps remain)

## Step 8: Record Results

- Update the repo's status in `REPO-INDEX.md`
- Move the repo from current to completed in `WORK-QUEUE.md`
- Promote any reusable answers to `DECISIONS.md`
- Store the per-repo artifacts in `repos/<repo-name>/`

## Ordering for Full-Treatment Repos

The order is strict:

```
shipcheck -> lockdown -> treatment
```

- **Shipcheck** validates treatment is lawful (hard gates A-D)
- **Lockdown** validates Role OS understands the repo enough to avoid damage
- **Treatment** is the staffed execution pass (7-phase polish + publish)
