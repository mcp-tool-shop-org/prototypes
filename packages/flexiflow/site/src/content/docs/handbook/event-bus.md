---
title: Event Bus
description: Subscribe and publish events with priority, delivery modes, error policies, observability, and retry.
sidebar:
  order: 2
---

The event bus is the backbone of FlexiFlow. Every state change, message, and component lifecycle event flows through it.

## Subscribe and publish

### Subscribe with priority

Priority ranges from **1** (highest) to **5** (lowest). Lower numbers are called first.

```python
handle = await bus.subscribe(
    "my.event", "my_component", handler, priority=2
)
```

### Publish

```python
await bus.publish("my.event", data)
```

### Cleanup

```python
bus.unsubscribe(handle)
bus.unsubscribe_all("my_component")
```

## Delivery modes

When publishing, you can choose how handlers are invoked:

### Sequential (default)

Handlers run one at a time, in priority order. If one fails, the error policy determines what happens next.

```python
await bus.publish("my.event", data, delivery="sequential")
```

### Concurrent

Handlers run in parallel via `asyncio.gather`. Fastest when handlers are independent.

```python
await bus.publish("my.event", data, delivery="concurrent")
```

## Error policies

Error policies control what happens when a handler raises an exception:

| Policy | Behavior |
|--------|----------|
| `continue` | Log the error and keep calling remaining handlers |
| `raise` | Fail fast — re-raise the exception immediately |

Set the policy when creating the bus or per-publish call.

## Observability events

FlexiFlow emits these built-in events so you can monitor component and engine activity:

| Event | When | Payload |
|-------|------|---------|
| `engine.component.registered` | Component registered with the engine | `{component}` |
| `component.message.received` | A message is received by a component | `{component, message}` |
| `state.changed` | A state transition occurs | `{component, from_state, to_state}` |
| `event.handler.failed` | A handler throws an exception (continue mode) | `{event_name, component_name, exception}` |

Subscribe to these events like any other:

```python
await bus.subscribe("state.changed", "monitor", my_state_logger, priority=5)
```

## Retry decorator

For handlers that call flaky services or do I/O, use the retry decorator:

```python
from flexiflow.extras.retry import retry_async, RetryConfig

@retry_async(RetryConfig(max_attempts=3, base_delay=0.2, jitter=0.2))
async def my_handler(data):
    await call_flaky_service(data)
```

`RetryConfig` fields:

| Field | Default | Description |
|-------|---------|-------------|
| `max_attempts` | 3 | Total attempts (including the first) |
| `base_delay` | 1.0 | Seconds to wait between attempts |
| `jitter` | 0.0 | Random jitter added to delay (in seconds) |
