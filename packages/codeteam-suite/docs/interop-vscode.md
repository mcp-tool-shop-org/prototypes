# VS Code Extension Interop Contract

## Overview

This document defines the interface contract between VS Code extensions and the CodeTeam CLI. Extensions MUST NOT implement verification logic — they invoke the CLI and render results.

---

## CLI Invocation

### Verify Command

```bash
codeteam verify <package-path> --json
```

**Exit Codes:**
| Code | Status |
|------|--------|
| 0 | OK_VERIFIED |
| 1 | OK_UNSIGNED |
| 2 | FAIL_INTEGRITY |
| 3 | FAIL_SCHEMA |
| 4 | FAIL_SIGNATURE |
| 5 | FAIL_THRESHOLD |
| 6 | FAIL_UNAUTHORIZED |

**JSON Output Schema:** `schemas/codeteam.cli.verify.schema.v0.1.json`

### Approve Command

```bash
codeteam approve <package-path> --key <key-id> --json
```

**JSON Output Schema:** `schemas/codeteam.cli.approve.schema.v0.1.json`

### Sign Command

```bash
codeteam sign <package-path> --key <key-id> --json
```

**JSON Output Schema:** `schemas/codeteam.cli.sign.schema.v0.1.json`

---

## Extension Responsibilities

### MUST

1. Invoke CLI with `--json` flag for all operations
2. Parse JSON output according to versioned schemas
3. Display status codes verbatim (never paraphrase)
4. Show all errors returned by CLI
5. Respect exit codes for pass/fail determination
6. Handle CLI not found gracefully

### MUST NOT

1. Implement verification logic (hash computation, signature verification)
2. Interpret or modify status codes
3. Skip or hide errors/warnings
4. Cache verification results beyond single operation
5. Auto-correct or auto-repair packages

---

## UI Rendering Guidelines

### Status Display

| CLI Status | Badge Color | Icon |
|------------|-------------|------|
| OK_VERIFIED | Green | checkmark |
| OK_UNSIGNED | Yellow/Amber | warning |
| FAIL_* | Red | error |

### Error Display

- Show error `code` as identifier
- Show `message` as human-readable text
- Show `path` when present (clickable if possible)
- Show `expected` vs `actual` for integrity failures

### TreeView Structure

```
Package: my-package v1.0.0
├── Status: OK_UNSIGNED
├── Artifacts (2)
│   ├── src/main.ts ✓
│   └── dist/bundle.js ✓
├── Evidence (1)
│   └── test-report.json ✓
├── Approvals (1/2 required)
│   └── alice@example.com ✓
└── Signature: None
```

---

## Configuration

Extensions SHOULD support these settings:

```jsonc
{
  "codeteam.cliPath": "codeteam",        // Path to CLI executable
  "codeteam.autoVerify": true,           // Verify on package open
  "codeteam.showNotifications": true     // Show status notifications
}
```

---

## Discovery

Extensions SHOULD locate the CLI in this order:

1. User-configured path (`codeteam.cliPath`)
2. PATH environment variable
3. Well-known installation paths:
   - Windows: `%LOCALAPPDATA%\CodeTeam\codeteam.exe`
   - macOS: `/usr/local/bin/codeteam`
   - Linux: `/usr/bin/codeteam`

---

## Version Negotiation

Extensions SHOULD check CLI version on activation:

```bash
codeteam --version --json
```

If CLI version is incompatible with extension:
- Show warning to user
- Link to upgrade instructions
- Continue with degraded functionality if possible

---

## Error Handling

### CLI Not Found

Display: "CodeTeam CLI not found. Install from https://codeteam.dev/install"

### CLI Execution Error

Display: "CodeTeam CLI error: <stderr output>"

### JSON Parse Error

Display: "Invalid CLI output. Please update CodeTeam CLI."

---

## Testing

Extensions MUST validate against golden fixtures:

| Fixture | Expected Status |
|---------|-----------------|
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |

---

**End of VS Code Interop Contract v0.1**
