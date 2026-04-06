---
title: Reference
description: Full CLI and API reference for Training Studio.
sidebar:
  order: 5
---

This page covers the complete command-line interface, exit codes, error codes, and JSON output schema.

## CLI usage

```bash
training-studio validate [options] <bundle-path>
```

### Options

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON (machine-readable) |
| `<bundle-path>` | Path to the bundle directory to validate |

### Running from source

If you have not installed Training Studio globally, run the validator through npm:

```bash
cd TrainingStudio.Web
npm run validate -- ./path/to/bundle
npm run validate -- --json ./path/to/bundle
```

## Exit codes

The validator uses three exit codes for scripting and CI integration:

| Code | Meaning |
|------|---------|
| `0` | Valid bundle — all artifacts verified, no errors |
| `2` | Valid with warnings — passes but has non-blocking issues |
| `3` | Invalid bundle — schema violations, missing files, or digest mismatch |

## JSON output schema

When `--json` is passed, the validator produces stable JSON:

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b8...",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | `true` if exit code is 0 or 2 |
| `exit_code` | number | 0, 2, or 3 |
| `bundle_id` | string | UUID v4 from the manifest |
| `bundle_digest` | string | SHA-256 of the canonical artifact list |
| `version` | string | Bundle schema version |
| `schema_uri` | string | URL to the schema definition |
| `schema_version` | string | Schema version used |
| `errors` | array | List of error objects (empty if valid) |
| `warnings` | array | List of warning objects (empty if clean) |
| `stats` | object | File and artifact counts |

## Error codes

Errors indicate the bundle is invalid (exit code 3):

| Code | Description |
|------|-------------|
| `E_NO_MANIFEST` | `bundle.json` not found in the bundle directory |
| `E_PARSE_ERROR` | Manifest JSON could not be parsed |
| `E_VERSION_UNSUPPORTED` | Bundle version is not recognized |
| `E_MISSING_FIELD` | A required manifest field is missing |
| `E_INVALID_FIELD` | A field has an invalid value or format |
| `E_ARTIFACT_MISSING` | An artifact listed in the manifest was not found on disk |
| `E_HASH_MISMATCH` | Artifact SHA-256 does not match the manifest |
| `E_SIZE_MISMATCH` | Artifact byte size does not match the manifest |
| `E_DIGEST_MISMATCH` | Recomputed bundle digest does not match the manifest |
| `E_INVALID_JSONL` | A line in `metrics.jsonl` is not valid JSON |
| `E_IO_READ` | Filesystem read error (permissions, missing directory) |
| `E_PATH_INVALID` | Artifact path violates path rules (traversal, absolute, etc.) |
| `E_SYMLINK_FORBIDDEN` | A symlink was detected in the bundle |

## Warning codes

Warnings allow the bundle to pass (exit code 2) but flag potential issues:

| Code | Description |
|------|-------------|
| `W_UNLISTED_FILE` | A file exists in the bundle but is not listed in the manifest |
| `W_UNKNOWN_FIELD` | An unrecognized field appears in the manifest |
| `W_MISSING_OPTIONAL` | An optional field (e.g. `metrics.jsonl`) is missing |

## Testing

Training Studio ships with 287 tests covering the validator, bundle format, schema enforcement, and CLI exit codes:

```bash
cd TrainingStudio.Web

# Run all tests
npm test

# Watch mode for development
npm test -- --watch
```

## Test vectors

The repository includes test fixtures for implementers building their own validators:

| Fixture | Location | Expected exit |
|---------|----------|---------------|
| Golden valid bundle | `src/tests/fixtures/golden-v1/` | 0 |
| Hash mismatch | `src/tests/fixtures/invalid-hash-mismatch/` | 3 |
| Missing manifest | Empty directory | 3 |

See [SPEC.md](https://github.com/mcp-tool-shop-org/training-studio/blob/main/SPEC.md) for full test vector details including canonical digest inputs.
