# Feature-Reacher Architecture

## Overview

Feature-Reacher is a diagnostic tool that analyzes product artifacts to identify features at risk of low adoption.

## Layers

### Domain (`/src/domain`)
Core business logic and type definitions:
- Feature model
- Evidence structures
- Diagnosis types

### Analysis (`/src/analysis`)
Diagnostic and scoring logic:
- Feature extraction from artifacts
- Recency and visibility heuristics
- Risk diagnosis engine
- Ranking algorithms

### UI (`/src/ui`)
Reusable presentation components:
- Form elements
- Cards and layouts
- Export components

### App (`/src/app`)
Next.js pages and routing:
- Upload interface
- Audit dashboard
- Export views

## Data Flow

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report
```

## Design Principles

1. **No magic**: Every diagnosis is explainable with cited evidence
2. **Heuristics first**: No ML until heuristics prove insufficient
3. **Deterministic**: Same input always produces same output
4. **Transparent**: Users can trace any conclusion back to source
