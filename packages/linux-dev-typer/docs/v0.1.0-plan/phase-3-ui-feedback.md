# Phase 3 — UI correctness + per-character feedback (Commits 11–15)

> Goal: make the Avalonia UI feel “typing-trainer-grade”: focus behavior, feedback, and clean state transitions.

## Commit 11 — `fix(app): focus management + keyboard-first UX`
- [ ] Ensure typing TextBox gets focus on:
  - [ ] app startup
  - [ ] after "New Test"
  - [ ] after closing sidebar
- [ ] Ensure sidebar controls are keyboard reachable but don’t trap focus unexpectedly
- [ ] Commit

## Commit 12 — `feat(app): per-character prompt feedback (v1)`
- [ ] Replace plain prompt TextBlock with a render approach:
  - Option A (simple): build `Inlines` in a `TextBlock` with runs
  - Option B (better): custom control / `SelectableTextBlock` pattern
- [ ] Show:
  - [ ] correct typed chars
  - [ ] incorrect typed chars (underline + error color)
  - [ ] untyped chars muted
- [ ] Commit

## Commit 13 — `feat(app): completion flow + explainer display`
- [ ] On completion:
  - [ ] freeze current result for a moment OR show a completion card
  - [ ] display snippet `explain[]` bullets
  - [ ] provide “Next” (or auto-advance with small delay toggle)
- [ ] Commit

## Commit 14 — `feat(app): dynamic language discovery + safe fallback`
- [ ] Populate language dropdown from `assets/snippets/*.json`
- [ ] Handle missing/corrupt packs gracefully (no crashes)
- [ ] Commit

## Commit 15 — `a11y(app): contrast + font size polish`
- [ ] Verify text contrast against background
- [ ] Ensure font size slider affects both prompt + input
- [ ] Add visible focus styles (outline) for inputs/buttons
- [ ] Commit

---

## Phase 3 Exit Criteria
- [ ] Per-character feedback exists (not just raw text)
- [ ] Completion shows learning bullets
- [ ] Keyboard-first UX is smooth
