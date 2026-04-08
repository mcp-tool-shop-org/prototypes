# Editor Integration Specification v0.1

This document defines the integration contract between CodeTeam CLI and editor extensions (VS Code, Visual Studio 2026, and future editors).

---

## 1. Core Principle

**Extensions are thin wrappers around `codeteam verify --json`.**

Extensions MUST NOT:
- Hash files
- Interpret signatures
- Guess status from stderr
- Recompute verification logic

Extensions MUST:
- Call CLI
- Parse JSON
- Display results

---

## 2. CLI Discovery

Extensions MUST locate the CLI in this priority order:

1. **User-configured path** (explicit override setting)
   - VS Code: `codeteam.cliPath`
   - Visual Studio: Tools → Options → CodeTeam → CLI Path

2. **Workspace-local dotnet tool** (recommended for teams)
   - Check `.config/dotnet-tools.json` for `codeteam`
   - Run via `dotnet codeteam`

3. **PATH environment variable**
   - `codeteam` or `codeteam.exe` on Windows

4. **Well-known installation paths** (fallback)
   - Windows: `%LOCALAPPDATA%\CodeTeam\codeteam.exe`
   - macOS: `/usr/local/bin/codeteam`
   - Linux: `/usr/bin/codeteam`

### Execution Plan

Extensions MUST determine how to invoke the CLI:

```
function getExecPlan():
    if settings.codeteam.cliPath is set:
        return { file: settings.cliPath, prefixArgs: [] }

    if workspace has .config/dotnet-tools.json containing "codeteam":
        return { file: "dotnet", prefixArgs: ["codeteam"] }

    return { file: "codeteam", prefixArgs: [] }
```

---

## 3. CLI Invocation

### Command Line (Two Forms)

**Direct executable:**
```
codeteam verify "<package-path>" --json
```

**Dotnet tool:**
```
dotnet codeteam verify "<package-path>" --json
```

### Path Handling

- `package_path` in output is ALWAYS absolute
- Always quote the package path (handles spaces)
- Use absolute paths to avoid working directory issues
- Normalize path separators for the target OS

### Process Execution

```
Spawn process:
  Form A (direct executable):
    - FileName: "codeteam" (or full path)
    - Arguments: verify "<package-path>" --json

  Form B (dotnet tool):
    - FileName: "dotnet"
    - Arguments: codeteam verify "<package-path>" --json

  Common settings:
    - RedirectStandardOutput: true
    - RedirectStandardError: true
    - UseShellExecute: false
    - CreateNoWindow: true

Capture:
  - stdout → JSON result (treat as UTF-8)
  - stderr → diagnostics/logs
  - ExitCode → confirmation of status
```

### Important: Read All stdout Before Parse

Extensions SHOULD:
- Treat stdout as UTF-8
- Read entire stdout, then parse JSON
- NOT attempt streaming parse (unnecessary; safer to buffer)

---

## 4. Output Parsing

### stdout Rules

- stdout contains ONLY the JSON result
- No banners, no progress messages, no warnings on stdout
- If stdout is not valid JSON, treat as toolchain error

### stderr Rules

