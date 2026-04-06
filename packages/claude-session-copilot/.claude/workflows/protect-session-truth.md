# Workflow: Protect Session Truth

**Repo:** @mcptoolshop/claude-session-copilot
**Seam:** Hook binding + session truth — the boundary between what the system claims about session state and what is actually verifiable.

## What this workflow protects

The contract that the system is honest about what it knows (stored data) vs what it claims (session binding, completeness, freshness). The system is a persistence layer, not a session authority.

## Automatic reject criteria (9)

A proposed change MUST be rejected if it:

1. **Makes binding less explicit** — claims or implies that `currentSessionId` is bound to the actual Claude Code session when it is only a stored identifier
2. **Blurs stored vs current state** — presents snapshots, decisions, or timeline events as "current session state" without indicating their age or that they are stored data from a previous context
3. **Weakens scope boundaries between sessions** — allows data from one stored session to contaminate another without explicit signaling, or removes session ID filtering from queries
4. **Hides hook failure inside normal behavior** — treats missing timeline events (from hooks not firing) as equivalent to "nothing happened" rather than "unknown"
5. **Preserves working UX while degrading binding truth** — makes the system feel more reliable while actually reducing the operator's ability to detect stale, misbound, or incomplete state
6. **Changes session semantics without synchronized docs/tests/context updates** — modifies how `ensureSession()`, `resume`, or store lifecycle works without updating all affected surfaces
7. **Introduces reassurance language around uncertain binding** — adds "successfully connected" or "session active" messaging when the system has not verified actual Claude Code session binding
8. **Makes machine-detectable state harder to inspect** — removes timestamps, session IDs, or provenance from tool/resource output that consumers use to assess data freshness
9. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., resume says "ready to continue" while the snapshot is 3 days old (org-wide reassurance drift rule)

## The key question this workflow answers

**When claude-session-copilot acts on a session, what must it say about binding truth, and what must it never imply about current session authority?**

### Must say
- The session ID is a stored identifier, not a Claude Code session binding
- Snapshots include timestamps — freshness assessment is the consumer's responsibility
- Timeline events depend on hook prompts being followed — gaps are expected
- Resume loads stored data, not verified current state
- Pattern alerts are based on stored timeline, which may be incomplete

### Must never imply
- That `currentSessionId` corresponds to the active Claude Code session (it may be from a previous session)
- That the timeline is complete (hooks are prompt-based, not guaranteed)
- That a snapshot represents current reality (it represents what was last saved)
- That resume provides continuity (it provides stored data; whether it's continuous is unverifiable)
- That pattern alerts are comprehensive (they're based on whatever timeline events were recorded)
- That the system "knows" what the current session is doing (it knows what was stored under the current ID)

## When to re-prove

Re-prove this workflow when:
- `ensureSession()` logic changes
- Hook mechanism changes
- Resume packet contents change
- Store lifecycle changes (new fields, new persistence model)
- Any form of session binding is added (must verify it's real, not inferred)
