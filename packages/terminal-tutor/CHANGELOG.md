# Changelog

All notable changes to Terminal Tutor are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-03-29

### Added

- Tutor engine: parser, workspace isolation, outcome-based checker, tutor loop, progress ledger
- Checker normalization: ANSI strip, path normalize, whitespace collapse, case-insensitive mode
- 6 check types: output_contains, output_ordered, file_exists, file_contains, exit_code, git_state
- Three runtime adapters: shell (default), venv (Python), docker (container)
- Capability schema: 7-field contract enforced before runtime setup
- Evidence capture: per-step transcript with raw/normalized output, verdict, hint level
- Skill tracks: 5 tracks organizing lessons into learning progressions
- Mastery signals: fluency rating (clean/solid/guided) from ledger data
- Game system: mode, win/lose conditions, scoring, replay support
- 8 lessons: files-and-navigation, pipes-and-search, git-basics, python-debugging, service-triage, file-surgery, process-basics, dependency-detective
- 3 games: filesystem-salvage (shell), dependency-lab (venv), service-siege (docker)
- CLI: 17 commands with structured JSON output
- Doctor command: system readiness check with runtime remedies
- Structured error handling: code/message/hint shape, exit codes 0/1/2
- Lesson authoring doctrine (AUTHORING.md)
- 172 tests across 13 test files including end-to-end dogfood tests
