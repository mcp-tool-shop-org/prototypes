# Brand Rules — @mcptoolshop/mcp-aside

## Tone

Explicit lifecycle. Every aside has an identity, a lifetime, and a clear outcome. The system tells you exactly what happened — accepted, deduped, rate-limited, expired — and never hides state transitions.

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Interjection | An ephemeral side-channel note with priority, text, reason, TTL | A "message" or "notification" |
| Push | Attempt to add an interjection to the inbox | A guaranteed write |
| Accepted | Push succeeded; new item created with UUID and TTL | "Acknowledged" or "processed" |
| Deduped | Push rejected; identical (priority, text, reason) within dedupe window | "Merged" or "updated" |
| Rate-limited | Push rejected; per-priority rate cap exceeded | "Queued" or "deferred" |
| Expired | Item's TTL has elapsed; invisible to callers on next read | "Deleted" or "removed" |
| Inbox | In-memory ordered list of live (non-expired) interjections | A "queue" or "persistent store" |

## Enforcement bans

### Language that must never appear in mcp-aside output or docs

- "saved" / "stored" / "persisted" (in-memory only, lost on restart)
- "guaranteed delivery" / "reliable" (push can be deduped or rate-limited)
- "updated" / "refreshed" / "renewed" (no in-place mutation, no TTL extension)
- "complete record" / "full history" (inbox shows live items only, expired are gone)
- "queued" when describing rate-limited pushes (rejected, not queued)

### Contamination risks

1. **Persistence pretense** — implying asides survive server restart (they don't)
2. **Delivery guarantee** — implying every push is accepted (dedupe and rate-limit reject)
3. **Update pretense** — implying asides can be modified (they're immutable)
4. **History pretense** — implying expired asides are accessible (they're garbage-collected)
5. **Identity ambiguity** — not documenting that source/tags/meta are excluded from dedupe identity
