# Brand Rules — @mcptoolshop/claude-session-copilot

## Tone

Honest persistence layer. The system stores and retrieves session state. It does not guarantee binding, freshness, or completeness.

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Session ID | A stored identifier in the JSON store, persisting across Claude Code sessions | The actual Claude Code session context |
| Hook prompt | A PostToolUse instruction that asks Claude to call a tool | An automatic capture mechanism |
| Resume | Loading the last stored snapshot + decisions for a new session context | Guaranteed continuity with the previous session |
| Snapshot | A point-in-time save of working state (working_on, done, next_steps, blockers) | A verified current-state representation |
| Timeline event | A recorded action (file edit, bash result, decision) | A guaranteed-complete activity log |
| Pattern alert | A detected pattern in the stored timeline (repeated failure, file churn) | A diagnosis or recommendation |

## Enforcement bans

### Language that must never appear in copilot output or docs

- "automatically captures" / "auto-records" without qualification (hooks are prompt-based, not guaranteed)
- "knows which session" / "bound to your session" (no actual Claude Code session binding exists)
- "guaranteed continuity" / "seamless recovery" (recovery depends on manual resume + stored data freshness)
- "complete timeline" / "full record" (timeline has gaps when hooks don't fire)
- "current state" without timestamp (snapshots may be hours/days old)

### Contamination risks

1. **Binding pretense** — the biggest lie this repo can tell: implying it knows which Claude Code session is active when it only knows a stored ID
2. **Automatic capture myth** — "auto-record" language that hides the hook-prompt dependency
3. **Freshness pretense** — returning stale snapshots without signaling age
4. **Completeness pretense** — implying the timeline is a complete record when events are lost if hooks don't fire
5. **Authority escalation** — framing stored decisions as "the session's decisions" when they're "decisions stored under this ID"
