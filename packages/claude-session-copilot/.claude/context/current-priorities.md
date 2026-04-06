# Current Priorities — @mcptoolshop/claude-session-copilot

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: hook binding + session truth.

## Classification

Lock candidate → locked.

## Seam family

State binding truth — same family as any system where the claimed binding (session, hook, context) may not match the actual binding.

## Must-preserve invariants (8)

1. **Store is the only state** — all decisions, timeline, snapshots, patterns live in `store.json`. No hidden state elsewhere.
2. **Session ID is stored, not bound** — `currentSessionId` persists in JSON; it is not derived from or verified against the active Claude Code session.
3. **Hook execution is not guaranteed** — timeline events depend on Claude following PostToolUse hook prompts. Missing events are the expected failure mode.
4. **Resume loads stored data, not current data** — `copilot.resume` returns the last snapshot and recent decisions from the store, regardless of their age.
5. **No TTL on stored state** — snapshots, decisions, and timeline events have timestamps but no expiration. The system does not warn about staleness.
6. **Store corruption → empty store** — if `store.json` is malformed, `load()` returns an empty store silently. Previous data is lost.
7. **Single writer** — no file locking. Concurrent Claude Code sessions in the same project will overwrite each other's writes.
8. **Machine-consumable output** — all tool responses and resources return JSON. No natural language wrapping in output.

## Banned detours

- Adding "session detection" that guesses the Claude Code session without verified binding (would create false binding confidence)
- Hiding the hook-prompt dependency behind "automatic" language
- Adding TTL-based auto-expiry without explicit user control (would silently delete data)
- Making the store a shared service (no network, no cloud, local-only is a feature)
- Adding "smart resume" that infers what the user was doing (the system stores and retrieves, it does not infer)