- stderr contains human-readable diagnostics
- Log stderr to Output channel (don't parse it)
- stderr presence does NOT indicate failure

### JSON Parsing

Parse stdout as JSON and validate structure:

```json
{
  "status": "OK_UNSIGNED",          // REQUIRED - enum
  "exit_code": 1,                   // REQUIRED - 0-6
  "package_path": "/path/to/pkg",   // REQUIRED - string (always absolute)
  "package_digest": "sha256:...",   // OPTIONAL - null or sha256 pattern
  "manifest_digest": "sha256:...",  // OPTIONAL - null or sha256 pattern
  "summary": {                      // REQUIRED
    "artifacts_count": 1,           // REQUIRED - integer
    "evidence_count": 0,            // REQUIRED - integer
    "approvals_valid": 0,           // REQUIRED - integer
    "approvals_required": 1,        // REQUIRED - integer
    "signature_present": false,     // REQUIRED - boolean
    "signature_valid": false,       // REQUIRED - boolean
    "signer_id": null               // OPTIONAL - string or null
  },
  "checks": {...},                  // OPTIONAL - may be absent or present
  "errors": [...],                  // OPTIONAL - may be absent or empty array
  "warnings": [...],                // OPTIONAL - may be absent or empty array
  "timestamp": "..."                // OPTIONAL - ISO-8601 format
}
```

### Handling Optional Fields

Extensions SHOULD treat:
- `errors` missing → empty array (nothing to display)
- `errors` present but empty → nothing to display
- Same for `warnings`, `checks`

---

## 5. Status Mapping

### Status to Exit Code

| Status | Exit Code | Meaning |
|--------|-----------|---------|
| OK_VERIFIED | 0 | Signed + threshold met + integrity OK |
| OK_UNSIGNED | 1 | Integrity OK, not signed |
| FAIL_INTEGRITY | 2 | Artifact/evidence hash mismatch |
| FAIL_SCHEMA | 3 | Manifest schema validation failed |
| FAIL_SIGNATURE | 4 | Signature cryptographically invalid |
| FAIL_THRESHOLD | 5 | Signed but approval count < required |
| FAIL_UNAUTHORIZED | 6 | Actor not in authorized set |

### Exit Code Handling

- Use `status` field as PRIMARY source of truth
- Use `exit_code` field as secondary confirmation
- Process exit code SHOULD match JSON `exit_code`
- **If process exit code != JSON exit_code**: surface a TOOLCHAIN warning (not a package error), but trust the JSON `status`

### Status to UI State

| Status | Badge/Icon | Color | Severity |
|--------|------------|-------|----------|
| OK_VERIFIED | checkmark | Green | Success |
| OK_UNSIGNED | warning | Yellow/Amber | Warning |
| FAIL_* | error | Red | Error |

---

## 6. Error Display

### Error Structure

```json
{
  "code": "DIGEST_MISMATCH",
  "message": "Artifact digest mismatch: artifacts/hello.txt",
  "path": "artifacts/hello.txt",
  "expected": "sha256:abc...",
  "actual": "sha256:def..."
}
```

### UI Mapping

- Show `code` as identifier/badge
- Show `message` as human-readable text
- Make `path` clickable if it maps to a file
- Show `expected` vs `actual` for comparison errors

### Error List Integration (Visual Studio)

| Column | Source |
|--------|--------|
| Code | `error.code` |
| Description | `error.message` |
| Project | Package name from path |
| File | `error.path` (if present; otherwise package root) |

### Problems Panel Integration (VS Code)

```typescript
const diagnostic = new vscode.Diagnostic(
  range,  // Line 1 if no specific location
  error.message,
  vscode.DiagnosticSeverity.Error
);
diagnostic.code = error.code;
diagnostic.source = 'CodeTeam';
```

---

## 7. CLI Handshake (Compatibility Check)

### Preferred: Version Command (Recommended)

On extension activation, **always try version first**:

```
codeteam version --json
```

Expected response:
```json
{
  "cli_version": "0.1.0",
  "schema_version": "0.1"
}
```

**Why prefer version over verify:**
- Faster (no file I/O, no crypto)
- Doesn't require a package to exist
- Returns schema version for compatibility checks
- No side effects

### Fallback: Verify Handshake

If `version --json` is not available (older CLI), use the verify handshake:

```
function handshake(execPlan, schemaValidator, targetPath):
    args = ["verify", targetPath, "--json"]

    result = run_process(
        file = execPlan.file,
        args = execPlan.prefixArgs + args,
        timeoutMs = 30000
    )

    stdout = result.stdout.trim()

    if stdout == "":
        return HandshakeFail("EMPTY_STDOUT", { stderr: result.stderr })

    json = try_parse_json(stdout)
    if json.parse_failed:
        return HandshakeFail("NON_JSON_STDOUT", {
            stderr: result.stderr,
            stdout_prefix: stdout[0:500]
        })

    if not schemaValidator.validate(json):
        return HandshakeFail("JSON_SCHEMA_MISMATCH", {
            schema_errors: schemaValidator.errors,
            stderr: result.stderr
        })

    if result.exit_code != json.exit_code:
        return HandshakeFail("EXIT_CODE_MISMATCH", {
            process_exit_code: result.exit_code,
            json_exit_code: json.exit_code,
            stderr: result.stderr
        })

    return HandshakeOk(execPlan)
```

### Handshake Target Path

- Use bundled "probe" fixture if extension ships one (best)
- Otherwise use user-selected package path (handshake piggybacks on real verify)

### Failure Messages

Use these exact messages for consistency across editors:

| Code | Message |
|------|---------|
| `EMPTY_STDOUT` | "CodeTeam CLI produced no output. Check installation and try again." |
| `NON_JSON_STDOUT` | "CodeTeam CLI output was not JSON. Ensure you are using `verify --json` and that stdout is not being modified." |
| `JSON_SCHEMA_MISMATCH` | "CodeTeam CLI JSON did not match the expected schema. Your CLI/extension versions are incompatible." |
| `EXIT_CODE_MISMATCH` | "CodeTeam CLI exit code disagreed with its JSON output. This indicates a toolchain bug; please report." |

---

## 8. Diagnostic Severity Mapping

Extensions MUST map error codes to appropriate UI severities. The CLI returns error codes in `errors[]` and `warnings[]` arrays.

**Critical Rule: Extensions MUST NOT infer severity from `status` or `exit_code`.**

Severity comes from error code mapping only. This matters because:
- `OK_UNSIGNED` + warning diagnostics (e.g., `LEGACY_SIGNATURE_IGNORED`) = valid unsigned package
- `OK_UNSIGNED` + error diagnostics (e.g., quorum not met) = policy failure
- Same status, different severities — only the error code tells you which

### Error Code to Severity

| Error Code | Severity | UI Treatment |
|------------|----------|--------------|
| `MISSING_FILE` | Error | Red badge, Problems panel |
| `SIZE_MISMATCH` | Error | Red badge, Problems panel |
| `DIGEST_MISMATCH` | Error | Red badge, Problems panel |
| `SCHEMA_INVALID` | Error | Red badge, Problems panel |
| `SIGNATURE_INVALID` | Error | Red badge, Problems panel |
| `ACTOR_NOT_AUTHORIZED` | Error | Red badge, Problems panel |
| `THRESHOLD_NOT_MET` | Error | Red badge, Problems panel |
| `SIGNATURE_QUORUM_NOT_MET` | Error | Red badge, Problems panel |
| `APPROVAL_QUORUM_NOT_MET` | Error | Red badge, Problems panel |
| `SIGNATURE_NOT_ALLOWED` | Error | Red badge, Problems panel |
| `PURPOSE_MISMATCH` | Error | Red badge, Problems panel |
| `SIGNATURE_FORMAT_UNSUPPORTED` | Error | Red badge, Problems panel |

### Quorum-Mode Diagnostics

| Error Code | Severity | UI Treatment | Message |
|------------|----------|--------------|---------|
| `LEGACY_SIGNATURE_IGNORED` | Warning | Yellow banner | "Legacy signatures ignored in quorum mode. Re-sign with `codeteam sign` to generate envelope signatures." |
| `DUPLICATE_SIGNER` | Info | Log only | "Duplicate signer (same key_id) - only counted once" |

### Display Rules

1. **Errors** (`errors[]`): Always show in Problems panel
2. **Warnings** (`warnings[]`): Show in Problems panel as warnings
3. **`LEGACY_SIGNATURE_IGNORED`**: Show as dismissible warning banner above results
4. **`DUPLICATE_SIGNER`**: Log to Output channel, don't surface in Problems

### VS Code Example

```typescript
// Map LEGACY_SIGNATURE_IGNORED to warning banner
if (result.warnings?.some(w => w.code === 'LEGACY_SIGNATURE_IGNORED')) {
  vscode.window.showWarningMessage(
    'Legacy signatures ignored in quorum mode. Re-sign with `codeteam sign` to generate envelope signatures.'
  );
}

// Map errors to Problems panel
for (const error of result.errors ?? []) {
  const severity = error.code === 'DUPLICATE_SIGNER'
    ? vscode.DiagnosticSeverity.Information
    : vscode.DiagnosticSeverity.Error;

  diagnostics.push(new vscode.Diagnostic(range, error.message, severity));
}
```

---

## 9. Caching (Optional)

Extensions MAY cache verification results:

### Cache Key

- Package root path (absolute)
- Manifest file hash (or modification time)

### Cache Invalidation

- Any file change in package directory
- Manual refresh command
- Extension reload

### Cache Duration

- Single session recommended
- Do NOT cache across sessions (file state may change)

---

## 10. Error Handling

### CLI Not Found

```
"CodeTeam CLI not found.

Install via:
  dotnet tool install -g codeteam

Or configure the path in settings."
```

### CLI Execution Error

```
"CodeTeam CLI error:
{stderr output}"
```

### JSON Parse Error

```
"Invalid CLI output.

Expected JSON, received:
{first 200 chars of stdout}

Please update CodeTeam CLI."
```

### Timeout

- Default timeout: 30 seconds
- VS Code: use cancellable progress notification
- Visual Studio: use async task + cancellation token, don't block UI thread
- On timeout: "Verification timed out. Package may be very large."

---

## 11. VS Code Implementation

### Settings

```json
{
  "codeteam.cliPath": "",
  "codeteam.autoVerify": true,
  "codeteam.showNotifications": true
}
```

### Commands

| Command ID | Title |
|------------|-------|
| `codeteam.verify` | CodeTeam: Verify Package |
| `codeteam.locateCli` | CodeTeam: Locate CLI |
| `codeteam.showDiagnostics` | CodeTeam: Show Diagnostics |

### Output Channel

Name: "CodeTeam"
Shows: stderr from CLI, debug logs

### Implementation Flow

1. **Discover CLI**
   - `codeteam.cliPath` override
   - else `.config/dotnet-tools.json` → use `dotnet codeteam`
   - else PATH

2. **Execute**
   - args: `verify "<abs package path>" --json`
   - capture stdout/stderr separately

3. **Parse**
   - if stdout not valid JSON → toolchain error
   - validate against `codeteam.cli.verify.schema.v0.1.json`

4. **Map to UI**
   - OK_VERIFIED: success (green)
   - OK_UNSIGNED: warning (amber)
   - FAIL_*: error (red)
   - populate Problems panel from `errors[]` (path if present; otherwise attach to package root)

5. **Log**
   - stderr → "CodeTeam" Output channel (no parsing)

---

## 12. Visual Studio 2026 Implementation

### Settings

Tools → Options → CodeTeam:
- CLI Path (string)
- Auto-Verify on Solution Load (bool)
- Show Notifications (bool)
- Log to Output (bool)

### Tool Window

Menu: View → Other Windows → CodeTeam Verifier
Shows: Package status, summary, diagnostics

### Implementation Flow

1. **Discover CLI**
   - Tools → Options → CodeTeam → CLI Path
   - else dotnet tool
   - else PATH

2. **Execute async**
   - Never block UI thread
   - Use async task + cancellation token

3. **Parse + validate schema**

4. **Populate**
   - Tool Window summary (status + counts)
   - Error List: one entry per `errors[]` item
   - Output Window: stderr

### MSBuild Integration (Optional)

```xml
<Target Name="VerifyCodeTeam" AfterTargets="Build">
  <Exec Command="codeteam verify ... --json > verify.json" />
  <ReadVerifyResult File="verify.json" />
</Target>
```

---

## 13. Testing Requirements

Extensions MUST test against golden fixtures:

| Fixture | Expected Status | Expected Exit Code |
|---------|-----------------|-------------------|
| `fixtures/minimal_unsigned/` | OK_UNSIGNED | 1 |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED | 1 |
| `fixtures/signed_verified/` | OK_VERIFIED | 0 |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY | 2 |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA | 3 |

Test that:
1. CLI is invoked correctly
2. JSON is parsed correctly
3. Status matches expected
4. Exit code matches expected
5. UI state reflects status

---

## 14. Security Considerations

### Path Injection

- Always quote paths in command line
- Validate paths don't contain shell metacharacters
- Use array-based process spawn (not shell)

### Output Parsing

- Don't execute anything from stdout/stderr
- Don't follow URLs in error messages automatically
- Sanitize paths before displaying in UI

---

**End of Editor Integration Specification v0.1**
