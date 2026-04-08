# Ship Gate

> No repo is "done" until every applicable line is checked.

**Tags:** `[all]` every repo · `[pypi]` published artifact · `[cli]` CLI tool
**Detected:** `[all] [pypi]`

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-28)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-03-28)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-28)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-03-28)

### Default safety posture

- [x] `[cli|mcp|desktop]` Dangerous actions (kill, delete, restart) require explicit `--allow-*` flag (2026-03-28) — train writes only to user-specified --output dir; export overwrites require existing dir
- [x] `[cli|mcp|desktop]` File operations constrained to known directories (2026-03-28) — all output written to --output flag only
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-03-28)
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error · 3 partial success (2026-03-28)
- [x] `[cli]` No raw stack traces without `--debug` (2026-03-28)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-03-28)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-28)
- [x] `[all]` LICENSE file present and repo states support status (2026-03-28)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-03-28)
- [x] `[cli|mcp|desktop]` Logging levels defined: silent / normal / verbose / debug — secrets redacted at all levels (2026-03-28) — --debug flag controls stack trace visibility
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex operational system

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-03-28)
- [x] `[all]` Version in manifest matches git tag (2026-03-28) — v1.0.0
- [ ] `[all]` SKIP: Dependency scanning — no dependabot configured yet (planned)
- [ ] `[all]` SKIP: Automated dependency updates — planned for post-launch
- [ ] `[npm]` SKIP: not an npm package
- [x] `[pypi]` `python_requires` set (2026-03-28) — >=3.11
- [x] `[pypi]` Clean wheel + sdist build (2026-03-28)
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header (2026-03-28)
- [ ] `[all]` Translations (polyglot-mcp, 8 languages) — user runs locally
- [x] `[org]` Landing page (@mcptoolshop/site-theme) (2026-03-28)
- [x] `[all]` GitHub repo metadata: description, homepage, topics (2026-03-28)

---

## Gate Rules

**Hard gate (A-D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
