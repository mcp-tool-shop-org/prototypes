# Plugin Development Guide

This guide walks through creating a ConsensusOS plugin from scratch.

## Plugin API v1 (Frozen)

Every plugin implements the `Plugin` interface:

```typescript
interface Plugin {
  readonly manifest: PluginManifest;
  init(ctx: PluginContext): Promise<LifecycleResult>;
  start(): Promise<LifecycleResult>;
  stop(): Promise<LifecycleResult>;
  destroy?(): Promise<void>;
}
```

### Lifecycle

```
register → init(ctx) → start() → [running] → stop() → destroy()
```

- `init()`: Set up subscriptions, register invariants, configure state
- `start()`: Begin processing (emit events, start timers)
- `stop()`: Clean up resources
- `destroy()`: Optional final cleanup

### Manifest

```typescript
const manifest: PluginManifest = {
  id: "my-plugin",           // Unique identifier (kebab-case)
  name: "My Plugin",         // Human-readable name
  version: "1.0.0",          // SemVer version
  capabilities: ["custom"],  // What this plugin does
  dependencies: [],          // IDs of plugins that must init first
};
```

### PluginContext

Injected in `init()` — your only window into the core:

```typescript
interface PluginContext {
  readonly events: EventBus;        // Publish and subscribe to events
  readonly invariants: InvariantEngine;  // Register governance rules
  readonly config: PluginConfig;    // Plugin-specific configuration
  readonly log: Logger;             // Structured logger
}
```

## Example: Counter Plugin

```typescript
import type { Plugin, PluginContext, LifecycleResult } from "./src/plugins/api.js";

export class CounterPlugin implements Plugin {
  readonly manifest = {
    id: "counter",
    name: "Counter Plugin",
    version: "1.0.0",
    capabilities: ["counting"] as const,
  };

  private count = 0;
  private ctx!: PluginContext;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.ctx = ctx;

    // Listen for increment events
    ctx.events.subscribe("counter.increment", () => {
      this.count++;
      ctx.log.info(`Count: ${this.count}`);
    });

    // Register a max-count invariant
    ctx.invariants.register({
      name: "counter.max-check",
      owner: this.manifest.id,
      description: "Counter must not exceed 1000",
      check: () => this.count <= 1000,
    });

    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.ctx.log.info("Counter plugin started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    this.ctx.log.info(`Final count: ${this.count}`);
    return { ok: true };
  }
}

// Factory pattern (recommended)
export const createCounterPlugin = () => new CounterPlugin();
```

## Using the Plugin SDK

The SDK provides `BasePlugin` for less boilerplate:

```typescript
import { BasePlugin, ManifestBuilder } from "./src/sdk/plugin-sdk.js";

export class EasyPlugin extends BasePlugin {
  constructor() {
    super(
      new ManifestBuilder("easy-plugin", "Easy Plugin", "1.0.0")
        .addCapability("example")
        .build(),
    );
  }

  protected async onInit(): Promise<void> {
    this.ctx.events.subscribe("easy.*", (event) => {
      this.ctx.log.info(`Received: ${event.topic}`);
    });
  }

  protected async onStart(): Promise<void> {
    this.ctx.log.info("Easy plugin started!");
  }

  protected async onStop(): Promise<void> {
    this.ctx.log.info("Easy plugin stopped!");
  }
}
```

## Validation

Use `validatePlugin()` to check a plugin before loading:

```typescript
import { validatePlugin } from "./src/sdk/plugin-sdk.js";

const errors = validatePlugin(myPlugin);
if (errors.length > 0) {
  console.error("Plugin validation failed:", errors);
}
```

## Event Conventions

| Topic Pattern | Example | Used For |
|---------------|---------|----------|
| `<domain>.<action>` | `health.check` | Simple actions |
| `<domain>.<action>.<detail>` | `health.check.completed` | Detailed events |
| `core.*` | `core.boot.complete` | System lifecycle |
| `<plugin-id>.*` | `counter.increment` | Plugin-specific |

## Rules

1. **Never import other modules directly** — use the event bus
2. **Never instantiate `CoreEventBus`** — use the injected `ctx.events`
3. **Always return `LifecycleResult`** from init/start/stop
4. **Use factories** — export a function, not a class instance
5. **Declare dependencies** — if your plugin needs another, list it in `manifest.dependencies`
