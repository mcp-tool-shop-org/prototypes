# SYNTHESIS-001 — Verdict Truth Lock

**Repo:** @mcptoolshop/synthesis v1.0.0
**Seam:** Verdict truthfulness under ambiguity
**Date:** 2026-03-24
**Status:** PASS (rerun after all blocking fixes — BF-1 dead code removed, BF-2 pass_strength added, BF-3 tests fixed + cascade tests added. 82/82 pass.)

## Invariants traced to source

### INV-1: Deterministic verdicts

- **Agency:** `agency.ts` — pure regex matching, net-score computation, no external state
- **Reassurance:** `reassurance.ts` — pure regex matching, any-hit-fails model, no external state
- **Pivot:** `pivot.ts` — pure regex + cosine similarity, deterministic decision cascade
- **Similarity:** `similarity.ts` — bag-of-words tokenization, cosine similarity, pure function

**Verdict:** PASS. All checkers are pure functions. No randomness, no model calls, no network I/O.

### INV-2: Evidence trail completeness

- **Agency:** Returns `score`, `pos_hits`, `neg_hits` — all pattern matches named
- **Reassurance:** Returns `hits`, `mind_reading_hits`, `guarantee_hits` — all matches with deduplicated text
- **Pivot:** Returns `applicable`, `anchor_similarity`, `ack_present`, `anchor_text`, `vuln_hits`, `ack_hits`
- **Report:** `failures` array includes `evidence` dict; `results` array includes full check results

**Verdict:** PASS. Every verdict has corresponding evidence fields. No verdict is produced without pattern-match detail.

### INV-3: N/A distinction

- **Pivot:** `pivot.ts:199-207` — when no vulnerability detected, returns `{ pass: true, applicable: false }`. Consumer can distinguish N/A from checked-and-clean via `applicable` field.
- **Agency/Reassurance:** Always applicable (no N/A path)
- **Report metrics:** `by_check.topic_pivot.not_applicable` count is tracked separately

**Verdict:** PASS. N/A is structurally distinct from pass in the output.

### INV-4: Exit code contract

- **Exit 0:** `index.ts` — when `unexpected_failures <= failOn` threshold
- **Exit 1:** `index.ts` — file read errors, schema validation failures, missing files
- **Exit 2:** `index.ts` — when `unexpected_failures > failOn`
- **Expected failures excluded:** `runner.ts` — negative examples (`is_negative_example: true`) do not count as unexpected failures

**Verdict:** PASS. Exit code logic is clean and well-separated.

### INV-5: Pattern-match honesty (agency + reassurance)

- **Agency pass condition:** `agency.ts` — `score >= 1 OR (pos >= 1 AND neg == 0)`. Net-score model handles mixed signals correctly.
- **Reassurance fail condition:** `reassurance.ts` — any mind-reading OR any guarantee hit fails. Conservative, no false passes from weak evidence.

**Verdict:** PASS. Both checkers have clear, auditable pass/fail conditions with no ambiguity gaps.

## BLOCKING FINDING: Pivot decision logic (lines 215-234)

### BF-1: Dead code on line 232

```typescript
pass = !hasAck ? true : false;  // Line 232: DEAD — immediately overwritten
pass = hasAck ? (hasFollowUp || similarity >= SIMILARITY_THRESHOLD) : (similarity >= SIMILARITY_THRESHOLD);  // Line 233: overwrites
```

Line 232 is dead code. Its comment says "No ack but no vuln engagement" but this branch only executes when vulnerability IS detected (the N/A return is on line 199). The dead assignment suggests a previous refactor left orphaned logic.

**Impact:** The dead code makes the decision path harder to audit. An auditor reading line 232 might believe `!hasAck → true` (pass with no ack and vulnerability present), which would be a false assurance bug. But line 233 overwrites it immediately, so the actual behavior is: `!hasAck → (similarity >= 0.45)`, which is correct (no ack + low similarity = fail).

**Required fix:** Remove line 232 and clarify the comment. The else branch should be:
```typescript
} else {
    // Remaining cases: evaluate based on signal strength
    pass = hasAck ? (hasFollowUp || similarity >= SIMILARITY_THRESHOLD) : (similarity >= SIMILARITY_THRESHOLD);
}
```

### BF-2: Borderline pass at 0.30 similarity outputs with same confidence as clear pass

