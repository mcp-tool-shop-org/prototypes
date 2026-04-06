# claude-session-copilot

Session copilot for Claude Code. Captures decisions, timelines, and patterns across sessions. Makes context recoverable after /compact.

## Tools (7)

| Tool | Purpose | Read-only? |
|------|---------|-----------|
| `copilot.decision` | Log a decision (what, why, alternatives rejected, confidence, tags, files) | No |
| `copilot.snapshot` | Save session state (working_on, done, next_steps, blockers, key_files, notes) | No |
| `copilot.resume` | Load latest snapshot + recent decisions + timeline summary for new session | Yes |
| `copilot.timeline_event` | Record a timeline event (auto events come from hooks) | No |
| `copilot.query` | Search decisions/timeline/snapshots by keyword, file, session | Yes |
| `copilot.pulse` | Project health summary (sessions, hot files, blockers, pattern alerts) | Yes |
| `copilot.forget` | Prune old data by age or session ID | No |

## Resources (4)

| Resource | URI | What it shows |
|----------|-----|---------------|
| Project Pulse | `copilot://pulse` | Live health dashboard |
| Timeline | `copilot://timeline` | Current session events |
| Decisions | `copilot://decisions` | Recent decision log |
| Latest Snapshot | `copilot://snapshot/latest` | Most recent handoff note |

## Session Lifecycle

1. **Start**: Call `copilot.resume` (or `/copilot:resume`) to catch up from last session
2. **During**: Log decisions with `copilot.decision`. Hook prompts request timeline recording for file edits, bash results, todo changes (prompt-based, not guaranteed).
3. **Before /compact**: Call `copilot.snapshot` (or `/copilot:snapshot`) to save state
4. **Next session**: `copilot.resume` picks up where you left off

## Pattern Detection

Runs on timeline events when they are recorded:
- **Repeated failure** — same command fails 3+ times → alert
- **File churn** — same file edited 5+ times in session → alert
- **Long session** — 100+ events without a snapshot → reminder

## Hooks (PostToolUse — Claude Code exclusive)

Hook prompts request timeline recording after (prompt-based — events may be missed if Claude does not execute the prompt):
- **Bash** — detects build/test results (pass/fail)
- **Write** — records file creation
- **Edit** — records file modification
- **TodoWrite** — records task state changes

## Common Patterns

- **Starting a new session**: `/copilot:resume` → read snapshot → continue work
- **Made an architectural decision**: `copilot.decision` with what/why/alternatives
- **About to /compact**: `/copilot:snapshot` with current state
- **Checking project health**: `/copilot:pulse` → see hot files, blockers, alerts
- **Finding past decisions**: `copilot.query` with keyword or file path
- **Cleaning up old data**: `copilot.forget` with olderThanDays

## Storage

Data persists in `.claude/copilot/store.json` (project-local) or `~/.claude/copilot/store.json` (global fallback). Override with `COPILOT_STORE_PATH` env var.
