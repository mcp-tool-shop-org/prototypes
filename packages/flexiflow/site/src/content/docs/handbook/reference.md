---
title: Reference
description: Persistence backends, error handling hierarchy, structured logging with correlation IDs, and security scope.
sidebar:
  order: 4
---

## Persistence

FlexiFlow supports two persistence backends. Choose based on your use case.

### JSON vs SQLite

| Feature | JSON | SQLite |
|---------|------|--------|
| History | Overwrites on each save | Appends snapshots |
| Retention | N/A | `prune_snapshots_sqlite()` |
| Best for | Dev / debugging | Production |

### Save and restore (JSON)

```python
from flexiflow.extras import save_component, load_snapshot, restore_component

# Save current state
save_component(component, "state.json")

# Restore later
snapshot = load_snapshot("state.json")
restored = restore_component(snapshot, engine)
```

### Save and restore (SQLite)

```python
import sqlite3
from flexiflow.extras import save_snapshot_sqlite, load_latest_snapshot_sqlite

conn = sqlite3.connect("state.db")
save_snapshot_sqlite(conn, snapshot)
latest = load_latest_snapshot_sqlite(conn, "my_component")
```

### Snapshot pruning

In production, snapshots accumulate. Prune old ones to keep the database lean:

```python
from flexiflow.extras import prune_snapshots_sqlite

# Keep only the 50 most recent snapshots per component
prune_snapshots_sqlite(conn, "my_component", keep=50)
```

## Error handling

All exceptions inherit from `FlexiFlowError`. Each error includes structured fields: **What**, **Why**, **Fix**, and **Context**.

### Error hierarchy

```
FlexiFlowError (base)
├── ConfigError      — Configuration validation failures
├── StateError       — State registry / machine errors
├── PersistenceError — JSON / SQLite persistence errors
└── ImportError_     — Dotted path import failures
```

### Catching errors

```python
from flexiflow import FlexiFlowError, StateError

try:
    sm = StateMachine.from_name("BadState")
except StateError as e:
    print(e)  # includes What, Why, Fix, and Context
```

Every error tells you what went wrong, why, and how to fix it. No raw stack traces in production.

## Structured logging

FlexiFlow bakes **correlation IDs** into every log entry. When a message enters the system, it gets a unique ID that follows it through every handler, state transition, and persistence call.

This means you can trace any message through the full pipeline — from receipt to state change to persistence — using a single grep.

## Security scope

FlexiFlow is a **local-first** library. Here is what it does and does not access:

| Scope | Details |
|-------|---------|
| **Data accessed** | In-process state machine data, optional SQLite persistence for state history |
| **Data NOT accessed** | No cloud sync, no telemetry, no analytics, no network calls, no authentication |
| **Permissions** | File system write only for optional SQLite persistence. No elevated permissions |

Full security policy: [SECURITY.md](https://github.com/mcp-tool-shop-org/flexiflow/blob/main/SECURITY.md)
