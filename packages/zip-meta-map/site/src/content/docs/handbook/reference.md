---
title: Reference
description: Quick reference for Zip Meta Map commands and output files.
sidebar:
  order: 5
---

## Commands

| Command | Description |
|---------|-------------|
| `zip-meta-map build <path> -o <dir>` | Generate metadata for a folder or ZIP |
| `zip-meta-map explain <path>` | Print detected profile and top files |
| `zip-meta-map diff <old> <new>` | Compare two indices (same repo over time) |
| `zip-meta-map compare <left> <right>` | Compare two indices (different repos) |
| `zip-meta-map benchmark <path>` | Measure performance per phase |
| `zip-meta-map validate <index>` | Validate an index against the schema |
| `zip-meta-map serve` | Start the MCP server |

## Build flags

| Flag | Description |
|------|-------------|
| `-o <dir>` | Output directory |
| `-p <profile>` | Force profile (python_cli, node_ts_tool, rust_cli, go_cli, dotnet_cli, java_cli, monorepo) |
| `--summary` | Include step summary |
| `--report md` | Generate detailed report |
| `--format json` | JSON to stdout |
| `--format ndjson` | One JSON line per file |
| `--manifest-only` | Skip FRONT.md |
| `--policy <file>` | Apply policy overrides |

## Output files

| File | Format | Purpose |
|------|--------|---------|
| `META_ZIP_FRONT.md` | Markdown | Human-readable orientation |
| `META_ZIP_INDEX.json` | JSON | Machine-readable index |
| `META_ZIP_REPORT.md` | Markdown | Detailed browseable report |

## MCP tools

| Tool | Description |
|------|-------------|
| `build_metadata` | Generate metadata bundle from directory/ZIP |
| `explain` | Get guided navigation plan with start-here list |
| `diff_metadata` | Compare metadata between archives |
| `compare_repos` | Cross-repo archetype matching |
| `validate_index` | Validate index against schema |

Install with `pip install 'zip-meta-map[mcp]'`.

## GitHub Action

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v1
  with:
    path: .
```

Outputs: `index-path`, `front-path`, `profile`, `file-count`, `warnings-count`. Set `pr-comment: 'true'` for PR summaries.

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/zip-meta-map)
- [PyPI Package](https://pypi.org/project/zip-meta-map/)
- [Specification (v0.2)](https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/docs/SPEC.md)
