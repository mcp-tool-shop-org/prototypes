---
title: Beginners Guide
description: A beginner-friendly introduction to ThrottleAI — what it does, why you need it, and how to get your first governor running in minutes.
sidebar:
  order: 99
---

## What is ThrottleAI?

ThrottleAI is a lightweight TypeScript library that controls how many AI calls your application makes at the same time. It acts as a traffic cop between your code and AI model APIs (OpenAI, Anthropic, Ollama, or any HTTP endpoint), preventing stampedes that blow budgets, trigger rate limits, or crash local GPUs.

ThrottleAI uses a **lease-based model**: before making an AI call, your code requests a lease from a governor. The governor checks concurrency, rate limits, and fairness rules, then returns an immediate yes or no. If granted, you make the call and release the lease when done. If denied, you get a recommendation for when to retry.

The library has zero dependencies, runs in Node.js 18+, and operates entirely in memory -- no network calls, no telemetry, no persistent state.

## Who is this for?

ThrottleAI is for any TypeScript or JavaScript developer who calls AI APIs and needs to control:

- **Concurrency** -- how many calls run at the same time
- **Rate limits** -- how many requests per minute the upstream API allows
- **Fairness** -- preventing one user from hogging all capacity in multi-tenant apps
- **Cost** -- staying within token budgets to avoid surprise bills

If you have ever seen a `429 Too Many Requests` error from an AI provider, or had a local model run out of memory from too many simultaneous requests, ThrottleAI solves that problem.

## Key concepts

### Governor

The governor is the central object. You create one with `createGovernor()` and it tracks all active leases, rate windows, and fairness state. Most applications need exactly one governor.

### Lease

A lease is a permit to make one AI call. You acquire a lease before calling the model and release it when done. Leases auto-expire after a configurable timeout (default: 60 seconds) as a safety net.

### Presets

ThrottleAI ships three presets that cover common scenarios:

- **quiet** -- 1 concurrent call, 10 requests/min. For CLI tools and single-user apps.
- **balanced** -- 5 concurrent calls with 2 reserved for interactive users, 60 requests/min, fairness enabled. For SaaS backends.
- **aggressive** -- 20 concurrent calls, 300 requests/min, fairness + adaptive tuning. For batch processing.

### Adapters

Adapters are optional wrappers for popular frameworks (fetch, OpenAI SDK, Express, Hono). They handle acquire/release automatically so you do not need to manage leases manually.

## Prerequisites

- **Node.js 18 or later** -- ThrottleAI uses modern JavaScript features.
- **TypeScript recommended** -- The library is written in TypeScript and provides full type definitions. JavaScript works too, but you lose type safety.
- A package manager: npm, pnpm, or yarn.

## Step-by-step tutorial

### 1. Install

```bash
npm install @mcptoolshop/throttleai
```

### 2. Create a governor

```ts
import { createGovernor, presets } from "@mcptoolshop/throttleai";

// Start with the quiet preset for learning
const gov = createGovernor(presets.quiet());
```

The `quiet` preset allows 1 concurrent call and 10 requests per minute. This is the safest starting point.

### 3. Make a governed call with withLease

`withLease` is the recommended way to use ThrottleAI. It handles acquire and release automatically, including on errors.

```ts
import { createGovernor, withLease, presets } from "@mcptoolshop/throttleai";

const gov = createGovernor(presets.quiet());

// Simulate an AI call
async function callMyModel(prompt: string): Promise<string> {
  // Replace this with your actual AI SDK call
  return `Response to: ${prompt}`;
}

const result = await withLease(
  gov,
  { actorId: "my-app", action: "chat" },
  async () => await callMyModel("Hello, world!"),
);

if (result.granted) {
  console.log("Got a response:", result.result);
} else {
  console.log("Throttled! Retry in", result.decision.retryAfterMs, "ms");
  console.log("Reason:", result.decision.reason);
}
```

**What happens here:**

1. `withLease` calls `gov.acquire()` to request a lease.
2. If granted, it runs your function and then calls `gov.release()` automatically.
3. If denied, it returns the denial with a reason and retry recommendation.
4. If your function throws an error, the lease is still released (with outcome `"error"`).

### 4. Add observability

To see what the governor is doing, add an event handler:

```ts
import { createGovernor, formatEvent, presets } from "@mcptoolshop/throttleai";

const gov = createGovernor({
  ...presets.quiet(),
  onEvent: (e) => console.log(formatEvent(e)),
});
```

You will see output like:

```
[acquire] actor=my-app action=chat leaseId=abc123
[release] leaseId=abc123 outcome=success
```

If a call is denied, you will see:

```
[deny] actor=my-app action=chat reason=concurrency retryAfterMs=500
```

### 5. Check governor state

At any time, you can inspect the governor:

```ts
import { formatSnapshot } from "@mcptoolshop/throttleai";

console.log(formatSnapshot(gov.snapshot()));
// concurrency=0/1 rate=3/10 leases=0
```

### 6. Clean up on shutdown

The governor runs a background interval to expire stale leases. Call `dispose()` when your app shuts down to stop it:

```ts
process.on("SIGINT", () => {
  gov.dispose();
  process.exit(0);
});
```

## Common mistakes

### Forgetting to release leases

If you use `gov.acquire()` directly (instead of `withLease`), you must always release the lease, even when an error occurs:

```ts
const decision = gov.acquire({ actorId: "my-app", action: "chat" });
if (!decision.granted) return;

try {
  const result = await callMyModel();
  gov.release(decision.leaseId, { outcome: "success" });
} catch (err) {
  gov.release(decision.leaseId, { outcome: "error" });
  throw err;
}
```

If you forget the `catch` branch, leaked leases consume concurrency slots until they expire. Use `withLease` to avoid this entirely.

### Setting maxInFlight too low

With `maxInFlight: 1` (the quiet preset), only one call runs at a time. This is safe but slow. Once you are comfortable, increase it:

```ts
createGovernor({
  concurrency: { maxInFlight: 5 },
});
```

### Not calling dispose

If you do not call `gov.dispose()`, the reaper interval keeps your Node.js process alive after your work is done. This is especially noticeable in scripts and tests.

## FAQ

**Q: Does ThrottleAI make network calls?**

No. ThrottleAI is a pure in-memory library. It does not call any APIs, send telemetry, or access the filesystem. It only tracks state in JavaScript objects.

**Q: Can I use ThrottleAI with any AI provider?**

Yes. ThrottleAI is provider-agnostic. It governs when calls happen, not how they are made. Use it with OpenAI, Anthropic, Google, Ollama, vLLM, or any HTTP API. The built-in adapters handle OpenAI and fetch patterns automatically, but the core `acquire/release` API works with anything.

**Q: What happens when a lease expires?**

The governor fires an `expire` event and frees the concurrency slot. The in-flight operation continues running -- the governor just stops tracking it. Frequent expirations indicate that `leaseTtlMs` is too short for your workload.

**Q: Do I need a separate governor per API?**

Not necessarily. One governor can manage all your AI calls. If you call multiple APIs with different rate limits, you may want separate governors -- one per API.

**Q: What is the difference between `withLease` and raw `acquire/release`?**

`withLease` wraps `acquire` and `release` with automatic error handling. It is the recommended approach for most use cases. Use raw `acquire/release` only when you need fine-grained control, such as holding a lease across multiple async steps or streaming responses.
