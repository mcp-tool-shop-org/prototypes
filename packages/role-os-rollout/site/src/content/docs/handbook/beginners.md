---
title: For Beginners
description: New to Role OS Rollout? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What Is This Tool?

Role OS Rollout is a **governance control plane** that tracks the org-wide deployment of [Role OS](https://github.com/mcp-tool-shop-org/role-os) across all repositories in the mcp-tool-shop-org organization.

Think of it as a project management hub, but specifically for deploying Role OS setups to repos. It answers questions like:

- Which repos have been set up with Role OS?
- Which repos still need it?
- What org-wide rules were discovered during the process?
- What code defects were found and fixed along the way?

It contains no runnable code. It is pure operational state: markdown files that track doctrine, decisions, work queues, and per-repo audit results.

The first rollout locked 15 repos, identified 11 seam families, and promoted 21 org-wide decisions. 29% of locked repos required real code repair before their seams could be defended.

## Who Is This For?

- **Org contributors** who need to set up Role OS on a new or existing repo
- **Multi-Claude operators** coordinating parallel lockdown work across repos
- **Anyone reviewing** org-wide decisions about truth governance, seam defense, or reject criteria
- **Auditors** checking which repos have been locked and what defects were found

## Prerequisites

- **GitHub access** to the `mcp-tool-shop-org` organization
- **Basic Git skills** (clone, commit, push, pull requests)
- **Familiarity with Role OS** — read the [Role OS README](https://github.com/mcp-tool-shop-org/role-os) first to understand what it does
- **Understanding of "seam"** — in this context, a seam is the boundary in a codebase where generic orchestration would cause damage if it treated the boundary as an implementation detail rather than product law

No coding is required to use this repo. It is entirely markdown-based. You will need `npx` (included with Node.js) to run `role-os init` on target repos.

## Your First 5 Minutes

### 1. Clone the repo

```bash
gh repo clone mcp-tool-shop-org/role-os-rollout
cd role-os-rollout
```

### 2. Read the current state

Open `WORK-QUEUE.md` to see which repos are currently claimed, completed, or blocked.

### 3. Check the repo index

Open `REPO-INDEX.md` to see every org repo and its classification (full treatment, lock candidate, init only, deferred).

### 4. Read the doctrine

Open `DOCTRINE.md` for the 7-step lockdown checklist. This is the process you follow for every repo.

### 5. Review org decisions

Open `DECISIONS.md` to see the reusable answers that apply across all repos. These were promoted from individual lockdowns during the first rollout.

### 6. Understand the doctrine

Open `ROLLOUT-DOCTRINE-v1.md` for the full operating constitution. This covers all 11 seam families, lock classifications, and the reject-patterns that defend each family.

## Common Mistakes

### 1. Treating "initialized" as "locked"

Running `npx role-os init` scaffolds files, but that is only step 1. A repo is not locked until the context files are filled with repo-specific truth, a seam workflow exists with reject conditions, and a proving packet has passed.

### 2. Batch-initializing repos

The doctrine explicitly forbids batch init. Each repo must be claimed and processed individually. Batching produces shallow context files that defeat the purpose of the rollout.

### 3. Skipping the rollout question

Every repo must answer: *"What repo-specific law would generic orchestration miss, and what wrong change must the system reject automatically?"* If you cannot answer this, the repo is not ready to lock.

### 4. Writing guidelines instead of reject criteria

Reject criteria are hard gates, not suggestions. "Consider terminal validation" is a guideline. "Reject if a change weakens terminal validation law" is a reject criterion. The lockdown requires the latter.

### 5. Forgetting to promote reusable answers

If a lockdown audit surfaces a decision that applies to multiple repos, it must be promoted to `DECISIONS.md`. Do not bury org-wide truths in per-repo artifacts.

### 6. Skipping the proving packet

The proving packet is not optional for lock candidates. It must trace invariants from the workflow to specific source lines, verify routing, and describe at least one hypothetical violation. Without it, you have documentation -- not defense.

## Next Steps

- Read the [Getting Started](/role-os-rollout/handbook/getting-started/) guide for the full step-by-step lockdown process
- Review the [Reference](/role-os-rollout/handbook/reference/) page for seam families, lock classifications, and the complete decision list
- Study the `repos/` directory for examples of completed lockdown artifacts

## Glossary

| Term | Definition |
|------|-----------|
| **Role OS** | A multi-agent orchestration system that scaffolds agents, schemas, policies, workflows, and context templates into a repo's `.claude/` directory. |
| **Lockdown** | The process of taking a repo from initialized to locked — filling context, identifying seams, writing workflows, defining reject criteria, and running a proving packet. |
| **Seam** | A boundary in a codebase where generic orchestration would cause damage if it treated the boundary as implementation detail instead of product law. |
| **Seam family** | A class of truth risk. The first rollout identified 11 families (lifecycle, contract, bootstrap, health/budget, dispatch, binding, evaluator, ephemeral, mutation, discovery, identity). |
| **Proving packet** | An audit artifact that traces invariants from a repo-local workflow to specific source lines, verifies routing, and confirms hypothetical violations would be rejected. |
| **Reject criteria** | Hard gates in a workflow that define when a change must be automatically rejected. Not guidelines — these are enforced rules. |
| **Org decision** | A reusable answer promoted from an individual repo lockdown to `DECISIONS.md`, applicable across multiple repos. |
| **Context files** | The 4 markdown files in `context/` that contain repo-specific truth: product-brief, repo-map, brand-rules, current-priorities. |
| **Lock classification** | How a repo was locked: reference, clean, repair, granularity-gap, or architecture-held. |
| **Full treatment** | The 7-phase repo polish and publish playbook. Requires shipcheck before lockdown before treatment. |
| **Shipcheck** | A 31-item quality gate with hard gates A-D that block release. Must pass before full treatment. |
| **Non-waste rule** | Every repo must exit the process with at least one real asset: a workflow, proving packet, org decision, bug fix, or queued follow-up packet. |
| **Re-lock trigger** | An event that invalidates a previous lock (seam files moved, lifecycle changed, core invariants changed). Requires re-proving. |
| **Rollout question** | The question every repo must answer: "What repo-specific law would generic orchestration miss, and what wrong change must the system reject automatically?" |
