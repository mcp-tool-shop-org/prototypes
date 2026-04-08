---
title: EdgePacks Handbook
description: Complete guide to building fine-tuning datasets with EdgePacks.
sidebar:
  order: 0
---

EdgePacks is a task-dataset foundry for training small models on narrow jobs. It provides pre-built dataset templates (packs) for specific capabilities, with synthetic generation, validation, and export to common fine-tuning formats.

## Who is this for?

- ML engineers who need high-quality training data for small, specialized models
- Teams fine-tuning models for tool routing, structured extraction, or error triage
- Anyone who wants curated training datasets without manual labeling

## What you get

Each pack includes everything needed to train a capable model on one specific skill:

- **Seed examples** — hand-curated demonstrations of the target behavior
- **Generation recipe** — prompts that produce synthetic examples via local Ollama
- **Validation rules** — schema checks and quality filters that reject bad rows
- **Hard negatives** — intentionally wrong examples for contrastive training
- **Eval protocol** — metrics and thresholds to verify the model learned the skill
- **Export paths** — JSONL, HuggingFace datasets, Unsloth, torchtune formats

## Design principles

1. **Narrow over broad** — each pack trains exactly one capability, not a general-purpose model
2. **Local generation** — all synthetic data comes from Ollama on your machine. No cloud APIs, no cost
3. **Quality over quantity** — validation and deduplication are built into the pipeline, not bolted on
4. **Format-agnostic** — export to whatever your training stack expects

## Available packs

| Pack | Task | What it trains |
|------|------|---------------|
| `tool-routing` | Classification | Natural language request to correct tool + arguments |
| `structured-extraction` | Extraction | Messy text to structured JSON |
| `error-triage` | Classification | Error logs to cause + severity + next step |

## Quick tour

```bash
# Install
pip install edgepacks

# See available packs
edgepacks list

# Build a complete dataset
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```
