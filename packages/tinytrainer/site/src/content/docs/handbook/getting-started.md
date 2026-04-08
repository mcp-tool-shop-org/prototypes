---
title: Getting Started
description: Install TinyTrainer and train your first classifier.
sidebar:
  order: 1
---

## Install

```bash
pip install tinytrainer
```

For Core ML export (macOS only):

```bash
pip install tinytrainer[coreml]
```

### Requirements

- Python 3.11+
- PyTorch 2.2+
- [edgepacks](https://github.com/mcp-tool-shop-org/edgepacks) (installed automatically)

## Train your first model

### From an edgepacks pack

```bash
tinytrainer train --pack error-triage --output ./model/
```

This downloads the MiniLM backbone on first use (~80MB), embeds all training text (takes a few seconds), and trains a classifier head with early stopping.

### From your own labeled data

Create a JSONL file with `text` and `label` fields:

```json
{"text": "TypeError: Cannot read properties of null", "label": "null_reference"}
{"text": "Connection timed out on port 5432", "label": "connection_timeout"}
{"text": "No space left on device", "label": "disk_full"}
```

Then train:

```bash
tinytrainer train --data my_errors.jsonl --output ./model/
```

## Evaluate

```bash
tinytrainer eval ./model/ --pack error-triage
```

Shows per-class precision/recall/F1 and checks thresholds from the pack's eval protocol.

## Export

```bash
# ONNX (universal)
tinytrainer export ./model/ --format onnx --output ./export/

# Core ML (macOS, with updatable layers)
tinytrainer export ./model/ --format coreml --output ./export/
```

## Package a training kit

```bash
tinytrainer kit ./model/ --output classifier.kit.zip
```

The `.kit.zip` contains everything needed for deployment: model, label map, personalization recipe, and training metadata.
