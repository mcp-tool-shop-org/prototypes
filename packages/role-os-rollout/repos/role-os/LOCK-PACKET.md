# ROLEOS-001 — Bootstrap Truth Lock

**Packet type:** lockdown proving packet
**Repo:** role-os
**Seam:** Bootstrap truth and contract drift
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, 4 decisions locked, 3 code fixes implemented

---

## Objective

Prove that the Role OS setup for role-os itself can reject changes that would cause the bootstrap tool to scaffold stale structures, drift from its own documentation, or invent state outside the filesystem.

## Invariants under test

### INV-1: Init scaffolds only canonical structures

**Claim:** `roleos init` copies the starter-pack directory tree to `.claude/` without modification. It does not interpolate, inject, or customize.

**Source:** `src/init.mjs:14-21`
```javascript
const result = copyDirSafe(STARTER_PACK_DIR, path.join(CWD, ".claude"));
```

And `src/fs-utils.mjs:7-30` (`copyDirSafe`): recursive copy that skips existing files via `existsSync()` check.

**Evidence:** Init calls `copyDirSafe()` which iterates the starter-pack directory and copies each file to `.claude/`. The only transformation is path mapping (starter-pack → .claude). No placeholders are filled. No content is modified.

**Test coverage:** `test/cli.test.mjs` — "init scaffolds .claude/ with all spine files" and "init skips existing files on re-run."

**Reject defense:**
- `protect-bootstrap-truth.md` criterion #1 (scaffolds files product no longer treats as canonical)
- `protect-bootstrap-truth.md` criterion #8 (overrides init idempotence)
- `current-priorities.md` invariant #7 (init idempotence)
- `current-priorities.md` invariant #8 (starter-pack = bootstrap truth)

### INV-2: Starter-pack matches README role table

**Claim:** The 32 agent files in `starter-pack/agents/` correspond exactly to the 32 roles listed in the README role table.

**Verification method:**
```bash
find starter-pack/agents -name "*.md" | wc -l
# Expected: 32 (one file = one role, across 8 subdirectories)
```

**README table (8 packs, 32 roles):**
- Core (3): Orchestrator, Product Strategist, Critic Reviewer
- Engineering (7): Frontend Developer, Backend Engineer, Test Engineer, Refactor Engineer, Performance Engineer, Dependency Auditor, Security Reviewer
- Design (2): UI Designer, Brand Guardian
- Marketing (1): Launch Copywriter
- Treatment (7): Repo Researcher, Repo Translator, Docs Architect, Metadata Curator, Coverage Auditor, Deployment Verifier, Release Engineer
- Product (4): Feedback Synthesizer, Roadmap Prioritizer, Spec Writer, Information Architect
- Research (4): UX Researcher, Competitive Analyst, Trend Researcher, User Interview Synthesizer
- Growth (4): Launch Strategist, Content Strategist, Community Manager, Support Triage Lead

**Cross-reference verified against:**
- `starter-pack/policy/routing-rules.md` — all 32 roles documented
- `starter-pack/policy/tool-permissions.md` — all 32 roles have May/Must-not blocks

**Reject defense:**
- `protect-bootstrap-truth.md` criterion #4 (expands role surface without synchronized coverage)
- `protect-bootstrap-truth.md` criterion #5 (changes starter-pack without matching README)
- `brand-rules.md` truth constraint #1 (role count must be exact)

### INV-3: Route/review/status operate on filesystem truth only

**Claim:** No CLI command invents state not backed by filesystem files.

**Source audit (all 7 src files):**
- `fs-utils.mjs` — synchronous fs operations, no caching
- `init.mjs` — copies files, no memory
- `packet.mjs` — prompts user, writes to disk, no memory
- `prompts.mjs` — readline interface, no persistent state across runs
- `route.mjs` — reads packet file, scores keywords, reads referenced files, no cache
- `review.mjs` — prompts user, writes verdict file, no memory
- `status.mjs` — reads all packets/verdicts from disk, computes status fresh each run, no cache

**Evidence:** Grep for `cache`, `store`, `global`, `session`, `persist`, `save` across all src files returns zero state-inventing patterns. The only global is the readline instance in `prompts.mjs` (closed after use).

**Reject defense:**
- `protect-bootstrap-truth.md` criterion #2 (reintroduces invented local memory)
- `protect-bootstrap-truth.md` criterion #3 (weakens truthfulness)
- `product-brief.md` anti-thesis #5 (no state outside filesystem)
- `current-priorities.md` invariant #6 (filesystem-only state)

### INV-4: No duplicate memory abstraction

**Claim:** Role OS does not store repo facts, decisions, or treatment history. It integrates with Claude project memory without duplicating it.

**Source:** `starter-pack/handbook.md` — "Claude project memory is the canonical continuity layer. Role OS integrates with it, does not duplicate it."

**Evidence:**
- No files in src/ reference `memory/` paths
- No files in starter-pack/ store repo-specific facts (all are templates or contracts)
- Full treatment workflow references `memory/full-treatment.md` as canonical — it does not inline or rewrite it
- Done definition references contamination detection — it does not maintain a contamination database

**Reject defense:**
- `protect-bootstrap-truth.md` criterion #2 (invented local memory)
- `product-brief.md` anti-thesis #1 (never a memory layer)
- `current-priorities.md` invariant #10 (no canonical memory duplication)

### INV-5: CLI enums are synchronized across all surfaces

