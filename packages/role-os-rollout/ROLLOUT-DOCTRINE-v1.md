# ROLLOUT-DOCTRINE v1

**Role OS Org-Wide Truth Governance**

15 repos locked. 21 org decisions. 11 seam families. 4 repos required code repair before lock.

This document is the operating constitution produced by the first org-wide Role OS rollout. It is organized by seam family — each section describes a class of truth risk, the org decisions that govern it, and the reject-pattern that defends it.

---

## The Rollout Question

> What repo-specific law would generic orchestration miss, and what wrong change must the system be able to reject automatically?

Every lock in this rollout answered that question. The answers fell into 11 seam families.

---

## 1. Lifecycle Truth

**Core liar-path:** A system claims to manage a lifecycle (terminal session, play mode, state transition) while silently allowing drift in ownership, routing, or validation.

**What a lock means:** The system can reject changes that blur lifecycle boundaries, misroute ownership, or weaken terminal/session validation.

**Org decisions:** (None promoted — reference implementation established the pattern)

**Repo example:** commandui — raw play lifecycle, terminal passthrough, session ownership

**Reject-pattern:** Reject if a change weakens terminal validation, blurs session ownership, or allows GUI drift in a terminal-native product.

**What normal shipping misses:** Terminal-native products gradually accumulating browser/UI assumptions that don't match the actual execution context.

---

## 2. Contract Truth

**Core liar-path:** A gate/checker tool reports pass/fail but the exit codes, skip semantics, or failure classification drift from their documented meaning.

**What a lock means:** The system can reject changes that weaken gate semantics, blur exit-code meaning, or soften enforcement into advisory behavior.

**Org decisions:**
- Exit code semantics: 1 = checker failure, 2 = evaluated gate failure (shipcheck)
- Reassurance drift is a reject-worthy change category org-wide (claude-guardian)
- Active truth defects block lock, not just future improvements (claude-session-copilot)

**Repo example:** shipcheck — audit gate exit-code contract, skip semantics, failure classification

**Reject-pattern:** Reject if a change alters exit-code semantics, blurs gate pass/fail, or converts hard failure into advisory without explicit law.

**What normal shipping misses:** "Friendlier" error messages that gradually soften enforcement truth until the gate no longer reliably blocks.

---

## 3. Bootstrap Truth

**Core liar-path:** A scaffold/init tool produces incorrect structures, stale templates, or diverges from its own documented contract over time.

**What a lock means:** The system can reject changes that scaffold stale content, introduce invented local memory, or let CLI and starter-pack drift apart.

**Org decisions:**
- Init --force must protect user content (role-os)
- Nested directory bugs in scaffold tools are blocking defects (role-os)
- Publish patch bumps throughout rollout (org-wide)

**Repo example:** role-os — bootstrap truth, starter-pack/CLI synchronization, double-nested .claude/ bug found and fixed

**Reject-pattern:** Reject if a change scaffolds files the product no longer treats as canonical, or lets CLI and documentation drift apart.

**What normal shipping misses:** Scaffold tools that work on fresh repos but silently produce wrong structures on re-init or upgrade.

---

## 4. Health/Budget Truth

**Core liar-path:** A health/budget system makes operator-facing reassurance stronger while leaving machine-facing semantics unchanged.

**What a lock means:** The system can reject changes that blur health-state meaning, soften guard behavior, or obscure operational truth with comforting language.

**Org decisions:**
- Reassurance drift is a reject-worthy change category (promoted from claude-guardian)

**Repo example:** claude-guardian — health checks + budget-system truth, 9 reject criteria

**Reject-pattern:** Reject if a change makes human-facing reassurance stronger while leaving machine-facing semantics unchanged.

**What normal shipping misses:** Dashboard language that drifts from "warn" to "minor concern" while the underlying signal hasn't changed.

---

## 5. Dispatch Truth

**Core liar-path:** A routing/dispatch system claims the right entry/loadout/translation was selected when it actually fell back, guessed, or used stale assumptions.

**What a lock means:** The system can reject changes that weaken deterministic selection, hide fallback behavior, or imply capabilities beyond what was actually matched.

**Org decisions:**
- Routing is not comprehension (ai-loadout)
- MIN_SCORE is not configurable — single-threshold contract (ai-loadout)

