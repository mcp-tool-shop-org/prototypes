---
title: Storage
description: How and where Session Copilot persists data.
sidebar:
  order: 3
---

## Store location

Session Copilot persists all data to a single JSON file. The lookup order is:

1. `COPILOT_STORE_PATH` environment variable (if set)
2. `.claude/copilot/store.json` in the current project directory
3. `~/.claude/copilot/store.json` as a global fallback

The project-local path is preferred so each project keeps its own session history.

## Data model

The store contains three collections:

### Decisions

Each decision records:

- **what** -- the choice that was made
- **why** -- the reasoning behind it
- **alternatives** -- options that were rejected and why
- **confidence** -- how confident the decision is (high, medium, low)
- **tags** -- categorization labels
- **files** -- related file paths

### Snapshots

A snapshot captures full session state:

- **working_on** -- what was in progress
- **done** -- what was completed
- **next_steps** -- planned follow-up work
- **blockers** -- anything preventing progress
- **key_files** -- important files for context
- **notes** -- freeform context

### Timeline events

Timeline events are recorded via hook prompts or directly via `copilot.timeline_event`. Hook-based recording is prompt-based and not guaranteed — events may be missed if Claude does not execute the prompt. Each event includes a timestamp, event type, and metadata (file paths, command results, pass/fail status).

## Data format

All data is stored as JSON in a single file. The file is human-readable and can be inspected directly if needed. There is no database, no binary format, and no network sync.

## Pruning

Use `copilot.forget` to remove old data:

- By age: `copilot.forget` with `olderThanDays` removes entries older than N days
- By session: `copilot.forget` with a session ID removes all data from that session

Pruning is permanent. There is no undo.
