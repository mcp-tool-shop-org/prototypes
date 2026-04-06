---
title: Tools & Resources
description: MCP tools and resources exposed by mcp-aside.
sidebar:
  order: 2
---

## Tools

| Tool | Description |
|------|-------------|
| `aside.push` | Push an interjection into the inbox. Accepts `text`, `priority` (low/med/high), `reason`, `tags`, `expiresAt`, `source`, and `meta`. |
| `aside.configure` | Tune guardrails at runtime — TTL caps, rate limits, dedupe windows, notification thresholds. |
| `aside.clear` | Wipe the inbox. |
| `aside.status` | Read-only snapshot of inbox size and current guardrail config. |
| `aside.stats` | Usage statistics: accepted, rejected, deduped, and rate-limited counts. |

## Resource

| URI | Description |
|-----|-------------|
| `interject://inbox` | JSON array of pending interjections, newest first. Expired items are filtered on read. |

## aside.push parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | The interjection text (must be non-empty). |
| `priority` | `"low"` \| `"med"` \| `"high"` | No | Defaults to `"med"`. Controls rate limits and notification behavior. |
| `reason` | string | No | Why this interjection matters. Used in deduplication (same priority + text + reason = duplicate). |
| `tags` | string[] | No | Categorization tags, e.g. `["bug"]`, `["perf"]`, `["idea"]`. |
| `expiresAt` | string | No | ISO timestamp. If omitted, the guardrails apply the default TTL (10 min). Capped at `maxTtlSeconds`. |
| `source` | string | No | Where the interjection came from: `"timer"`, `"tool"`, `"hook"`, etc. |
| `meta` | object | No | Arbitrary key-value metadata. The guardrails append `dedupeHash` and `normalizedAt` automatically. |

## aside.configure parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `enabled` | boolean | Master switch. Set to `false` to bypass all guardrails. |
| `defaultTtlSeconds` | number | Default TTL when no `expiresAt` is provided. |
| `maxTtlSeconds` | number | Hard cap on TTL. |
| `dedupeWindowSeconds` | number | Window for duplicate suppression. |
| `rateLimitWindowSeconds` | number | Sliding window for rate limiting. |
| `rateLimitMax` | `{ low, med, high }` | Max pushes per priority per window. |
| `notifyAtOrAbove` | `"low"` \| `"med"` \| `"high"` | Minimum priority that triggers log notifications. |

## Timer trigger

A built-in timer fires every 5 minutes, pushing a low-priority check-in. It respects the same guardrails as manual pushes. Disable it by commenting out the `startTimerTrigger` call in `index.ts`.
