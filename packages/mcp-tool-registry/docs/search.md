# Registry Search & Discovery

The MCP Tool Registry includes built-in tools for searching and discovering tools.

## Quick Start

```bash
# Search by keyword
node scripts/query.mjs --q "accessibility"

# Filter by bundle
node scripts/query.mjs --bundle core

# List top tags and stats
node scripts/facets.mjs
```

## CLI Usage

### `scripts/query.mjs`

Searches the registry index.

| Option            | Description                 | Example                    |
| :---------------- | :-------------------------- | :------------------------- |
| `--q <text>`      | Keyword search (ranked)     | `--q "testing"`            |
| `--id <id>`       | Filter by exact ID          | `--id accessibility-suite` |
| `--tag <tag>`     | Filter by tag               | `--tag monorepo`           |
| `--bundle <name>` | Filter by bundle            | `--bundle core`            |
| `--cap <name>`    | Filter by capability        | `--cap read-resource`      |
| `--json`          | Output JSON instead of text | `--json`                   |
| `--explain`       | Show why a result matched   | `--explain`                |

### `scripts/facets.mjs`

Displays high-level registry statistics.

- Top Tags
- Bundle Counts
- Ecosystem Breakdown
- Totals

## Ranking Logic

When using `--q`, results are ranked by:

1. **Exact ID Match**: 100 points
2. **Exact Keyword Match**: 50 points
3. **Prefix Match**: 30 points
4. **Description Match**: 10 points
5. **Partial Keyword Match**: 5 points

Use `--explain` to see the breakdown for any result.
