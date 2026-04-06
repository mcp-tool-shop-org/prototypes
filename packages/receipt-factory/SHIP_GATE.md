# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-03)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-03-03)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-03)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-03-03)

### Default safety posture

- [x] `[cli|mcp|desktop]` Dangerous actions (kill, delete, restart) require explicit `--allow-*` flag (2026-03-03) — N/A: rf CLI only creates, renders, and verifies files. No destructive actions.
- [x] `[cli|mcp|desktop]` File operations constrained to known directories (2026-03-03) — writes only to user-specified --output dirs
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-03-03) — RfError class in rf-core
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error · 3 partial success (2026-03-03)
- [x] `[cli]` No raw stack traces without `--debug` (2026-03-03) — all commands catch RfError and call toCliText()
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-03-03)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-03)
- [x] `[all]` LICENSE file present and repo states support status (2026-03-03)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-03-03)
- [x] `[cli|mcp|desktop]` Logging levels defined: silent / normal / verbose / debug — secrets redacted at all levels (2026-03-03) — CLI outputs structured messages only; no logging framework (no secrets to redact)
- [ ] `[mcp]` SKIP: not an MCP server
- [x] `[complex]` HANDBOOK.md: daily ops, warn/critical response, recovery procedures (2026-03-03) — docs/handbook/ with 3 guides

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-03-03) — "verify": "turbo build test"
- [x] `[all]` Version in manifest matches git tag (2026-03-03) — v1.7.0
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) (2026-03-03) — pnpm audit in CI
- [x] `[all]` Automated dependency update mechanism exists (2026-03-03) — manual pnpm update; no dependabot (intentional per org policy to avoid CI minute burn)
- [x] `[npm]` `npm pack --dry-run` includes: dist/, README.md, CHANGELOG.md, LICENSE (2026-03-03)
- [x] `[npm]` `engines.node` set (2026-03-03) — >=20.0.0 on all packages
- [x] `[npm]` Lockfile committed (2026-03-03) — pnpm-lock.yaml
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header (2026-03-03)
- [x] `[all]` Translations (polyglot-mcp, 3 of 8 languages: ja, zh, es) (2026-03-03)
- [x] `[org]` Landing page (@mcptoolshop/site-theme) (2026-03-03)
- [x] `[all]` GitHub repo metadata: description, homepage, topics (2026-03-03)

---

## Gate Rules

**Hard gate (A–D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification — don't leave it unchecked.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."

**Checking off:**
```
- [x] `[all]` SECURITY.md exists (2026-02-27)
```

**Skipping:**
```
- [ ] `[pypi]` SKIP: not a Python project
```
