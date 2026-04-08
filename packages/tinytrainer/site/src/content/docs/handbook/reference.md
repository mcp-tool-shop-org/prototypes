---
title: CLI Reference
description: Complete reference for all TinyTrainer CLI commands.
sidebar:
  order: 4
---

## Global options

| Flag | Description |
|------|-------------|
| `--version`, `-v` | Show version and exit |
| `--debug` | Show full stack traces on errors |

## Commands

### `tinytrainer train`

Train a classifier from an edgepacks pack or JSONL data.

```bash
tinytrainer train --pack <name> --output ./model/
tinytrainer train --data <path.jsonl> --output ./model/
```

| Option | Default | Description |
|--------|---------|-------------|
| `--pack`, `-p` | — | edgepacks pack name |
| `--data`, `-d` | — | Path to JSONL data file |
| `--output`, `-o` | `./model` | Output directory for model files |
| `--backbone`, `-b` | `all-MiniLM-L6-v2` | Sentence embedding model |
| `--head` | `linear` | Head type: `linear` or `mlp` |
| `--lr` | `0.001` | Learning rate |
| `--epochs` | `50` | Maximum training epochs |
| `--patience` | `5` | Early stopping patience |
| `--batch-size` | `32` | Training batch size |
| `--seed` | `42` | Random seed |
| `--label-field` | auto | Field name for label extraction |

**Output files:** `model.pt`, `config.json`, `label_map.json`, `train_result.json`

### `tinytrainer eval`

Evaluate a trained model against a pack's eval protocol.

```bash
tinytrainer eval ./model/ --pack error-triage
```

| Option | Default | Description |
|--------|---------|-------------|
| `--pack`, `-p` | required | Pack name for eval protocol |
| `--split` | `test` | Data split: `train`, `val`, `test` |

### `tinytrainer export`

Export a trained model to ONNX or Core ML.

```bash
tinytrainer export ./model/ --format onnx --output ./export/
```

| Option | Default | Description |
|--------|---------|-------------|
| `--format`, `-f` | `onnx` | Export format: `onnx` or `coreml` |
| `--output`, `-o` | `./export` | Output directory |
| `--updatable/--no-updatable` | `true` | Mark Core ML model as updatable |

### `tinytrainer kit`

Package model + exports into a `.kit.zip` training kit.

```bash
tinytrainer kit ./model/ --output classifier.kit.zip
```

| Option | Default | Description |
|--------|---------|-------------|
| `--output`, `-o` | `./model.kit.zip` | Output path for kit file |
| `--formats` | `onnx` | Comma-separated: `onnx`, `coreml` |
| `--pack` | — | Pack name to record in manifest |

### `tinytrainer info`

Show training kit contents and metadata.

```bash
tinytrainer info classifier.kit.zip
```

### `tinytrainer list-models`

Show available backbone and head architectures.

```bash
tinytrainer list-models
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | User error (bad input, missing file) |
| 2 | Runtime error (training failure, export error) |
