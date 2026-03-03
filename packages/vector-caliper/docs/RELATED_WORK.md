# Related Work

This document positions VectorCaliper relative to existing tools. The goal is clarity, not competition.

---

## Overview

VectorCaliper occupies a specific niche: **faithful visualization of training state trajectories**. It does not replace other tools—it complements them for a narrow use case.

---

## Training Dashboards

### TensorBoard

**What it does:** Training dashboard with metrics, histograms, embeddings, profiling.

**How VectorCaliper differs:**
- TensorBoard interprets data (smoothing, aggregation)
- TensorBoard recommends actions (via plugins)
- VectorCaliper shows raw state without interpretation

**When to use which:**
- TensorBoard: monitoring training runs, comparing experiments
- VectorCaliper: debugging specific trajectory segments, understanding dynamics

### Weights & Biases

**What it does:** Experiment tracking, hyperparameter sweeps, model registry.

**How VectorCaliper differs:**
- W&B manages experiments across runs
- W&B provides comparative analysis and recommendations
- VectorCaliper visualizes single trajectories faithfully

**When to use which:**
- W&B: experiment management, team collaboration, production workflows
- VectorCaliper: inspecting what happened in a specific run

### MLflow

**What it does:** ML lifecycle management, model registry, deployment.

**How VectorCaliper differs:**
- MLflow manages the full ML lifecycle
- MLflow focuses on reproducibility of experiments
- VectorCaliper focuses on reproducibility of visualization

**When to use which:**
- MLflow: experiment tracking, model versioning, deployment
- VectorCaliper: understanding training dynamics post-hoc

---

## Visualization Tools

### Embedding Projector (TensorBoard)

**What it does:** Visualizes high-dimensional embeddings with PCA, t-SNE, UMAP.

**How VectorCaliper differs:**
- Embedding Projector visualizes data embeddings
- VectorCaliper visualizes training state (not data)
- VectorCaliper provides deterministic, seeded projections

**When to use which:**
- Embedding Projector: exploring learned representations
- VectorCaliper: understanding how representations evolve during training

### Loss Landscape Visualization

**What it does:** Visualizes the loss surface around a point in parameter space.

**How VectorCaliper differs:**
- Loss landscape tools sample the loss function
- VectorCaliper visualizes the trajectory through the landscape
- VectorCaliper does not compute loss—it accepts measured values

**When to use which:**
- Loss landscape tools: understanding local geometry at a point
- VectorCaliper: understanding the path taken through that geometry

---

## Logging Libraries

### Python logging / structlog / loguru

**What they do:** Structured logging for Python applications.

**How VectorCaliper differs:**
- Logging libraries emit records
- VectorCaliper consumes structured state and produces visualization
- VectorCaliper defines a specific state schema for training dynamics

**When to use which:**
- Logging libraries: capturing events during training
- VectorCaliper: visualizing captured state

### TensorBoard SummaryWriter / WandB Logger

**What they do:** Emit metrics during training.

**How VectorCaliper differs:**
- These loggers integrate with their respective dashboards
- VectorCaliper is dashboard-agnostic
- VectorCaliper provides adapters that don't modify training state

**When to use which:**
- Summary writers: streaming metrics to dashboards
- VectorCaliper: post-hoc analysis of captured state

---

## What VectorCaliper Is Not

To be explicit, VectorCaliper is **not**:

| Category | Example Tools | Why Not VectorCaliper |
|----------|---------------|----------------------|
| Dashboard | TensorBoard, W&B | VC does not aggregate, smooth, or recommend |
| Experiment tracker | MLflow, Neptune | VC does not manage experiments |
| Hyperparameter tuner | Optuna, Ray Tune | VC does not search or optimize |
| Model debugger | PyTorch Debugger | VC does not inspect activations or gradients |
| Profiler | PyTorch Profiler | VC does not measure compute or memory |

---

## Ecosystem Position

```
┌─────────────────────────────────────────────────────────────┐
│                    ML Development Ecosystem                  │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Experiment    │   Training      │   Debugging             │
│   Management    │   Monitoring    │   & Inspection          │
├─────────────────┼─────────────────┼─────────────────────────┤
│ MLflow          │ TensorBoard     │ PyTorch Debugger        │
│ W&B             │ W&B             │ Loss Landscape Tools    │
│ Neptune         │ Neptune         │ ★ VectorCaliper ★       │
└─────────────────┴─────────────────┴─────────────────────────┘
```

VectorCaliper sits in the **Debugging & Inspection** column, specifically for **training dynamics visualization**.

---

## When VectorCaliper Adds Value

VectorCaliper is valuable when:

1. You need to **debug training dynamics** (not just monitor metrics)
2. You need **faithful representation** (no smoothing or interpretation)
3. You need **reproducible visualization** (same input → same output)
4. You need to **understand regime transitions** (warmup → learning → convergence)
5. You need **publication-ready figures** from training trajectories

VectorCaliper does **not** add value when:

1. You need real-time monitoring
2. You need comparative analysis across experiments
3. You need automated recommendations
4. You need anomaly detection
5. You need hyperparameter optimization

---

## Complementary Usage

VectorCaliper works alongside other tools:

```
Training Loop
    │
    ├──► TensorBoard (real-time monitoring)
    │
    ├──► W&B (experiment tracking)
    │
    └──► VectorCaliper Adapter (state capture)
              │
              ▼
        Post-hoc Analysis
              │
              ▼
        VectorCaliper Visualization
```

Use dashboards for monitoring. Use VectorCaliper for inspection.
