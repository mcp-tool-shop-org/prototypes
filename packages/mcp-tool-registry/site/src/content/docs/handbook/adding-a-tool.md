---
title: Adding a Tool
description: How to submit your tool to the registry.
sidebar:
  order: 3
---

## Submission process

1. Read the [registry guidelines](https://github.com/mcp-tool-shop-org/mcp-tool-registry/blob/main/docs/registry-guidelines.md)
2. Add an entry to `registry.json` (keep the tools array sorted by `id`)
3. Run `npm run validate` and `npm run policy` to verify your entry
4. Submit a Pull Request

## Entry requirements

Every tool entry must include:

- **id** — Unique, lowercase, hyphen-separated identifier (must match `^[a-z0-9]+(-[a-z0-9]+)*$`)
- **name** — Human-readable display name
- **description** — Clear description of what the tool does (minimum 10 characters, no TODO placeholders)
- **repo** — HTTPS GitHub URL to the source repository
- **install** — Installation method (`type`, `url`, `default_ref` are all required inside this object)
- **tags** — Array of lowercase keywords for search and bundle membership

Optional fields:

- **ecosystem** — Sub-ecosystem the tool belongs to (e.g., `accessibility`, `python`)
- **defaults** — Safe defaults for the tool (e.g., `{ "safe_run": true }`)
- **verification** — Validation level: `none` (default), `community`, or `official`
- **deprecated** / **deprecated_at** / **sunset_at** / **deprecation_reason** — Lifecycle fields (see the [lifecycle policy](https://github.com/mcp-tool-shop-org/mcp-tool-registry/blob/main/docs/lifecycle.md))

## Validation

CI runs two checks on every PR:

- **Schema validation** (`npm run validate`) — Checks required fields, ID format, URL format, and structural rules
- **Policy check** (`npm run policy`) — Enforces ecosystem-wide policies like HTTPS URLs, description quality, and capability declarations

Both must pass before a PR can be merged.

## After merge

Once merged, your tool will:

- Appear in `registry.json` and the search index
- Be discoverable via `mcpt list`, `mcpt search`, and the web explorer
- Be eligible for bundle membership based on its tags and maturity level
- Show up in the next registry version published to npm
