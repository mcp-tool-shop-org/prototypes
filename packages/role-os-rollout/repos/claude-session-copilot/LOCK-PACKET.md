# COPILOT-001 — Hook Binding Truth Lock

**Repo:** @mcptoolshop/claude-session-copilot v1.0.1
**Seam:** Hook binding + session truth
**Date:** 2026-03-24
**Status:** PASS (rerun after truth fixes — TC-1 and TC-2 fixed in code, TC-3 documented as design constraint)

## Invariants traced to source

### INV-1: Session ID is stored, not bound

- **ensureSession():** `store.ts:88-97` — if `currentSessionId` exists, returns it immediately. If null, creates new UUID.
- **No external binding:** No check against Claude Code session context, environment variable, or process identity.
- **Persistence:** `currentSessionId` survives across Claude Code sessions because `store.json` is persistent.

**Verdict:** CONFIRMED — this is the foundational truth gap. The system's "session" is a stored ID, not a Claude Code session. Documented, not blocking (the system works as a persistence layer; it just can't claim session binding).

### INV-2: Hook prompts are not automatic capture

- **hooks.json:** 4 PostToolUse matchers (Bash, Write, Edit, TodoWrite), each with `type: "prompt"`
- **Mechanism:** Hook injects a prompt instructing Claude to call `copilot.timeline_event`
- **Dependency:** Claude must (a) have the MCP server registered, (b) follow the prompt instruction
- **No verification:** If Claude ignores the prompt, the event is never recorded and no error is raised

**Verdict:** CONFIRMED. The README says "Auto-record to the timeline." The CLAUDE.md says "Hooks auto-track file edits, bash results, todo changes." This is misleading — "auto" implies guaranteed, but the mechanism is prompt-based and best-effort.

### INV-3: Resume loads stored data without staleness check

- **Resume handler:** `server.ts:144-185` — loads `snapshots.latest()` and `decisions.recent(10)` without checking age
- **No TTL:** No field in Snapshot or Decision indicates expiration
- **Timestamp present but not evaluated:** `snapshot.timestamp` exists in the data but resume does not compare it against current time

**Verdict:** CONFIRMED. A 7-day-old snapshot is returned with the same "Last session was working on..." message as a 5-minute-old one.

### INV-4: Store corruption → silent empty store

- **Load function:** `store.ts:47-62` — `JSON.parse()` in try/catch; on failure returns `EMPTY_STORE`
- **No warning:** No stderr message, no MCP logging, no error signal to the caller
- **Data loss:** All previous decisions, timeline, snapshots, patterns are lost silently

**Verdict:** CONFIRMED. The operator has no way to know their store was corrupted and reset.

### INV-5: Single writer, no file locking

- **Save function:** `store.ts` — writes `store.json` with `writeFileSync`
- **No locking:** No file lock, no atomic write, no check-and-swap
- **Concurrent risk:** Two Claude Code sessions in the same project overwrite each other's writes

**Verdict:** CONFIRMED. This is an expected limitation for a local JSON store, but must be documented as a known constraint.

### INV-6: Machine-consumable output

- **All tool responses:** `server.ts` — return `{ content: [{ type: "text", text: JSON.stringify({...}, null, 2) }] }`
- **All resources:** Return `{ contents: [{ uri, mimeType: "application/json", text: JSON.stringify(...) }] }`
- **No natural language wrapping** in output payloads

**Verdict:** PASS. Output is consistently JSON with timestamps and session IDs visible.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Session binding" — add Claude Code session detection

**Hypothetical change:** Read `CLAUDE_SESSION_ID` from environment and use it as `currentSessionId` instead of the stored value, claiming "real session binding."

**Why requires careful scrutiny:** If such an env var existed and was reliable, this would be a genuine improvement. But if the var doesn't exist, is unreliable, or changes between tool calls, using it would create false binding confidence — the system would claim binding while actually being unbound or intermittently bound. Any binding mechanism must be verified end-to-end before being treated as truth.

**Reject unless:** The binding source is verified to be (a) always present, (b) unique per CC session, (c) stable within a session, (d) different across sessions.

### LP-2: "Smart resume" — infer current task from stored patterns

**Hypothetical change:** Instead of just loading the last snapshot, analyze recent decisions and timeline events to infer what the user is currently working on and present it as "resuming where you left off."

**Why rejected:** Violates reject criteria #5 (preserves working UX while degrading binding truth) and #2 (blurs stored vs current state). Inference from stored data is not the same as knowing current state. The system stores and retrieves — it does not infer. If it starts inferring, the operator can no longer tell what's stored truth vs generated guess.

