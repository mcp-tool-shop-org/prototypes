# Ship Gate — @mcptoolshop/sovereignty

**Repo type:** npm
**Version:** 1.4.6
**Audited:** 2026-03-19

---

## A. Security Baseline — HARD GATE

- [x] A1 `[all]` SECURITY.md exists (report email, supported versions, response timeline) (2026-03-19)
- [x] A2 `[all]` README includes threat model paragraph (data touched, NOT touched, permissions) (2026-03-19)
- [x] A3 `[all]` No secrets, tokens, or credentials in source or diagnostics output (2026-03-19)
- [x] A4 `[all]` No telemetry by default — stated explicitly (2026-03-19)
- SKIP: A5 `[cli|mcp|desktop]` Dangerous actions require explicit `--allow-*` flag — wrapper only, no dangerous actions
- SKIP: A6 `[cli|mcp|desktop]` File operations constrained to known directories — wrapper only, delegates to npm-launcher
- SKIP: A7 `[mcp]` Network egress off by default — not an MCP server
- SKIP: A8 `[mcp]` Stack traces never exposed — not an MCP server

## B. Error Handling — HARD GATE

- SKIP: B1 `[all]` Errors follow Structured Error Shape — wrapper delegates all errors to npm-launcher
- SKIP: B2 `[cli]` Exit codes: 0/1/2/3 — passthrough from npm-launcher and sovereignty binary
- SKIP: B3 `[cli]` No raw stack traces without `--debug` — no logic to produce stacks
- SKIP: B4–B7 — not applicable (not MCP, desktop, or VS Code)

## C. Operator Docs — HARD GATE

- [x] C1 `[all]` README current: what it does, install, usage, platforms + runtime versions (2026-03-19)
- [x] C2 `[all]` CHANGELOG.md (Keep a Changelog format) (2026-03-19)
- [x] C3 `[all]` LICENSE file present and repo states support status (2026-03-19)
- SKIP: C4 `[cli]` `--help` output accurate — passthrough to sovereignty binary
- SKIP: C5 `[cli|mcp|desktop]` Logging levels — no logging in wrapper
- SKIP: C6 `[mcp]` All tools documented — not an MCP server
- SKIP: C7 `[complex]` HANDBOOK.md — site handbook exists at site/src/content/docs/handbook/

## D. Shipping Hygiene — HARD GATE

- [x] D1 `[all]` `verify` script exists (test + build + smoke in one command) (2026-03-19)
- [x] D2 `[all]` Version in manifest matches git tag (2026-03-19)
- [x] D3 `[all]` Dependency scanning runs in CI (`npm audit --audit-level=high`) (2026-03-19)
- SKIP: D4 `[all]` Automated dependency update mechanism — single dep, manual updates
- [x] D5 `[npm]` `npm pack --dry-run` includes: bin/, README.md, LICENSE (2026-03-19)
- [x] D6 `[npm]` `engines.node` set (>=18) (2026-03-19)
- [x] D7 `[npm]` Lockfile committed (2026-03-19)
- SKIP: D8 `[vsix]` — not a VS Code extension
- SKIP: D9 `[desktop]` — not a desktop app

## E. Identity — SOFT GATE

- [x] E1 `[all]` Logo in README header (2026-03-19)
- [x] E2 `[all]` Translations (8 languages) (2026-03-19)
- [x] E3 `[org]` Landing page (Starlight + @mcptoolshop/site-theme) (2026-03-19)
- [x] E4 `[all]` GitHub repo metadata: description, homepage, topics (2026-03-19)

---

**Result:** All hard gates (A–D) PASS. All soft gates (E) PASS.
