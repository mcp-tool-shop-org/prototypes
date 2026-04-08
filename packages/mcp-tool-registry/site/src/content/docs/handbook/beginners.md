---
title: Beginners
description: New to MCP Tool Registry? Start here for a guided introduction.
sidebar:
  order: 99
---

New to MCP Tool Registry? This page walks you through the core concepts, common workflows, and how to get productive quickly.

## What is MCP Tool Registry?

MCP Tool Registry is a **data-only npm package** that serves as the single source of truth for all tools in the MCP Tool Shop ecosystem. It contains no executable code — just JSON metadata describing each tool's name, description, repository, tags, and installation instructions.

Consumers install the package to discover, search, and integrate tools into their own projects, agents, and pipelines. The registry is schema-validated on every commit, so the data you get is always structurally sound.

## Who is it for?

- **Developers** building agents or workflows who need to discover and select tools programmatically.
- **Tool authors** who want to make their MCP-compatible tools discoverable by the community.
- **AI/LLM pipelines** that need structured metadata about available tools for retrieval-augmented generation (RAG).
- **DevOps teams** looking for curated tool bundles (core utilities, agent stacks, ops tools, evaluation suites).

## Key concepts

**Registry** — The canonical `registry.json` file containing every tool entry. This is the source of truth and the only file that humans edit directly.

**Schema** — A JSON Schema (`schema/registry.schema.json`) that enforces structural rules on every tool entry. CI validates against this schema on every pull request.

**Bundles** — Rule-generated subsets of the registry grouped by purpose. Four bundles ship today: `core`, `agents`, `ops`, and `evaluation`. Membership is determined by declarative rules (tag matching and explicit ID lists), not manual curation.

**Derived artifacts** — Files generated deterministically from `registry.json` at publish time. These include the search index, capability reverse map, health report, and LLM context file. Never edit these by hand.

**Policy** — A set of ecosystem-wide rules enforced by `scripts/policy-check.mjs`. Policies check ID format, description quality, HTTPS URLs, tag formatting, and deprecation field consistency.

## Installation and first steps

Install the package:

```bash
npm install @mcptoolshop/mcp-tool-registry
```

Import the full registry in your code:

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

// How many tools are available?
console.log(`${registry.tools.length} tools registered`)

// List all tool IDs
registry.tools.forEach(t => console.log(t.id))
```

Import a bundle to get a curated subset:

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }

console.log(`Core bundle contains ${coreBundle.tools.length} tools`)
console.log(coreBundle.tools) // Array of tool IDs
```

Use the pre-built search index for discovery:

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

// Find tools tagged with "testing"
const testingTools = toolIndex.filter(t => t.tags.includes("testing"))
testingTools.forEach(t => console.log(`${t.id}: ${t.description}`))
```

## Common tasks

### Search for tools from the command line

The package includes CLI scripts that work directly against the local data — no network requests required:

```bash
# Keyword search
node scripts/query.mjs --q "accessibility"

# Filter by bundle
node scripts/query.mjs --bundle agents

# Filter by tag
node scripts/query.mjs --tag testing

# JSON output for piping to other tools
node scripts/query.mjs --q "file" --json

# See why results matched (scoring breakdown)
node scripts/query.mjs --q "compass" --explain
```

### View ecosystem stats

```bash
node scripts/facets.mjs
```

This prints the top tags, bundle sizes, ecosystem breakdown, and total tool count.

### Validate the registry

Before submitting a pull request, always run validation locally:

```bash
# Schema validation + invariant checks
npm run validate

# Policy enforcement (ID format, description quality, HTTPS, tags)
npm run policy

# Full test suite (validate + policy + compat tests + health SLO gates)
npm test
```

### Submit a new tool

1. Fork the repository and create a branch.
2. Add a new entry to `registry.json`, keeping the `tools` array sorted alphabetically by `id`.
3. Include all required fields: `id`, `name`, `description`, `repo`, `install` (with `type`, `url`, `default_ref`), and `tags`.
4. Run `npm run validate` and `npm run policy` to check your entry.
5. Submit a pull request. CI will run schema validation, policy checks, compatibility tests, and health SLO gates automatically.

## Troubleshooting

**"Schema validation failed"** — Your tool entry is missing a required field or has a field in the wrong format. Check that `id`, `name`, `description`, `repo`, `install`, and `tags` are all present and correctly typed. Run `npm run validate` locally to see the exact error.

**"Policy violation: ID must be lower-kebab-case"** — Tool IDs must match `^[a-z0-9]+(-[a-z0-9]+)*$`. Use only lowercase letters, numbers, and hyphens. No underscores, dots, or uppercase.

**"Policy violation: description is too short"** — Descriptions must be at least 10 characters. Write a clear, concise summary of what the tool does.

**"Bundle references unknown tool ID"** — A bundle rule file references a tool ID that does not exist in `registry.json`. Either add the tool or update the bundle rule.

**"Export validation failed: File not found"** — The `package.json` exports map points to a bundle or artifact file that does not exist on disk. Run `npm run bundles:build` and `npm run build:derived` to regenerate derived files.

**"SLO Violation" during health report** — The registry's quality metrics have dropped below the service-level threshold. Check `dist/REGISTRY_HEALTH.md` for details on which tools are causing the issue.

## Next steps

- Read [Getting Started](/mcp-tool-registry/handbook/getting-started/) for detailed import patterns and pinning.
- Learn about [Bundles & Structure](/mcp-tool-registry/handbook/bundles-and-structure/) to understand how tools are grouped.
- See [Adding a Tool](/mcp-tool-registry/handbook/adding-a-tool/) for the full submission process.
- Check the [Reference](/mcp-tool-registry/handbook/reference/) page for schemas, versioning, and ecosystem links.