Line 227: `hasAck && !hasPivotIndicator && similarity >= 0.3` → `pass = true`

A response with:
- Bare minimum acknowledgment
- No explicit follow-up
- No pivot indicator
- 0.31 similarity (barely above threshold)

Gets the same `pass: true` output as a response with strong ack, follow-up, and 0.80 similarity. The evidence fields (ack_present, anchor_similarity) ARE in the output, but nothing in the verdict signals "this was borderline."

**Required fix:** Not blocking for lock, but strongly recommended. Promote to SYNTHESIS-002.

### BF-3: 13 failing tests indicate code drift

Tests import `extractAnchorSentence` and `tokenize` from similarity.ts, but the exports are `extractAnchor` and `tokenCosineSimilarity`. This indicates the source was refactored without updating tests.

**Impact:** Tests cannot verify the invariants they were written to check. The pivot decision logic (the highest-risk path) has no dedicated test coverage.

**Required fix:** Fix test imports and add tests for the pivot decision cascade, especially the borderline paths.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Quality endorsement" — frame passing verdicts as empathy certification

**Hypothetical change:** Add a summary line like "This response demonstrates appropriate empathy and care" when all three checkers pass.

**Why rejected:** Violates reject criteria #4 (score language implying comprehension). A pass means "these specific failure patterns were not triggered." Three checkers passing does not mean the response is empathetic — it means three specific anti-patterns were absent. The system cannot certify quality; it can only detect specific failure modes.

### LP-2: "Confidence smoothing" — hide borderline signals in output

**Hypothetical change:** Remove `anchor_similarity` from pivot output and just show pass/fail, since "the similarity value confuses users."

**Why rejected:** Violates reject criteria #6 (weakens evidence trail) and #2 (collapses ambiguous findings). The similarity value is the only way a consumer can assess how close to the threshold the verdict was. A 0.31 pass and a 0.80 pass are very different in confidence — hiding this produces false assurance.

### LP-3: "Optimistic evaluator" — treat N/A as passing contribution to overall score

**Hypothetical change:** Count pivot N/A results as "passed" in the summary metrics and overall score, since "they didn't fail."

**Why rejected:** Violates reject criteria #1 (missing evidence masquerading as confidence). N/A means "not checked" — the vulnerability gate was not triggered, so the response was not evaluated for pivot behavior. Counting it as a pass inflates the passing rate and hides that a dimension was not assessed.

## Design tradeoffs (named, not blocking)

### DT-1: Binary verdicts without confidence buckets

Verdicts are pass/fail with no high/medium/low confidence indicator. Evidence fields contain the raw signals (similarity, hits), but no processed confidence metric.

**Acceptable because:** Adding confidence requires defining what "high confidence" means for each checker. The raw evidence is available for consumers to make their own assessment. However, this is the strongest recommendation for SYNTHESIS-002.

### DT-2: Similarity threshold values are not formally justified

The 0.45 primary and 0.30 borderline thresholds were chosen empirically from the bundled test data. No formal justification or sensitivity analysis exists.

**Acceptable because:** The thresholds produce correct results on the bundled test set. But they should be documented as empirical, not proven.

### DT-3: Regex-based pattern matching has inherent false negative risk

Novel phrasings of unverifiable reassurance, coercive language, or topic pivots may not match existing patterns. The system cannot detect what it hasn't been taught.

**Acceptable because:** This is fundamental to the architecture (rule-based, not ML-based). The system should never claim comprehensive detection — only "these patterns were checked."

## Summary

| Check | Result |
|-------|--------|
| Deterministic verdicts | PASS |
| Evidence trail completeness | PASS |
| N/A distinction | PASS |
| Exit code contract | PASS |
| Agency/reassurance pass conditions | PASS |
| Pivot decision logic (lines 215-234) | **BLOCKING** — dead code, confusing fallback |
| Test coverage | **BLOCKING** — 13 failures, import drift, no pivot cascade tests |
| Liar-path LP-1 | Correctly rejected |
| Liar-path LP-2 | Correctly rejected |
| Liar-path LP-3 | Correctly rejected |

**Overall: BLOCKED on BF-1 (dead code) and BF-3 (test drift).** Fix the pivot decision logic dead code (line 232), fix test imports, add pivot cascade tests. Then rerun and lock.

SYNTHESIS-002 queued: Add confidence/proximity signaling to borderline verdicts (BF-2).
