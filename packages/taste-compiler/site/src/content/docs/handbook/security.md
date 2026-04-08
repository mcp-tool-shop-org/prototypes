---
title: Security
description: Threat model, data boundaries, and vulnerability reporting for Taste Compiler.
sidebar:
  order: 5
---

Taste Compiler is a **local-only static analysis tool**. It reads source files and YAML configuration, then produces JSON and Markdown reports. It has no network surface.

## Data Boundaries

### Data touched
- YAML taste source files (read)
- Compiled JSON taste packs (read/write)
- TSX, JSX, CSS source files (read-only)
- Stdout/stderr for reports

### Data NOT touched
- No network requests
- No databases
- No user credentials
- No runtime state
- No environment variables (beyond Node.js defaults)

## Permissions

- **Filesystem:** reads from user-specified directories, writes to user-specified output paths
- **Network:** none
- **System:** none

## Telemetry

No telemetry is collected or sent. This is by design, not by omission.

## Secrets

Taste Compiler does not read, store, or transmit credentials. Source files are parsed for structural patterns only — string contents are matched against rule patterns, not exfiltrated.

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly:

- **Email:** 64996768+mcp-tool-shop@users.noreply.github.com
- **Response time:** best effort, typically within 7 days
- **Supported versions:** latest release only

See [SECURITY.md](https://github.com/mcp-tool-shop-org/taste-compiler/blob/main/SECURITY.md) for the full policy.
