# Ship Gate

> No repo is "done" until every applicable line is checked.

**Tags:** `[all]` `[npm]` `[cli]`

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-04-02)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-04-02)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-04-02)
- [x] `[all]` No telemetry by default — state it explicitly even if obvious (2026-04-02)

### Default safety posture

- [ ] `[cli|mcp|desktop]` SKIP: no dangerous actions — taste-compiler only reads source and writes reports
- [ ] `[cli|mcp|desktop]` SKIP: reads from user-specified directories only, writes to stdout or user-specified output
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-04-02) — violations use TasteViolation schema with id, severity, class, ruleId, message, rationale, evidence, suggestedFix
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error · 3 partial success (2026-04-02)
- [x] `[cli]` No raw stack traces without `--debug` (2026-04-02)
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-04-02)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-04-02)
- [x] `[all]` LICENSE file present and repo states support status (2026-04-02)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-04-02)
- [ ] `[cli|mcp|desktop]` SKIP: CLI outputs to stdout only, no logging levels needed for a static analysis tool
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex daemon — runs once per invocation

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-04-02)
- [x] `[all]` Version in manifest matches git tag (2026-04-02) — v1.0.0
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) (2026-04-02) — pnpm audit in CI
- [ ] `[all]` SKIP: automated dependency updates not configured — monorepo with minimal deps, manual updates preferred
- [ ] `[npm]` SKIP: not published to npm yet — monorepo packages are workspace-internal
- [x] `[npm]` `engines.node` set (2026-04-02) — >=20 in all packages
- [x] `[npm]` Lockfile committed (2026-04-02) — pnpm-lock.yaml
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [ ] `[all]` Logo in README header
- [ ] `[all]` Translations (polyglot-mcp, 8 languages)
- [ ] `[org]` Landing page (@mcptoolshop/site-theme)
- [ ] `[all]` GitHub repo metadata: description, homepage, topics

---

## Gate Rules

**Hard gate (A–D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification — don't leave it unchecked.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
