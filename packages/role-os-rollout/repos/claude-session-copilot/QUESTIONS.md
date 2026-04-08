# claude-session-copilot — Questions

## Answered during lockdown

### Q1: When claude-session-copilot acts on a session, what must it say about binding truth, and what must it never imply about current session authority?

**Answer:** See protect-session-truth.md "Must say" / "Must never imply" sections. The system must say that session IDs are stored identifiers, snapshots have timestamps (freshness is consumer's job), timeline depends on hook prompts, and resume loads stored data. It must never imply that IDs are CC-session-bound, timelines are complete, snapshots are current, or resume provides continuity.

### Q2: Is the session ID reuse a bug or a design decision?

**Answer:** Design decision (TC-3). The system uses one persistent `currentSessionId` per project. Changing to per-CC-session binding would require a reliable session identity source that doesn't currently exist. The model works for single-user single-session workflows. The lock ensures this is documented honestly.

### Q3: Are hooks automatic or prompt-based?

**Answer:** Prompt-based. PostToolUse hooks inject a prompt instructing Claude to call `copilot.timeline_event`. This depends on Claude following the prompt. "Auto-record" language in README and CLAUDE.md is misleading. Promoted to COPILOT-002.
