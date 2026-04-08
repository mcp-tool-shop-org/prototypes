---
title: Architecture
description: How EdgePacks is structured internally.
sidebar:
  order: 3
---

EdgePacks has three layers that compose cleanly. Data flows from schema through foundry to delivery.

## Layer 1: Schema

The schema layer defines what a dataset pack IS. All types are Pydantic models.

```
edgepacks/schema/
  pack.py          PackSpec — the root type for a pack definition
  example.py       Example, HardNegative — individual data points
  eval_protocol.py EvalProtocol, EvalMetric — how to measure success
  splits.py        SplitConfig, SplitResult — train/val/test configuration
```

### PackSpec

The central type. Every pack returns a `PackSpec` containing:

- `name`, `version`, `description` — metadata
- `task_type` — what kind of ML task (classification, extraction, etc.)
- `generation_mode` — how synthetic examples are created
- `examples` — list of `Example` objects (input/output pairs)
- `hard_negatives` — list of `HardNegative` objects (wrong answers for contrastive training)
- `label_space` — valid labels for classification tasks
- `split_config` — train/val/test ratios and random seed
- `eval_protocol` — metrics, thresholds, and description

### Example

An input/output pair with metadata:

- `input` — the model's input (dict)
- `output` — the expected output (dict)
- `source` — where it came from (`curated`, `synthetic`, `mutated`)
- `quality_checks` — optional validation results

## Layer 2: Foundry

The foundry layer creates, validates, and transforms pack data. Each operation is a **stage** in a composable pipeline.

```
edgepacks/foundry/
  pipeline.py      Pipeline — ordered sequence of stages
  generate.py      GenerateStage — synthetic example creation via Ollama
  mutate.py        MutateStage — hard negative generation
  validate.py      ValidateStage — schema + quality filtering
  deduplicate.py   DeduplicateStage — exact + fuzzy dedup
  split.py         SplitStage — train/val/test splitting
  balance.py       BalanceStage — label distribution balancing
  ollama_client.py OllamaClient — thin HTTP client for Ollama
```

### Pipeline

Stages compose into a pipeline that transforms a `PackSpec` step by step:

```
PackSpec → Generate → Mutate → Validate → Dedup → Split → Balance → PackSpec
```

Each stage receives a `PackSpec` and returns a new `PackSpec` with its modifications applied. The pipeline calls an optional `on_stage_complete` callback after each stage.

### Ollama client

A minimal HTTP client that talks to Ollama's `/api/generate` and `/api/chat` endpoints. Features:

- Retry logic with exponential backoff (3 attempts)
- Health check endpoint
- No SDK dependency — uses httpx directly
- Raises `OllamaError` with structured fields on failure

## Layer 3: Delivery

The delivery layer gets data out of EdgePacks and into your training stack.

```
edgepacks/export/
  base.py          ExportFormat enum + get_exporter factory
  jsonl.py         JsonlExporter — one JSON object per line
  huggingface.py   HuggingFaceExporter — datasets-compatible format
  unsloth.py       UnslothExporter — ShareGPT conversation format
  torchtune.py     TorchtuneExporter — dialogue format for torchtune

edgepacks/cli.py   Typer CLI — all user-facing commands
```

### Export formats

| Format | Output | Use with |
|--------|--------|----------|
| `jsonl` | `.jsonl` files | Any training framework |
| `huggingface` | `dataset_dict/` structure | HuggingFace Trainer, TRL |
| `unsloth` | ShareGPT `.jsonl` | Unsloth fine-tuning |
| `torchtune` | Dialogue `.jsonl` | Meta torchtune |

## Packs

Packs live in `edgepacks/packs/`. Each pack is a Python package that exposes a `spec()` method returning a `PackSpec`.

```
edgepacks/packs/
  _base.py                  BasePack abstract class
  __init__.py               discover_packs() — auto-discovers all packs
  tool_routing/             NL request → tool + args
  structured_extraction/    Messy text → structured JSON
  error_triage/             Error log → cause + severity + action
```

Each pack directory contains:

- `spec.py` — pack definition with seed examples
- `generator.py` — Ollama prompt templates for synthetic generation
- `mutator.py` — strategies for creating hard negatives
- `evaluator.py` — pack-specific quality checks
