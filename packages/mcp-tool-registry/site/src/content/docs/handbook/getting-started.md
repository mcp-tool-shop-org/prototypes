---
title: Getting Started
description: Install the registry package and start importing tool metadata.
sidebar:
  order: 1
---

The MCP Tool Registry is a data-only npm package — no executable code, just JSON metadata for every tool in the ecosystem.

## Installation

```bash
npm install @mcptoolshop/mcp-tool-registry
```

## Import the full registry

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
console.log(registry.tools[0].id)
```

## Import a bundle

Bundles are rule-generated subsets of the registry grouped by purpose:

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Available bundles: `core`, `agents`, `ops`, `evaluation`.

## Use the search index

A pre-built search index ships inside the package — no server or runtime computation required:

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

## LLM context

For RAG pipelines, import the plain-text context file:

```javascript
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Search locally

The package ships with CLI scripts for searching and exploring the registry without any network requests:

```bash
# Keyword search (ranked by relevance)
node scripts/query.mjs --q "testing"

# Filter by bundle
node scripts/query.mjs --bundle core

# Filter by tag
node scripts/query.mjs --tag accessibility

# JSON output for scripting
node scripts/query.mjs --q "agent" --json

# Show why results matched
node scripts/query.mjs --q "file" --explain

# View top tags, bundle counts, and ecosystem stats
node scripts/facets.mjs
```

## Pinning

Pin a registry version in your `package.json` and get identical metadata on every install:

```json
{
  "dependencies": {
    "@mcptoolshop/mcp-tool-registry": "1.1.5"
  }
}
```

The registry hash in `dist/derived.meta.json` lets you verify the exact state of any pinned version.

The v1 contract is stable — new optional fields may appear in minor versions, but no existing required fields will change within a major version.
