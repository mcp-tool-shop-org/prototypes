# AILOADOUT-001 — Dispatch Truth Lock

**Repo:** @mcptoolshop/ai-loadout v1.4.2
**Seam:** Knowledge dispatch correctness
**Date:** 2026-03-24
**Status:** PASS (clean, 1 truth concern identified → AILOADOUT-002)

## Invariants traced to source

### INV-1: Scoring determinism

- **Tokenizer:** `match.ts:20-28` — lowercase, strip non-alphanum, split whitespace, discard ≤1 char. Pure function, no external state.
- **Score formula:** `match.ts:66-77` — `(matchedKeywords.length / entry.keywords.length) + patternBonus(0.2)`, capped at 1.0.
- **Sort:** `match.ts:117-120` — score descending, then tokens_est ascending. Deterministic tiebreaker.

**Verdict:** PASS. No randomness anywhere in the match pipeline. Same input → same output guaranteed.

### INV-2: MIN_SCORE hard filter

- **Threshold:** `match.ts:17` — `const MIN_SCORE = 0.1`
- **Filter:** `match.ts:97` — `if (score >= MIN_SCORE)` — strict inequality, entries at exactly 0.1 are included
- **No soft zone:** No code path produces "partial" or "weak" matches below 0.1

**Verdict:** PASS. Single constant, single filter point, no configurable override.

### INV-3: Core always included / Manual never auto-included

- **Core:** `match.ts:36-38` — `if (entry.priority === "core") return { score: 1.0 }` — unconditional
- **Manual:** `match.ts:41-43` — `if (entry.priority === "manual") return { score: 0 }` — unconditional
- **Filter interaction:** Manual entries score 0 < MIN_SCORE(0.1), so they never pass the filter at `match.ts:97`

**Verdict:** PASS. Both behaviors are first-checks in scoreEntry(), not edge cases.

### INV-4: Layer order immutability

- **Discovery:** `resolve.ts:93-108` — candidates array constructed in fixed order: global, org (if set), project, session (if set)
- **Merge:** `merge.ts` — iterates layers in discovery order; later entry replaces earlier for same ID

**Verdict:** PASS. Layer order is hardcoded in the candidates array construction, not configurable.

### INV-5: Override transparency

- **Conflict tracking:** `merge.ts` — every override recorded as `{ entryId, layers: string[], resolution: "override" }`
- **Provenance:** `merge.ts` → `runtime.ts` — every merged entry mapped to its source layer
- **Explain:** `resolve.ts:158-191` — explainEntry() returns full definition chain across all layers

**Verdict:** PASS. No override can happen without leaving a trace in conflicts[] and provenance.

### INV-6: Reason string machine-readability

- **Core reason:** `match.ts:104-105` — `"core: always loaded"` (fixed string)
- **Domain reasons:** `match.ts:106-110` — `"keywords [ci, workflow] + patterns [ci_pipeline]"` or `"keywords [ci, workflow]"` or `"patterns [ci_pipeline]"` — explicit, parseable
- **No vague reasons:** No code path produces reasons like "likely relevant" or "good match"

**Verdict:** PASS. Reason strings enumerate the exact keywords and patterns that triggered the match.

### INV-7: Pure-function core

- **match.ts:** No imports from `fs`, `path`, `os`, or `process`. Zero side effects.
- **merge.ts:** Same — pure function taking arrays, returning merged result.
- **validate.ts:** Same — pure validation returning issues array.
- **analysis.ts:** Same — pure analysis functions.
- **I/O boundary:** Only `resolve.ts` (readFileSync, existsSync), `runtime.ts` (delegates to resolve + usage), `usage.ts` (readFileSync + appendFileSync), `cli.ts` (console + process)

**Verdict:** PASS. Clean separation. Core logic testable without filesystem.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Smart matching" — add semantic similarity to scoring

**Hypothetical change:** Add an LLM call or embedding similarity check to scoreEntry() so that entries without keyword overlap but "semantically similar" content can match.

**Why rejected:** Violates reject criteria #2 (weakens deterministic selection rules). The scoring formula is keyword ratio + pattern bonus — that's the contract. Semantic similarity would make dispatch non-deterministic, non-explainable, and dependent on an external service. If you want semantic matching, build a different product.

