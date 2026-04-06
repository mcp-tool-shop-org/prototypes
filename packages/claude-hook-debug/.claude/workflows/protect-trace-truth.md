# Workflow: Protect Trace Truth

**Repo:** @mcptoolshop/claude-hook-debug
**Seam:** Observability/trace truth — the boundary between what the tool claims to show (settings diagnostics) and what users might expect (runtime hook behavior).

## What this workflow protects

The contract that this tool is a static configuration validator, not a runtime hook tracer. It reads settings files, pattern-matches known bugs, and reports. It does not observe, intercept, or prove runtime hook behavior.

## Automatic reject criteria (8)

A proposed change MUST be rejected if it:

1. **Makes empty/partial capture read like "no hooks fired"** — presents empty hooks array without indicating that plugin hooks are invisible and empty settings does not mean no activity
2. **Makes filtered traces read like full traces** — if filtering is ever added, filtered output must indicate what was excluded
3. **Makes stale session logs read like current activity** — presents a settings snapshot without indicating it may not reflect current runtime state
4. **Makes inferred relationships read like observed relationships** — presents diagnostic heuristics ("ghost hook detected") as though the tool observed the hook actually firing
5. **Makes dropped/error events disappear from the outward surface** — hides broken JSON or missing files instead of surfacing them in diagnostics
6. **Adds runtime observation claims without actual interception** — frames settings reading as "monitoring," "tracing," or "capturing" hook events
7. **Removes the PLUGIN_HOOKS_INVISIBLE diagnostic** — this is the tool's honest admission of its structural limitation; removing it hides the visibility gap
8. **Makes human-facing reassurance stronger while leaving machine-facing semantics unchanged** — e.g., report says "hooks healthy" when it only checked settings, not runtime (org-wide reassurance drift rule)

## The key question this workflow answers

**Can claude-hook-debug make unobserved, partial, filtered, stale, or misordered hook activity look like a complete and faithful trace?**

### Currently: mostly no, with bounded risk

The tool is honestly scoped as a "diagnostic CLI" (README line 19). It doesn't use words like "trace," "observe," or "monitor." The PLUGIN_HOOKS_INVISIBLE diagnostic admits its own limitation. Diagnostics are clearly labeled as pattern-matching, not runtime proof.

### Bounded risks
- JSON output format could mislead a consumer who doesn't read the diagnostic section
- "0 diagnostics" doesn't explicitly say "this doesn't mean all clear"
- Report timestamp shows capture time but doesn't compare to settings modification times

### Must never imply
- That "hooks configured" means "hooks that will actually fire"
- That empty hooks means "nothing is active" (plugin hooks are invisible)
- That diagnostics prove runtime behavior (they're heuristics)
- That the report reflects current Claude Code state (it reflects settings at capture time)

## When to re-prove

Re-prove this workflow when:
- New settings scopes are added
- Plugin manifest reading is attempted
- Any form of runtime observation is added
- The PLUGIN_HOOKS_INVISIBLE diagnostic is modified
- Output format changes (especially JSON structure)
