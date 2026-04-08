---
title: Architecture
description: How TinyTrainer is built — the three-layer pipeline.
sidebar:
  order: 3
---

## Pipeline overview

```
edgepacks pack → load + render → embed (frozen) → train head → export → .kit.zip
```

TinyTrainer is a pipeline, not a framework. Data flows through five stages, each producing artifacts the next stage consumes.

## Three layers

### 1. Data layer (`tinytrainer.data`)

Loads training data from two sources:
- **edgepacks packs**: `load_from_pack()` renders each example's input text using the pack's instruction template, extracts labels from output dicts
- **JSONL files**: `load_from_jsonl()` reads `text` and `label` fields

The `LabelEncoder` maps string labels to integer indices. `prepare_dataset()` embeds all texts and returns a PyTorch `EmbeddingDataset`.

### 2. Training layer (`tinytrainer.training`)

The core `train_model()` function:
1. Embeds all texts once (backbone is frozen)
2. Creates train/val DataLoaders
3. Initializes a `ClassifierHead` (Linear or MLP)
4. Runs training with `EarlyStopping`
5. Saves the best checkpoint

Key design: embeddings are precomputed as numpy arrays, then converted to tensors for training. This means the training loop only processes tiny vectors (~384 floats), not raw text. Training 50 epochs on 2000 examples takes seconds.

### 3. Export layer (`tinytrainer.export`)

Three export targets:
- **ONNX**: `torch.onnx.export()` with dynamic batch axis
- **Core ML**: ONNX → coremltools conversion, with updatable layers marked
- **Kit**: zip packaging of model + metadata + recipe

The export is head-only. The backbone embedding step is a separate concern handled by the consuming application (e.g., NLEmbedding on iOS).

## Key design decisions

### Frozen backbone
The backbone never trains. This makes:
- Training fast (seconds, not hours)
- Export clean (classifier head is ~5KB)
- Mobile update marking simple (everything in the head is trainable)

### Head-only export
The backbone (~80MB) has optimized implementations for every platform. Exporting it inside the classifier would make the model huge and the updatable marking fragile. By separating, the kit transfers instantly and the mobile app chains: `embed → classify`.

### Precomputed embeddings
Since the backbone is frozen, embedding outputs are deterministic. Computing them once and caching as numpy arrays avoids redundant work across epochs.

### .kit.zip as standard zip
No custom format. Any language can read the manifest, label map, and recipe. The model files (ONNX, Core ML) use their own standard formats inside the zip.
