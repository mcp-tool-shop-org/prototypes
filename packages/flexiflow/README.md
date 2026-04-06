<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/flexiflow/readme.png" alt="FlexiFlow logo" width="400">
</p>

<p align="center">
    <em>A lightweight async component engine with events, state machines, and a minimal CLI.</em>
</p>

<p align="center">
    <a href="https://github.com/mcp-tool-shop-org/flexiflow/actions/workflows/tests.yml">
        <img src="https://github.com/mcp-tool-shop-org/flexiflow/actions/workflows/tests.yml/badge.svg" alt="CI">
    </a>
    <a href="https://pypi.org/project/flexiflow/">
        <img src="https://img.shields.io/pypi/v/flexiflow" alt="PyPI version">
    </a>
    <a href="https://opensource.org/licenses/MIT">
        <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
    </a>
    <a href="https://mcp-tool-shop-org.github.io/flexiflow/">
        <img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page">
    </a>
</p>

**A small async component engine with events, state machines, and a minimal CLI.**

---

## Why FlexiFlow?

Most workflow engines are heavyweight, opinionated, and assume you want a DAG runner.
FlexiFlow is none of those things. It gives you:

- **Components** with declarative rules and pluggable state machines
- **An async event bus** with priority, filters, and sequential or concurrent delivery
- **Structured logging** with correlation IDs baked in
- **Persistence** (JSON for dev, SQLite for production) with snapshot history and pruning
- **A minimal CLI** so you can demo and debug without writing a harness
- **Config introspection** (`explain()`) to validate before you run

All in under 2,000 lines of pure Python. No heavy dependencies. No magic.

---

## Install

```bash
pip install flexiflow
```

With optional extras:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

---

## Quick Start

### CLI

```bash
# Register a component and start it
flexiflow register --config examples/config.yaml --start

# Send messages through the state machine
flexiflow handle --config examples/config.yaml confirm --content confirmed
flexiflow handle --config examples/config.yaml complete

# Hot-swap rules at runtime
flexiflow update_rules --config examples/config.yaml examples/new_rules.yaml
```

### Embedded (Python)

```python
from flexiflow.engine import FlexiFlowEngine
from flexiflow.config_loader import ConfigLoader

config = ConfigLoader.load_component_config("config.yaml")
engine = FlexiFlowEngine()

# Register and interact
component = engine.create_component(config)
await engine.handle_message(component.name, "start")
await engine.handle_message(component.name, "confirm", content="confirmed")
```

You can also set `FLEXIFLOW_CONFIG=/path/to/config.yaml` and omit `--config` from the CLI.

---

## API Overview

### Event Bus

```python
# Subscribe with priority (1=highest, 5=lowest)
handle = await bus.subscribe("my.event", "my_component", handler, priority=2)

# Publish with delivery mode
await bus.publish("my.event", data, delivery="sequential")   # ordered
await bus.publish("my.event", data, delivery="concurrent")    # parallel

# Cleanup
bus.unsubscribe(handle)
bus.unsubscribe_all("my_component")
```

**Error policies:** `continue` (log and keep going) or `raise` (fail fast).

### State Machines

Built-in message types: `start`, `confirm`, `cancel`, `complete`, `error`, `acknowledge`.

Load custom states via dotted paths:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

Or register entire state packs:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

### Observability Events

| Event | When | Payload |
|-------|------|---------|
| `engine.component.registered` | Component registered | `{component}` |
| `component.message.received` | Message received | `{component, message}` |
| `state.changed` | State transition | `{component, from_state, to_state}` |
| `event.handler.failed` | Handler exception (continue mode) | `{event_name, component_name, exception}` |

### Retry Decorator

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    ...
```

### Persistence

| Feature | JSON | SQLite |
|---------|------|--------|
| History | Overwrites | Appends |
| Retention | N/A | `prune_snapshots_sqlite()` |
| Best for | Dev/debugging | Production |

```python
from flexiflow.extras import save_component, load_snapshot, restore_component

# JSON: save and restore
save_component(component, "state.json")
snapshot = load_snapshot("state.json")
restored = restore_component(snapshot, engine)
```

```python
import sqlite3
from flexiflow.extras import save_snapshot_sqlite, load_latest_snapshot_sqlite

conn = sqlite3.connect("state.db")
save_snapshot_sqlite(conn, snapshot)
latest = load_latest_snapshot_sqlite(conn, "my_component")
```

### Config Introspection

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

---

## Error Handling

All exceptions inherit from `FlexiFlowError` with structured messages (What / Why / Fix / Context):

```
FlexiFlowError (base)
├── ConfigError      # Configuration validation failures
├── StateError       # State registry/machine errors
├── PersistenceError # JSON/SQLite persistence errors
└── ImportError_     # Dotted path import failures
```

```python
from flexiflow import FlexiFlowError, StateError

try:
    sm = StateMachine.from_name("BadState")
except StateError as e:
    print(e)  # includes What, Why, Fix, and Context
```

---

## Examples

See [`examples/embedded_app/`](examples/embedded_app/) for a complete working example with custom states, SQLite persistence, observability subscriptions, and retention pruning.

---

## Security & Data Scope

FlexiFlow is a **local-first** async component engine library.

- **Data accessed:** In-process state machine data, optional SQLite persistence for state history
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No network calls. No authentication
- **Permissions:** File system write only for optional SQLite persistence. No elevated permissions

Full policy: [SECURITY.md](SECURITY.md)

---

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10/10 |
| B. Error Handling | 10/10 |
| C. Operator Docs | 10/10 |
| D. Shipping Hygiene | 10/10 |
| E. Identity (soft) | 10/10 |
| **Overall** | **50/50** |

---

## License

[MIT](LICENSE) -- Copyright (c) 2025-2026 mcp-tool-shop

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
