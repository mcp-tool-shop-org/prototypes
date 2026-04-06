# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-02-27)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-02-27)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-02-27)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-02-27)

### Default safety posture

- [x] `[cli|mcp|desktop]` Dangerous actions (kill, delete, restart) require explicit `--allow-*` flag — SKIP: plugin has no destructive actions; synthesis is inherently safe (2026-02-27)
- [x] `[cli|mcp|desktop]` File operations constrained to known directories (2026-02-27 — WAV output sandboxed to tempdir/voice-soundboard/)
- [x] `[mcp]` Network egress off by default (2026-02-27 — local stdio only, remote backends opt-in)
- [x] `[mcp]` Stack traces never exposed — structured error results only (2026-02-27 — trace IDs + error codes, stacks to stderr only)

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-02-27)
- [ ] `[cli]` SKIP: not a CLI tool (stdio MCP server)
- [ ] `[cli]` SKIP: not a CLI tool
- [x] `[mcp]` Tool errors return structured results — server never crashes on bad input (2026-02-27)
- [x] `[mcp]` State/config corruption degrades gracefully (stale data over crash) (2026-02-27)
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-02-27)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-02-27)
- [x] `[all]` LICENSE file present and repo states support status (2026-02-27)
- [ ] `[cli]` SKIP: not a CLI tool
- [x] `[cli|mcp|desktop]` Logging levels defined: silent / normal / verbose / debug — secrets redacted at all levels (2026-02-27 — inner monologue redacts paths, tokens, IPs, base64, key=value)
- [x] `[mcp]` All tools documented with description + parameters (2026-02-27 — README + HANDBOOK.md)
- [x] `[complex]` HANDBOOK.md: daily ops, warn/critical response, recovery procedures (2026-02-27 — docs/HANDBOOK.md)

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-02-27 — Makefile verify target)
- [x] `[all]` Version in manifest matches git tag (2026-02-27)
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) (2026-02-27 — pip-audit in CI dep-audit job)
- [x] `[all]` Automated dependency update mechanism exists (2026-02-27 — pip-audit in dev deps)
- [ ] `[npm]` SKIP: not an npm package
- [x] `[pypi]` `python_requires` set (2026-02-27 — >=3.10)
- [x] `[pypi]` Clean wheel + sdist build (2026-02-27 — hatchling build backend)
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header (2026-02-27)
- [x] `[all]` Translations (polyglot-mcp, 8 languages) (2026-02-27)
- [x] `[org]` Landing page (@mcptoolshop/site-theme) (2026-02-27)
- [x] `[all]` GitHub repo metadata: description, homepage, topics (2026-02-27)

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
