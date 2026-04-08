---
title: CI Integration
description: Using Tool-Scan in GitHub Actions and pre-commit hooks.
sidebar:
  order: 5
---

Tool-Scan is designed for CI/CD pipelines. Gate deployments on tool safety with standard exit codes and structured output.

## GitHub Actions

Add a scan step to your workflow:

```yaml
name: Tool-Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Tool-Scan
        run: pip install tool-scan

      - name: Scan MCP Tools
        run: |
          tool-scan \
            --strict \
            --min-score 80 \
            --json \
            tools/*.json > scan-report.json

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: scan-report
          path: scan-report.json
```

The `--strict` flag causes the step to fail if any security issue is found. The `--min-score` flag sets a minimum score threshold.

## GitHub Code Scanning (SARIF)

Upload SARIF reports directly to GitHub Code Scanning for inline security annotations on pull requests:

```yaml
name: Tool-Scan SARIF

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Tool-Scan
        run: pip install tool-scan

      - name: Scan MCP Tools
        run: tool-scan --format sarif tools/*.json > results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

Security findings appear as annotations in the GitHub Security tab and on pull request diffs.

## Pre-commit hook

Add to your `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: tool-scan
        name: Tool-Scan
        entry: tool-scan --strict
        language: python
        files: '\.json$'
        types: [json]
```

This scans every JSON file on commit and blocks the commit if any tool fails.

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | All tools passed |
| 1 | One or more tools failed |
| 2 | Error loading files |

Standard Unix conventions — use these in shell scripts and pipeline conditions.
