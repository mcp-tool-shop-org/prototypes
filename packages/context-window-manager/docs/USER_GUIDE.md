# Context Window Manager - User Guide

> **Version**: 0.6.1
> **Last Updated**: 2026-01-23

---

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Basic Workflows](#basic-workflows)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Introduction

The Context Window Manager (CWM) is an MCP server that enables persistent context storage for LLM sessions. It allows you to:

- **Freeze** your conversation context at any point
- **Thaw** frozen contexts to continue exactly where you left off
- **Clone** contexts for parallel exploration
- **Tag and organize** your saved contexts

### Why Use CWM?

LLM context windows are ephemeral - when you close a session, that context is lost. CWM solves this by:

1. Capturing KV cache state from vLLM
2. Storing it persistently (memory, disk, or Redis)
3. Restoring it later with full conversation fidelity

This is particularly valuable for:
- Long-running projects that span multiple sessions
- Exploratory conversations where you want to branch
- Preserving valuable context that took time to build

---

## Quick Start

### Prerequisites

- Python 3.11+
- vLLM server running (for KV cache operations)
- Claude Code or another MCP client

### Installation

```bash
pip install context-window-manager
```

### Configuration

Add to your MCP client configuration (e.g., `.claude/settings.json`):

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### First Session

1. Start a conversation with your LLM
2. When you want to save your context:

```
Use the window_freeze tool with:
- session_id: my-first-session
- window_name: project-kickoff
- description: Initial planning for the widget feature
- tags: [planning, widget]
```

3. Later, restore your context:

```
Use the window_thaw tool with:
- window_name: project-kickoff
```

---

## Core Concepts

### Sessions

A **session** represents an active conversation with the LLM. Each session has:
- A unique `session_id`
- An associated model
- A state (active, frozen, thawed, expired)
- Associated KV cache blocks

### Windows

A **window** is a named snapshot of a session's context. Think of it as a "save point" that captures:
- All KV cache blocks at freeze time
- Metadata (description, tags, timestamps)
- Reference to the original session

### KV Cache Blocks

The actual context data is stored as **blocks** - chunks of the key-value cache that the LLM uses for attention. CWM manages these blocks across storage tiers:
- **CPU memory**: Fast access, limited capacity
- **Disk**: Larger capacity, slower access
- **Redis**: Distributed, shareable across instances

### Storage Tiers

CWM automatically manages block placement:

```
Hot Access (CPU) → Warm Access (Disk) → Cold Storage (Redis)
```

Frequently accessed windows stay in faster tiers; older windows migrate to slower, larger tiers.

---

## Basic Workflows

### Workflow 1: Simple Save and Restore

**Scenario**: You're working on a complex problem and need to take a break.

```python
# Save your context
await window_freeze(
    session_id="current-session",
    window_name="debug-session-jan23",
    description="Debugging the authentication flow - found the issue with token refresh",
    tags=["debug", "auth"]
)

# ... time passes ...

# Restore and continue
result = await window_thaw(
    window_name="debug-session-jan23"
)
# Continue from exactly where you left off
```

### Workflow 2: Branching for Exploration

**Scenario**: You want to try two different approaches without losing your starting point.

```python
# Save the current state
await window_freeze(
    session_id="exploration",
    window_name="before-experiment"
)

# Try approach A
# ... conversation about approach A ...

# Save approach A
await window_freeze(
    session_id="exploration",
    window_name="approach-a",
    tags=["experiment", "approach-a"]
)

# Go back and try approach B
await window_thaw(window_name="before-experiment")

# ... conversation about approach B ...

# Save approach B
await window_freeze(
    session_id="exploration",
    window_name="approach-b",
    tags=["experiment", "approach-b"]
)

# Compare or choose the better approach
```

### Workflow 3: Cloning for Collaboration

**Scenario**: You want to share a context starting point with a colleague.

```python
# Clone your current work
await window_clone(
    source_window="my-project",
    target_window="my-project-for-alice",
    description="Clone for Alice to explore caching strategies"
)

# Alice can now thaw "my-project-for-alice" independently
```

### Workflow 4: Organizing with Tags

**Scenario**: You have many saved contexts and want to find relevant ones.

```python
# List all contexts for a specific project
result = await window_list(
    tags=["project-x"]
)

# List recent debugging sessions
result = await window_list(
    tags=["debug"],
    sort_by="created_at",
    sort_order="desc",
    limit=5
)
```

---

## Advanced Usage

### Auto-Freeze Policies

CWM can automatically freeze sessions based on policies:

```python
# Configure in settings or via API
auto_freeze_policy = {
    "enabled": True,
    "idle_timeout_minutes": 30,  # Freeze after 30 min idle
    "token_threshold": 100000,   # Freeze when context exceeds 100k tokens
    "naming_pattern": "auto-{session_id}-{timestamp}"
}
```

### Context Window Monitoring

Use the health and metrics tools to monitor your system:

```python
# Check system health
health = await health_check()
print(f"Status: {health['status']}")
print(f"Uptime: {health['uptime_seconds']}s")

# Get detailed metrics
metrics = await get_metrics_data(format="json")
for metric in metrics['metrics']:
    print(f"{metric['name']}: {metric['value']}")
```

### Session State Management

Track sessions through their lifecycle:

```python
# List all active sessions
active = await session_list(state_filter="active")

# List all frozen sessions
frozen = await session_list(state_filter="frozen")

# Get detailed status
status = await window_status(window_name="my-project")
print(f"Token count: {status['token_count']}")
print(f"Storage tier: {status['kv_cache']['storage_tier']}")
```

### Custom Cache Salt for vLLM Integration

When working directly with vLLM's prefix caching:

```python
# Thaw returns a cache_salt for vLLM
result = await window_thaw(window_name="my-context")
cache_salt = result['cache_salt']

# Use this salt when making vLLM requests to get cache hits
# The salt ensures your requests hit the restored KV blocks
```

---

## Troubleshooting

### Common Issues

#### "Session not found" Error

**Cause**: The session ID doesn't exist or has expired.

**Solution**:
```python
# List available sessions
sessions = await session_list()

# Check if your session exists
status = await window_status(session_id="your-session-id")
```

#### "Window already exists" Error

**Cause**: Attempting to create a window with a name that's already taken.

**Solution**:
```python
# Use a unique name
await window_freeze(
    session_id="session",
    window_name="project-v2",  # Add version or timestamp
)

# Or delete the existing window first
await window_delete(window_name="project")
```

#### Slow Restore Times

**Cause**: Large contexts or blocks stored in cold storage.

**Solutions**:
1. Use smaller, more focused contexts
2. Increase CPU cache size: `CWM_CPU_CACHE_GB=16`
3. Pre-warm frequently used contexts

#### vLLM Connection Errors

**Cause**: vLLM server not running or unreachable.

**Solutions**:
1. Check vLLM status: `curl http://localhost:8000/health`
2. Verify `CWM_VLLM_URL` environment variable
3. Check health: `await health_check(component="vllm")`

### Health Check Diagnostics

```python
# Full health check
health = await health_check()

if health['status'] == 'unhealthy':
    for component in health['components']:
        if component['status'] != 'healthy':
            print(f"Issue with {component['name']}: {component['message']}")
```

### Checking Storage Usage

```python
# Get cache statistics
stats = await cache_stats()

print(f"KV Store blocks: {stats['kv_store']['total_blocks']}")
print(f"KV Store size: {stats['kv_store']['total_bytes'] / 1024 / 1024:.2f} MB")
print(f"Hit rate: {stats['kv_store']['hit_rate']:.2%}")
```

---

## Best Practices

### 1. Use Descriptive Names and Tags

```python
# Good
await window_freeze(
    session_id="sess-123",
    window_name="auth-module-debug-jan23",
    description="Debugging token refresh - root cause identified in line 145",
    tags=["debug", "auth", "january"]
)

# Bad
await window_freeze(
    session_id="sess-123",
    window_name="save1"
)
```

### 2. Clean Up Old Windows

Regularly delete windows you no longer need:

```python
# List old windows
old = await window_list(
    created_before="2026-01-01T00:00:00Z"
)

# Delete unneeded ones
for window in old['windows']:
    if 'temporary' in window['tags']:
        await window_delete(window_name=window['name'])
```

### 3. Use Tags Consistently

Establish a tagging convention:
- `project-{name}`: Project-specific contexts
- `debug`: Debugging sessions
- `experiment`: Exploratory/experimental contexts
- `production`: Production-ready contexts
- `wip`: Work in progress

### 4. Monitor Context Size

Large contexts impact performance and cost:

```python
status = await window_status(window_name="my-context")
if status['token_count'] > 50000:
    print("Consider trimming this context")
```

### 5. Clone Before Experimenting

Always clone before making risky changes:

```python
await window_clone(
    source_window="stable-context",
    target_window="experiment-context"
)
# Now experiment safely
```

### 6. Check Health Before Critical Operations

```python
health = await health_check()
if health['status'] == 'healthy':
    # Safe to proceed
    await window_freeze(...)
else:
    print("System degraded - consider waiting")
```

---

## Getting Help

- **API Reference**: See [API.md](./API.md) for complete tool documentation
- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **Error Codes**: See [ERROR_HANDLING.md](./ERROR_HANDLING.md) for error details
- **Issues**: Report bugs at the project repository

---

*Happy context management!*
