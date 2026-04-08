---
title: Getting Started
description: How to install EdgePacks and build your first dataset.
sidebar:
  order: 1
---

## Prerequisites

- Python 3.11 or later
- [Ollama](https://ollama.ai) running locally (for synthetic generation only)

## Install

```bash
pip install edgepacks
```

For fuzzy deduplication support (uses datasketch for MinHash):

```bash
pip install edgepacks[fuzzy]
```

## Verify installation

```bash
edgepacks --version
edgepacks list
```

You should see the three launch packs: `tool-routing`, `structured-extraction`, and `error-triage`.

## Your first dataset

### Step 1: Explore a pack

```bash
# See what is in the tool-routing pack
edgepacks info tool-routing

# Preview some seed examples
edgepacks preview tool-routing --n 5
```

### Step 2: Build the dataset

Make sure Ollama is running with a model available:

```bash
ollama pull qwen2.5:7b
edgepacks build tool-routing --count 200 --model qwen2.5:7b --output ./data/
```

The `build` command runs the full pipeline:
1. **Generate** — creates synthetic examples from the pack's generation recipe
2. **Mutate** — generates hard negatives (intentionally wrong examples)
3. **Validate** — filters out malformed or low-signal examples
4. **Deduplicate** — removes near-duplicate examples
5. **Split** — divides into train/val/test sets
6. **Balance** — ensures even label distribution

### Step 3: Export for your trainer

```bash
# Export in Unsloth format
edgepacks export tool-routing --format unsloth --output ./data/

# Or HuggingFace datasets format
edgepacks export tool-routing --format huggingface --output ./data/

# Or plain JSONL
edgepacks export tool-routing --format jsonl --output ./data/
```

### Step 4: Quality checks

```bash
# Check label balance
edgepacks stats tool-routing

# Verify no data leaks between splits
edgepacks check-leakage tool-routing
```

## Working without Ollama

If you do not have Ollama available, you can still work with the seed examples:

```bash
# Skip generation, use only curated seed data
edgepacks build tool-routing --skip-generate --output ./data/

# Or export seed examples directly
edgepacks export tool-routing --format jsonl --output ./data/
```

The seed examples are bundled in the package and always available.

## Debugging

Pass `--debug` to any command for verbose output and full tracebacks:

```bash
edgepacks --debug build tool-routing --count 100
```
