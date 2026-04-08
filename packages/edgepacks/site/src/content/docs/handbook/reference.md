---
title: CLI Reference
description: Complete CLI command reference for EdgePacks.
sidebar:
  order: 2
---

## Global options

| Flag | Description |
|------|-------------|
| `--version`, `-v` | Show version and exit |
| `--debug` | Enable verbose logging and full tracebacks |
| `--help` | Show help for any command |

## Commands

### `edgepacks list`

List all available dataset packs with their task type, example count, and description.

```bash
edgepacks list
```

### `edgepacks info <pack>`

Show detailed information about a pack: task type, generation mode, label space, eval protocol, and metrics.

```bash
edgepacks info tool-routing
```

### `edgepacks preview <pack>`

Show sample examples from a pack's seed data.

| Option | Default | Description |
|--------|---------|-------------|
| `--n`, `-n` | 3 | Number of examples to show |

```bash
edgepacks preview structured-extraction --n 10
```

### `edgepacks generate <pack>`

Generate synthetic examples using Ollama. Requires Ollama running locally.

| Option | Default | Description |
|--------|---------|-------------|
| `--count`, `-c` | 100 | Number of examples to generate |
| `--model`, `-m` | `qwen2.5:7b` | Ollama model to use |
| `--temperature`, `-t` | 0.8 | Sampling temperature |
| `--output`, `-o` | `./output` | Output directory |
| `--seed`, `-s` | 42 | Random seed |

```bash
edgepacks generate error-triage --count 500 --model llama3.2:3b
```

### `edgepacks mutate <pack>`

Generate hard negatives from existing examples. These are intentionally wrong examples used for contrastive training.

| Option | Default | Description |
|--------|---------|-------------|
| `--count`, `-c` | 50 | Number of hard negatives |
| `--strategies` | `swap_label,partial_input` | Comma-separated mutation strategies |
| `--model`, `-m` | `qwen2.5:7b` | Ollama model |

```bash
edgepacks mutate tool-routing --count 100 --strategies swap_label,partial_input
```

### `edgepacks validate <pack>`

Validate pack data quality. Reports how many examples pass schema and quality checks.

| Option | Default | Description |
|--------|---------|-------------|
| `--strict` | false | Exit with code 1 if any example is invalid |

```bash
edgepacks validate tool-routing --strict
```

### `edgepacks build <pack>`

Run the full pipeline: generate, mutate, validate, deduplicate, split, and balance.

| Option | Default | Description |
|--------|---------|-------------|
| `--count`, `-c` | 100 | Target example count |
| `--model`, `-m` | `qwen2.5:7b` | Ollama model |
| `--output`, `-o` | `./output` | Output directory |
| `--seed`, `-s` | 42 | Random seed |
| `--skip-generate` | false | Skip Ollama generation (use seed data only) |

```bash
edgepacks build tool-routing --count 2000 --model qwen2.5:7b --output ./data/
```

### `edgepacks export <pack>`

Export pack data for training in various formats.

| Option | Default | Description |
|--------|---------|-------------|
| `--format`, `-f` | `jsonl` | Export format: `jsonl`, `huggingface`, `unsloth`, `torchtune` |
| `--output`, `-o` | `./export` | Output directory |
| `--split` | `all` | Split to export: `train`, `val`, `test`, or `all` |

```bash
edgepacks export tool-routing --format unsloth --split train --output ./data/
```

### `edgepacks stats <pack>`

Show label distribution, balance ratio, and identify under/over-represented labels.

```bash
edgepacks stats error-triage
```

### `edgepacks check-leakage <pack>`

Check for data leakage between train/val/test splits. Exits with code 1 if any leaked examples are found.

```bash
edgepacks check-leakage tool-routing
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | User error (pack not found, validation failed, leakage detected) |
| 2 | Runtime error (Ollama unreachable, unexpected failure) |

## Error format

All errors include structured fields:

- **code** — machine-readable identifier (e.g. `INPUT_PACK_NOT_FOUND`, `DEP_OLLAMA_FAILED`)
- **message** — human-readable description
- **hint** — actionable suggestion

Pass `--debug` to see full tracebacks.
