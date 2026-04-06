---
title: Security Patterns
description: Vulnerability classes detected by brain-dev's security auditor, with CWE references and architecture details.
sidebar:
  order: 3
---

The `security_audit` tool scans code for common vulnerability patterns aligned with OWASP guidelines. Each finding includes a CWE reference, severity level, and remediation guidance.

## Detected vulnerability classes

| Category | Severity | CWE |
|----------|----------|-----|
| SQL Injection | Critical | [CWE-89](https://cwe.mitre.org/data/definitions/89.html) |
| Command Injection | Critical | [CWE-78](https://cwe.mitre.org/data/definitions/78.html) |
| Insecure Deserialization | Critical | [CWE-502](https://cwe.mitre.org/data/definitions/502.html) |
| Hardcoded Secrets | High | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| Path Traversal | High | [CWE-22](https://cwe.mitre.org/data/definitions/22.html) |
| Insecure Crypto | Medium | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) |

### SQL Injection (CWE-89)

Detects string interpolation and concatenation in SQL queries. Flags f-strings, `.format()` calls, and `+` concatenation passed to database cursor methods.

**Remediation:** Use parameterized queries with placeholders instead of string formatting.

### Command Injection (CWE-78)

Identifies calls to `os.system()`, `subprocess.call()` with string concatenation, `subprocess.run()` with `shell=True`, `eval()`, and `exec()`. These patterns allow user input to flow into shell commands or arbitrary code execution.

**Remediation:** Use `subprocess.run()` with a list of arguments instead of shell strings. Validate and sanitize all inputs.

### Insecure Deserialization (CWE-502)

Catches usage of `pickle.loads()`, `yaml.load()` without `SafeLoader`, and other deserialization patterns that execute arbitrary code.

**Remediation:** Use safe loaders (`yaml.safe_load`) and avoid deserializing untrusted data with pickle.

### Hardcoded Secrets (CWE-798)

Scans for string literals assigned to variables with names like `password`, `secret`, `api_key`, `token`, and similar patterns.

**Remediation:** Use environment variables or a secrets manager. Never commit credentials to source control.

### Path Traversal (CWE-22)

Detects file operations where user input flows into path construction without sanitization, allowing `../` escapes.

**Remediation:** Use `pathlib.Path.resolve()` and validate that resolved paths stay within expected directories.

### Insecure Crypto (CWE-327)

Flags usage of weak cryptographic algorithms (MD5, SHA1 for security purposes, DES, RC4) and insecure random number generators for security contexts.

**Remediation:** Use SHA-256 or stronger hashes, AES-256 for encryption, and `secrets` module for security-sensitive random values.

## Architecture

The security auditor processes code symbols provided by the MCP client. Each symbol includes its source code, file path, and line number. The auditor runs pattern matching against known vulnerability signatures and returns structured findings.

```
┌──────────────────────────────────────────────┐
│              MCP Client                      │
│  (sends symbols with source code)            │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│           security_audit tool                │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Pattern Matchers               │  │
│  │                                        │  │
│  │  SQL Injection    Command Injection    │  │
│  │  Deserialization  Hardcoded Secrets    │  │
│  │  Path Traversal   Insecure Crypto     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         Finding Builder                │  │
│  │                                        │  │
│  │  category + severity + CWE + remediation │
│  └────────────────────────────────────────┘  │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│         Structured Findings                  │
│  (filtered by severity_threshold)            │
└──────────────────────────────────────────────┘
```

## Severity filtering

The `severity_threshold` parameter controls which findings are returned:

- **`low`** (default) -- returns all findings
- **`medium`** -- returns medium, high, and critical findings
- **`high`** -- returns only high and critical findings
- **`critical`** -- returns only critical findings

This allows you to focus on the most impactful issues first and expand the scope as you address them.
