# Repo Map — @mcptoolshop/claude-hook-debug

## Stack

- TypeScript CLI + library
- Reads 4 settings file scopes (managed, user, project, local)
- Vitest (2 test files, 24 tests)
- Zero runtime dependencies beyond Node.js fs

## Module architecture

| Module | Purpose |
|--------|---------|
| `scanner.ts` | Read settings files, extract plugins + hooks across 4 scopes |
| `diagnostics.ts` | 8 pattern-matched diagnostic rules against known Claude Code bugs |
| `report.ts` | ANSI + JSON output formatting |
| `types.ts` | SettingsFile, PluginState, ResolvedHook, Diagnostic, DebugReport |
| `index.ts` | debug() orchestrator: scan → extract → diagnose → report |
| `cli.ts` | CLI entrypoint with arg parsing |

## Primary seam: Observability/trace truth

### Three laws this seam governs

**Capture law:** The tool reads static settings files only. It CANNOT capture runtime hook events, plugin-injected hooks, or hook execution outcomes. The `PLUGIN_HOOKS_INVISIBLE` diagnostic (diagnostics.ts:191-213) is the tool's own honest admission: "Plugin hooks are invisible to settings inspection."

**Ordering law:** N/A for this tool — it doesn't capture events with timestamps. Hooks are listed by scope (managed → user → project → local), not by firing order. No temporal claims are made.

**Causality law:** Diagnostics are pattern-matched heuristics, not observed causality. "Ghost hooks" means "disabled plugin + hook pattern matches" — not "this hook actually fired when it shouldn't have."

### Contract surfaces

| Surface | Location | What it governs | Truth state |
|---------|----------|-----------------|-------------|
| Settings file reading | scanner.ts:41-57 | Scope discovery + parse | **OK** — handles missing files and broken JSON explicitly |
| Plugin state extraction | scanner.ts:73-113 | Cross-scope plugin merge | **OK** — tracks provenance (which scope defined the state) |
| Hook extraction | scanner.ts:115-137 | Static hook declarations | **OK** — accurately reads what's in settings files |
| PLUGIN_HOOKS_INVISIBLE | diagnostics.ts:191-213 | Plugin hook visibility gap | **HONEST** — admits tool's limitation |
| Diagnostic pattern rules | diagnostics.ts:20-286 | 8 known-bug patterns | **OK** — heuristics clearly labeled as diagnostics |
| Report timestamp | types.ts:92 | When report was generated | **MEDIUM** — no comparison to settings file modification times |

### Liar-path surfaces

| Path | Risk | Actual state |
|------|------|-------------|
| Settings snapshot → runtime trace | MEDIUM | README is honest ("diagnostic"), but JSON output format could mislead |
| Empty hooks → "nothing fires" | MEDIUM | PLUGIN_HOOKS_INVISIBLE diagnostic warns, but only if plugins are detected |
| 0 diagnostics → "all clear" | LOW | No claim of completeness, but absence of warnings could imply health |
| Stale report → current state | LOW | Timestamp present but no settings-modification comparison |

## Validation

- `npm test` — Vitest (24 tests: 9 scanner, 15 diagnostics)
- All passing
