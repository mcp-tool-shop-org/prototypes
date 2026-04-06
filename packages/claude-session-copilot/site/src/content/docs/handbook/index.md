---
title: Welcome
description: Claude Session Copilot handbook — session memory for Claude Code.
sidebar:
  order: 0
---

Claude Session Copilot captures decisions, timelines, and patterns across Claude Code sessions. When you `/compact` or start fresh, your reasoning and progress survive.

## What you will find here

| Page | Covers |
|------|--------|
| [Getting started](/claude-session-copilot/handbook/getting-started/) | Installation, first run, why this tool exists |
| [Usage](/claude-session-copilot/handbook/usage/) | Tools, skills, hooks, pattern detection, session lifecycle |
| [Storage](/claude-session-copilot/handbook/storage/) | Data model, store location, environment overrides |
| [Reference](/claude-session-copilot/handbook/reference/) | Full MCP tool reference, resources, security and data scope |
| [For Beginners](/claude-session-copilot/handbook/beginners/) | New to Session Copilot? Start here |

## Key facts

- **7 MCP tools** for decisions, snapshots, timeline, queries, health, and cleanup
- **4 skills** (slash commands) exclusive to Claude Code
- **4 PostToolUse hooks** that prompt Claude to record Bash results, file edits, and task changes (prompt-based, not guaranteed)
- **Pattern detection** alerts on repeated failures, file churn, and long sessions
- **Local-only** storage in `.claude/copilot/store.json` with no network requests
