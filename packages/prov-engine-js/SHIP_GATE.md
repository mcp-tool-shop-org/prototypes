# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output
- [x] `[all]` No telemetry by default — state it explicitly even if obvious

### Default safety posture

- [x] `[cli|mcp|desktop]` Dangerous actions (kill, delete, restart) require explicit `--allow-*` flag — SKIP: read-only digest/wrap operations; no destructive actions
- [x] `[cli|mcp|desktop]` File operations constrained to known directories — reads only explicitly specified JSON files
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` — JSON error output with descriptive messages
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error · 3 partial success
- [x] `[cli]` No raw stack traces without `--debug`
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions
- [x] `[all]` CHANGELOG.md (Keep a Changelog format)
- [x] `[all]` LICENSE file present and repo states support status
- [x] `[cli]` `--help` output accurate for all commands and flags — describe, digest, wrap, verify-digest, check-vector
- [x] `[cli|mcp|desktop]` Logging levels defined: silent / normal / verbose / debug — SKIP: single-file CLI with JSON stdout; no logging levels needed
- [ ] `[mcp]` SKIP: not an MCP server
- [x] `[complex]` HANDBOOK.md: deep-dive guide covering provenance concepts, prov-spec mechanics, integration patterns

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) — npm test
- [x] `[all]` Version in manifest matches git tag
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) — zero dependencies, CI runs Node 18/20/22 matrix
- [x] `[all]` Automated dependency update mechanism exists — SKIP: zero dependencies
- [x] `[npm]` `npm pack --dry-run` includes: dist/, README.md, CHANGELOG.md, LICENSE
- [x] `[npm]` `engines.node` set (>=18.0.0)
- [x] `[npm]` Lockfile committed — SKIP: zero dependencies, no lockfile needed
- [ ] `[pypi]` SKIP: not a Python project
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header
- [x] `[all]` Translations (polyglot-mcp, 8 languages)
- [x] `[org]` Landing page (@mcptoolshop/site-theme)
- [x] `[all]` GitHub repo metadata: description, homepage, topics
