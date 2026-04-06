---
title: CLI Reference
description: All zip-meta-map commands — build, explain, diff, compare, benchmark, validate, serve.
sidebar:
  order: 2
---

Zip Meta Map provides seven commands: `build`, `explain`, `diff`, `compare`, `benchmark`, `validate`, and `serve`.

## build

Generate metadata for a folder or ZIP archive:

```bash
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/
```

### Output options

```bash
# Include step summary and detailed report
zip-meta-map build . -o output/ --summary --report md

# JSON to stdout (for piping)
zip-meta-map build . --format json

# One JSON line per file (NDJSON)
zip-meta-map build . --format ndjson

# Skip FRONT.md, only write INDEX.json
zip-meta-map build . --manifest-only
```

### Policy overrides

Apply custom role assignments and rules:

```bash
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## explain

Print what the tool detected without writing any files:

```bash
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json
```

Shows the detected profile, top files to read first, and a traversal plan with byte budgets.

## diff

Compare two metadata indices — useful in CI to detect structural changes:

```bash
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes
```

## compare

Compare indexes from different repos to find structural similarities (archetype matching):

```bash
zip-meta-map compare repo-a.json repo-b.json         # similarity scores
zip-meta-map compare repo-a.json repo-b.json --json   # JSON output
zip-meta-map compare repo-a.json repo-b.json --exit-code  # exit 1 if similarity < 0.5
```

Reports overall similarity (0-100%), broken down into:
- **Role similarity** — cosine similarity on role distributions
- **Structure similarity** — shared filenames and directory patterns
- **Plan similarity** — shared traversal plan names

Archetype classification: `near_identical` (85%+), `same_archetype` (65%+), `related` (40%+), `different`.

## benchmark

Measure performance on a directory:

```bash
zip-meta-map benchmark path/to/repo             # 3 runs per phase
zip-meta-map benchmark path/to/repo --runs 5    # 5 runs
zip-meta-map benchmark path/to/repo --cache     # include incremental scan
zip-meta-map benchmark path/to/repo --json      # JSON output
```

Reports timing for: scan, role assignment, index build, front generation, validation, and end-to-end.

## validate

Check an existing index file against the schema:

```bash
zip-meta-map validate META_ZIP_INDEX.json
```

## serve

Start the MCP server for AI agent consumption:

```bash
pip install 'zip-meta-map[mcp]'
zip-meta-map serve
```

Exposes 5 MCP tools: `build_metadata`, `explain`, `diff_metadata`, `compare_repos`, `validate_index`.

## Generated files

| File | Purpose |
|------|---------|
| `META_ZIP_FRONT.md` | Human-readable orientation page |
| `META_ZIP_INDEX.json` | Machine-readable index (roles, confidence, plans, chunks, excerpts, risk flags) |
| `META_ZIP_REPORT.md` | Detailed browseable report (with `--report md`) |
