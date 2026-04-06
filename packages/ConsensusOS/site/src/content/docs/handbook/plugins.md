---
title: Plugins
description: Built-in modules and how to write your own plugin.
sidebar:
  order: 3
---

ConsensusOS uses a plugin architecture where every module — from health monitoring to chain adapters — is a plugin that communicates through the shared event bus.

## Built-in modules

| Factory | Purpose |
|---------|---------|
| `createHealthSentinel()` | Node health monitoring via heartbeats |
| `createReleaseVerifier()` | Software release hash verification |
| `createConfigGuardian()` | Configuration schema validation and migration |
| `createSandboxPlugin()` | Isolated simulation, replay, and amendment engine |
| `createGovernorPlugin()` | Token-based execution, policy enforcement, build queue |

## Writing a custom plugin

Extend `BasePlugin` and use `ManifestBuilder` to declare your plugin's identity and capabilities:

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### Plugin lifecycle

1. **Registration** — `loader.register(plugin)` adds the plugin to the loader
2. **Dependency resolution** — The loader topologically sorts plugins using Kahn's algorithm; circular dependencies cause a hard fail
3. **Initialization** — `onInit(ctx)` is called in dependency order, receiving the `PluginContext` with access to the event bus, invariant engine, config, and logger
4. **Startup** — `onStart()` is called after all plugins are initialized
5. **Shutdown** — `onStop()` is called in reverse boot order
6. **Destroy** — `onDestroy()` is called after stop for final resource cleanup

### BasePlugin convenience methods

When extending `BasePlugin`, these helpers are available in any lifecycle hook:

| Method | Description |
|--------|-------------|
| `this.emit(topic, data)` | Publish an event through the event bus |
| `this.on(topic, handler)` | Subscribe to an event topic (supports wildcards) |
| `this.registerInvariant(name, description, check)` | Register a fail-closed invariant |
| `this.log` | Structured logger scoped to this plugin |
| `this.events` | Direct access to the event bus |
| `this.invariants` | Direct access to the invariant engine |
| `this.config` | Plugin-specific configuration |

### Plugin SDK exports

| Export | Description |
|--------|-------------|
| `BasePlugin` | Abstract base class with lifecycle defaults and convenience methods |
| `ManifestBuilder` | Fluent builder for type-safe plugin manifests |
| `validatePlugin()` | Pre-registration validation with errors and warnings |
| `AttestationPipeline` | Release attestation and build provenance |

### Validation

Call `validatePlugin()` before registration to catch issues early:

```ts
const result = validatePlugin(myPlugin);
if (result.errors.length > 0) {
  console.error("Plugin validation failed:", result.errors);
}
```
