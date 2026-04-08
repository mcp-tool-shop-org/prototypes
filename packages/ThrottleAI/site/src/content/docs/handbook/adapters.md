---
title: Adapters
description: Drop-in wrappers for fetch, OpenAI, tool calls, Express, and Hono — all tree-shakeable with zero runtime dependencies.
sidebar:
  order: 5
---

Adapters are tree-shakeable wrappers that integrate ThrottleAI with common tools and frameworks. Import only what you use. Each adapter handles acquire, release, outcome reporting, and latency tracking automatically.

All adapters return a consistent shape:

```ts
// Granted
{ ok: true, result: T, latencyMs: number }

// Denied
{ ok: false, decision: AcquireDecision }
```

## Adapter overview

| Adapter | Import | Auto-reports |
|---------|--------|-------------|
| **fetch** | `@mcptoolshop/throttleai/adapters/fetch` | outcome (from HTTP status) + latency |
| **OpenAI** | `@mcptoolshop/throttleai/adapters/openai` | outcome + latency + token usage |
| **Tool** | `@mcptoolshop/throttleai/adapters/tools` | outcome + latency + custom weight |
| **Express** | `@mcptoolshop/throttleai/adapters/express` | outcome (from `res.statusCode`) + latency |
| **Hono** | `@mcptoolshop/throttleai/adapters/hono` | outcome + latency |

## fetch adapter

Wraps any `fetch`-compatible function with governor-controlled leases. The outcome is automatically derived from the HTTP status code.

```ts
import { wrapFetch } from "@mcptoolshop/throttleai/adapters/fetch";

const throttledFetch = wrapFetch(fetch, { governor: gov });

const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) {
  console.log(r.response.status); // the original Response
} else {
  console.log("Denied:", r.decision.retryAfterMs);
}
```

### Options

- `governor` — the governor instance (required)
- `actorId` — default actor ID for all requests (default: `"default"`)
- `priority` — default priority (default: `"interactive"`)
- `classifyAction` — function to derive action from the request (default: URL pathname)
- `estimate` — function to provide a token estimate for the request

### Outcome mapping

| HTTP Status | Outcome |
|-------------|---------|
| 200-399 | `"success"` |
| 400-499 | `"error"` |
| 500-599 | `"error"` |
| Network error | `"error"` |

## OpenAI adapter

Wraps an OpenAI-compatible `chat.completions.create` function. Automatically reports token usage from the response.

```ts
import { wrapChatCompletions } from "@mcptoolshop/throttleai/adapters/openai";

const chat = wrapChatCompletions(
  (params) => openai.chat.completions.create(params),
  { governor: gov },
);

const r = await chat({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello" }],
});

if (r.ok) {
  console.log(r.result.choices[0].message.content);
  console.log("Tokens used:", r.result.usage?.total_tokens);
}
```

### What it auto-reports

- **Outcome:** `"success"` if the call completes, `"error"` on exception
- **Latency:** wall-clock time of the API call
- **Token usage:** extracted from `response.usage.total_tokens` if present

This means the governor's token-rate limiter stays accurate without you manually tracking tokens.

### Estimation helpers

The OpenAI adapter exports two utility functions for rough token estimation:

```ts
import {
  estimateTokensFromChars,
  estimateTokensFromMessages,
} from "@mcptoolshop/throttleai/adapters/openai";

// ~4 chars per token heuristic
const tokens = estimateTokensFromChars(2000); // 500

// Sum message content + per-message overhead
const promptTokens = estimateTokensFromMessages([
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Hello" },
]);
```

These are intentionally simple estimates. For accurate counts, use a real tokenizer (tiktoken) and pass the result as the `estimate` parameter.

## Tool adapter

Wraps any async function as a governed tool call. Useful for MCP tools, embedding functions, or any custom async work.

```ts
import { wrapTool } from "@mcptoolshop/throttleai/adapters/tools";

const embed = wrapTool(myEmbedFn, {
  governor: gov,
  toolId: "embed",
  costWeight: 2, // this tool uses 2 concurrency slots
});

const r = await embed("hello world");
if (r.ok) {
  console.log(r.result); // the embedding vector
}
```

### Options

- `governor` — the governor instance (required)
- `toolId` — identifier for this tool (used as the `action` in acquire requests)
- `costWeight` — concurrency weight per call (default: 1). Heavier tools can consume multiple slots.
- `actorId` — default actor ID

The `costWeight` option is particularly useful when different tools have different resource costs. An embedding call that hits a GPU might cost 2 slots while a simple metadata lookup costs 1.

## Express adapter

Middleware for Express that automatically governs incoming requests. Denied requests receive a 429 response with a `Retry-After` header.

```ts
import { throttleMiddleware } from "@mcptoolshop/throttleai/adapters/express";

app.use("/ai", throttleMiddleware({ governor: gov }));
```

### What happens on deny

When the governor denies a request, the middleware responds with:

- **Status:** 429 Too Many Requests
- **Header:** `Retry-After` (in seconds, derived from `retryAfterMs`)
- **Body:** JSON with the deny reason, recommendation, and retry timing

```json
{
  "error": "throttled",
  "reason": "concurrency",
  "retryAfterMs": 500,
  "recommendation": "All 5 slots in use. Try again in ~500ms."
}
```

### Options

- `governor` — the governor instance (required)
- `getActorId` — function to extract actor ID from request (default: `x-actor-id` header, then `req.ip`, then `"anonymous"`)
- `getAction` — function to extract action from request (default: `req.path`)
- `getPriority` — function to extract priority from request (default: `"interactive"`)
- `getEstimate` — function to derive a token estimate from the request
- `onDeny` — custom handler for denied requests (default: 429 JSON response)

### Outcome mapping

The middleware reports outcomes based on `res.statusCode` after the handler completes:

| Status Code | Outcome |
|-------------|---------|
| < 400 | `"success"` |
| >= 400 | `"error"` |

## Hono adapter

Middleware for the Hono framework, designed for edge-compatible runtimes.

```ts
import { throttle } from "@mcptoolshop/throttleai/adapters/hono";

app.use("/ai/*", throttle({ governor: gov }));
```

### Behavior

- Denied requests return 429 JSON with the same shape as the Express adapter.
- The `leaseId` is stored on the Hono context, allowing downstream handlers to access it if needed.
- Outcomes are reported automatically from the response status.

### Options

- `governor` — the governor instance (required)
- `getActorId` — function to extract actor ID from context (default: `x-actor-id` header or `"anonymous"`)
- `getAction` — function to extract action from context (default: `req.path`)
- `getPriority` — function to extract priority from context (default: `"interactive"`)
- `getEstimate` — function to derive a token estimate from the context
- `onDeny` — custom handler for denied requests (return a Response to override the default 429 JSON)

## Writing a custom adapter

If your framework or client is not covered by the built-in adapters, the pattern is straightforward:

```ts
async function myAdapter(gov, request, fn) {
  const decision = gov.acquire({
    actorId: request.actorId,
    action: request.action,
  });

  if (!decision.granted) {
    return { ok: false, decision };
  }

  const start = Date.now();
  try {
    const result = await fn();
    gov.release(decision.leaseId, {
      outcome: "success",
      latencyMs: Date.now() - start,
    });
    return { ok: true, result, latencyMs: Date.now() - start };
  } catch (err) {
    gov.release(decision.leaseId, {
      outcome: "error",
      latencyMs: Date.now() - start,
    });
    throw err;
  }
}
```

The key contract: acquire before, release after, always release on error, and report the outcome.