**Repo examples:** polyglot-mcp (translation dispatch), ai-loadout (knowledge dispatch), artifact (Ollama fallback determinism)

**Reject-pattern:** Reject if a change makes dispatch reasoning less explicit, weakens deterministic selection, or blurs primary selection with fallback/degraded selection.

**What normal shipping misses:** "Smart" matching that gradually replaces deterministic scoring with heuristics, making dispatch decisions unexplainable.

---

## 6. Binding Truth

**Core liar-path:** A system claims to be bound to a specific session, hook, or context when the binding is actually stored, inferred, or stale.

**What a lock means:** The system can reject changes that blur bound vs inferred state, hide hook failure, or present stale data as current without signaling.

**Org decisions:**
- Active truth defects block lock (discovered here — "auto-record" language was actively wrong)

**Repo example:** claude-session-copilot — hook binding + session truth. 2 blocking truth fixes shipped: "auto-record" language corrected, staleness signaling added to resume.

**Reject-pattern:** Reject if a change makes binding less explicit, introduces reassurance around uncertain binding, or preserves "working" UX while degrading binding truth.

**What normal shipping misses:** "Auto-record" and "session-aware" language that sounds authoritative but describes best-effort, prompt-dependent behavior.

---

## 7. Evaluator Truth

**Core liar-path:** An evaluator projects confidence when evidence is weak, partial, ambiguous, or near a threshold — making a borderline verdict look the same as a clear one.

**What a lock means:** The system can reject changes that collapse ambiguous findings into clean verdicts, hide threshold proximity, or frame pattern-matching as comprehension.

**Org decisions:**
- Evaluator outputs must degrade explicitly under weak evidence — must not share the same success surface as a clear pass (synthesis)

**Repo example:** synthesis — verdict truthfulness under ambiguity. 3 blocking code fixes: dead code removed, `pass_strength` field added, 7 cascade regression tests added.

**Reject-pattern:** Reject if a change allows missing evidence to masquerade as confidence, collapses ambiguous findings into clean verdicts, or uses score language implying comprehension.

**What normal shipping misses:** Borderline passes that look identical to clear passes in the output, causing consumers to trust weak verdicts.

---

## 8. Ephemeral Truth

**Core liar-path:** Temporary state masquerades as fresh, unique, or authoritative when it is expired, duplicated, replayed, or identity-ambiguous.

**What a lock means:** The system can reject changes that allow expired state to surface, collapse distinct intents via dedupe, or enable resurrection of dead state.

**Org decisions:**
- Ephemeral state must define identity, lifetime, and resurrection semantics explicitly (mcp-aside)

**Repo example:** mcp-aside — ephemeral lifecycle truth. Clean lock — architecture already held. Identity law (priority:text:reason), lifetime law (TTL immutable at write), resurrection law (none — re-push creates new state).

**Reject-pattern:** Reject if a change allows expired state to read as live, makes dedupe collapse distinct intents, or enables replay/resurrection of dead state.

**What normal shipping misses:** TTL and dedupe mechanics that look correct in isolation but allow subtle replay or identity collapse when combined.

---

## 9. Mutation Truth

**Core liar-path:** A write-path system reports "success" when the mutation didn't complete, retried silently, created duplicates, or left orphaned state.

**What a lock means:** The system can reject changes that collapse per-action results, hide retry behavior, introduce false idempotency claims, or frame informational actions as drift resolution.

**Org decisions:**
- Write-path systems must distinguish acceptance, commit, retry, partial failure, rollback, and duplicate suppression explicitly (registry-sync)

**Repo example:** registry-sync — write-path mutation truth. 4 truth concerns (granularity gaps, not verdict lies): orphaned state, no idempotency, 422 retry assumption, failure cause collapse.

**Reject-pattern:** Reject if a change collapses per-action results into aggregate-only output, hides retry behavior, or frames issue creation as drift resolution.

**What normal shipping misses:** "Apply succeeded" language when the mutation created a GitHub issue (human still has to act), or retry that silently double-writes.

---

## 10. Discovery Truth

**Core liar-path:** A crawler/scanner reports discovery results that silently omit failed, filtered, rate-limited, or permission-denied entities — making partial coverage look complete.

