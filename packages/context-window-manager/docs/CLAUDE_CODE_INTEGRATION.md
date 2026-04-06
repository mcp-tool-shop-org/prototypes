# Claude Code Integration Guide

> **Version**: 0.6.2
> **Last Updated**: 2026-01-23

This guide covers integrating Context Window Manager with Claude Code for seamless context persistence.

---

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Configuration Options](#configuration-options)
3. [Workflow Examples](#workflow-examples)
4. [Hook Integration](#hook-integration)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Quick Setup

### 1. Install the Package

```bash
pip install context-window-manager
```

### 2. Configure Claude Code

Add to your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000",
        "CWM_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

### 3. Verify Installation

In Claude Code, run:
```
health_check
```

You should see:
```json
{
  "success": true,
  "status": "healthy",
  "version": "0.6.2"
}
```

---

## Configuration Options

### Basic Configuration

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

### Full Configuration

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000",
        "CWM_DB_PATH": "~/.cwm/cwm.db",
        "CWM_STORAGE_PATH": "~/.cwm/storage",
        "CWM_CPU_CACHE_GB": "8",
        "CWM_DISK_CACHE_GB": "50",
        "CWM_LOG_LEVEL": "INFO",
        "CWM_AUTO_FREEZE_ENABLED": "true",
        "CWM_AUTO_FREEZE_TOKEN_THRESHOLD": "100000"
      }
    }
  }
}
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `CWM_VLLM_URL` | vLLM server URL | `http://localhost:8000` |
| `CWM_DB_PATH` | SQLite database location | `~/.cwm/cwm.db` |
| `CWM_STORAGE_PATH` | Disk storage for KV blocks | `~/.cwm/storage` |
| `CWM_CPU_CACHE_GB` | CPU memory cache size | `8` |
| `CWM_DISK_CACHE_GB` | Disk cache size | `50` |
| `CWM_LOG_LEVEL` | Logging verbosity | `INFO` |
| `CWM_AUTO_FREEZE_ENABLED` | Enable auto-freeze | `false` |
| `CWM_AUTO_FREEZE_TOKEN_THRESHOLD` | Token count trigger | `100000` |

---

## Workflow Examples

### Workflow 1: Daily Development Sessions

Save your context at the end of each day:

```
# End of day - save your context
window_freeze session_id="dev-session" window_name="project-day-3" description="Implemented auth module, started on API endpoints" tags=["daily", "auth", "api"]

# Next day - restore and continue
window_thaw window_name="project-day-3"
```

### Workflow 2: Exploratory Branching

Try different approaches without losing your starting point:

```
# Save your current state
window_freeze session_id="exploration" window_name="before-refactor"

# Try approach A
# ... work on approach A ...
window_freeze session_id="exploration" window_name="approach-a-complete" tags=["experiment"]

# Go back and try approach B
window_thaw window_name="before-refactor"
# ... work on approach B ...
window_freeze session_id="exploration" window_name="approach-b-complete" tags=["experiment"]

# Compare both approaches
window_list tags=["experiment"]
```

### Workflow 3: Project Context Library

Build a library of reusable contexts:

```
# Create a base context for your project
window_freeze session_id="project-setup" window_name="myproject-base" description="Project initialized with architecture understanding, coding standards, and key files reviewed" tags=["base", "myproject"]

# Clone for different tasks
window_clone source_window="myproject-base" target_window="myproject-feature-x" description="Working on feature X"
window_clone source_window="myproject-base" target_window="myproject-bugfix-123" description="Fixing bug #123"
```

### Workflow 4: Code Review Context

Preserve context from code review sessions:

```
# Save context after reviewing a PR
window_freeze session_id="review" window_name="pr-456-review" description="Reviewed authentication changes, identified 3 issues" tags=["review", "pr-456"]

# Later, continue the review
window_thaw window_name="pr-456-review"
```

---

## Hook Integration

Claude Code hooks allow automatic context management based on events.

### Auto-Freeze on Context Threshold

Create `.claude/hooks/context-threshold.sh`:

```bash
#!/bin/bash
# Auto-freeze when context exceeds threshold

# Get current token count from your session
TOKEN_COUNT=$(claude-code --get-context-tokens 2>/dev/null || echo "0")
THRESHOLD=80000

if [ "$TOKEN_COUNT" -gt "$THRESHOLD" ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    echo "Context threshold exceeded ($TOKEN_COUNT tokens). Auto-freezing..."

    # Use the auto_freeze_check tool
    claude-code --tool "auto_freeze_check" --args '{"session_id": "current"}'
fi
```

### Auto-Freeze on Session End

Create `.claude/hooks/session-end.sh`:

```bash
#!/bin/bash
# Auto-save context when session ends

SESSION_ID="$1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Only freeze if session has meaningful content
if [ -n "$SESSION_ID" ]; then
    echo "Session ending. Saving context..."
    claude-code --tool "window_freeze" --args "{
        \"session_id\": \"$SESSION_ID\",
        \"window_name\": \"auto-save-$TIMESTAMP\",
        \"description\": \"Auto-saved on session end\",
        \"tags\": [\"auto-save\"]
    }"
fi
```

