---
title: Welcome
description: TinyTrainer — desktop training foundry + mobile personalization export pipeline.
sidebar:
  order: 0
---

TinyTrainer trains tiny classifier heads on frozen sentence embeddings, exports them to ONNX and Core ML, and packages everything into portable training kits for mobile deployment.

## The product thesis

Small models can beat general models on narrow tasks once tuned on clean data. The ecosystem has great plumbing (HuggingFace, Unsloth, torchtune) but no pipeline from "task pack" to "trained model" to "mobile-safe export with on-device personalization."

TinyTrainer fills that gap.

## How it works

1. **Backbone** (frozen): `all-MiniLM-L6-v2` sentence embeddings (384-dim). Computed once, cached.
2. **Head** (trainable): Linear or MLP classifier on precomputed embeddings. Tiny (~5KB-50KB).
3. **Training**: PyTorch, Adam/SGD, early stopping, CrossEntropyLoss.
4. **Export**: Head-only to ONNX + Core ML (with updatable layers for on-device personalization).
5. **Kit**: `.kit.zip` bundle with model + config + recipe + tokenizer ref + eval scores.

## Part of the TinyTrainer ecosystem

| Product | Role |
|---------|------|
| [edgepacks](https://github.com/mcp-tool-shop-org/edgepacks) | Task-dataset foundry — produces training packs |
| **tinytrainer** (this) | Desktop training + mobile export |
| [TinyTrainer Mobile](https://github.com/mcp-tool-shop-org/TinyTrainerMobile) | iOS reference app — on-device personalization |