### LP-2: "Soft threshold" — introduce a "weak match" zone below MIN_SCORE

**Hypothetical change:** Instead of excluding entries below 0.1, return them with a `mode: "suggested"` flag so the agent can consider them.

**Why rejected:** Violates reject criteria #6 (softens hard filter into advisory mush). MIN_SCORE is a contract boundary. Below it means excluded. A "suggested" zone would create ambiguity about what the system actually recommends, confuse consumers about what to load, and gradually erode the threshold's meaning as people start treating suggestions as matches.

### LP-3: "Invisible override" — stop reporting layer conflicts

**Hypothetical change:** Simplify the merge output by removing conflict tracking and provenance, since "most users only have one layer anyway."

**Why rejected:** Violates reject criteria #1 (makes dispatch reasoning less explicit). Conflict tracking is how operators discover that a session overlay is silently replacing a project-level rule. Removing it because most setups don't need it would make the system blind precisely when complexity increases and override truth matters most.

## Design tradeoffs (named, not blocking)

### DT-1: Malformed layers are silently skipped

`resolve.ts:122-125` catches JSON parse errors and marks the layer as not found. This means a malformed layer file is indistinguishable from a genuinely missing layer in the searched[] output.

**Acceptable because:** The alternative (throwing on malformed JSON) would make the system fragile — a typo in one layer file would prevent all dispatch. However, this means an operator with a corrupt index.json won't get a clear error, just silence.

**Truth concern:** This is the one place where the system's observable truth is weakest. A searched layer marked `found: false` might be "missing" or "present but broken," and the operator can't tell which.

### DT-2: Token estimation is a rough heuristic

`tokens.ts` uses chars/4 as a token estimate. This can be significantly off for code-heavy or multilingual payloads.

**Acceptable because:** The system provides `analyzeBudget()` to compare estimated vs observed tokens, and budget.avg_task_load_observed in the index can be updated from usage data. The heuristic is a starting point, not a promise.

### DT-3: No payload freshness checking

ai-loadout matches against declared keywords in the index. It does not check whether the payload files referenced by entries are current, exist, or match their summaries.

**Acceptable because:** This is explicitly outside scope. The system is a router, not a validator. `findDeadEntries()` and usage tracking provide indirect freshness signals. Payload freshness is the consumer's responsibility.

### DT-4: Keyword overlap ambiguity is reported, not resolved

When multiple entries share keywords and both match a task, both appear in results ranked by score. The system does not deduplicate or prefer one over the other.

**Acceptable because:** `findKeywordOverlaps()` exists specifically to surface this. The system's job is to score truthfully, not to pick favorites. Ambiguity resolution belongs to the human maintaining the index.

## Truth concern → AILOADOUT-002

### AILOADOUT-002 — Malformed Layer Signaling (queued)

**Status:** Follow-up improvement packet (not blocking lock)
**Source:** DT-1 from AILOADOUT-001

**Problem:** When a layer file exists but contains invalid JSON, `resolve.ts:122-125` catches the error and marks `found: false`. The operator cannot distinguish "file missing" from "file broken" in the searched[] output.

**Goal:**
- Make malformed layer files distinguishable from missing ones in the resolver output
- Preserve graceful degradation (don't throw on bad JSON)
- Enable operators to detect and fix corrupt index files

**Possible approaches:**
1. Add a `reason` field to SearchedLayer: `"not_found"` | `"malformed"` | `"loaded"`
2. Log a warning to stderr when a layer file exists but fails to parse
3. Add a `malformed: string[]` field to ResolvedLoadout listing paths that existed but failed

**Constraint:** Must not break existing ResolvedLoadout consumers or make missing layers into errors.

## Summary

| Check | Result |
|-------|--------|
| Scoring determinism | PASS |
| MIN_SCORE hard filter | PASS |
| Core/Manual priority rules | PASS |
| Layer order immutability | PASS |
| Override transparency | PASS |
| Reason string machine-readability | PASS |
| Pure-function core | PASS |
| Liar-path LP-1 | Correctly rejected |
| Liar-path LP-2 | Correctly rejected |
| Liar-path LP-3 | Correctly rejected |

**Overall: PASS.** No blocking defects. 4 design tradeoffs documented. DT-1 (malformed layer signaling) promoted to AILOADOUT-002.