**What a lock means:** The system can reject changes that hide truncation, collapse absence causes, serve cached data as fresh, or let failed entities be silently absent from results.

**Org decisions:**
- Discovery systems must distinguish absent, excluded, failed, unreachable, partial, and stale explicitly (repo-crawler-mcp)

**Repo example:** repo-crawler-mcp — crawl/discovery truth. 3 blocking fixes shipped: cacheNote on results, discovery.limitReached + matchingReposInLimit, discovery.failedRepos array.

**Reject-pattern:** Reject if a change makes "no results" share surface with "crawl failed," makes stale data read as current, or makes counts imply completeness when only a subset was visited.

**What normal shipping misses:** "Found 30 repos" when the org has 10,000 (limit=30), or cached data served with current timestamps.

---

## 11. Identity Truth

**Core liar-path:** Draft, variant, derived, stale, or wrong-context identity assets share the same surface as canonical assets — causing misbound identity to look official.

**What a lock means:** The system can reject changes that put non-canonical assets in canonical locations, generate references to non-existent assets, or weaken manifest integrity verification.

**Org decisions:**
- Brand systems must distinguish canonical, approved variant, derived export, draft, and deprecated assets explicitly (brand)

**Repo example:** brand — identity truth. Clean lock — SHA-256 manifest, CI verification, PR-based sync already defend canonical identity. 2 bounded concerns: migrate 404 URLs, audit not in CI.

**Reject-pattern:** Reject if a change makes canonical and derived share naming, makes preview/export storable as official, or lets stale assets read as current.

**What normal shipping misses:** Logo pipelines that quietly serve the wrong variant because naming conventions drifted, or generated exports committed alongside source assets.

---

## Rollout-Wide Findings

### Lock classification

| Class | Count | Repos |
|-------|-------|-------|
| **Reference lock** | 1 | commandui |
| **Clean lock** | 6 | claude-guardian, polyglot-mcp, site-theme, artifact, ai-loadout, mcp-aside |
| **Repair lock** | 4 | role-os, claude-session-copilot, synthesis, repo-crawler-mcp |
| **Granularity-gap lock** | 2 | multi-claude, registry-sync |
| **Architecture-held lock** | 2 | mcp-aside, brand |

**29% of locks required real code repair before the seam could be defended.** That proves the process catches defects that normal shipping would have let through.

### Follow-up packet taxonomy

| Packet | Repo | Priority | Type |
|--------|------|----------|------|
| ARTIFACT-002 | artifact | Low | Curator correction signaling |
| AILOADOUT-002 | ai-loadout | Low | Malformed layer signaling |
| COPILOT-002 | claude-session-copilot | Medium | Stronger hook capture truth |
| COPILOT-003 | claude-session-copilot | Medium | Deeper resume freshness |
| SYNTHESIS-002 | synthesis | Medium | Deeper confidence signaling |
| REGSYNC-002 | registry-sync | High | Orphaned state visibility |
| REGSYNC-003 | registry-sync | High | Idempotency checks |
| REGSYNC-004 | registry-sync | Medium | Failure classification |
| CRAWLER-005 | repo-crawler-mcp | Medium | Tier 1/2 permission model |
| BRAND-002 | brand | Medium | Migrate existence validation |
| BRAND-003 | brand | High | Audit in CI |

### What this rollout proved

1. **Truth governance works at org scale.** 15 repos, 11 seam families, 21 decisions — each lock either confirmed architecture or forced repair.

2. **The process catches real defects.** Dead code in decision logic (synthesis), "auto-record" lies (claude-session-copilot), discovery truncation presented as complete (repo-crawler-mcp), double-nested scaffolding (role-os).

3. **Doctrine compounds.** Later locks benefited from earlier decisions: reassurance drift rule (from claude-guardian), active truth defects block lock (from claude-session-copilot), evaluator degradation (from synthesis).

4. **One repo at a time is the right pace.** Batch init was attempted and reverted. Quality of setup over throughput.

5. **The non-waste rule works.** Every repo left stronger: workflow + proving packet + decisions + follow-up packets. No ceremony without output.

### The one-line doctrine

**A repo is not locked when it can describe itself. It is locked when it can reject the wrong change.**

---

*Generated from the first org-wide Role OS rollout, 2026-03-24. 15 repos. 21 decisions. 11 seam families.*
