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

- [ ] `[cli|mcp|desktop]` SKIP: no dangerous actions — extension only speaks text and exports VTT files
- [x] `[cli|mcp|desktop]` File operations constrained to known directories (2026-02-27 — audio to temp dir, VTT to workspace)
- [x] `[mcp]` Network egress off by default (2026-02-27 — local Python/Kokoro is default; cloud TTS is opt-in via API key)
- [x] `[mcp]` Stack traces never exposed — structured error results only (2026-02-27 — errors surfaced via VS Code notifications)

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-02-27 — VS Code showErrorMessage with action buttons)
- [ ] `[cli]` SKIP: not a CLI tool
- [ ] `[cli]` SKIP: not a CLI tool
- [x] `[mcp]` Tool errors return structured results — server never crashes on bad input (2026-02-27)
- [x] `[mcp]` State/config corruption degrades gracefully (stale data over crash) (2026-02-27 — setup banner shown when backend needs config)
- [ ] `[desktop]` SKIP: not a desktop app
- [x] `[vscode]` Errors surface via VS Code notification API — no silent failures (2026-02-27)

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-02-27)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-02-27)
- [x] `[all]` LICENSE file present and repo states support status (2026-02-27)
- [ ] `[cli]` SKIP: not a CLI tool
- [ ] `[cli|mcp|desktop]` SKIP: logging is via VS Code Output channel, not configurable levels
- [x] `[mcp]` All tools documented with description + parameters (2026-02-27 — commands table in README)
- [ ] `[complex]` SKIP: single-purpose extension, not complex enough for HANDBOOK

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) (2026-02-27)
- [x] `[all]` Version in manifest matches git tag (2026-02-27)
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate) (2026-02-27)
- [x] `[all]` Automated dependency update mechanism exists (2026-02-27 — npm audit in CI)
- [ ] `[npm]` SKIP: published as vsix, not npm
- [ ] `[npm]` SKIP: published as vsix, not npm
- [ ] `[npm]` SKIP: published as vsix, not npm
- [x] `[vsix]` `vsce package` produces clean .vsix with correct metadata (2026-02-27)
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
