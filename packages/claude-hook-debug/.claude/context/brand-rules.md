# Brand Rules — @mcptoolshop/claude-hook-debug

## Tone

Honest diagnostic. The tool reads settings files and pattern-matches known bugs. It does not observe runtime behavior, trace hook execution, or prove that detected patterns actually manifested.

## Domain language

| Term | Meaning | Must not be confused with |
|------|---------|--------------------------|
| Diagnostic | A pattern-matched warning about a known configuration issue | "Observation" or "runtime detection" |
| Scan | Reading and parsing settings files across 4 scopes | "Monitoring" or "intercepting" |
| Ghost hook | A hook that may fire from a disabled plugin (known Claude Code bug) | "A hook that was actually observed firing" |
| Resolved hook | A hook declaration extracted from settings files | "A hook that actually ran" |
| Plugin state | Whether a plugin is enabled/disabled in settings | "Whether a plugin is actually active in Claude Code runtime" |

## Enforcement bans

- "traces" / "observes" / "monitors" / "captures" hook activity (it reads settings files, not runtime events)
- "all hooks shown" / "complete view" (plugin-injected hooks are invisible)
- "verified" / "confirmed" when describing diagnostics (heuristics, not proof)
- "runtime analysis" / "execution trace" (static configuration inspection)

### Contamination risks

1. **Observability pretense** — the biggest risk: framing settings snapshots as hook traces
2. **Completeness pretense** — implying all active hooks are visible when plugin hooks are structurally invisible
3. **Proof pretense** — presenting pattern-matched diagnostics as observed runtime behavior
4. **Freshness pretense** — timestamp on report implies currency when settings may have changed
