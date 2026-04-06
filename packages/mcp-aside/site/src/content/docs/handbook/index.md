---
title: mcp-aside Handbook
description: Complete guide to mcp-aside — an in-memory interjection inbox for your AI.
sidebar:
  order: 0
---

mcp-aside gives your AI a place to jot things down mid-conversation — a sticky-note pad next to the conversation. The model writes notes, tagged by priority, and reads them when the time is right.

## How it works

1. The model calls `aside.push` with a thought, tagged by priority
2. Guardrails check for duplicates, rate limits, and TTL caps
3. If it passes, the interjection lands in an in-memory inbox
4. Clients get notified via `notifications/resources/updated`
5. Anyone can read the inbox through the `interject://inbox` resource

No database. No persistence. If the server stops, the inbox is gone — by design.
