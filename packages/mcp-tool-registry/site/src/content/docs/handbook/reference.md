---
title: Reference
description: Schema versioning, security scope, and ecosystem links.
sidebar:
  order: 4
---

## Schema versioning

The v1 contract is stable:

- New optional fields may be added in minor versions
- Required fields and existing field shapes will not change within a major version
- The schema version is declared in `registry.json` and validated in CI

## Security & data scope

This is a **data-only** package — no executable code ships.

| Aspect               | Detail                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| **Data touched**     | Tool names, descriptions, tags, and repo URLs in `registry.json`; derived search indices in `dist/` |
| **Data NOT touched** | No user files, no OS credentials, no network requests at runtime                                    |
| **Telemetry**        | None collected or sent                                                                              |

## Ecosystem

| Package                                                                                                | Role                                               |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| [mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)                                                  | Official client — discover, install, and run tools |
| [Public Explorer](https://mcp-tool-shop-org.github.io/mcp-tool-registry/)                              | Browse available tools on the web                  |
| [Registry Contract](https://github.com/mcp-tool-shop-org/mcp-tool-registry/blob/main/docs/contract.md) | Stability and metadata guarantees                  |
| [Submit a Tool](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)              | Contribute to the ecosystem                        |

## Import paths

```javascript
// Full registry
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

// Individual bundles
import core from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
import ops from "@mcptoolshop/mcp-tool-registry/bundles/ops.json" with { type: "json" }
import evaluation from "@mcptoolshop/mcp-tool-registry/bundles/evaluation.json" with { type: "json" }

// Derived artifacts
import index from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }
import caps from "@mcptoolshop/mcp-tool-registry/dist/capabilities.json" with { type: "json" }
import meta from "@mcptoolshop/mcp-tool-registry/dist/derived.meta.json" with { type: "json" }
```

All JSON imports require the `with { type: "json" }` import attribute in ESM contexts (Node 22+, modern bundlers).

## Health report and SLO gates

The registry includes a health report system that tracks quality metrics and enforces service-level objectives:

```bash
# Generate the health report (JSON + Markdown)
npm run report:health

# Generate and enforce SLO gates (used in CI)
npm run report:health -- --check-slo
```

SLO gates enforced in CI:

| Gate                                | Threshold      | Severity             |
| ----------------------------------- | -------------- | -------------------- |
| Missing `description` or `repo`     | > 5% of tools  | Error (blocks merge) |
| Missing `tags` or `ecosystem`       | > 10% of tools | Warning              |
| Description quality issues          | > 5% of tools  | Error (blocks merge) |
| Deprecated tool budget              | > 20% of tools | Error (blocks merge) |
| Core bundle present and non-trivial | < 5 tools      | Warning              |

Reports are written to `dist/registry.report.json` (machine-readable) and `dist/REGISTRY_HEALTH.md` (human-readable).

## Lifecycle policy

Tools follow a three-stage lifecycle: **Active**, **Deprecated**, and **Removed (Archived)**.

To deprecate a tool, add these fields to its entry in `registry.json`:

- `deprecated: true` (required)
- `deprecation_reason` (required) — why the tool is deprecated
- `deprecated_at` (required) — ISO 8601 date when the deprecation took effect
- `sunset_at` (optional) — ISO 8601 date when the tool will be removed from the registry

Deprecated tools remain in the registry indefinitely unless `sunset_at` is set. After sunset, a tool may be moved to the `archived` array. Retired tool IDs are never reused.
