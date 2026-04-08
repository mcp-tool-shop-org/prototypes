# mcp-aside — Questions

## Answered during lockdown

### Q1: Can this system ever cause old or collapsed side-state to be mistaken for a fresh, distinct, currently valid aside?

**Answer:** No, under current architecture. Expired items are unconditionally filtered. Deduped pushes get distinct response codes. Replayed items are blocked within the dedupe window and create genuinely new state after it. Three caveats documented: source-excluded dedupe, expired-vs-absent equivalence, latent TOCTOU race.

### Q2: What makes two asides "the same"?

**Answer:** The tuple `(priority, text, reason)`. Source, tags, and metadata are excluded by design. Two asides from different sources with identical semantic content will collide. This is correct for an inbox (dedupe is about content, not provenance) but must be documented.

### Q3: What happens if an expired aside is re-pushed?

**Answer:** Depends on timing. Within the 5-minute dedupe window: rejected with `INBOX.DEDUPED` (dedupe history outlives items). After the window: accepted as genuinely new state with new UUID. No resurrection of the original item.
