---
title: Getting Started
description: Install FlexiFlow, configure your first component, and run it from the CLI or embedded Python.
sidebar:
  order: 1
---

## Installation

Install from PyPI:

```bash
pip install flexiflow
```

### Optional extras

FlexiFlow ships with optional extras for common use cases:

```bash
pip install flexiflow[reload]   # hot-reload with watchfiles
pip install flexiflow[api]      # FastAPI integration
pip install flexiflow[dev]      # pytest + coverage
```

## CLI usage

The `flexiflow` CLI lets you register components, send messages, and hot-swap rules without writing Python.

### Register and start a component

```bash
flexiflow register --config examples/config.yaml --start
```

### Send messages through the state machine

```bash
flexiflow handle --config examples/config.yaml confirm --content confirmed
flexiflow handle --config examples/config.yaml complete
```

### Hot-swap rules at runtime

```bash
flexiflow update_rules --config examples/config.yaml examples/new_rules.yaml
```

## Embedded Python usage

For programmatic control, use the engine directly:

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

## Environment variable

You can set `FLEXIFLOW_CONFIG` to point at your config file and omit `--config` from every CLI invocation:

```bash
export FLEXIFLOW_CONFIG=/path/to/config.yaml
flexiflow register --start
flexiflow handle confirm
```

## Config introspection

Before running anything, you can validate and inspect your configuration:

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
```

This shows what components will be created, which states are registered, and flags any issues before you commit to a run.
