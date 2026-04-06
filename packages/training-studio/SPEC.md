# Training Studio Bundle Specification v0.1

This document defines the Training Studio export bundle format for implementers.

## Overview

A Training Studio bundle is a directory or ZIP archive containing:
- A manifest (`bundle.json`) describing the training run
- Model artifacts (topology + weights)
- Training metrics
- Configuration and data schema

## Manifest Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `bundle_version` | string | Schema version (e.g., `"0.1"`) |
| `bundle_id` | string | UUID v4 identifying this bundle |
| `run_id` | string | UUID v4 identifying the training run |
| `bundle_digest` | string | SHA-256 of canonical artifact list |
| `schema_uri` | string | URL to schema definition |
| `schema_version` | string | Version of schema used |
| `created_utc` | string | ISO 8601 timestamp |
| `app` | object | Application info (`name`, `version`) |
| `backend` | object | TF.js backend info |
| `dataset` | object | Dataset metadata |
| `model` | object | Model architecture |
| `training` | object | Training configuration and results |
| `artifacts` | array | List of artifact entries |

### Artifact Entry

```json
{
  "path": "model/model.json",
  "sha256": "52c2b401364e3484a9fa10bb010235a419995b64f0cee6cd75dd416856236b15",
  "size_bytes": 223
}
```

## Bundle Digest Algorithm

The `bundle_digest` is computed as follows:

```
canonical = "bundle_version:{version}\n"
for artifact in sorted(artifacts, key=path):
    canonical += "{path}\n{sha256}\n{size_bytes}\n"
digest = SHA-256(canonical)
```

**Rules:**
- Sort artifacts by path using bytewise ASCII comparison
- Use lowercase hex for SHA-256 (64 characters)
- The manifest (`bundle.json`) is NOT included in the digest

## Path Rules

All artifact paths MUST:
- Use forward slashes (`/`) only
- Be relative (no leading `/`)
- Not contain `..` (directory traversal)
- Not contain `:` (Windows reserved)
- Not contain `\` (backslash)
- Not start with `./`

Symlinks are forbidden.

## Required Files

| Path | Description |
|------|-------------|
| `bundle.json` | Manifest |
| `model/model.json` | TF.js model topology |
| `model/weights.bin` | Model weights |
| `metrics/summary.json` | Training summary |
| `config/run_config.json` | Hyperparameters |
| `data/schema.json` | Feature/label schema |

## Optional Files

| Path | Description |
|------|-------------|
| `metrics/metrics.jsonl` | Per-epoch metrics (JSONL) |

## Validation

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Valid bundle |
| 2 | Valid with warnings |
| 3 | Invalid bundle |

### Error Codes

| Code | Description |
|------|-------------|
| `E_NO_MANIFEST` | `bundle.json` not found |
| `E_PARSE_ERROR` | Manifest JSON parse failure |
| `E_VERSION_UNSUPPORTED` | Unknown bundle version |
| `E_MISSING_FIELD` | Required field missing |
| `E_INVALID_FIELD` | Field has invalid value |
| `E_ARTIFACT_MISSING` | Listed artifact not found |
| `E_HASH_MISMATCH` | Artifact hash doesn't match |
| `E_SIZE_MISMATCH` | Artifact size doesn't match |
| `E_DIGEST_MISMATCH` | Bundle digest doesn't match |
| `E_INVALID_JSONL` | Invalid JSONL line |
| `E_IO_READ` | Filesystem read error |
| `E_PATH_INVALID` | Path violates rules |
| `E_SYMLINK_FORBIDDEN` | Symlink found |

### Warning Codes

| Code | Description |
|------|-------------|
| `W_UNLISTED_FILE` | File exists but not in manifest |
| `W_UNKNOWN_FIELD` | Unknown field in manifest |
| `W_MISSING_OPTIONAL` | Optional field missing |

## CLI JSON Output

The `--json` flag produces stable output:

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "12345678-1234-4123-8123-123456789abc",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
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

## JSONL Epoch Metrics

Each line in `metrics/metrics.jsonl`:

```json
{"epoch":1,"timestamp_ms":1000,"loss":0.5,"accuracy":0.7}
```

Required fields: `epoch`, `loss`
Optional: `timestamp_ms`, `accuracy`, `val_loss`, `val_accuracy`, `learning_rate`

## Test Vectors

Use these vectors to verify your validator implementation.

### Vector 1: Valid Bundle (Golden)

**Location:** `TrainingStudio.Web/src/tests/fixtures/golden-v1/`

| Property | Value |
|----------|-------|
| bundle_id | `00000000-0000-4000-8000-000000000001` |
| bundle_digest | `719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f` |
| Expected exit code | `0` |
| Artifact count | 6 |

**Canonical digest input:**
```
bundle_version:0.1
config/run_config.json
ae5eca0136ba71775cd4552813a9d64aa992c81c6e19dddc473db4b8199ca901
139
data/schema.json
5afe14baea8df0d9d96756b205f9c79d3725920231940233417b4d38ee1337d3
154
metrics/metrics.jsonl
8fff11a08bd4db690e9047820a777dcfdf30dc583a4685b856c777817bd60691
179
metrics/summary.json
851df1ebd2e5cde7345defec71981c7b0e46c67e5c45c031bd73694d98600307
193
model/model.json
52c2b401364e3484a9fa10bb010235a419995b64f0cee6cd75dd416856236b15
223
model/weights.bin
18b1cb9d01d1298fb45e2ca9a181a08134c08d7722c88c3348a11ff2171da6cc
6
```

### Vector 2: Hash Mismatch

**Location:** `TrainingStudio.Web/src/tests/fixtures/invalid-hash-mismatch/`

| Property | Value |
|----------|-------|
| Expected exit code | `3` |
| Expected error codes | `E_HASH_MISMATCH`, `E_DIGEST_MISMATCH` |

The `test.txt` file contains `wrong` but manifest claims hash `aaaa...`.

### Vector 3: Missing Manifest

**Setup:** Empty directory or directory without `bundle.json`

| Property | Value |
|----------|-------|
| Expected exit code | `3` |
| Expected error code | `E_NO_MANIFEST` |

## Implementing a Validator

1. Read `bundle.json` from the bundle root
2. Parse JSON and validate required fields exist
3. Check `bundle_version` is supported
4. Validate UUID format for `bundle_id` and `run_id`
5. For each artifact in `artifacts`:
   - Read the file at `path`
   - Compute SHA-256 of contents
   - Compare with declared `sha256`
   - Compare file size with `size_bytes`
6. Recompute `bundle_digest` from artifacts and compare
7. Report any extra files not in manifest as warnings

## See Also

- [COMPAT.md](COMPAT.md) - Versioning and compatibility rules
- [bundle.schema.json](TrainingStudio.Web/src/types/bundle.schema.json) - JSON Schema
