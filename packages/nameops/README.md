<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Name clearance orchestrator for the [clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine).

Turns a canonical name list into batch clearance runs, published artifacts, and human-readable PR summaries.

## How it works

1. `data/names.txt` holds the canonical list of names to check
2. `data/profile.json` holds default COE CLI flags (channels, risk, concurrency, etc.)
3. `src/run.mjs` orchestrates: COE batch, publish, validate
4. `src/build-pr-body.mjs` generates a Markdown PR body with tier summaries, collision cards, and cost stats
5. The marketing repo's scheduled workflow calls this logic and opens PRs with ingested artifacts

## Usage

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## Configuration

### `data/names.txt`

One name per line. Lines starting with `#` are comments. Max 500 names.

### `data/profile.json`

| Field | COE Flag | Default |
|-------|----------|---------|
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 days) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | workflow timeout | `15` |

## Output

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## Architecture

NameOps is an orchestrator, not a service. It owns no data model and has no runtime dependencies beyond the COE CLI. The marketing repo owns the schedule (per CLAUDE.md rules); nameops owns the logic.

## Tests

```bash
npm test
```

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Name lists (`data/names.txt`). Profile config. Clearance result artifacts |
| **Data NOT touched** | No telemetry. No analytics. No user data collected |
| **Permissions** | Read: name lists, profile. Write: result artifacts, PR body output |
| **Network** | Delegates to clearance-opinion-engine for external lookups |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT
