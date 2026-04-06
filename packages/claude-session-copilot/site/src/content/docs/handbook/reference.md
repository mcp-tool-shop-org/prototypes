---
title: Reference
description: Full MCP tool reference, resources, and security scope.
sidebar:
  order: 4
---

## MCP tool reference

### copilot.decision

Log an architectural or implementation decision.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `what` | string | yes | The decision that was made |
| `why` | string | yes | Reasoning behind the decision |
| `alternatives` | string | no | Options that were rejected and why |
| `confidence` | string | no | high, medium, or low |
| `tags` | string[] | no | Categorization labels |
| `files` | string[] | no | Related file paths |

### copilot.snapshot

Save comprehensive session state for continuity across sessions or `/compact`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `working_on` | string | yes | What is currently in progress |
| `done` | string | no | What was completed this session |
| `next_steps` | string | no | Planned follow-up work |
| `blockers` | string | no | Anything preventing progress |
| `key_files` | string[] | no | Important files for context |
| `notes` | string | no | Freeform context |

### copilot.resume

Load the latest snapshot, recent decisions, and a timeline summary. Takes no parameters. Call this at the start of every session.

### copilot.timeline_event

Record a timeline event. Hook prompts request recording for Bash/Write/Edit/TodoWrite (prompt-based, not guaranteed). Use this directly for events hooks cannot detect.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | yes | Event type identifier |
| `metadata` | object | no | Arbitrary event metadata |

### copilot.query

Search across decisions, timeline events, and snapshots.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyword` | string | no | Text to search for |
| `file` | string | no | Filter by file path |
| `session` | string | no | Filter by session ID |

### copilot.pulse

Project health dashboard. Takes no parameters. Returns session count, hot files, active blockers, and pattern alerts.

### copilot.forget

Prune old data permanently.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `olderThanDays` | number | no | Remove entries older than N days |
| `sessionId` | string | no | Remove all data from a specific session |

## Resources

| URI | Description |
|-----|-------------|
| `copilot://pulse` | Live project health dashboard |
| `copilot://timeline` | Current session timeline events |
| `copilot://decisions` | Recent decision log |
| `copilot://snapshot/latest` | Most recent handoff snapshot |

Resources update in real time via MCP resource notifications.

## Security and data scope

Claude Session Copilot is a **local-only MCP server**. It makes no network requests, collects no telemetry, and uses no cloud services.

### Data accessed

- Reads and writes session data (decisions, timeline events, snapshots) to `.claude/copilot/store.json`
- Monitors PostToolUse hooks for event metadata (file paths, command results)

### Data NOT accessed

- No network requests of any kind
- No telemetry or analytics
- No credential storage
- Does not read source code contents -- only records file paths and event metadata

### Permissions required

- File system read/write for the copilot store file
- MCP stdio transport (no network listeners)

### Vulnerability reporting

See [SECURITY.md](https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/SECURITY.md) for vulnerability reporting procedures.