**Claim:** Hardcoded enums in CLI code match their documentation and usage across all surfaces.

**Enum inventory:**

| Enum | Location | Values | Verified against |
|------|----------|--------|-----------------|
| TYPES | `src/packet.mjs` | feature, integration, identity | `src/route.mjs:CHAINS`, example packets, handbook |
| VERDICTS | `src/review.mjs` | accept, accept-with-notes, reject, blocked | `schemas/review-verdict.md`, `bin/roleos.mjs` help text |
| CHAINS | `src/route.mjs` | 3 chains (one per type) | `src/packet.mjs:TYPICAL_CHAINS`, routing-rules |
| ROLE_KEYWORDS | `src/route.mjs` | 6 roles scored | routing-rules (comprehensive), README (disclosed) |
| Context files | `src/status.mjs` | 4 files | starter-pack/context/ (4 templates) |
| Spine files | `src/status.mjs` | 5 key files | starter-pack (all present) |

**Known drift:** `bin/roleos.mjs:VERSION` is hardcoded `1.0.0` but `package.json` says `1.0.1`. Minor but flagged.

**Reject defense:**
- `protect-bootstrap-truth.md` criterion #7 (alters enums without synchronized updates)
- `protect-bootstrap-truth.md` criterion #6 (CLI and starter-pack drift)
- `brand-rules.md` truth constraint #1-5 (all counts and enums must be exact)

## Hypothetical violations

### Violation A: "New role without sync"

**Scenario:** A PR adds `starter-pack/agents/engineering/api-gateway-engineer.md` (33rd role) without updating routing-rules, tool-permissions, README, or handbook.

**Would this be rejected?**
- `protect-bootstrap-truth.md` criterion #4: YES — expands role surface without synchronized coverage
- `protect-bootstrap-truth.md` criterion #5: YES — changes starter-pack without matching README
- `brand-rules.md` truth constraint #1: YES — role count no longer exact
- INV-2 broken: starter-pack has 33 files, README says 32

**Verdict:** Rejected at 4 independent levels.

### Violation B: "Local memory cache"

**Scenario:** A PR adds a `.claude/.role-os-cache.json` file that stores routing decisions to speed up subsequent `roleos route` calls.

**Would this be rejected?**
- `protect-bootstrap-truth.md` criterion #2: YES — invented local memory
- `protect-bootstrap-truth.md` criterion #3: YES — weakens truthfulness (cached routing may be stale)
- `product-brief.md` anti-thesis #5: YES — state outside filesystem truth
- `current-priorities.md` invariant #6: YES — filesystem-only state violated
- INV-3 broken: route now reads from cache, not fresh from packet

**Verdict:** Rejected at 5 independent levels.

### Violation C: "Stale workflow in starter-pack"

**Scenario:** The full-treatment protocol changes in `memory/full-treatment.md` but `starter-pack/.claude/workflows/full-treatment.md` is not updated. Init scaffolds the old version.

**Would this be rejected?**
- `protect-bootstrap-truth.md` criterion #1: YES — scaffolds files product no longer treats as canonical
- `product-brief.md` anti-thesis #4: YES — scaffolds stale truth
- `current-priorities.md` invariant #8: YES — starter-pack must reflect current product truth
- INV-1 weakened: init scaffolds canonical structure, but that structure is stale

**Verdict:** Rejected at 4 independent levels.

## Resolved questions (human decisions 2026-03-24)

### Q1: Version drift
**Decision:** Read from package.json at runtime. Hardcoded VERSION removed.
**Implementation:** Done. `bin/roleos.mjs` reads package.json. Regression test: `--version` must match package metadata.

### Q2: Route coverage disclosure
**Decision:** No default disclosure. Route stays focused on type + chain + dependencies. May add to `--verbose` later.

### Q3: Init update path
**Decision:** Add explicit `--force` flag. Overwrites canonical files, always protects `context/`. Reports exactly what it overwrites.
**Implementation:** Done. `src/init.mjs` supports `--force`. `src/fs-utils.mjs:copyDirSafe()` supports `protectedPaths`. Regression test: context files survive `--force`.

### Q4: Double-nested .claude/ (BLOCKING)
**Decision:** Bug. `starter-pack/.claude/workflows/full-treatment.md` moved to `starter-pack/workflows/full-treatment.md`.
**Implementation:** Done. Regression tests: init must not create `.claude/.claude/`, full-treatment.md must land in `workflows/`.
**Remediation:** commandui (659007d) and shipcheck (58c0bd1) both remediated and pushed.

## Rerun results

All 5 invariants re-verified after fixes:

- **INV-1 (init scaffolds canonical):** Now correct. No `.claude/` nesting in starter-pack. `copyDirSafe()` supports `--force` with protected paths. 22/22 tests pass.
- **INV-2 (starter-pack matches README):** Unchanged. 32 roles, 8 packs, all synchronized.
- **INV-3 (filesystem-only state):** Unchanged. No caching, no memory, no globals.
- **INV-4 (no memory duplication):** Unchanged. Role OS reads memory, never creates parallel systems.
- **INV-5 (enums synchronized):** VERSION now reads from package.json (single source of truth). Regression test enforces sync. Other enums unchanged.

All 3 hypothetical violations still rejected at 4-5 independent levels each.

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source. 3 hypothetical violations proven rejectable. 4 questions resolved (1 blocking bug fixed with remediation). 3 code fixes implemented with 4 regression tests. 22/22 tests pass.

Lockdown status: **locked**.
