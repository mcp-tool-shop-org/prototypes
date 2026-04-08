# MCP Tool Registry Handbook

This handbook is the deep-dive companion to the README. It covers architecture,
data model, bundle mechanics, search, policy enforcement, consumer patterns,
and the contribution workflow in detail.

---

## Table of Contents

- [What the Registry Is](#what-the-registry-is)
- [Why It Matters](#why-it-matters)
- [Architecture](#architecture)
- [The Data Model](#the-data-model)
- [Bundle System](#bundle-system)
- [Derived Artifacts](#derived-artifacts)
- [Search and Discovery](#search-and-discovery)
- [Policy Enforcement](#policy-enforcement)
- [Health Reporting](#health-reporting)
- [Consumer Patterns](#consumer-patterns)
- [Contributing a Tool](#contributing-a-tool)
- [Versioning and Pinning](#versioning-and-pinning)
- [Security Model](#security-model)
- [FAQ](#faq)

---

## What the Registry Is

The MCP Tool Registry is a **metadata-only** package. It contains no
executable code. Its sole purpose is to describe every tool in the MCP Tool
Shop ecosystem: what it is called, where its source lives, how to install it,
and what capabilities it requires.

The canonical data lives in a single file -- `registry.json`. Everything else
in the package (bundles, search indexes, capability maps) is derived from that
file by deterministic build scripts that run at publish time.

The registry is published to npm as `@mcptoolshop/mcp-tool-registry`. Consumers
can import it as a regular dependency and get typed, schema-validated metadata
with zero runtime cost.

## Why It Matters

Decoupling metadata from implementation solves three problems at once.

**Discovery.** Clients can search, filter, and browse tools without cloning
every repository. The pre-built search index (`dist/registry.index.json`)
makes keyword lookup fast and offline-capable.

**Safety.** Every entry is validated against a JSON Schema before it can be
merged. Policy checks enforce ID format, description quality, and HTTPS-only
URLs. The least-privilege model means tools default to zero capabilities;
side-effects must be declared explicitly.

**Reproducibility.** By pinning a registry version in your workspace
configuration, you get deterministic metadata. The same `registry-ref` always
resolves to the same set of tool IDs, descriptions, and install URLs.

---

## Architecture

The registry follows a linear pipeline from human-edited source to
machine-consumable artifacts.

```
registry.json  (source of truth, hand-edited)
      |
      v
schema validation  (npm run validate)
      |
      v
policy checks  (npm run policy)
      |
      v
bundle generation  (npm run bundles:build)
      |
      v
derived artifacts  (npm run build:derived)
      |
      v
health report  (npm run report:health)
      |
      v
npm publish  (prepack runs the full pipeline)
```

### Build scripts

| Script          | Command                 | Purpose                                                     |
| :-------------- | :---------------------- | :---------------------------------------------------------- |
| `validate`      | `npm run validate`      | Check `registry.json` against `schema/registry.schema.json` |
| `policy`        | `npm run policy`        | Enforce ID format, description quality, HTTPS, tags         |
| `bundles:build` | `npm run bundles:build` | Generate bundle JSON files from rule definitions            |
| `build:derived` | `npm run build:derived` | Generate search index, capability map, build metadata       |
| `report:health` | `npm run report:health` | Run SLO checks and produce `dist/REGISTRY_HEALTH.md`        |
| `verify-pack`   | `npm run verify-pack`   | Ensure the npm tarball contains all required files          |
| `facets`        | `npm run facets`        | Display tag and ecosystem facet counts                      |
| `test:search`   | `npm run test:search`   | Run search integration tests                                |

The `prepack` hook chains `bundles:build`, `build:derived`, and `report:health`
so that every `npm publish` produces a fully up-to-date package.

---

## The Data Model

### Registry root

`registry.json` is a JSON object with these top-level fields:

| Field            | Type     | Description                             |
| :--------------- | :------- | :-------------------------------------- |
| `schema_version` | `string` | Schema version (currently `"0.3"`)      |
| `generated_at`   | `string` | ISO date when the file was last updated |
| `organization`   | `string` | Owning GitHub organization              |
| `tools`          | `array`  | The list of tool entries                |
| `archived`       | `array`  | Tools that have been removed (optional) |
| `ecosystems`     | `object` | Ecosystem definitions (optional)        |

### Tool entry

Each object in the `tools` array describes one tool.

**Required fields:**

| Field         | Type           | Rules                                                       |
| :------------ | :------------- | :---------------------------------------------------------- |
| `id`          | `string`       | Must match `^[a-z0-9]+(-[a-z0-9]+)*$` (lower-kebab-case)    |
| `name`        | `string`       | Human-readable display name                                 |
| `description` | `string`       | At least 10 characters, no "TODO" placeholders              |
| `repo`        | `string` (URI) | HTTPS GitHub repository URL                                 |
| `install`     | `object`       | Contains `type` (`"git"`), `url` (HTTPS URI), `default_ref` |
| `tags`        | `string[]`     | 1 or more searchable tags                                   |

**Optional fields:**

| Field                | Type                 | Purpose                                              |
| :------------------- | :------------------- | :--------------------------------------------------- |
| `defaults`           | `object`             | Default settings, e.g. `{ "safe_run": true }`        |
| `ecosystem`          | `string`             | Groups related tools (e.g., `"accessibility"`)       |
| `verification`       | `enum`               | Trust tier: `"none"`, `"community"`, or `"official"` |
| `deprecated`         | `boolean`            | Marks the tool as deprecated                         |
| `deprecated_at`      | `string` (date-time) | When the deprecation took effect                     |
| `sunset_at`          | `string` (date-time) | When the tool will be removed                        |
| `deprecation_reason` | `string`             | Why the tool was deprecated                          |
| `note`               | `string`             | Freeform annotation                                  |

### How IDs work

Tool IDs are the primary key of the registry. They are:

- **Immutable** once published. Renaming an ID is a breaking change.
- **Globally unique** across the entire registry.
- **Lower-kebab-case** enforced by both schema regex and policy checks.
- **Sorted alphabetically** in `registry.json` to minimize merge conflicts.

Examples: `file-compass`, `tool-scan`, `context-window-manager`.

---

## Bundle System

Bundles are opinionated subsets of the registry designed for common use cases.
They answer the question: "I want a working set of tools for X -- which ones
should I install?"

### Available bundles

| Bundle         | Description                                          | File                      |
| :------------- | :--------------------------------------------------- | :------------------------ |
| **core**       | Essential utilities for any workspace                | `bundles/core.json`       |
| **agents**     | Full agent stack: orchestration, navigation, context | `bundles/agents.json`     |
| **ops**        | DevOps, infrastructure, and deployment               | `bundles/ops.json`        |
| **evaluation** | Testing, benchmarking, and coverage                  | `bundles/evaluation.json` |

### Rules-based classification

Bundles are **not** manually curated lists. Each bundle has a rule file in
`bundles/rules/` that defines its membership criteria.

A rule file can use two selection strategies:

1. **Explicit IDs** -- list specific tool IDs to include.
2. **Tag matching** -- include any tool that has one or more matching tags
   (using an `OR` operator).

Both strategies can be combined in a single bundle. For example, the `agents`
bundle uses explicit IDs for foundational tools and tag matching for the
broader agent ecosystem.

Every bundle automatically excludes deprecated tools via the `exclude` block:

```json
{
  "exclude": {
    "deprecated": true
  }
}
```

### How bundles are built

The `npm run bundles:build` script reads each rule file, evaluates it against
`registry.json`, and writes the resulting tool list to the corresponding
`bundles/*.json` file. This runs automatically during `prepack`.

### Using bundles

```javascript
// Import a bundle as an npm subpath export
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }

// Each bundle contains a tools array with full tool entries
coreBundle.tools.forEach(tool => {
  console.log(`${tool.id}: ${tool.description}`)
})
```

From the CLI: `mcpt install --bundle core`.

---

## Derived Artifacts

The `dist/` directory contains artifacts generated from `registry.json` by the
`build:derived` script. These are optimized for machine consumption and ship
inside the npm package.

### registry.index.json

A flat array of lightweight tool records optimized for search. Each record
contains:

- `id`, `name`, `description` -- from the source entry.
- `verification` -- trust tier.
- `keywords` -- tokenized from the name and description for full-text search.
- `tags` -- copied from the source entry.
- `bundle_membership` -- which bundles the tool belongs to.
- `capabilities` -- declared capabilities (if any).

This is the artifact that the Public Explorer and `mcpt search` consume.

### capabilities.json

A reverse lookup map from capability names to arrays of tool IDs. This lets a
client answer the question "which tools need network access?" in O(1).

### derived.meta.json

Build metadata for the current publish:

```json
{
  "generated_at": "2026-02-15T06:54:30.759Z",
  "registry_hash": "8c20f60f...",
  "schema_version": "0.3",
  "registry_version": "1.0.0",
  "tool_count": 48,
  "commit_sha": "e54d10d4..."
}
```

Consumers can use `registry_hash` to detect whether their cached copy is
current without downloading the full registry.

### registry.llms.txt

A plain-text rendering of the registry designed for LLM retrieval-augmented
generation (RAG) pipelines. Feed this file into an AI context window to give
the model awareness of available tools.

---

## Search and Discovery

### The search index

`dist/registry.index.json` is the primary search artifact. It is generated by
tokenizing each tool's `name` and `description` into a `keywords` array.
Tokenization splits on whitespace, lowercases, and removes stopwords.

### Keyword matching

The simplest search pattern is keyword filtering:

```javascript
import index from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const results = index.filter(tool =>
  tool.keywords.some(kw => kw.includes("compliance"))
)
```

### Tag filtering

Tags are curated labels assigned by the tool author. They are more precise
than keywords:

```javascript
const securityTools = index.filter(tool => tool.tags.includes("security"))
```

### Facets

The `npm run facets` script produces a breakdown of how many tools exist per
tag and per ecosystem. This is useful for understanding registry composition
and spotting gaps.

### CLI search

The `scripts/query.mjs` script provides a command-line search interface:

```bash
node scripts/query.mjs --q "accessibility"
```

### Web Explorer

The [Public Explorer](https://mcp-tool-shop-org.github.io/mcp-tool-registry/)
provides a browser-based search and browsing experience backed by the same
`registry.index.json` artifact.

---

## Policy Enforcement

The `npm run policy` script (`scripts/policy-check.mjs`) enforces data quality
rules that go beyond schema validation. Policy checks run in CI on every PR
and as part of the local `npm run lint` pipeline.

### Current policy rules

| Rule                    | What it checks                                        |
| :---------------------- | :---------------------------------------------------- |
| **ID format**           | Must be lower-kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`) |
| **Description quality** | At least 10 characters; must not contain "TODO"       |
| **HTTPS enforcement**   | `repo` and `install.url` must start with `https://`   |
| **Tag presence**        | At least one tag is required (enforced by schema)     |

Policy violations cause a non-zero exit code, which fails CI.

### When to use policy vs. schema

- **Schema** validates structural correctness: required fields exist, types
  are correct, enums match.
- **Policy** validates semantic quality: descriptions are meaningful, URLs are
  secure, IDs follow convention.

Both must pass before a PR can be merged.

---

## Health Reporting

The `npm run report:health` script produces a health report at
`dist/REGISTRY_HEALTH.md`. When run with `--check-slo`, it also enforces
service-level objectives and exits non-zero if any SLO is violated.

### What health checks cover

- **Tool count** -- is the registry growing or shrinking?
- **Deprecation ratio** -- what percentage of tools are deprecated?
- **Schema compliance** -- do all entries pass validation?
- **Tag coverage** -- are there tools with no tags?
- **Description quality** -- are there tools with placeholder descriptions?

The health report runs as part of `prepack`, so every published version has
a verified health status.

---

## Consumer Patterns

### Pattern 1: Import the full registry

Best for tools that need access to every tool entry.

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

for (const tool of registry.tools) {
  console.log(`${tool.id} -> ${tool.repo}`)
}
```

### Pattern 2: Import a bundle

Best for installing a curated set of tools for a specific use case.

```javascript
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }

// agents.tools contains only agent-related tools
```

### Pattern 3: Use the search index

Best for building search UIs, CLIs, or recommendation engines.

```javascript
import index from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

function search(query) {
  const terms = query.toLowerCase().split(/\s+/)
  return index.filter(tool =>
    terms.every(term => tool.keywords.some(kw => kw.includes(term)))
  )
}
```

### Pattern 4: Use the capability map

Best for permission-aware tool selection.

```javascript
import caps from "@mcptoolshop/mcp-tool-registry/dist/capabilities.json" with { type: "json" }

// Find all tools that require network access
const networkTools = caps["network"] || []
```

### Pattern 5: Use build metadata for caching

Best for clients that poll for updates.

```javascript
import meta from "@mcptoolshop/mcp-tool-registry/dist/derived.meta.json" with { type: "json" }

if (meta.registry_hash !== cachedHash) {
  // Registry has changed, re-fetch
}
```

### Pattern 6: LLM context injection

Best for AI agents that need to discover tools at runtime.

```
# In your system prompt or RAG pipeline, include:
dist/registry.llms.txt
```

This gives the model a plain-text view of all available tools, their
descriptions, and tags.

---

## Contributing a Tool

### Prerequisites

- Your tool implements the [Model Context Protocol](https://modelcontextprotocol.io).
- Your tool's source code is hosted on GitHub under HTTPS.
- You have read the [Registry Guidelines](docs/registry-guidelines.md).

### Step-by-step

1. **Fork** this repository.

2. **Add your tool** to the `tools` array in `registry.json`. Keep the array
   sorted alphabetically by `id`.

   ```json
   {
     "id": "my-new-tool",
     "name": "My New Tool",
     "description": "A clear, specific description of what this tool does",
     "repo": "https://github.com/mcp-tool-shop-org/my-new-tool",
     "install": {
       "type": "git",
       "url": "https://github.com/mcp-tool-shop-org/my-new-tool.git",
       "default_ref": "main"
     },
     "tags": ["utility", "search"],
     "defaults": { "safe_run": true }
   }
   ```

3. **Validate locally:**

   ```bash
   npm install
   npm run validate
   npm run policy
   ```

4. **Format your changes:**

   ```bash
   npm run format
   ```

5. **Submit a Pull Request.** CI will run schema validation, policy checks,
   and the health report. All must pass before merge.

### Common mistakes

- **ID not lower-kebab-case.** Use `my-tool`, not `myTool` or `My_Tool`.
- **Description too short.** Must be at least 10 characters.
- **HTTP URL.** Both `repo` and `install.url` must be HTTPS.
- **Unsorted entry.** Keep `tools` sorted by `id` to reduce merge conflicts.
- **Missing tags.** At least one tag is required.

### Bundle membership

You do not manually add your tool to a bundle. Bundle membership is determined
automatically by the rules in `bundles/rules/`. If your tool has tags that
match a bundle's tag rules (e.g., `testing` for the `evaluation` bundle), it
will be included automatically at the next build.

---

## Versioning and Pinning

### Registry versioning

The registry follows [Semantic Versioning](https://semver.org/):

- **Major** (e.g., 1.0.0 to 2.0.0): Breaking changes to required schema
  fields, removal of exports, or changes to the structure of derived artifacts.
- **Minor** (e.g., 1.0.0 to 1.1.0): New optional fields, new bundles, new
  derived artifacts, documentation improvements.
- **Patch** (e.g., 1.0.0 to 1.0.1): Tool additions/removals, description
  edits, tag changes, bug fixes in build scripts.

### What "pinning" means

When you configure `registry-ref: v1.0.0` in your workspace, you lock the
**registry metadata** to that version. This gives you:

- A fixed set of tool IDs and descriptions.
- A fixed set of install URLs and default refs.
- A fixed set of bundle compositions.

It does **not** pin the tool source code. Each tool has its own `default_ref`
(usually `main`), which resolves to whatever commit is current. To pin a
specific tool version, use `mcpt add tool-id --ref v2.0.0`.

### Registry ref vs. tool ref

| Concept          | Controls                                        | Example                              |
| :--------------- | :---------------------------------------------- | :----------------------------------- |
| **Registry ref** | Which version of `registry.json` you read       | `registry-ref: v1.0.0`               |
| **Tool ref**     | Which commit/tag of the tool source you install | `mcpt add file-compass --ref v3.1.0` |

### Upgrade path

To upgrade your registry version:

1. Review the [CHANGELOG](CHANGELOG.md) for breaking changes.
2. Update `registry-ref` in your workspace config.
3. Run `mcpt sync` to pick up new or changed tools.

---

## Security Model

### Least privilege

Every tool in the registry defaults to **zero capabilities**. A tool cannot
read files, access the network, or execute commands unless those capabilities
are explicitly declared in its registry entry and accepted by the user at
install time.

### Explicit opt-in

The `defaults` field in each tool entry declares the tool's default posture.
Setting `safe_run: true` means the tool is designed to run without side
effects. Tools that need elevated access must declare it, and the CLI prompts
the user before granting it.

### Verification tiers

The `verification` field indicates how much review a tool has received:

| Tier        | Meaning                                       |
| :---------- | :-------------------------------------------- |
| `none`      | No review beyond schema validation            |
| `community` | Reviewed and vouched for by community members |
| `official`  | Maintained by the MCP Tool Shop organization  |

Consumers can filter by verification tier to control their risk exposure.

### HTTPS enforcement

Both `repo` and `install.url` must use HTTPS. This is enforced by policy
checks in CI. HTTP URLs are rejected.

### Schema as a security boundary

The JSON Schema (`schema/registry.schema.json`) prevents injection of
unexpected fields via `additionalProperties: false` on all objects. This
ensures that the registry cannot be used to smuggle arbitrary data.

---

## FAQ

**Q: Is this a package manager?**
No. The registry is metadata only. The `mcpt` CLI is the package manager. The
registry tells `mcpt` where to find tools; `mcpt` handles installation,
isolation, and execution.

**Q: Can I use this without mcpt?**
Yes. The registry is a standard npm package. You can import `registry.json`
directly and build your own tooling on top of it.

**Q: How do I know if a tool is safe?**
Check the `verification` field and the `defaults.safe_run` flag. Tools with
`verification: "official"` and `safe_run: true` have the highest trust level.

**Q: How often is the registry updated?**
Tool additions and updates are merged via Pull Request on a rolling basis.
Versioned releases (npm publishes) happen when meaningful changes accumulate.

**Q: What happens when a tool is deprecated?**
It stays in `registry.json` with `deprecated: true` and an optional
`deprecation_reason`. It is automatically excluded from all bundles. Clients
can filter it out using the `deprecated` flag.

**Q: Can I host my own registry?**
The schema is open. You can fork this repository, replace the tool entries,
and publish your own registry package. The build tooling is generic.

**Q: How do bundle rules work?**
Each bundle has a rule file in `bundles/rules/`. Rules can match by explicit
tool ID or by tag. The build script evaluates the rules against `registry.json`
and writes the result to `bundles/*.json`. This is fully deterministic: the
same `registry.json` always produces the same bundles.

**Q: What is `dist/registry.llms.txt`?**
A plain-text rendering of the registry designed for LLM context windows. If
you are building an AI agent and want it to know what tools are available,
include this file in your system prompt or RAG pipeline.

**Q: How do I report a security issue?**
See [SECURITY.md](SECURITY.md) for the responsible disclosure process.
