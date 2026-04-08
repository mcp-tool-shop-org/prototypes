# HOOKDEBUG-001 — Observability/Trace Truth Lock

**Repo:** @mcptoolshop/claude-hook-debug
**Seam:** Observability/trace truth
**Date:** 2026-03-24
**Status:** PASS (clean — tool is honestly scoped, architecture matches claims)

## Three-law verification

### Capture law

- **What it reads:** 4 static settings files (managed, user, project, local) via `scanner.ts:41-57`
- **What it cannot see:** Plugin-injected hooks, runtime events, hook execution outcomes
- **Honest admission:** `PLUGIN_HOOKS_INVISIBLE` diagnostic (diagnostics.ts:191-213) fires when plugins are enabled but no user-defined hooks exist: "Plugin hooks are invisible to settings inspection."
- **File error handling:** Missing files → `{ exists: false }`. Broken JSON → `{ exists: true, error: '...' }`. Both surfaced in diagnostics.

**Verdict:** PASS. The tool reads what it claims to read and admits what it cannot see.

### Ordering law

- **No temporal claims:** Hooks are listed by scope (managed → user → project → local), not by firing order.
- **No timestamps on hooks:** `ResolvedHook` has no `firedAt`, `executedAt`, or similar field.
- **Report timestamp:** `DebugReport.timestamp` is capture time only — when the tool ran, not when hooks fired.

**Verdict:** PASS. No ordering claims are made. The tool doesn't pretend to know firing order.

### Causality law

