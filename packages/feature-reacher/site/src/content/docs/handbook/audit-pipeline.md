---
title: Audit Pipeline
description: The 6-step deterministic pipeline from raw artifact text to ranked adoption risk report.
sidebar:
  order: 2
---

Feature-Reacher processes text through a deterministic 6-step pipeline. Every step is transparent, reproducible, and explainable.

## Pipeline overview

```
Artifact Upload → Text Normalization → Feature Extraction →
Heuristic Scoring → Diagnosis Generation → Risk Ranking → Report
```

## Step 1: Artifact Upload

Paste text directly, upload a `.txt` or `.md` file, or select a saved Artifact Set. The raw input is your product documentation, release notes, changelogs, or feature specs.

## Step 2: Text Normalization

The raw artifact is cleaned and normalized — whitespace standardized, markdown structure preserved for citation linking, and section boundaries identified. This produces a stable corpus that downstream steps reference.

## Step 3: Feature Extraction

The normalized text is parsed to identify discrete features. Each extracted feature includes:
- A **name** derived from the text
- **Evidence citations** linking back to specific passages in the artifact
- **Contextual signals** (visibility cues, documentation density, recency markers)

## Step 4: Heuristic Scoring

Each feature receives a risk score from 0 to 1 based on transparent heuristics:
- **Recency decay** — older features with no recent mentions score higher risk
- **Visibility signals** — features buried deep in docs or lacking prominent placement score higher
- **Documentation density** — thin or missing docs relative to feature complexity raises the score

No ML models, no embeddings, no probabilistic inference. The same inputs always produce the same scores.

## Step 5: Diagnosis Generation

Scored features are classified into one of six diagnosis types, each triggered by explicit signal patterns:

| Diagnosis | Trigger |
|-----------|---------|
| **Buried** | Feature exists but has low visibility in docs |
| **Undocumented** | Feature referenced in code/changelogs but missing from user-facing docs |
| **Stale** | Feature not mentioned in recent releases, may be abandoned |
| **Complex** | Feature requires multi-step setup with insufficient guidance |
| **Shadowed** | Feature overshadowed by a more prominent similar feature |
| **Orphaned** | Feature exists in isolation with no clear user path to it |

## Step 6: Risk Ranking

Diagnosed features are sorted by risk score (highest first) to produce the final ranked report. Each entry includes:
- Feature name and risk score
- Diagnosis type and triggering signals
- Cited evidence (linked back to the artifact)
- Recommended action

## Design principles

- **No magic** — every conclusion is traceable to an artifact passage
- **Heuristics first** — deterministic rules, not statistical models
- **Deterministic** — same input always produces the same output
- **Transparent** — expand any result to see exactly why it was flagged
