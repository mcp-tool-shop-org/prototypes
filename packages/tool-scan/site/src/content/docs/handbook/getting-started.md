---
title: Getting Started
description: Install Tool-Scan and run your first security scan.
sidebar:
  order: 1
---

Tool-Scan scans MCP tool definitions for security vulnerabilities, MCP spec compliance, and quality issues. This guide covers installation and your first scan.

## Installation

Install from PyPI:

```bash
pip install tool-scan
```

## Your first scan

### Command line

Scan a single tool definition file:

```bash
tool-scan my_tool.json
```

The output shows the score, letter grade, and any remarks with actionable recommendations.

### Strict mode for CI

Use `--strict` to fail on any security issue, and `--min-score` to set a threshold:

```bash
tool-scan --strict --min-score 80 tools/*.json
```

### JSON output

For automation and downstream processing:

```bash
tool-scan --json my_tool.json > report.json
```

### SARIF output

For GitHub Code Scanning and other SARIF-compatible tools:

```bash
tool-scan --format sarif tools/*.json > results.sarif
```

### Concurrent scanning

Process multiple files in parallel with `--jobs`:

```bash
tool-scan --jobs 4 --json tools/*.json
```

### Compact and streaming

For large batches, reduce output size or memory usage:

```bash
# Compact JSON (~50% smaller, single line)
tool-scan --json --compact-json tools/*.json

# Streaming JSON (low peak memory)
tool-scan --json --stream tools/*.json
```

## Python API

You can also scan tools programmatically:

```python
from tool_scan import grade_tool

tool = {
    "name": "get_weather",
    "description": "Gets current weather for a location.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"],
        "additionalProperties": False
    }
}

report = grade_tool(tool)

print(f"Score: {report.score}/100")
print(f"Grade: {report.grade.letter}")
print(f"Safe: {report.is_safe}")
```

## Next steps

- Learn about the [security checks](/tool-scan/handbook/security-checks/) Tool-Scan runs
- Understand the [grading system](/tool-scan/handbook/grading/)
- Add custom rules with [plugins](/tool-scan/handbook/plugins/)
- Explore [output formats](/tool-scan/handbook/output-formats/) (JSON, SARIF, streaming)
- Set up [CI integration](/tool-scan/handbook/ci-integration/) to gate deployments
