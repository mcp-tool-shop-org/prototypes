---
title: Usage Guide
description: Detailed guide for all TinyTrainer workflows.
sidebar:
  order: 2
---

## Training options

### Backbone selection

TinyTrainer ships with two backbone options:

| Backbone | Dimensions | Size | Speed |
|----------|-----------|------|-------|
| `all-MiniLM-L6-v2` (default) | 384 | ~80MB | Fast |
| `all-MiniLM-L12-v2` | 384 | ~120MB | Better quality |

```bash
tinytrainer train --pack error-triage --backbone all-MiniLM-L12-v2
```

### Head types

| Head | Parameters | Best for |
|------|-----------|----------|
| `linear` (default) | ~1.5KB | Simple classification, few labels |
| `mlp` | ~50KB | Complex boundaries, many labels |

```bash
tinytrainer train --pack error-triage --head mlp
```

### Hyperparameters

```bash
tinytrainer train --pack error-triage \
  --lr 0.001 \
  --epochs 50 \
  --patience 5 \
  --batch-size 32 \
  --seed 42
```

- `--lr`: Learning rate (default: 0.001)
- `--epochs`: Maximum training epochs (default: 50)
- `--patience`: Early stopping patience (default: 5)
- `--batch-size`: Training batch size (default: 32)

### Label field

When loading from edgepacks packs, TinyTrainer auto-detects the label field. For custom data or ambiguous packs:

```bash
tinytrainer train --data custom.jsonl --label-field category
```

## Export formats

### ONNX

Universal format. The exported model takes embedding vectors as input and outputs logits.

- Input: `embeddings` tensor `(batch, 384)` float32
- Output: `logits` tensor `(batch, num_labels)` float32
- Dynamic batch axis

### Core ML

macOS-only export via coremltools. Produces `.mlpackage` with classifier head.

When `--updatable` is set (default), the model is marked for on-device personalization via Apple's MLUpdateTask API. This enables users to improve the model locally on their iPhone/iPad without sending data to any server.

```bash
tinytrainer export ./model/ --format coreml --updatable
```

## Training kits

A `.kit.zip` is a standard zip file containing:

| File | Contents |
|------|----------|
| `manifest.json` | Task type, labels, backbone, eval scores, device targets |
| `config.json` | Training configuration snapshot |
| `label_map.json` | Label-to-index mapping |
| `recipe.json` | On-device personalization recipe (updatable layers, LR bounds, max epochs) |
| `tokenizer_ref.json` | Which backbone to use for embeddings |
| `train_result.json` | Training metrics |
| `model.onnx` | ONNX classifier head (if exported) |
| `model.mlpackage/` | Core ML classifier head (if exported) |

## Debugging

Use `--debug` to see full stack traces on errors:

```bash
tinytrainer --debug train --pack error-triage
```

Without `--debug`, errors show structured messages with hints. No raw stack traces are exposed.
