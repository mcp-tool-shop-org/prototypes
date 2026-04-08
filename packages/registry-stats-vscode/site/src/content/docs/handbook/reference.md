---
title: Reference
description: Commands, registries, report formats, settings, and export options.
sidebar:
  order: 2
---

## Commands

| Command | Description |
|---------|-------------|
| `Registry Stats: Generate Report` | Guided report generation (audience then output) |
| `Registry Stats: Refresh Stats` | Clear cache and re-fetch all data |
| `Registry Stats: Open Sidebar` | Focus the sidebar panel |
| `Registry Stats: Copy Executive Summary` | Quick-copy executive report |
| `Registry Stats: Copy LLM Log (JSONL)` | Quick-copy LLM report |
| `Registry Stats: Copy Dev Log (Markdown)` | Quick-copy dev report |
| `Registry Stats: Refresh CodeLens` | Re-fetch inline CodeLens stats |

## Supported registries

| Registry | Data available | Auth needed |
|----------|---------------|-------------|
| **npm** | Daily, weekly, monthly downloads | No |
| **PyPI** | Daily, weekly, monthly, all-time | No |
| **NuGet** | All-time total | No |
| **VS Code Marketplace** | All-time installs, ratings | No |
| **Docker Hub** | All-time pulls | Optional (raises rate limits) |

### Registry-specific notes

- **npm** has rate limits — bulk queries may receive HTTP 429 responses. The extension spaces out requests automatically (controlled by `maxConcurrentRequests`).
- **VS Code Marketplace** and **NuGet** only report all-time totals, not weekly or monthly breakdowns.
- **Docker Hub** requires a token (`registryStats.dockerToken`) only to raise rate limits. Public pull counts are available without auth.

## Report formats

### Executive (PDF)

One-page report with KPIs, top packages by downloads, and risk indicators (declining trends, unmaintained dependencies). Generated with pdfmake — no browser engine required, works everywhere.

### LLM (JSONL)

Schema-versioned, provenance-tagged, streaming-friendly format. One JSON object per line. Includes `freshness_hours` and `source_registry` so LLMs can reason about data quality.

```
{"type":"header","schema_version":"1.0","run_id":"...","workspace":{...}}
{"type":"package","registry":"npm","name":"express","downloads":{...},"freshness_hours":0.5}
{"type":"summary","total":48,"succeeded":45,"failed":3,"duration_ms":2100}
```

### Dev (Markdown)

Structured per-package table with collapsible raw trace and error listing. Designed for pasting into GitHub issues, PRs, or internal documentation. Includes run summary, registry breakdown, manifest scan details, and structured error hints.

## Manifest detection

| Manifest | Registry | What's scanned |
|----------|----------|----------------|
| `package.json` | npm | `dependencies`, `devDependencies`. If it has `publisher` + `engines.vscode`, the primary is detected as a VS Code extension. |
| `pyproject.toml` | PyPI | `[project].dependencies`, `[tool.poetry.dependencies]` |
| `*.csproj` | NuGet | `<PackageReference>` elements |

## Settings

### Core

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.enabledRegistries` | All five | Which registries to query (array of `npm`, `pypi`, `nuget`, `vscode`, `docker`) |
| `registryStats.cacheTtlHours` | `{ npm: 6, pypi: 6, nuget: 12, vscode: 12, docker: 24 }` | Cache TTL in hours per registry |
| `registryStats.maxConcurrentRequests` | `3` | Max parallel registry requests (1–10) |

### Display

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.statusBar.enabled` | `true` | Show download stats in the status bar |
| `registryStats.hover.enabled` | `true` | Show stats on hover over dependencies |

### CodeLens (inline stats)

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.codeLens.enabled` | `false` | Show inline download stats above dependencies (opt-in) |
| `registryStats.codeLens.maxPerFile` | `50` | Max CodeLens items per file (1–500, prevents lag on large manifests) |
| `registryStats.codeLens.showFreshness` | `true` | Show cache age in CodeLens text |
| `registryStats.codeLens.showTrend` | `true` | Show trend arrow when confidence ≥ 0.7 |
| `registryStats.codeLens.refreshOnSave` | `false` | Auto-refresh CodeLens data when file is saved |

### My Packages

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.myPackages.manual` | `[]` | Manually specified packages to track (`{ registry, name }` objects) |
| `registryStats.myPackages.identities.npm` | `[]` | npm usernames — discovers all packages by each user |
| `registryStats.myPackages.identities.vscode` | `[]` | VS Code Marketplace publisher IDs — discovers all extensions |
| `registryStats.myPackages.identities.docker` | `[]` | Docker Hub namespaces — discovers all repositories |

### Dev logging

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.devLogging.enabled` | `false` | Enable dev-level trace logging in reports |
| `registryStats.devLogging.level` | `info` | Trace verbosity (`info` or `debug`) |

### Auth

| Setting | Default | Description |
|---------|---------|-------------|
| `registryStats.dockerToken` | `""` | Docker Hub token to raise rate limits |

## Caching

Stats are cached in VS Code's `globalState` (persists across restarts). Each registry has its own TTL. The extension uses **stale-while-revalidate**: if cached data exists but is stale, it's returned immediately while a background refresh runs. This keeps the UI responsive.

## Data flow

1. Extension scans workspace for package manifests
2. Extracts dependency names and versions
3. Queries each registry's public API (no auth for npm/PyPI/NuGet/VS Code)
4. Caches results locally for the configured TTL
5. Displays in status bar, hover tooltips, CodeLens, and sidebar

## Security and data scope

- **Read-only** — the extension only reads package manifests and fetches public API data
- **No workspace modifications** — no files are written except exported reports (user-initiated)
- **No telemetry** collected or sent
- Network access is limited to registry APIs (registry.npmjs.org, pypi.org, api.nuget.org, marketplace.visualstudio.com, hub.docker.com)
