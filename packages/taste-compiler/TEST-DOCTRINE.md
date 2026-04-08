# Taste Compiler — Test Doctrine

## Principle

Behavioral fixtures are canonical. Coverage numbers are informative but secondary. The test suite must prove the product thesis: that a Taste Pack catches drift that matters, stays quiet on compliant code, and preserves its contract across changes.

## Fixture Categories

### 1. Violation fixtures (must fire)

Every evaluator must have at least one fixture per rule ID that demonstrates a clear violation.

| Evaluator | Rule IDs | Min fixtures |
|-----------|----------|-------------|
| token-checker | TOK-001, TOK-002, TOK-003 | 3 |
| grammar-checker | GRAM-001, GRAM-002, GRAM-003, GRAM-006 | 4 |
| law-checker | LAW-001, LAW-002, LAW-003, LAW-004 | 4 |
| copy-checker | COPY-001, COPY-002, COPY-003, COPY-004 | 4 |
| budget-checker | BUD-001, BUD-002, BUD-003, BUD-004 | 4 |
| forbidden-checker | FP-001, FP-002, FP-003 | 3 |

### 2. Quiet fixtures (must not fire)

Every evaluator must have at least one clean fixture that proves the checker stays silent on compliant input. False positives erode trust faster than missed violations.

### 3. Regression fixtures (locked from real catches)

Every real-world catch from a pilot trial that is materially important must become a locked regression test. This is the most important category — it turns empirical proof into permanent coverage.

**Process:**
1. Trial produces a meaningful violation catch
2. Reduce the catch to a minimal fixture (file, line, snippet, expected rule ID)
3. Add to the evaluator's test file with a comment linking to the trial report
4. This fixture must never be removed without explicit justification

### 4. Edge-case fixtures

Extraction edge cases that have caused (or could cause) false positives or missed violations:

- Partial extraction (incomplete JSX tree, missing imports)
- Grouped violations (CR-1: consecutive same-file violations → 1 finding)
- Severity propagation (pack law with `warn` vs `error`)
- Pack-aware activation (law not in pack → checker stays quiet)
- Empty extraction (no styles/components/interactions → 0 violations, not crash)

## Coverage Policy

### Behavioral coverage (primary)

Every rule ID has at least one fire-test and one quiet-test. This is the promotion gate.

### Line/branch coverage (informative)

Report in CI. Do not gate releases on a percentage. A 90% coverage number that misses a golden-flow regression is worse than 70% coverage with all regression fixtures locked.

### What to measure

- Rule ID coverage: every rule ID in `BUILTIN_RULES` has at least one test
- Evaluator-level quiet tests: every evaluator has at least one clean-pass test
- Regression fixture count: should grow with every trial round
- Integration test: `runChecks()` exercises all 6 evaluators in one pass

## Regression Fixture Backlog

Trial catches that should become locked regression fixtures:

| Trial | Catch | Rule | Status |
|-------|-------|------|--------|
| GlyphStudio #1 | Dashboard creep (stat grid in export surface) | FP-002 | Needs fixture |
| CommandUI #2 | Dual confirmation button (2 primary actions) | BUD-002 | Needs fixture |
| World Forge #3 | styles.ts bypass (inline CSSProperties) | FP-001 | Needs fixture |
| CommandUI #4 | Autonomy overclaiming ("I'll retry...") | COPY-001/004 | Needs fixture |
| GlyphStudio #5 | Personality injection in tooltips | COPY-002 | Needs fixture |
| World Forge #6 | Silent mutation from read-only export surface | Golden | Needs fixture |
| CommandUI #7 | Clear-all without confirmation | LAW-001 | Needs fixture |
| CommandUI #7 | Submit without validation gate | LAW-002 | Needs fixture |
| CommandUI #7 | Dead-end empty state | LAW-004 | Needs fixture |

## Anti-Patterns

- Do not write tests that assert violation *count* without asserting *which rules* fired
- Do not write tests that depend on violation *ordering* (checkers may run in parallel)
- Do not write quiet tests that pass by accident (empty input) — use realistic compliant fixtures
- Do not delete regression fixtures when refactoring checkers — if a fixture breaks, the refactor has a bug
