---
title: Output Formats
description: JSON, SARIF, compact, and streaming output options.
sidebar:
  order: 3.2
---

Tool-Scan supports multiple output formats for different use cases.

## Text (default)

Human-readable output with scores, grades, and remarks:

```bash
tool-scan my_tool.json
```

## JSON

Structured output for automation and downstream processing:

```bash
tool-scan --json my_tool.json > report.json
# or
tool-scan --format json my_tool.json > report.json
```

The JSON output includes `results` (keyed by tool name), `summary` (counts and averages), and `errors` (file-level errors).

### Output schema

Print the formal JSON Schema (2020-12) that defines the output structure:

```bash
tool-scan --output-schema
```

Use this to validate tool-scan output in CI or generate types for downstream code.

## SARIF

[SARIF v2.1.0](https://sarifweb.azurewebsites.net/) output for integration with GitHub Code Scanning, Azure DevOps, and VS Code SARIF Viewer:

```bash
tool-scan --format sarif tools/*.json > results.sarif
```

SARIF maps:
- Security threats to SARIF results with severity levels
- Compliance failures to SARIF results with fix suggestions
- Quality remarks to SARIF note-level results
- Rules are deduplicated across all scanned tools

Upload to GitHub Code Scanning:

```yaml
- name: Scan
  run: tool-scan --format sarif tools/*.json > results.sarif

- name: Upload SARIF
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

## Compact JSON

Single-line JSON output, approximately 50% smaller than pretty-printed JSON:

```bash
tool-scan --json --compact-json tools/*.json
```

Works with both `--json` and `--format json`. Useful for log ingestion pipelines where compact output matters.

## Streaming JSON

Incremental JSON writing with periodic flush, reducing peak memory for large batches:

```bash
tool-scan --json --stream tools/*.json
```

The output is still valid, parseable JSON. Streaming mode writes results incrementally rather than buffering the entire output in memory.

Combine with compact mode for minimal memory and output size:

```bash
tool-scan --json --stream --compact-json tools/*.json
```

## Concurrent scanning

Process multiple files in parallel with `--jobs`:

```bash
tool-scan --jobs 4 --json tools/*.json
```

Output is deterministic regardless of the number of threads — the same input always produces the same output order. `--jobs 1` (the default) matches sequential behavior exactly.
