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

- [x] `[cli]` SKIP: No dangerous actions — tool plays sounds and writes config only. `init` adds hooks (reversible via `uninstall`), `export` writes WAVs to user-specified dir.
- [x] `[cli]` File operations constrained to known directories (2026-02-27) — config: `~/.claude-sfx/`, hooks: `.claude/settings.json` in cwd, export: user-specified dir
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` (2026-02-27) — `SfxError` class in `src/errors.ts`
- [x] `[cli]` Exit codes: 0 ok · 1 user error · 2 runtime error (2026-02-27) — constants in `src/errors.ts`, top-level catch in `cli.ts`
- [x] `[cli]` No raw stack traces without `--debug` (2026-02-27) — `--debug` flag enables stack traces
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[desktop]` SKIP: not a desktop app
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions (2026-02-27)
- [x] `[all]` CHANGELOG.md (Keep a Changelog format) (2026-02-27)
- [x] `[all]` LICENSE file present and repo states support status (2026-02-27)
- [x] `[cli]` `--help` output accurate for all commands and flags (2026-02-27) — includes --version, --debug, all commands
- [x] `[cli]` Logging levels defined: silent (muted) / normal (default) / debug (--debug flag) (2026-02-27) — no secrets to redact
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: not complex enough to warrant a handbook

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build in one command) (2026-02-27) — `npm run verify`
- [x] `[all]` Version in manifest matches git tag (2026-02-27) — v0.1.2
- [x] `[all]` Dependency scanning runs in CI (2026-02-27) — `npm audit --omit=dev` in ci.yml
- [x] `[all]` SKIP: Automated dependency updates deferred — zero production dependencies, devDeps updated manually per release
- [x] `[npm]` `npm pack --dry-run` includes: dist/, README.md, CHANGELOG.md, LICENSE (2026-02-27)
- [x] `[npm]` `engines.node` set to `>=18.0.0` (2026-02-27)
- [x] `[npm]` Lockfile committed (2026-02-27) — package-lock.json
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
