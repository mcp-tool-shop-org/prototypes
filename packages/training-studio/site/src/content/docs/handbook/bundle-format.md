---
title: Bundle Format
description: Specification for the Training Studio ML bundle format.
sidebar:
  order: 2
---

A Training Studio bundle is a self-describing directory that carries everything a trained model needs: topology, weights, metrics, configuration, and a cryptographic manifest tying it all together.

## Directory structure

```
bundle/
├── bundle.json           # Manifest — the source of truth
├── model/
│   ├── model.json        # TF.js topology (layer graph)
│   └── weights.bin       # Binary weights (content-addressed)
├── metrics/
│   ├── metrics.jsonl     # Per-epoch loss and accuracy
│   └── summary.json      # Final training summary
├── config/
│   └── run_config.json   # Hyperparameters (layers, dropout, etc.)
└── data/
    └── schema.json       # Feature and label schema
```

## Manifest (`bundle.json`)

The manifest is the central file. It references every artifact by path, SHA-256 hash, and byte size.

### Required fields

| Field | Type | Description |
|-------|------|-------------|
| `bundle_version` | string | Schema version (e.g. `"0.1"`) |
| `bundle_id` | string | UUID v4 identifying this bundle |
| `run_id` | string | UUID v4 identifying the training run |
| `bundle_digest` | string | SHA-256 of the canonical artifact list |
| `schema_uri` | string | URL pointing to the schema definition |
| `schema_version` | string | Version of schema used |
| `created_utc` | string | ISO 8601 timestamp |
| `app` | object | Application info (`name`, `version`) |
| `backend` | object | TF.js backend info |
| `dataset` | object | Dataset metadata |
| `model` | object | Model architecture |
| `training` | object | Training configuration and results |
| `artifacts` | array | List of artifact entries |

### Artifact entries

Each artifact is an object with three fields:

```json
{
  "path": "model/model.json",
  "sha256": "52c2b401364e3484a9fa10bb010235a419995b64f0cee6cd75dd416856236b15",
  "size_bytes": 223
}
```

The validator checks every artifact's hash and size against the declared values.

## Bundle digest

The `bundle_digest` ties all artifacts together into a single checksum. It is computed by sorting artifacts by path (bytewise ASCII) and concatenating them in a canonical format:

```
bundle_version:{version}
{path}
{sha256}
{size_bytes}
...
```

The SHA-256 of this canonical string becomes the `bundle_digest`. The manifest itself (`bundle.json`) is excluded from the digest computation.

## Path rules

All artifact paths must:

- Use forward slashes only
- Be relative (no leading `/`)
- Contain no `..` (directory traversal is forbidden)
- Contain no `:` or `\`
- Not start with `./`

Symlinks are forbidden. The validator rejects any bundle containing symlinks.

## Required vs. optional files

**Required:** `bundle.json`, `model/model.json`, `model/weights.bin`, `metrics/summary.json`, `config/run_config.json`, `data/schema.json`

**Optional:** `metrics/metrics.jsonl` (per-epoch metrics in JSONL format)

## JSONL epoch metrics

Each line in `metrics/metrics.jsonl` is a self-contained JSON object:

```json
{"epoch": 1, "timestamp_ms": 1000, "loss": 0.5, "accuracy": 0.7}
```

Required fields: `epoch`, `loss`. Optional: `timestamp_ms`, `accuracy`, `val_loss`, `val_accuracy`, `learning_rate`.

## Sample datasets

Training Studio ships with two sample datasets for testing:

| File | Task | Features | Classes |
|------|------|----------|---------|
| `sample_data/iris.csv` | Multi-class classification | 4 | 3 |
| `sample_data/binary_classification.csv` | Binary classification | 2 | 2 |

These can be loaded directly in the web app to produce a training bundle you can then validate.

## Further reading

- [SPEC.md](https://github.com/mcp-tool-shop-org/training-studio/blob/main/SPEC.md) — the complete formal specification with test vectors
- [Reference](/training-studio/handbook/reference/) — CLI flags and error codes
