# Plugin Ecosystem Readiness

## Plugin SDK

The SDK is packaged at `src/sdk/plugin-sdk.ts` and provides:

- **`BasePlugin`** — Abstract base class with boilerplate lifecycle management
- **`ManifestBuilder`** — Fluent API for constructing plugin manifests
- **`validatePlugin()`** — Pre-load validation (checks interface compliance, manifest completeness)

## Plugin Compatibility Policy

### Version Matrix

| Plugin API Version | ConsensusOS Version | Status |
|--------------------|---------------------|--------|
| 1.0 | 1.0.x, 1.1.x | ✅ Supported |
| 2.0 (future) | 2.0.x+ | Planned |

### Compatibility Rules

1. **v1.0 plugins work on any v1.x release** — backward compatibility guaranteed
2. **New optional fields may be added** to `PluginManifest`, `PluginContext`, etc. without a version bump
3. **Breaking changes require `PLUGIN_API_VERSION = "2.0"`** and a package major version bump
4. **Deprecated features** will be marked for 2 minor versions before removal

## Plugin Validation Checklist

Before distributing a plugin:

- [ ] Implements all required `Plugin` interface methods
- [ ] `manifest.id` is unique and kebab-case
- [ ] `manifest.version` is valid SemVer
- [ ] `manifest.capabilities` lists at least one capability
- [ ] Passes `validatePlugin()` with zero errors
- [ ] Has tests covering init/start/stop lifecycle
- [ ] Does not import from other modules (only `plugins/api.ts` and `core/`)
- [ ] Does not call `new CoreEventBus()` — uses injected `ctx.events`
- [ ] Does not add production dependencies

## Plugin CLI Validation

```bash
# Validate a plugin file
npx tsx src/cli/cli.ts validate ./my-plugin.ts
```

(CLI validation command planned for v1.1)

## Example Plugins

| Plugin | File | Demonstrates |
|--------|------|-------------|
| Heartbeat Monitor | `examples/heartbeat-monitor.ts` | Events, invariants, intervals |
| Echo Plugin | `src/mocks/echo-plugin.ts` | Wildcard subscription |
| Health Sentinel | `src/mocks/health-sentinel-plugin.ts` | Real invariant registration |
| Config Guardian | `src/mocks/config-guardian-plugin.ts` | Dependencies, config |

## Ecosystem Guidelines

1. **Naming**: Plugins should use `@scope/consensus-plugin-<name>` for npm packages
2. **Testing**: Include integration tests that boot with `CoreLoader`
3. **Documentation**: Provide a README with installation, configuration, and event topics
4. **Licensing**: MIT or compatible license recommended