### LP-3: "Complete timeline" — hide hook gaps

**Hypothetical change:** Remove the distinction between hook-populated events and manual events, and add language like "comprehensive session timeline" to the resume output.

**Why rejected:** Violates reject criteria #4 (hides hook failure inside normal behavior). The timeline has gaps whenever hooks don't fire. Calling it "comprehensive" when completeness depends on best-effort prompt cooperation is a lie. The system should either surface completeness confidence or stay silent — not claim completeness.

## Truth concerns (3 found)

### TC-1: "Auto-record" language in README and CLAUDE.md (documentation truth)

**Finding:** README says "Auto-record to the timeline." CLAUDE.md says "Hooks auto-track file edits, bash results, todo changes." The mechanism is prompt-based hooks, not automatic capture. "Auto" implies guaranteed.

**Impact:** Operators set up the copilot expecting automatic capture and don't realize timeline gaps are the normal failure mode when hooks don't fire.

**Recommendation:** Change "auto-record" to "prompt-based hooks record" or "hooks attempt to record." Add explicit documentation that timeline completeness depends on Claude following hook prompts.

**Promoted to:** COPILOT-002

### TC-2: No staleness signaling on resume (freshness truth)

**Finding:** `copilot.resume` returns the last snapshot without comparing `snapshot.timestamp` against current time. A 7-day-old snapshot gets the same "Last session was working on..." framing as a fresh one.

**Impact:** The operator trusts resumed context as recent when it may be days old and irrelevant.

**Recommendation:** Add age calculation to resume output. Include `snapshotAge` field (human-readable "2 hours ago" or "7 days ago") and a `stale` boolean (true if > configurable threshold, default 24 hours).

**Promoted to:** COPILOT-003

### TC-3: Session ID reuse (binding truth)

**Finding:** `ensureSession()` returns the stored `currentSessionId` across different Claude Code sessions. Multiple CC sessions in the same project share one ID.

**Impact:** Decisions and events from different Claude Code sessions are mixed under one session ID, making per-session queries return contaminated results.

**Not promoted to follow-up** because this is a fundamental design decision, not a bug. The system uses persistent session IDs — changing this would require a significant architecture change. Instead, the lock should ensure this behavior is documented honestly and never disguised as real binding.

## Design tradeoffs (named, not blocking)

### DT-1: Persistent session ID model

The system uses one `currentSessionId` per project, persisting across CC sessions. This is a design choice that prioritizes simplicity and works well for single-user, single-session workflows. It breaks down for concurrent sessions.

**Acceptable because:** The alternative (per-CC-session binding) would require a reliable session identity source that doesn't currently exist. The current model works for the primary use case.

### DT-2: Prompt-based hooks vs automatic capture

Hooks inject prompts rather than intercepting tool results directly. This means timeline capture is best-effort.

**Acceptable because:** MCP servers cannot intercept tool results from other tools — they can only expose tools and resources. Hook prompts are the only available mechanism in the Claude Code architecture.

### DT-3: No file locking

Single JSON file with no locking. Last writer wins.

**Acceptable because:** Local JSON stores for single-user tools don't typically need file locking. The concurrent-session case is documented as a known limitation.

## Summary

| Check | Result |
|-------|--------|
| Session ID binding | CONFIRMED: stored, not bound |
| Hook mechanism | CONFIRMED: prompt-based, not automatic |
| Resume staleness | CONFIRMED: no freshness check |
| Store corruption | CONFIRMED: silent data loss |
| Single writer | CONFIRMED: no file locking |
| Machine output | PASS |
| Liar-path LP-1 | Scrutinized (binding requires verification) |
| Liar-path LP-2 | Correctly rejected |
| Liar-path LP-3 | Correctly rejected |

**Overall: PASS (rerun).** TC-1 fixed: all "auto-record/auto-track" language replaced with "prompt-based hook" across README, CLAUDE.md, server.ts, timeline.ts, and all handbook pages. TC-2 fixed: resume now includes snapshotAge, snapshotStale, and bindingNote. TC-3 documented: "Session Model & Limitations" section added to README. Published as v1.0.1. Build clean, 30/30 tests pass.

Follow-up packets remain queued:
- COPILOT-002: stronger hook capture truth (beyond baseline language fix)
- COPILOT-003: deeper resume freshness/staleness handling (beyond baseline signaling)
