# claude-session-copilot — Repo-Local Decisions

## 2026-03-24 — System is a persistence layer, not a session authority

**Decision:** claude-session-copilot stores and retrieves session data. It does not bind to, verify, or guarantee the identity of the active Claude Code session. All language and output must reflect this.

**Why:** The audit found that `currentSessionId` is a stored identifier reused across CC sessions. The system cannot verify which CC session is active. Claiming session authority would be a lie.

**Applies to:** All tools, resources, documentation, and hook descriptions.

---

## 2026-03-24 — "Auto-record" language must be corrected

**Decision:** Replace "auto-record," "auto-track," and "automatically captures" with accurate descriptions that acknowledge the prompt-based hook mechanism.

**Why:** Hooks inject prompts that ask Claude to call tools. This is best-effort, not guaranteed. "Automatic" implies the system intercepts events, which it cannot do.

**Applies to:** README.md, CLAUDE.md, tool descriptions, hook documentation.

**Queued as:** COPILOT-002

---

## 2026-03-24 — Resume must signal staleness

**Decision:** `copilot.resume` output should include snapshot age and a staleness indicator. The operator must be able to assess freshness without inspecting timestamps manually.

**Why:** A 7-day-old snapshot is currently returned with the same "working on" message as a 5-minute-old one. This violates freshness truth.

**Applies to:** server.ts resume handler, resume output format.

**Queued as:** COPILOT-003
