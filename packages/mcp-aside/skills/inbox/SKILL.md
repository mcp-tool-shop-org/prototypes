---
name: inbox
description: Review all pending interjections. See what side-thoughts and blockers have been captured.
argument-hint:
---

# Review Inbox

Show all pending interjections.

## Instructions

1. Call `aside.status` to get inbox size and guardrails config
2. If the inbox is empty, say so and suggest using `/aside:push` to capture observations
3. If there are items, read the `interject://inbox` resource for the full list
4. Present each interjection clearly:
   - **Priority** badge (high/med/low)
   - **Text** — the observation
   - **Reason** — why it was captured
   - **Tags** — categories
   - **Age** — how long ago it was created
   - **Expires** — when it will auto-expire
5. Suggest next actions:
   - Act on high-priority items first
   - Dismiss resolved items with `/aside:clear`
   - Low-priority items may expire on their own

## Tips

- Expired items are automatically filtered out
- Items are shown newest-first
- If the inbox is cluttered, consider clearing and re-capturing only what matters
