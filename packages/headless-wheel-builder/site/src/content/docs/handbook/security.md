---
title: Security
description: Vulnerability scanning, code security analysis, license compliance, and dependency graph analysis.
sidebar:
  order: 5
---

Headless Wheel Builder includes built-in security tooling so you do not need a separate scanner in your pipeline.

## Security scanning

### Full scan

Run a comprehensive scan covering both dependency vulnerabilities and code security:

```bash
hwb security scan -p ./my-project
```

The scan checks your dependency tree against public advisory databases and runs static code analysis for common security issues.

### Quick vulnerability check

A faster scan that only checks for known vulnerabilities in dependencies, skipping code analysis:

```bash
hwb security check -p ./my-project
```

### Scan types

Focus on a specific area:

```bash
# Only dependency vulnerabilities
hwb security scan -p ./my-project --type vulnerability

# Only code security analysis
hwb security scan -p ./my-project --type code
```

### Failing CI on findings

Control which severity levels cause a non-zero exit code:

```bash
# Fail on critical issues
hwb security scan -p ./my-project --fail-critical

# Fail on high or critical issues
hwb security scan -p ./my-project --fail-high

# Ignore specific vulnerability IDs
hwb security scan -p ./my-project --ignore CVE-2024-1234
```

### Available tools

The scanner wraps external security tools. Check what is installed:

```bash
hwb security tools
```

This lists `pip-audit` (dependency scanning), `bandit` (code analysis), and `safety` (dependency checks), showing which ones are available on your system.

## Dependency graph analysis

### Tree visualization

See your full dependency tree:

```bash
hwb deps tree requests
hwb deps tree numpy --depth 2
```

### License compliance

List every dependency and its license, with optional compliance checking:

```bash
hwb deps licenses numpy
hwb deps licenses ./my-project --check
```

### Cycle detection

Find circular dependencies that can cause import errors:

```bash
hwb deps cycles ./my-project
```

### Build order

Compute a topological build order for a set of interdependent packages:

```bash
hwb deps order ./my-project
```

### Conflict detection

Find version conflicts across your dependency tree:

```bash
hwb deps conflicts ./my-project
```

### Full analysis

Run all dependency checks at once:

```bash
hwb deps analyze ./my-project
```

## Integrating with CI

A typical CI step combines vulnerability scanning with a failure gate:

```yaml
- name: Security checks
  run: |
    hwb security scan -p . --fail-critical
    hwb deps licenses . --check
```

The `--fail-critical` flag causes a non-zero exit when critical vulnerabilities are found. Use `--fail-high` to include high-severity findings as well.
