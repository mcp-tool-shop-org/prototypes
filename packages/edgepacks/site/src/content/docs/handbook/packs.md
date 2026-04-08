---
title: Pack Guide
description: Detailed guide to each available training pack.
sidebar:
  order: 4
---

Each pack targets one narrow ML capability. This page describes what each pack trains, its label space, and typical use cases.

## tool-routing

**Task:** Classification — route a natural language request to the correct tool with the right arguments.

**Use case:** You have a set of tools (search, calculator, file reader, API caller) and need a small model to decide which tool to invoke for a given user request.

**Label space:** One label per tool in the pack's registry. Each example maps a natural language input to a tool name and argument dict.

**Example:**

```json
{
  "input": { "request": "What is 42 * 17?" },
  "output": { "tool": "calculator", "args": { "expression": "42 * 17" } }
}
```

**Generation approach:** The generator creates diverse phrasings for each tool, varying formality, ambiguity, and complexity. The mutator creates hard negatives by swapping tool labels and truncating inputs.

```bash
edgepacks build tool-routing --count 2000 --model qwen2.5:7b
```

## structured-extraction

**Task:** Extraction — pull structured data from messy, unformatted text.

**Use case:** You receive freeform text (emails, logs, reports) and need a model to extract specific fields into a clean JSON structure.

**Label space:** N/A (extraction tasks produce structured output, not discrete labels).

**Example:**

```json
{
  "input": { "text": "Meeting with Sarah Chen on March 15th at 2pm in Room 401 to discuss Q2 budget" },
  "output": {
    "attendee": "Sarah Chen",
    "date": "2024-03-15",
    "time": "14:00",
    "location": "Room 401",
    "topic": "Q2 budget"
  }
}
```

**Generation approach:** The generator creates varied text formats (emails, notes, transcripts) with different field combinations. Hard negatives include partial extractions and hallucinated fields.

```bash
edgepacks build structured-extraction --count 1000 --model qwen2.5:7b
```

## error-triage

**Task:** Classification — categorize error logs by root cause, severity, and recommended next step.

**Use case:** Your system produces error logs and you need a model to quickly triage them for the operations team.

**Label space:** Categories for cause (config, dependency, permission, runtime, network), severity (low, medium, high, critical), and action (retry, escalate, fix-config, restart, investigate).

**Example:**

```json
{
  "input": { "error": "ConnectionRefusedError: [Errno 111] Connection refused to postgres:5432" },
  "output": {
    "cause": "dependency",
    "severity": "high",
    "action": "restart",
    "explanation": "Database connection failed, likely the PostgreSQL service is down"
  }
}
```

**Generation approach:** The generator creates realistic error messages across different categories. Hard negatives swap severity levels and suggest wrong remediation actions.

```bash
edgepacks build error-triage --count 1500 --model qwen2.5:7b
```

## Pack quality checks

Every pack includes built-in validation. Use these commands to verify quality:

```bash
# Validate schema and quality rules
edgepacks validate tool-routing --strict

# Check label balance (classification packs)
edgepacks stats tool-routing

# Verify no data leakage between splits
edgepacks check-leakage tool-routing
```

## Choosing a model

The `--model` flag accepts any model available in your local Ollama instance. Recommendations:

| Model | Speed | Quality | VRAM |
|-------|-------|---------|------|
| `qwen2.5:7b` | Fast | Good | ~5 GB |
| `llama3.2:3b` | Very fast | Adequate | ~3 GB |
| `qwen2.5:14b` | Moderate | Very good | ~10 GB |
| `llama3.1:8b` | Fast | Good | ~6 GB |

Smaller models generate faster but may produce more examples that fail validation. The pipeline automatically filters low-quality outputs.
