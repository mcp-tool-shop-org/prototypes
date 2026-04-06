# Phase 2 — Core engine hardening (Commits 6–10)

> Goal: make the **Core** library production-grade and testable (even if UI remains simple).

## Commit 6 — `feat(core): add results model + session summary`
- [ ] Add `Result` model (timestamp, language, wpm, accuracy, errors, chars, xpEarned, snippetId)
- [ ] Add a method to convert a completed `TypingSession` → `Result`
- [ ] Commit

## Commit 7 — `test(core): unit tests for TypingSession`
- [ ] Add `LinuxDevTyper.Core.Tests` (xUnit)
- [ ] Tests:
  - [ ] exact match completes
  - [ ] one wrong char increments errors
  - [ ] extra chars count as errors
  - [ ] accuracy stays within 0–100
  - [ ] wpm increases with time/typed length (basic sanity)
- [ ] Commit

## Commit 8 — `feat(core): line-ending normalization option`
- [ ] Add setting flag: `NormalizeLineEndings` (default true)
- [ ] Normalize `\r\n` and `\r` to `\n` in both target + typed when enabled
- [ ] Commit

## Commit 9 — `feat(core): whitespace rules toggles`
- [ ] Add settings:
  - [ ] `IgnoreTrailingSpaces` (default false)
  - [ ] `StrictWhitespace` (default true)
- [ ] Implement behavior in engine via a preprocessing step
- [ ] Commit

## Commit 10 — `feat(core): snippet selection improvements`
- [ ] Add selection bias:
  - [ ] prefer snippets near rating target
  - [ ] occasional boss pick (+2 difficulty) stays
- [ ] Add deterministic seed support for debugging (optional)
- [ ] Commit

---

## Phase 2 Exit Criteria
- [ ] Core has unit tests and passes locally + in CI
- [ ] Session correctness rules are configurable and stable
- [ ] Snippet selection is predictable and extensible
