# Current Priorities — @mcptoolshop/claude-hook-debug

## Status

Locked (Role OS lockdown 2026-03-24). Primary seam: observability/trace truth.

## Classification

Lock candidate → locked.

## Seam family

Observability/trace truth — same family as any system where what was "seen" must be distinguished from what was configured, inferred, or missed.

## Must-preserve invariants (6)

1. **Settings-only scope** — the tool reads 4 JSON files. It does not intercept runtime events. This scope must be documented and not overclaimed.
2. **Plugin hooks visibility gap** — `PLUGIN_HOOKS_INVISIBLE` diagnostic must remain active. Plugin hooks cannot be seen by this tool.
3. **Graceful file handling** — missing files return `{ exists: false }`, broken JSON returns `{ error: '...' }`. Neither crashes the tool.
4. **Scope provenance** — every extracted hook and plugin state tracks which scope (managed/user/project/local) it came from.
5. **Diagnostic severity ordering** — diagnostics sorted by severity (error > warn > info). No priority suppression.
6. **No runtime claims** — output is a configuration snapshot, not an execution trace.

## Banned detours

- Adding "hook tracing" that infers firing from settings state (inference is not observation)
- Removing the PLUGIN_HOOKS_INVISIBLE diagnostic (it's the tool's honest admission)
- Claiming "clean bill of health" when 0 diagnostics are returned (absence of detected patterns ≠ correct behavior)
- Adding timestamps to hooks as if they represent firing times (hooks have no timestamps in settings)
