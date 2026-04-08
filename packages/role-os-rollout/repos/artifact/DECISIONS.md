# Artifact — Repo-Local Decisions

## 2026-03-24 — Fallback is a valid operating mode, not degradation

**Decision:** Fallback mode is not "degraded" or "limited." It is a valid, deterministic operating mode with different properties than Curator mode. Language and documentation must reflect this.

**Why:** The biggest brand/truth risk for this repo is treating fallback as inferior. It's different (deterministic vs reasoned) but not worse. Calling it degraded would invite "improvements" that break determinism.

**Applies to:** All output, docs, and stderr messaging.

---

## 2026-03-24 — DT-3 monitoring: Curator validation defaults

**Decision:** When Curator responds with invalid fields, the system corrects them to defaults and tags the packet as `mode: 'ollama'`. This is acceptable because Ollama DID drive the decision, but some fields may be defaults. Monitor for cases where this produces misleading packets.

**Why:** The alternative (rejecting the entire response) would make the system fragile. The current approach is pragmatic but should be named.

**Applies to:** curator.ts validation functions.
