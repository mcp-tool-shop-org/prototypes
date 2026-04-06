# Content System v1 — 5 Phases × 5 Commits

## Phase 1 — Contracts + scaffolding (1–5)
1. chore: initialize solution + CI
2. docs: lock language detection rules
3. docs: lock normalization + metrics
4. feat: add models + abstractions
5. test: add baseline parity tests

## Phase 2 — Pipeline (6–10)
6. feat: Normalizer + MetricCalculator
7. feat: LanguageDetector (ext + heuristics)
8. feat: DefaultExtractor
9. feat: LibraryIndexBuilder (dedupe by stable ID)
10. feat: JsonLibraryIndexStore (load/save + stats)

## Phase 3 — Sources v1 (11–15)
11. feat: source: pasted code
12. feat: source: folder import (manual refresh)
13. feat: optional: file list import
14. test: large corpus smoke test (1000 items)
15. docs: per-app storage locations

## Phase 4 — Query + integration (16–20)
16. feat: query/filter API
17. test: query correctness
18. docs: integration contract for both apps
19. feat: CLI build index utility
20. fix: deterministic ordering across OS

## Phase 5 — Hardening + release (21–25)
21. test: golden-file index output parity
22. test: invalid UTF-8 deterministic behavior
23. fix: performance pass
24. docs: runbook + examples
25. release: v1.0.0 tag
