---
title: CLI Reference
description: Every Terminal Tutor command explained.
sidebar:
  order: 4
---

## Lesson Commands

### `list`
Show all available lessons and games with runtime requirements.
```bash
terminal-tutor list
```

### `start <lesson-id>`
Start or resume a lesson. Creates the practice workspace and presents the first step.
```bash
terminal-tutor start files-and-navigation
```

### `info <lesson-id>`
Show lesson details without starting it.
```bash
terminal-tutor info filesystem-salvage
```

### `reset <lesson-id>`
Reset a lesson's progress and workspace. Start fresh.
```bash
terminal-tutor reset pipes-and-search
```

## Track Commands

### `tracks`
Show all skill tracks with progress and runtime availability.
```bash
terminal-tutor tracks
```

### `track <track-id>`
Show detailed progress for a specific track.
```bash
terminal-tutor track shell-fundamentals
```

### `next`
Suggest the next lesson to start based on track order.
```bash
terminal-tutor next
```

### `mastery <lesson-id>`
Show fluency signal for a completed lesson. Reports clean, solid, or guided rating.
```bash
terminal-tutor mastery files-and-navigation
```

## Progress Commands

### `progress`
Show all lesson progress.
```bash
terminal-tutor progress
```

### `transcript <lesson-id>`
Show per-step evidence for the current session. Includes commands, output, verdicts, and hint usage.
```bash
terminal-tutor transcript dependency-detective
```

## System Commands

### `doctor`
Check system readiness. Shows runtime availability with remedies and lists which lessons are runnable.
```bash
terminal-tutor doctor
```

### `runtimes`
Show detailed runtime availability.
```bash
terminal-tutor runtimes
```

## Engine Commands (Programmatic)

These commands are designed for integration with Claude Code or other automation:

### `eval <lesson-id> <json>`
Evaluate a command result against the current step. Accepts a JSON object with `command`, `stdout`, `stderr`, `exitCode`, `cwd`.

### `advance <lesson-id>`
Advance to the next step after a pass.

### `check <lesson-id> <command>`
Check if a command is safe to run in the current lesson context.

### `wrap <lesson-id> <command>`
Wrap a command for the lesson's runtime (e.g., docker exec prefix for Docker lessons).

## Global Flags

### `--debug`
Show stack traces on error. Without this flag, errors are structured JSON only.
```bash
terminal-tutor start nonexistent --debug
```
