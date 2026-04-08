# Ship Gate

> No repo is "done" until every applicable line is checked.

**Tags:** `[all]` every repo · `[npm]` published to npm · `[cli]` CLI tools
**Detected:** `[all]` `[npm]` `[cli]`

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-29)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-03-29)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-29)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-03-29)

### Default safety posture

- [x] `[cli]` Dangerous actions (kill, delete, restart) require explicit flags (2026-03-29)
- [x] `[cli]` File operations constrained to known directories (2026-03-29)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-03-29)
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error (2026-03-29)
- [x] `[cli]` No raw stack traces without `--debug` (2026-03-29)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-03-29)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-29)
- [x] `[all]` LICENSE file present and repo states support status (2026-03-29)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-03-29)
- [x] `[cli]` Logging levels defined: normal / debug (--debug flag) (2026-03-29)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex operational system

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (lint + test + build) (2026-03-29)
- [x] `[all]` Version in manifest matches git tag (2026-03-29)
- [x] `[all]` Dependency scanning runs in CI (GitHub Actions) (2026-03-29)
- [x] `[all]` Automated dependency update mechanism exists (GitHub dependabot via CI) (2026-03-29)
- [x] `[npm]` `npm pack --dry-run` includes: dist/, README.md, CHANGELOG.md, LICENSE (2026-03-29)
- [x] `[npm]` `engines.node` set (>=20) (2026-03-29)
- [x] `[npm]` Lockfile committed (2026-03-29)
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [ ] `[all]` Logo in README header
- [ ] `[all]` Translations (polyglot-mcp, 8 languages)
- [ ] `[org]` Landing page (@mcptoolshop/site-theme)
- [ ] `[all]` GitHub repo metadata: description, homepage, topics

---

## Gate Rules

**Hard gate (A-D):** Must pass before any version is tagged or published.
**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
