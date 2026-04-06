---
title: For Beginners
description: New to Claude Session Copilot? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Claude Session Copilot is a memory system for Claude Code. When you work with Claude Code, your conversation history disappears when you run `/compact` or start a new session. Session Copilot fixes that by automatically recording what happened (timeline events), what you decided (decisions), and where you left off (snapshots). The next time you start a session, you can pick up right where you left off.

It works by running as an MCP server alongside Claude Code — no extra apps, no cloud accounts, just a local JSON file that stores your session history.

## Who is this for?

- **Claude Code users** who work on long-running projects across multiple sessions
- **Developers** who use `/compact` frequently and lose context
- **Teams** where multiple people use Claude Code on the same project and want shared session history

**Important:** This tool only works with Claude Code. It depends on Claude Code-specific features (hooks, skills, CLAUDE.md injection) that no other MCP client supports.

## Prerequisites

- **Claude Code** installed and working
- **Node.js 18 or later** — check with `node --version`
- **npm** — comes with Node.js
- Basic familiarity with Claude Code (you know what `/compact` does and have used MCP servers before)

## Your first 5 minutes

### 1. Add the server to your project

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

### 2. Start a new Claude Code session

Open Claude Code in your project. It discovers the server automatically from `.mcp.json`.

### 3. Resume (even on first run)

Type `/copilot:resume` in Claude Code. On the first run, it reports that there is no prior session — that is expected.

### 4. Do some work

Work normally. The hooks prompt Claude to record file edits, build results, and task changes to the timeline automatically (though recording is prompt-based, so some events may be missed).

### 5. Save a snapshot before leaving

Before you `/compact` or close the session, type `/copilot:snapshot`. Claude saves what you were working on, what you finished, and what comes next.

Next time you start a session, `/copilot:resume` brings it all back.

## Common mistakes

1. **Trying to use it outside Claude Code.** Session Copilot depends on Claude Code hooks, skills, and resource notifications. It will not work in Cursor, Windsurf, or other MCP clients — the server starts but the hooks and skills are missing.

2. **Forgetting to snapshot before `/compact`.** If you `/compact` without running `/copilot:snapshot` first, the timeline events are still saved but the high-level summary (what you were working on, blockers, next steps) is lost. Make snapshotting a habit.

3. **Expecting perfect timeline recording.** The PostToolUse hooks are prompt-based — they ask Claude to record events, but Claude may skip the recording prompt. Timeline gaps are normal. Use explicit `copilot.decision` calls for anything important.

4. **Not checking pulse on long sessions.** After many edits, run `/copilot:pulse` to see pattern alerts. It flags repeated failures, file churn, and long sessions without snapshots — these are signals that something might be going wrong.

5. **Worrying about the store file size.** The store is a single JSON file. For most projects it stays small. If it grows large, use `copilot.forget` with `olderThanDays` to prune old sessions.

## Next steps

- [Getting Started](/claude-session-copilot/handbook/getting-started/) — installation and first session walkthrough
- [Usage](/claude-session-copilot/handbook/usage/) — tools, skills, hooks, and the session lifecycle
- [Reference](/claude-session-copilot/handbook/reference/) — full tool parameter reference

## Glossary

- **MCP** — Model Context Protocol. A standard for tools that extend AI assistants. Session Copilot is an MCP server.
- **Session** — A single Claude Code conversation. Sessions end when you close Claude Code, start fresh, or run `/compact`.
- **Snapshot** — A saved summary of your session state: what you were working on, what you finished, and what comes next.
- **Decision** — A logged architectural or implementation choice, including the reasoning and rejected alternatives.
- **Timeline event** — A timestamped record of something that happened (file edited, test passed, task changed).
- **Hook** — A PostToolUse hook in Claude Code that fires after certain tool calls. Session Copilot uses hooks to prompt Claude to record events.
- **`/compact`** — A Claude Code command that compresses your conversation to save context window space. Session data is lost unless you snapshot first.
- **Pulse** — A health dashboard showing session count, hot files, blockers, and pattern alerts.
