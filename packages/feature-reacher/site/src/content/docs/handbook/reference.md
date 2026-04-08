---
title: Reference
description: Architecture, key files, diagnosis types, Phase 3 roadmap, security scope, and test suite.
sidebar:
  order: 4
---

Technical reference for Feature-Reacher internals, roadmap, and testing.

## Key files

| File | Purpose |
|------|---------|
| `src/analysis/extractor.ts` | Feature extraction from normalized text |
| `src/analysis/scoring.ts` | Heuristic risk scoring (0–1) |
| `src/analysis/diagnose.ts` | Diagnosis generation from scored features |
| `src/analysis/ranking.ts` | Final risk ranking and report assembly |
| `src/app/page.tsx` | Main audit page |
| `src/app/history/page.tsx` | Audit history browser (Phase 2) |
| `src/app/compare/page.tsx` | Side-by-side audit comparison (Phase 2) |
| `src/app/trends/page.tsx` | Feature risk trend sparklines (Phase 2) |
| `src/components/` | React UI components |
| `src/lib/` | Shared utilities and IndexedDB layer |

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
├──────────┬──────────┬──────────┬────────────┤
│  Upload  │  Audit   │ History  │  Compare   │
│  Page    │  Report  │  Browse  │  Diff      │
├──────────┴──────────┴──────────┴────────────┤
│              Analysis Pipeline               │
│  extract → score → diagnose → rank → report  │
├─────────────────────────────────────────────┤
│              IndexedDB Storage               │
│  audits · artifact sets · settings           │
└─────────────────────────────────────────────┘
```

Everything runs client-side. No API calls, no server process, no external dependencies at runtime.

## Diagnosis types

| Type | Description | Primary signal |
|------|-------------|----------------|
| **Buried** | Feature has low visibility in documentation | Deep nesting, no prominent placement |
| **Undocumented** | Feature exists in code but not in user-facing docs | Changelog/code mention with no doc match |
| **Stale** | Feature absent from recent releases | No mention in recent artifacts |
| **Complex** | Feature requires multi-step setup without adequate guidance | High step count, low doc density |
| **Shadowed** | Feature overshadowed by a similar, more prominent feature | Semantic overlap with higher-visibility peer |
| **Orphaned** | Feature exists in isolation with no user path | No cross-references, no navigation links |

## Phase 3 roadmap

Features planned for Phase 3:

- **Demo mode** — pre-loaded sample artifacts for first-time users to try the pipeline without bringing their own docs
- **Legal pages** — privacy policy and terms (even though local-first, transparency matters)
- **Onboarding tour** — guided walkthrough of the audit pipeline on first visit
- **Methodology page** — detailed explanation of every heuristic and how scores are calculated
- **Error boundaries** — graceful handling of malformed input, empty artifacts, and edge cases
- **Accessibility (a11y)** — keyboard navigation, screen reader support, ARIA labels, focus management

## Security scope

Feature-Reacher is local-first by design:

- **No network requests** — the application makes zero outbound calls after page load
- **No telemetry** — no analytics, no tracking, no error reporting to external services
- **No server** — static export, no backend process
- **No authentication** — no accounts, no sessions, no tokens
- **Data stays local** — all audits stored in browser IndexedDB, never transmitted

The threat model is minimal: the only sensitive data is whatever the user pastes into the text editor, and it never leaves the browser.

## Test suite

The Jest test suite validates pipeline correctness:

```bash
npm test          # Run all tests
npm run typecheck # TypeScript strict mode
npm run lint      # ESLint
```

Key test areas:
- Risk scores bounded 0–1 for all inputs
- Audit IDs formatted correctly
- Feature extraction handles edge cases (empty input, single feature, malformed markdown)
- Diagnosis assignment matches expected signal patterns
- Ranking is stable (same input, same order)
