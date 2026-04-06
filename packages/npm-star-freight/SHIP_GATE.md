# Ship Gate

> No repo is "done" until every applicable line is checked.
> Copy this into your repo root. Check items off per-release.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

**Detected:** `[all]` `[npm]` `[cli]`

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-24)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required) (2026-03-24)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-24)
- [x] `[all]` No telemetry by default -- stated explicitly in README and SECURITY.md (2026-03-24)

### Default safety posture

- [ ] `[cli|mcp|desktop]` SKIP: Wrapper delegates to npm-launcher which downloads + caches + runs. No dangerous actions in the wrapper itself.
- [ ] `[cli|mcp|desktop]` SKIP: Wrapper writes only to user cache dir (~/.cache/mcptoolshop/). Enforced by npm-launcher.
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` SKIP: Wrapper is 15 lines. All error handling lives in @mcptoolshop/npm-launcher (download failures, checksum mismatches, platform detection). Errors are structured there.
- [x] `[cli]` SKIP: Wrapper delegates execution entirely. Exit codes come from the launched binary or npm-launcher.
- [x] `[cli]` SKIP: No stack traces possible from the 15-line wrapper. npm-launcher handles debug output.
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-03-24)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-24)
- [x] `[all]` LICENSE file present and repo states support status (2026-03-24)
- [x] `[cli]` SKIP: Wrapper provides --print-cache-path and --clear-cache via npm-launcher. No custom --help. The launched binary provides its own --help.
- [ ] `[cli|mcp|desktop]` SKIP: No logging in wrapper. npm-launcher handles download progress output.
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not a complex system

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists: `npm test` runs config validation tests (2026-03-24)
- [x] `[all]` Version in manifest matches git tag (1.0.3) (2026-03-24)
- [x] `[all]` SKIP: Single dependency (@mcptoolshop/npm-launcher). No dep scanning needed for 1 first-party dep.
- [x] `[all]` SKIP: Single first-party dependency. Updated manually when npm-launcher ships.
- [x] `[npm]` `npm pack --dry-run` includes: bin/, README.md, CHANGELOG.md, LICENSE (2026-03-24)
- [x] `[npm]` `engines.node` set to >=18 (2026-03-24)
- [x] `[npm]` Lockfile committed (2026-03-24)
- [ ] `[vsix]` SKIP: not a VS Code extension
- [ ] `[desktop]` SKIP: not a desktop app

## E. Identity (soft gate -- does not block ship)

- [x] `[all]` Logo in README header (brand repo URL) (2026-03-24)
- [ ] `[all]` Translations (polyglot-mcp, 8 languages) -- pending user local run
- [x] `[org]` Landing page (@mcptoolshop/site-theme) + Starlight handbook (2026-03-24)
- [x] `[all]` GitHub repo metadata: description, homepage, topics (2026-03-24)

---

## Gate Rules

**Hard gate (A-D):** Must pass before any version is tagged or published.
If a section doesn't apply, mark `SKIP:` with justification -- don't leave it unchecked.

**Soft gate (E):** Should be done. Product ships without it, but isn't "whole."
