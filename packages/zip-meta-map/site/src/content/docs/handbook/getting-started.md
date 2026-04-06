---
title: Getting Started
description: Install Zip Meta Map and generate your first metadata bundle.
sidebar:
  order: 1
---

Zip Meta Map turns a ZIP archive or folder into a guided, LLM-friendly metadata bundle. This guide covers installation and your first build.

## Installation

Install from PyPI:

```bash
pip install zip-meta-map
```

Or with pipx for isolated installs:

```bash
pipx install zip-meta-map
```

## Your first build

Generate metadata for any folder:

```bash
zip-meta-map build my-project/ -o output/
```

This produces two files:
- `META_ZIP_FRONT.md` — Human-readable orientation page
- `META_ZIP_INDEX.json` — Machine-readable index with roles, confidence scores, traversal plans, and more

## Explain mode

See what the tool detected without writing files:

```bash
zip-meta-map explain my-project/
```

This prints the detected profile, top files to read first (with roles and confidence), and an overview traversal plan with byte budgets.

## ZIP archives

Works on ZIP files too — no need to extract first:

```bash
zip-meta-map build archive.zip -o output/
```

## MCP server

For AI agents, install with MCP support:

```bash
pip install 'zip-meta-map[mcp]'
zip-meta-map serve
```

This exposes `build_metadata`, `explain`, `diff_metadata`, `compare_repos`, and `validate_index` as MCP tools.

## Next steps

- Learn all [CLI commands](/zip-meta-map/handbook/cli-reference/)
- Understand [profiles and role classification](/zip-meta-map/handbook/profiles/) (7 built-in profiles)
- Explore [progressive disclosure](/zip-meta-map/handbook/progressive-disclosure/) features
