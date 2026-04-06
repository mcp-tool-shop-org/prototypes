---
title: Usage
description: Tools, skills, hooks, pattern detection, and the session lifecycle.
sidebar:
  order: 2
---

## Tools

Session Copilot exposes 7 MCP tools:

| Tool | Purpose |
|------|---------|
| `copilot.decision` | Log a decision (what, why, alternatives rejected, confidence, tags, files) |
| `copilot.snapshot` | Save session state (working_on, done, next_steps, blockers, key_files, notes) |
| `copilot.resume` | Load latest snapshot + recent decisions + timeline summary for a new session |
| `copilot.timeline_event` | Record a timeline event (auto events come from hooks) |
| `copilot.query` | Search decisions, timeline, and snapshots by keyword, file, or session |
| `copilot.pulse` | Project health summary (sessions, hot files, blockers, pattern alerts) |
| `copilot.forget` | Prune old data by age or session ID |

## Skills (Claude Code only)

Skills are slash commands that wrap common workflows:

| Skill | What it does |
|-------|-------------|
| `/copilot:resume` | Pick up where the last session left off |
| `/copilot:snapshot` | Save comprehensive state before `/compact` |
| `/copilot:decisions` | Review the decision log |
| `/copilot:pulse` | Project health dashboard |

## PostToolUse hooks (Claude Code only)

Hook prompts fire after certain Claude Code tools and request that Claude record events to the timeline. This is prompt-based and not guaranteed — events may be missed if Claude does not execute the prompt:

- **Bash** -- detects build/test results (pass/fail)
- **Write** -- records file creation
- **Edit** -- records file modification
- **TodoWrite** -- records task state changes

No configuration required. As long as the MCP server is running, hooks fire on every matching tool use.

## Pattern detection

The copilot watches the timeline and surfaces alerts when it notices:

- **Repeated failure** -- same command fails 3+ times in a session
- **File churn** -- same file edited 5+ times in a session
- **Long session** -- 100+ events without a snapshot (nudges you to save state)

Alerts appear in `/copilot:pulse` and the `copilot://pulse` resource.

## Session lifecycle

```
Session start
  |
  v
/copilot:resume        -- catch up from last session
  |
  v
Work normally           -- hook prompts request event recording
  |
  v
copilot.decision       -- log key architectural choices
  |
  v
/copilot:snapshot      -- save state before /compact
  |
  v
Next session            -- /copilot:resume picks up here
```

### Common patterns

- **Starting a new session** -- `/copilot:resume` then read the snapshot and continue
- **Made an architectural decision** -- `copilot.decision` with what, why, and alternatives
- **About to /compact** -- `/copilot:snapshot` with current state
- **Checking project health** -- `/copilot:pulse` for hot files, blockers, alerts
- **Finding past decisions** -- `copilot.query` with a keyword or file path
- **Cleaning up old data** -- `copilot.forget` with `olderThanDays`
