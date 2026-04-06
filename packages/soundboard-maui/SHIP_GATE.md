# Ship Gate

> No repo is "done" until every applicable line is checked.

**Tags:** `[all]` every repo · `[npm]` `[pypi]` `[vsix]` `[desktop]` `[container]` published artifacts · `[mcp]` MCP servers · `[cli]` CLI tools

---

## A. Security Baseline

- [x] `[all]` SECURITY.md exists (report email, supported versions, response timeline)
- [x] `[all]` README includes threat model paragraph (data touched, data NOT touched, permissions required)
- [x] `[all]` No secrets, tokens, or credentials in source or diagnostics output
- [x] `[all]` No telemetry by default — state it explicitly even if obvious

### Default safety posture

- [ ] `[cli|mcp|desktop]` SKIP: desktop app with no destructive operations; user initiates all actions
- [x] `[cli|mcp|desktop]` File operations constrained to known directories — engine config only
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server

## B. Error Handling

- [x] `[all]` Errors follow the Structured Error Shape: `code`, `message`, `hint`, `cause?`, `retryable?` — SDK structured exceptions
- [ ] `[cli]` SKIP: not a standalone CLI
- [ ] `[cli]` SKIP: not a standalone CLI
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[mcp]` SKIP: not an MCP server
- [x] `[desktop]` Errors shown as user-friendly messages — no raw exceptions in UI
- [ ] `[vscode]` SKIP: not a VS Code extension

## C. Operator Docs

- [x] `[all]` README is current: what it does, install, usage, supported platforms + runtime versions
- [x] `[all]` CHANGELOG.md (Keep a Changelog format)
- [x] `[all]` LICENSE file present and repo states support status
- [ ] `[cli]` SKIP: not a standalone CLI
- [ ] `[cli|mcp|desktop]` SKIP: desktop app with structured logging via ILogger, no configurable levels exposed to user
- [ ] `[mcp]` SKIP: not an MCP server
- [ ] `[complex]` SKIP: docs/ contains comprehensive documentation

## D. Shipping Hygiene

- [x] `[all]` `verify` script exists (test + build + smoke in one command) — dotnet build + test
- [x] `[all]` Version in manifest matches git tag
- [x] `[all]` Dependency scanning runs in CI (ecosystem-appropriate)
- [x] `[all]` Automated dependency update mechanism exists
- [ ] `[npm]` SKIP: .NET project, not npm
- [ ] `[npm]` SKIP: .NET project
- [ ] `[npm]` SKIP: .NET project
- [ ] `[pypi]` SKIP: not a Python project
- [ ] `[vsix]` SKIP: not a VS Code extension
- [x] `[desktop]` Installer/package builds and runs on stated platforms — NuGet packages for SDK

## E. Identity (soft gate — does not block ship)

- [x] `[all]` Logo in README header
- [x] `[all]` Translations (polyglot-mcp, 8 languages)
- [x] `[org]` Landing page (@mcptoolshop/site-theme)
- [x] `[all]` GitHub repo metadata: description, homepage, topics
