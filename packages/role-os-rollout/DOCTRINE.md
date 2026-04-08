---
name: Role OS Lockdown Doctrine
description: Org-wide standard for taking a Role OS setup from initialized to repo-locked. Reference implementation is CommandUI.
type: protocol
---

# Role OS Lockdown Doctrine

A repo is not locked when it can describe itself. It is locked when it can reject the wrong change.

## The Rollout Question

Ask this in every repo before calling it locked:

> What repo-specific law would generic orchestration miss, and what wrong change must the system be able to reject automatically?

That gets you past shallow initialization.

## Reference Implementation

**CommandUI** — the first repo-locked Role OS setup.

Its missing law was easy to miss and costly to get wrong:
- Terminal validation law (no browser preview, no visual verification)
- Raw play lifecycle law (alternate screen, stdout routing, session ownership)
- Anti-GUI drift law (Console must never become a chat UI, workspace product, or "friendlier" abstraction)

These were not covered by generic Role OS. They had to be written as repo-specific law, defended by a repo-local workflow, and proven by a packet that traced invariants to source lines.

## Org-Wide Lockdown Checklist

For each repo:

### 1. Standard init
```bash
npx role-os init
```
Scaffolds agents, schemas, policies, workflows, context templates.

### 2. Fill all 4 context files with repo-specific truth

| File | Purpose | Quality bar |
|------|---------|-------------|
| `context/product-brief.md` | What this is, thesis, target user, core value, non-goals, **anti-thesis** | Testable statements. Must include what the product must never become. |
| `context/repo-map.md` | Stack, structure, build commands, key files, risky seams, **validation law**, **first-class architecture seams** | A new contributor can copy-paste and orient. Seams documented with invariants and line numbers. |
| `context/brand-rules.md` | Tone, domain language, forbidden metaphors, truth constraints, contamination risks, **interaction law** | Concrete enough to enforce without follow-up questions. |
| `context/current-priorities.md` | Active work, next up, blocked, completed, banned detours, **must-preserve invariants**, **validation law** | Honest about current state. Must-preserve section names what can't be traded away. |

**Authoring model:** Claude drafts from repo truth, history, and drift risks. Human pressure-tests and tightens. Then lock. Claude provides raw structure; human ensures the law is sharp enough to enforce.

### 3. Identify the highest-risk architecture seam

The seam where generic orchestration would cause the most damage if it treated it as implementation detail instead of product law.

Examples:
- CommandUI: raw play lifecycle (terminal passthrough, session ownership, stdout routing)
- A game repo: combat system state machine, save/load integrity
- An MCP server: tool dispatch, capability negotiation, transport lifecycle

### 4. Write one repo-local workflow for that seam

Place in `.claude/workflows/`. Must include:
- **Use when** — specific file paths and behavior changes that trigger this workflow
- **Required chain** — the smallest valid set of roles (not the default generic chain)
- **Required review checks** — concrete checklist items the Critic must verify against evidence
- **Reject criteria** — automatic reject conditions (not guidelines, hard gates)
- **Doctrine references** — links to the specs that govern this seam

### 5. Define explicit reject conditions

A setup is not locked until the system knows how to say no. Reject conditions must appear in:
- The repo-local workflow (automatic reject criteria)
- `current-priorities.md` (must-preserve invariants)
- `product-brief.md` (anti-thesis)
- `brand-rules.md` (forbidden metaphors, truth constraints)

These create overlapping defense. A single violation should be catchable at multiple levels.

### 6. Run one proving packet that traces invariants to source

Create a packet scoped to the highest-risk seam. The packet must:
- Trace every invariant from the repo-local workflow to specific source lines
- Verify routing recommends the correct chain for seam-touching changes
- Describe at least one hypothetical violation and confirm it would be rejected
- Produce a verdict: accept (setup is locked) or reject (gaps remain)

### 7. Only then call it locked

**Locked means:**
- Generic spine is initialized
- All 4 context files filled with repo-specific truth
- Highest-risk seam documented as first-class architecture law
- Repo-local workflow exists with explicit reject conditions
- Proving packet passed with invariants traced to source
- The system can reject the wrong change at multiple independent levels

**Not locked means:**
- Context files are templates or generic descriptions
- Seams are mentioned but not governed
- No repo-local workflow exists
- No reject conditions are defined
- No proving packet has been run

## Ordering: Shipcheck, Lockdown, Treatment

For repos undergoing full treatment, the order is strict:

```
shipcheck → lockdown → treatment
```

- **Shipcheck** asks whether treatment is lawful to begin (hard gates A-D).
- **Lockdown** asks whether Role OS understands the repo well enough to avoid damaging it.
- **Treatment** is the staffed execution pass.

Lockdown is not a replacement for shipcheck. It is the repo-safety layer that sits between gate and action.

For repos not undergoing full treatment, lockdown can happen without shipcheck — lockdown is broader than treatment.

## Initialized Is Not Locked

`roleos init` scaffolds the generic spine. That is step 1, not the finish line.

- **Initialized** = files exist, templates are in place.
- **Locked** = repo truth is filled, seam law is written, reject conditions are enforced, proving packet has passed.

Do not pretend initialized = locked. The rollout is: initialize now, lock slowly, with audit and remediation per repo.

CommandUI is the high-bar reference implementation, not the minimum every repo must hit in one sitting.

## Lock Maintenance

A repo does not stay locked forever just because it was once locked. Re-proving is required when the protected seam materially changes.

**Re-prove when:**
- The seam's key files move
- Lifecycle or state ownership changes
- Validation path changes
- Core invariants change
- The proving packet's source-line anchors go stale
- A major refactor touches the protected seam

Lock is a living status, not a one-time stamp.

## Seam Scope

Start with the highest-risk seam. One seam is the minimum for lock, not the maximum forever.

Some repos will need 2-3 seam workflows. But starting with one forces prioritization and gets the defense layer live faster. Add additional seam workflows only after the first lock is proven.

## The Formula

```
Reference-quality Role OS setup =
  generic spine
  + repo truth
  + seam law
  + proving packet
  + enforced no
```

## Applying to New Repos

When setting up Role OS on a new repo:

1. Initialize and fill context — this is the easy part
2. Ask the rollout question — this is where the real work starts
3. Name the seam that generic orchestration would miss
4. Write the workflow that protects it
5. Define how the system says no
6. Prove it with a packet
7. Lock it

The goal is not comprehensive documentation. The goal is targeted defense of the thing that's most likely to break if generic orchestration runs unsupervised.

## Non-Waste Rule

A repo does not count as successful just because `.claude/` exists. Each repo must leave the process with at least one real, repo-specific asset that improves it:

- A repo-local workflow that can reject the wrong change
- A proving packet that traces real invariants
- An org-level decision promoted from repo truth
- A real bug found and fixed
- Or a named follow-up improvement packet for a truth concern that isn't blocking

Every repo must exit with one of:
- Lock + repo-local workflow + proving packet
- Lock + code fix
- Lock + promoted org decision
- Lock + queued improvement packet tied to a named truth concern
- Full treatment with shipped artifacts

If a repo exits the process without at least one of these, the process failed on that repo.

## No Batch Init

Do not batch-initialize repos. Each repo must be claimed and processed individually through the full classify → context → seam → status cycle. Batching produces rubber-stamped context files with shallow seam identification — exactly the drift the doctrine prevents.
