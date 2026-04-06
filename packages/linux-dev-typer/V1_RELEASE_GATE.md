# v1.0.0 Release Gate Checklist

Ship v1.0 when ALL sections pass.

## Trust & Determinism

- [x] Guided Mode is opt-in (default OFF)
- [x] With Guided Mode off, behavior matches v0.9 (tests prove)
- [x] With Guided Mode on, only bounded bias applies (tests prove)
- [x] Golden end-to-end plan test passes
- [x] SignalPolicy defaults: selection=false, difficulty=false, XP=false

## Quality

- [x] Migration tests cover prior schemas (no data loss)
- [x] Perf gate passes at 5k CodeItems
- [x] Signal retention prevents file growth runaway
- [x] Heatmap history length capped (200 chars)
- [x] Daily snapshots capped (90 max)
- [x] Pruning is deterministic

## Accessibility

- [x] Keyboard-only usable (no focus traps)
- [x] Visible focus ring on all interactive elements
- [x] High-contrast mode usable
- [x] Reduced-motion supported
- [x] Sidebar, toggles, and "why this snippet" fully accessible

## Product Clarity

- [x] First-run flow is coherent
- [x] Guided Mode explanation is non-intrusive
- [x] "Add code" flow is obvious
- [x] Library health panel exists
- [x] Docs explain what signals do and don't do

## Test Coverage

- [x] 817 tests passing
- [x] WeaknessBias invariant tests (band never changes, ordering only)
- [x] SignalPolicy invariant tests (off = v0.9 behavior)
- [x] End-to-end golden session test
- [x] Migration tests: v9->v12, v10->v12, v11->v12, v12->v12
- [x] Perf: 5k CodeItems planning under budget
