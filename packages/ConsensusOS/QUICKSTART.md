# ConsensusOS Quickstart Guide

Get running in 3 minutes.

## 1. Install

```bash
git clone https://github.com/mcp-tool-shop-org/ConsensusOS.git
cd ConsensusOS
npm install
```

### Requirements

- Node.js ≥ 18
- npm

## 2. Verify

```bash
npm test
```

Expected: `295 passed (295)` — all tests green.

## 3. Your First Plugin

Create `my-plugin.ts`:

```typescript
import {
  CoreLoader,
  CoreEventBus,
  CoreInvariantEngine,
  createLogger,
  ARCHITECTURE_VERSION,
} from "./src/index.js";
import type { Plugin, PluginContext, LifecycleResult } from "./src/index.js";

// Define a plugin
const myPlugin: Plugin = {
  manifest: {
    id: "my-hello-plugin",
    name: "Hello Plugin",
    version: "1.0.0",
    capabilities: ["greeting"],
  },

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    ctx.log.info("Initializing...");

    // Subscribe to events
    ctx.events.subscribe("core.boot.complete", (event) => {
      ctx.log.info(`System booted! Architecture v${ARCHITECTURE_VERSION}`);
    });

    // Register an invariant
    ctx.invariants.register({
      name: "greeting.not-empty",
      owner: "my-hello-plugin",
      description: "Greeting must not be empty",
      check: (data: unknown) => {
        const d = data as { greeting?: string };
        return !d.greeting || d.greeting.length > 0;
      },
    });

    return { ok: true };
  },

  async start(): Promise<LifecycleResult> {
    console.log("Hello from ConsensusOS!");
    return { ok: true };
  },

  async stop(): Promise<LifecycleResult> {
    console.log("Goodbye from ConsensusOS!");
    return { ok: true };
  },
};

// Boot the system
async function main() {
  const events = new CoreEventBus();
  const invariants = new CoreInvariantEngine();
  const loader = new CoreLoader({ events, invariants });

  loader.register(myPlugin);

  await loader.boot();

  // Check an invariant
  const verdict = await invariants.check({ greeting: "Hello World" });
  console.log(`Invariant check: ${verdict.allowed ? "PASS" : "FAIL"}`);

  // Emit a custom event
  events.publish("greeting.sent", "my-hello-plugin", { to: "world" });

  // View event history
  console.log(`Events emitted: ${events.history().length}`);

  await loader.shutdown();
}

main().catch(console.error);
```

Run:

```bash
npx tsx my-plugin.ts
```

## 4. Use the CLI

```bash
npx tsx src/cli/cli.ts --help
```

## 5. Next Steps

| Task | Guide |
|------|-------|
| Write a real plugin | [Plugin Development Guide](PLUGIN_GUIDE.md) |
| Create a chain adapter | [Adapter Guide](ADAPTER_GUIDE.md) |
| Understand the architecture | [Architecture Spec](ARCHITECTURE.md) |
| Use the sandbox | [Sandbox Walkthrough](SANDBOX_GUIDE.md) |
| Configure governor policies | [Governor Guide](GOVERNOR_GUIDE.md) |
| Contribute | [Contributing](CONTRIBUTING.md) |
| Security model | [Security Policy](SECURITY.md) |
