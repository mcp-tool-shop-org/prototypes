# claude-hook-debug — Questions

## Answered during lockdown

### Q1: Can this tool make unobserved, partial, filtered, stale, or misordered hook activity look like a complete and faithful trace?

**Answer:** Mostly no. The tool is honestly scoped as a settings diagnostic. It doesn't use trace/observe/monitor language. PLUGIN_HOOKS_INVISIBLE admits its limitation. No runtime claims. Bounded risks: JSON output could mislead inattentive consumers, and stale reports carry no staleness signal. But the architecture matches its claims — it's a settings validator, not a hook tracer.

### Q2: Does the tool know about plugin-injected hooks?

**Answer:** No. Plugin hooks are structurally invisible — they're injected at runtime from plugin manifests, not stored in settings files. The PLUGIN_HOOKS_INVISIBLE diagnostic warns about this when plugins are enabled and no user hooks exist.

### Q3: Is this a runtime observer?

**Answer:** No. It reads 4 static JSON files. No MCP connection, no event interception, no process tracing.
