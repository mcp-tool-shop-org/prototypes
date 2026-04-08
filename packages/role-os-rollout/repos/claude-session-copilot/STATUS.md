# claude-session-copilot — Lockdown Status

## Classification
Lock candidate → **locked**

## Phase
Lockdown complete (2026-03-24)

## Primary seam
Hook binding + session truth

## Seam family
State binding truth

## Proving packet
COPILOT-001 — PASS (rerun after truth fixes: TC-1 language fix, TC-2 staleness signaling, TC-3 documented)

## Files placed
- `.claude/context/product-brief.md`
- `.claude/context/repo-map.md`
- `.claude/context/brand-rules.md`
- `.claude/context/current-priorities.md`
- `.claude/workflows/protect-session-truth.md`

## Fixes shipped (v1.0.1)
- TC-1: All "auto-record" language replaced with "prompt-based hook" descriptions
- TC-2: Resume now includes snapshotAge, snapshotStale, and bindingNote
- TC-3: "Session Model & Limitations" section added to README

## Open items
- COPILOT-002: Stronger hook capture truth (deeper signaling beyond language fix)
- COPILOT-003: Deeper resume freshness handling (beyond baseline staleness signaling)
