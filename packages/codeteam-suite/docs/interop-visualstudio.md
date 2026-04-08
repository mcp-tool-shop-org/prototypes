# Visual Studio 2026 Extension Interop Contract

## Overview

This document defines the interface contract between Visual Studio extensions and the CodeTeam CLI. Extensions MUST NOT implement verification logic — they invoke the CLI and render results.

---

## CLI Invocation

Visual Studio extensions invoke the same CLI as VS Code extensions. The contract is identical.

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

---

## Visual Studio Integration Points

### Solution Explorer Integration

CodeTeam packages can be displayed in Solution Explorer:

```
Solution 'MySolution'
├── MyProject
└── CodeTeam Packages
    ├── release-v1.0.0 [OK_VERIFIED ✓]
    └── staging-v1.1.0 [OK_UNSIGNED ⚠]
```

### Tool Window

Extensions SHOULD provide a dedicated tool window:

- **Menu Path:** View → Other Windows → CodeTeam Verifier
- **Shortcut:** Ctrl+Alt+C, V (suggested)

### Output Window

CLI output SHOULD be logged to a dedicated Output pane:

- **Pane Name:** CodeTeam
- **Log Level:** Commands, results, errors

---

## Extension Responsibilities

### MUST

1. Invoke CLI with `--json` flag for all operations
2. Parse JSON output according to versioned schemas
3. Display status codes verbatim (never paraphrase)
4. Show all errors returned by CLI
5. Respect exit codes for pass/fail determination
6. Run CLI invocations off the UI thread

### MUST NOT

1. Implement verification logic (hash computation, signature verification)
2. Interpret or modify status codes
3. Skip or hide errors/warnings
4. Cache verification results beyond single operation
5. Auto-correct or auto-repair packages

---

## UI Rendering Guidelines

### InfoBar Integration

For package-level status, use Visual Studio InfoBars:

| CLI Status | InfoBar Style | Icon |
|------------|---------------|------|
| OK_VERIFIED | Information (Blue) | StatusOK |
| OK_UNSIGNED | Warning (Yellow) | StatusWarning |
| FAIL_* | Error (Red) | StatusError |

### Error List Integration

Verification errors SHOULD appear in the Error List:

| Column | Value |
|--------|-------|
| Code | Error code (e.g., DIGEST_MISMATCH) |
| Description | Error message |
| Project | Package name |
| File | Affected file path (if applicable) |

### Quick Info Tooltips

Hovering over package items SHOULD show:

```
Package: my-package v1.0.0
Status: OK_UNSIGNED
Artifacts: 5 verified
Approvals: 1/2 required
Signature: None
```

---

## Configuration

Extensions SHOULD support these options in Tools → Options:

**Category:** CodeTeam

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| CLI Path | String | (auto) | Path to CLI executable |
| Auto-Verify | Bool | true | Verify on solution load |
| Show Notifications | Bool | true | Show status in notifications |
| Log to Output | Bool | true | Log CLI output |

---

## MEF Exports

Extensions MAY export these interfaces for other extensions:

```csharp
[Export(typeof(ICodeTeamVerifier))]
public interface ICodeTeamVerifier
{
    Task<VerifyResult> VerifyAsync(string packagePath);
    Task<ApproveResult> ApproveAsync(string packagePath, string keyId);
    Task<SignResult> SignAsync(string packagePath, string keyId);
}
```

**Note:** Implementations MUST delegate to CLI — they MUST NOT implement verification logic.

---

## AsyncPackage Pattern

Extensions MUST follow Visual Studio async loading patterns:

```csharp
[PackageRegistration(UseManagedResourcesOnly = true, AllowsBackgroundLoading = true)]
[ProvideAutoLoad(VSConstants.UICONTEXT.SolutionExists_string, PackageAutoLoadFlags.BackgroundLoad)]
public sealed class CodeTeamPackage : AsyncPackage
{
    protected override async Task InitializeAsync(
        CancellationToken cancellationToken,
        IProgress<ServiceProgressData> progress)
    {
        await JoinableTaskFactory.SwitchToMainThreadAsync(cancellationToken);
        // Register commands and services
    }
}
```

---

## Discovery

Extensions SHOULD locate the CLI in this order:

1. User-configured path (Tools → Options)
2. PATH environment variable
3. Well-known installation paths:
   - `%LOCALAPPDATA%\CodeTeam\codeteam.exe`
   - `%ProgramFiles%\CodeTeam\codeteam.exe`

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

## VSIX Manifest

Extensions SHOULD declare CLI dependency:

```xml
<Dependencies>
  <Dependency Id="CodeTeam.Cli" Version="[0.1,)" DisplayName="CodeTeam CLI" />
</Dependencies>
```

---

**End of Visual Studio 2026 Interop Contract v0.1**
