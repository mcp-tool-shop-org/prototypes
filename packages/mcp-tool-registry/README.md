<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**The metadata-only registry — the single source of truth for all MCP Tool Shop tools.**

Schema-validated on every commit. Opinionated bundles built by rules. Pre-built search index ships in the package. Pin a version, get deterministic metadata every time.

## Quick Start

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## At a Glance

- **Data-only** — no executable code, just JSON metadata for every tool in the ecosystem
- **Schema-validated** — every entry checked against JSON Schema on commit and in CI
- **Bundle system** — tools grouped into opinionated bundles (`core`, `agents`, `ops`, `evaluation`) by rules, not manual curation
- **Fast discovery** — pre-built search index with keywords and facets ships inside the package
- **Least privilege** — tools default to zero capabilities; side-effects are opt-in and declared explicitly
- **Reproducible** — pin a registry version and get deterministic metadata every time

## Consumers

### Full registry

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### Bundles

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Available bundles: `core`, `agents`, `ops`, `evaluation`.

### Search index

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### LLM context

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Bundles

| Bundle         | Description                              | Selection logic                                          |
| -------------- | ---------------------------------------- | -------------------------------------------------------- |
| **core**       | Essential utilities                      | Explicit ID list                                         |
| **agents**     | Agent orchestration, navigation, context | Explicit IDs + `agents` tag                              |
| **ops**        | DevOps, infrastructure, deployment       | Tags: `automation`, `packaging`, `release`, `monitoring` |
| **evaluation** | Testing, benchmarking, coverage          | Tags: `testing`, `evaluation`, `benchmark`, `coverage`   |

## Structure

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## Adding a Tool

1. Read [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. Add an entry to `registry.json` (keep sorted by `id`)
3. Run `npm run validate` and `npm run policy`
4. Submit a Pull Request

## Versioning

The v1 contract is stable. New optional fields may be added in minor versions; required fields and existing field shapes will not change within a major version.

## Security & Data Scope

This is a **data-only** package — no executable code ships. Consumers import JSON metadata.

- **Data touched:** tool names, descriptions, tags, and repo URLs in `registry.json`; derived search indices in `dist/`
- **Data NOT touched:** no user files, no OS credentials, no network requests at runtime
- **No telemetry** is collected or sent — see [SECURITY.md](SECURITY.md) for the full policy

## Ecosystem

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** — discover, install, and run tools
- **[Submit a Tool](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** — add your tool to the ecosystem

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
