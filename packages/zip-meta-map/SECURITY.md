# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Scope

zip-meta-map is an **analysis-only** tool. It reads files and ZIP archives, generates metadata, and writes output files. It does not:

- Execute code from analyzed archives
- Make network requests
- Modify input files
- Run subprocesses

The primary attack surface is **malicious ZIP archives** containing path traversal, binary masquerading, or oversized files. The tool detects and flags these via risk flags and warnings.

## Reporting a Vulnerability

Please report security issues via [GitHub private vulnerability reporting](https://github.com/mcp-tool-shop-org/zip-meta-map/security/advisories/new).

We will respond within 7 days.

## Security Features

- **Path traversal detection**: Files with `../` in paths are flagged with `path_traversal`
- **Binary masquerade detection**: Text-extension files containing binary data are flagged
- **Secrets detection**: Credential-like patterns are flagged with `secrets_like`
- **Index-level warnings**: Aggregate safety concerns are surfaced in the `warnings` array
- **Schema validation**: All output is validated against JSON Schema before writing