### Hook Configuration

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "onContextThreshold": {
      "command": ".claude/hooks/context-threshold.sh",
      "threshold": 80000
    },
    "onSessionEnd": {
      "command": ".claude/hooks/session-end.sh"
    }
  }
}
```

### Using Built-in Auto-Freeze

CWM includes built-in auto-freeze functionality:

```
# Configure auto-freeze policy
auto_freeze_config policy={"enabled": true, "token_threshold": 100000, "idle_timeout_minutes": 30, "naming_pattern": "auto-{session_id}-{timestamp}"}

# Check if auto-freeze should trigger
auto_freeze_check session_id="my-session"
```

---

## Best Practices

### 1. Naming Conventions

Use consistent, descriptive names:

```
# Good naming patterns
project-feature-date       # myapp-auth-jan23
task-type-identifier       # bugfix-issue-456
context-state-version      # setup-complete-v2

# Avoid
save1, test, temp, asdf
```

### 2. Tag Strategy

Establish a tagging system:

| Tag Category | Examples |
|--------------|----------|
| Project | `myapp`, `backend`, `frontend` |
| Task Type | `feature`, `bugfix`, `refactor`, `review` |
| Status | `wip`, `complete`, `blocked` |
| Priority | `critical`, `normal`, `low` |
| Time | `daily`, `weekly`, `milestone` |

### 3. Context Hygiene

```
# Regularly clean up old contexts
window_list created_before="2026-01-01T00:00:00Z" tags=["auto-save"]

# Delete unneeded auto-saves (keep last 5)
window_delete window_name="auto-save-old" force=true

# Archive important contexts with descriptive tags
window_clone source_window="feature-complete" target_window="archive-feature-v1" tags=["archive", "v1"]
```

### 4. Pre-flight Checks

Before starting work:

```
# Check system health
health_check

# Review available contexts
window_list tags=["myproject"] sort_by="created_at" sort_order="desc" limit=5

# Check storage usage
cache_stats
```

### 5. Session Organization

```
# Use session IDs that map to your work
session_id patterns:
- project-task-date: "myapp-auth-jan23"
- ticket-number: "PROJ-1234"
- user-project: "alice-backend"
```

---

## Troubleshooting

### "vLLM connection failed"

```bash
# Check vLLM is running
curl http://localhost:8000/health

# Verify URL in config
echo $CWM_VLLM_URL

# Check CWM health
health_check component="vllm"
```

### "Window not found"

```
# List all windows to find the correct name
window_list

# Search by partial name
window_list search="project"

# Check window exists
window_status window_name="my-window"
```

### "Storage quota exceeded"

```
# Check current usage
cache_stats

# Delete old windows
window_list sort_by="created_at" sort_order="asc" limit=10
window_delete window_name="oldest-window" delete_blocks=true

# Increase quota (in config)
CWM_DISK_CACHE_GB=100
```

### "Rate limit exceeded"

```
# Check current limits
get_metrics_data format="json"

# Wait for retry_after period
# Default: 60 requests/minute, 1000/hour
```

### Slow Restore Times

```
# Check where blocks are stored
window_status window_name="my-window" include_blocks=true

# Pre-warm frequently used contexts
window_thaw window_name="common-base" warm_cache=true

# Increase CPU cache for faster access
CWM_CPU_CACHE_GB=16
```

### Debug Mode

Enable verbose logging:

```json
{
  "env": {
    "CWM_LOG_LEVEL": "DEBUG"
  }
}
```

View logs:
```bash
# Logs go to stderr by default
python -m context_window_manager 2>&1 | tee cwm.log
```

---

## Integration with Other Tools

### context-bar Integration

If using context-bar for context monitoring:

```json
{
  "mcpServers": {
    "context-window-manager": { ... },
    "context-bar": {
      "command": "python",
      "args": ["-m", "context_bar"],
      "env": {
        "CONTEXT_BAR_CWM_ENABLED": "true"
      }
    }
  }
}
```

### claude-fresh Integration

For handoff management with claude-fresh:

```json
{
  "mcpServers": {
    "context-window-manager": { ... },
    "claude-fresh": {
      "command": "python",
      "args": ["-m", "claude_fresh"],
      "env": {
        "CLAUDE_FRESH_CWM_BACKUP": "true"
      }
    }
  }
}
```

---

## Quick Reference

### Essential Commands

| Command | Purpose |
|---------|---------|
| `window_freeze` | Save current context |
| `window_thaw` | Restore a saved context |
| `window_list` | Browse saved contexts |
| `window_status` | Check context details |
| `window_clone` | Branch a context |
| `window_delete` | Remove a context |
| `health_check` | Verify system status |

### Common Patterns

```
# Save and tag
window_freeze session_id="s1" window_name="checkpoint" tags=["wip"]

# Restore with continuation
window_thaw window_name="checkpoint" continuation_prompt="Let's continue..."

# Find recent contexts
window_list sort_by="created_at" sort_order="desc" limit=5

# Clean up
window_delete window_name="old-context" force=true delete_blocks=true
```

---

*For complete API documentation, see [API.md](./API.md)*
