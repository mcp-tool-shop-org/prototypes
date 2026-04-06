---
title: Security
description: Privacy and security model for Training Studio.
sidebar:
  order: 4
---

Training Studio is designed around a single principle: your data never leaves your device. This page explains the security model, validation guarantees, and privacy commitments in detail.

## Privacy model

Training Studio collects nothing. There is no telemetry, no analytics, no crash reporting, and no network requests. The application works entirely offline after installation.

| Aspect | Detail |
|--------|--------|
| **Data touched** | User-provided CSV datasets, TensorFlow.js models (browser-local), training metrics |
| **Data NOT touched** | No telemetry, no analytics, no cloud upload, no user tracking |
| **Permissions** | Browser sandbox only — file access via user-initiated file picker |
| **Network** | None — fully offline after install |
| **Accounts** | None required — no registration or sign-in |

## Validation security

The bundle validator enforces several layers of defense:

### Path validation

All artifact paths are checked against strict rules. The validator rejects:

- Absolute paths (`/etc/passwd`, `C:\Windows`)
- Directory traversal (`../`)
- Windows drive letters
- Backslash path separators
- Symlinks of any kind

### Hash verification

Every artifact listed in the manifest includes a SHA-256 hash. The validator reads each file, computes its hash, and compares. Any mismatch produces an `E_HASH_MISMATCH` error and the bundle is rejected.

### No code execution

The validator is a pure reader. It parses JSON and computes hashes, but it never loads model weights into a TensorFlow.js session and never executes arbitrary code. This is the core security guarantee: validation cannot trigger side effects.

## CLI security

The command-line validator follows defense-in-depth:

- Validates all arguments before processing
- Prevents symlink attacks by checking file types
- Handles untrusted JSON safely (parse errors produce structured error codes, not stack traces)
- Sanitizes all error messages
- Operates in read-only mode (never writes to bundle files)

## Dependency management

Training Studio minimizes its dependency surface:

| Library | Purpose |
|---------|---------|
| TensorFlow.js | ML model parsing (browser-local) |
| Chart.js | Training visualization (browser-local) |
| Vitest | Testing (dev only) |
| Vite | Build tooling (dev only) |
| TypeScript | Type checking (dev only) |

All dependencies are monitored via `npm audit` and updated regularly.

## Reporting vulnerabilities

Do not open public issues for security vulnerabilities. Instead, email **security@mcp-tool-shop.dev** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

Expect acknowledgment within 48 hours and weekly progress updates.

## Response times

| Severity | Target |
|----------|--------|
| Critical (RCE, data corruption) | Patch within 24 hours |
| High (DoS, information leak) | Patch within 1 week |
| Medium / Low | Next regular release |

## Further reading

- [SECURITY.md](https://github.com/mcp-tool-shop-org/training-studio/blob/main/SECURITY.md) — vulnerability reporting details
- [PRIVACY.md](https://github.com/mcp-tool-shop-org/training-studio/blob/main/PRIVACY.md) — full privacy policy
