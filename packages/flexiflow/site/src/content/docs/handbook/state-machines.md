---
title: State Machines
description: Built-in message types, custom states via dotted paths, YAML state packs, and config introspection.
sidebar:
  order: 3
---

FlexiFlow's state machines are declarative: you define states and transitions in config, not code. The engine handles the rest.

## Built-in message types

Every state machine understands these messages out of the box:

| Message | Purpose |
|---------|---------|
| `start` | Begin processing — transition from initial state |
| `confirm` | Acknowledge or approve — move forward |
| `cancel` | Abort the current flow |
| `complete` | Mark the component as done |
| `error` | Signal a failure |
| `acknowledge` | Confirm receipt of an error or event |

These cover the most common lifecycle patterns. For anything else, define custom states.

## Custom states via dotted paths

Point your config at any Python class using dotted import paths:

```yaml
initial_state: "mypkg.states:MyInitialState"
```

FlexiFlow will import `mypkg.states` and resolve `MyInitialState` at runtime. The class must implement the state interface (handle incoming messages and return the next state).

## State packs via YAML

For components with multiple custom states, register an entire state pack:

```yaml
states:
  InitialState: "mypkg.states:InitialState"
  Processing: "mypkg.states:ProcessingState"
  Complete: "mypkg.states:CompleteState"
initial_state: InitialState
```

State packs let you swap entire workflows by changing one YAML file. No code changes required.

## Config introspection with explain()

Before running anything, validate your state machine configuration:

```python
from flexiflow import explain

result = explain("config.yaml")
if result.is_valid:
    print(result.format())
else:
    for issue in result.issues:
        print(f"  {issue}")
```

`explain()` will:

1. Load and parse the config
2. Resolve all dotted paths and verify they point to valid classes
3. Check that the initial state exists in the state registry
4. Report any missing or misconfigured states

This catches configuration errors before they become runtime surprises.
