# synthesis — Questions

## Answered during lockdown

### Q1: When evidence is partial, stale, conflicting, or structurally weak, does the evaluator degrade honestly or project confidence it has not earned?

**Answer:** Partially. The agency and reassurance checkers degrade honestly (net-score and any-hit models are clear). The pivot checker does NOT degrade honestly in the borderline range — a 0.31 similarity pass looks identical to a 0.80 similarity pass in the output verdict. Evidence fields contain the raw signals but nothing flags borderline proximity.

### Q2: Is line 232 of pivot.ts a logic bug or just dead code?

**Answer:** Dead code. Line 232 assigns `pass` but line 233 immediately overwrites it. The actual behavior of line 233 is correct (`!hasAck → similarity >= 0.45`). But the dead line's comment is wrong and the double-assignment makes auditing the decision path unreliable. Must be removed.

### Q3: Why are 13 tests failing?

**Answer:** Test files import functions (`extractAnchorSentence`, `tokenize`) that were renamed during a refactor to (`extractAnchor`, `tokenCosineSimilarity`). The test code was not updated. This means the pivot decision cascade — the highest-risk path — has no verified test coverage.