- **Diagnostics are heuristics:** "Ghost hooks" = "disabled plugin + hook pattern matches known bug." Not "this hook was observed firing when disabled."
- **No causal chains:** No "hook A triggered event B" claims.
- **Pattern sources documented:** Diagnostics reference specific Claude Code bug numbers (#19893, #25086).

**Verdict:** PASS. Diagnostics are clearly labeled as pattern-matching, not runtime proof.

## Five pressure paths

### PP-1: Capture gap — plugin hooks invisible

- **Scenario:** User has plugins enabled, plugins inject PostToolUse hooks at runtime.
- **Tool output:** Shows user-configured hooks only. Plugin hooks are absent.
- **Diagnostic:** `PLUGIN_HOOKS_INVISIBLE` fires if plugins are detected and no user hooks exist.
- **Gap:** If user also has their own hooks, the diagnostic doesn't fire — plugin hooks are still invisible but no warning.

**Verdict:** PASS with design caveat (DC-1). The diagnostic fires in the most dangerous case (only plugin hooks, none visible). But mixed scenarios (user + plugin hooks) don't warn.

### PP-2: Empty hooks — "nothing fires" implication

- **Scenario:** All 4 settings files have empty `hooks: {}`. But plugins are enabled.
- **Tool output:** `hooks: []` in report + `PLUGIN_HOOKS_INVISIBLE` diagnostic.
- **Consumer risk:** If consumer only reads `hooks: []` and skips diagnostics, they assume "no hooks."

**Verdict:** PASS. The tool surfaces the warning. Consumer responsibility to read diagnostics.

### PP-3: Stale report — settings changed since capture

- **Scenario:** Tool runs at 10:00. User edits settings at 10:05. Report still shows 10:00 state.
- **Tool output:** `timestamp: "10:00:00Z"` — no comparison to file modification time.
- **Consumer risk:** Report looks authoritative but is stale.

**Verdict:** Design caveat (DC-2). Report has a timestamp but no staleness signal. Low risk — tool is designed for interactive use, not long-lived caching.

### PP-4: Diagnostics as proof — heuristic reading as observation

- **Scenario:** Ghost hook diagnostic fires. User believes "the bug is happening now."
- **Tool output:** `severity: 'warn', title: 'Ghost hook from disabled plugin'`
- **Actual meaning:** "This configuration pattern is known to trigger bug #19893. We can't verify it's happening right now."

**Verdict:** PASS. Diagnostics say "detected" and "may," not "confirmed" or "is happening." Language is honest.

### PP-5: File read errors — silent failure risk

- **Scenario:** User lacks permission to read managed settings.
- **Tool output:** `{ scope: 'managed', exists: false }` — file treated as missing.
- **Diagnostic:** `BROKEN_SETTINGS` only fires for files that exist but fail to parse. Permission-denied on a real file may look like "file doesn't exist."

**Verdict:** Design caveat (DC-3). Permission errors on existing files could be misclassified as missing. Low practical risk — managed settings are typically readable.

## Liar-path rejection tests (3)

### LP-1: "Runtime hook tracer" — add hook firing observation claims

**Hypothetical change:** Add a "live mode" that claims to watch hooks fire by polling settings files repeatedly.

**Why rejected:** Violates reject criteria #6 (adds runtime observation claims without actual interception). Polling settings files does not equal observing hook events. The tool would claim "watching hooks" while actually re-reading JSON files. Real observation requires MCP integration or Claude Code extension hooks.

### LP-2: "All clear" — present 0 diagnostics as health certification

**Hypothetical change:** Add a summary line: "✓ All hooks are healthy — no issues detected" when 0 diagnostics.

**Why rejected:** Violates reject criteria #8 (reassurance stronger than semantics). 0 diagnostics means "no known-bug patterns matched." It does NOT mean hooks are healthy — plugin hooks are invisible, runtime behavior is unknown, and novel bugs wouldn't be detected.

### LP-3: "Complete hook inventory" — claim the report shows all active hooks

**Hypothetical change:** Change the report header from "Resolved Hooks" to "Active Hooks" or "All Hooks."

**Why rejected:** Violates reject criteria #1 (partial capture reading as complete). Plugin hooks are structurally invisible. "Resolved" means "found in settings files" — "Active" would imply runtime truth the tool doesn't have.

## Design caveats (named, not blocking)

### DC-1: PLUGIN_HOOKS_INVISIBLE only fires when no user hooks exist

If the user has their own hooks AND plugins are enabled, the diagnostic doesn't fire. Plugin hooks are still invisible, but the warning is suppressed because user hooks exist.

**Acceptable because:** The most dangerous case (only invisible hooks, user thinks nothing is configured) is covered. The mixed case (user hooks + invisible plugin hooks) is less likely to cause confusion.

### DC-2: No settings-modification-time comparison

Report timestamp shows when the tool ran, but doesn't compare to file modification times. A report could be stale relative to settings changes.

**Acceptable because:** The tool is designed for interactive CLI use, not for long-lived cached reports. Users typically run it → read it → act on it.

### DC-3: Permission-denied may read as missing

If a settings file exists but the process lacks read permission, `existsSync` returns true but `readFileSync` throws. The catch block sets `error` on the file. But if `existsSync` returns false for permission reasons, the file is treated as missing.

**Acceptable because:** Low practical risk. Settings files are typically user-readable.

## Summary

| Check | Result |
|-------|--------|
| Capture law (static settings only) | PASS |
| Ordering law (no temporal claims) | PASS |
| Causality law (heuristics, not proof) | PASS |
| PP-1: Plugin hooks invisible | PASS (with DC-1) |
| PP-2: Empty hooks implication | PASS |
| PP-3: Stale report | Design caveat (DC-2) |
| PP-4: Diagnostics as proof | PASS |
| PP-5: File read errors | Design caveat (DC-3) |
| LP-1: Runtime hook tracer | Correctly rejected |
| LP-2: All clear certification | Correctly rejected |
| LP-3: Complete hook inventory | Correctly rejected |

**Overall: PASS (clean).** The tool is honestly scoped as a settings diagnostic. README uses "diagnostic" and "detects," not "traces" or "observes." The PLUGIN_HOOKS_INVISIBLE diagnostic admits the tool's own structural limitation. No runtime claims. 3 design caveats, all bounded.
