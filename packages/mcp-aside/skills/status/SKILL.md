---
name: status
description: Check inbox size and guardrails configuration.
argument-hint:
---

# Aside Status

Check the interjection inbox status.

## Instructions

1. Call `aside.status` to get current state
2. Report:
   - **Inbox size** — how many items are pending
   - **Guardrails** — current config (TTL, rate limits, dedupe window)
   - **Defaults** — what the factory defaults are
3. If guardrails have been customized (differ from defaults), highlight the changes
4. Suggest adjustments if needed:
   - Too many items expiring? Increase `defaultTtlSeconds`
   - Too noisy? Lower rate limits with `aside.configure`
   - Missing interjections? Check if dedupe window is too aggressive
