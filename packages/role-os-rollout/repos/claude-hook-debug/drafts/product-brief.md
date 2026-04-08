# Product Brief — @mcptoolshop/claude-hook-debug

## What this is

Diagnostic CLI for Claude Code hook configuration issues. Reads static settings files across 4 scopes (managed, user, project, local), extracts hook declarations and plugin states, resolves scope conflicts, and runs pattern-matched diagnostics against known Claude Code bugs. Outputs a settings snapshot with diagnostic warnings.

## Type

CLI + library (reads JSON files, outputs ANSI or JSON report)

## Core value

Static configuration validation that catches known hook misconfiguration patterns — ghost hooks from disabled plugins, scope conflicts, infinite-loop risk, invisible plugin hooks — before they cause runtime surprises. Deterministic, offline, no runtime dependencies.

## What it is not

- Not a runtime hook tracer — does not observe, intercept, or capture actual hook events as they fire
- Not a hook execution monitor — does not record which hooks succeeded, failed, or timed out
- Not a plugin manifest reader — plugin-injected hooks are invisible to this tool
- Not a real-time observer — output reflects settings files at capture time, not current runtime state
- Not an event logger — no timestamps on hook firing, no execution sequence, no causality chain

## Anti-thesis (6 statements)

1. Must never frame settings snapshots as runtime traces — "hooks configured" is not "hooks that fired"
2. Must never let empty output imply "no hooks active" — plugin hooks are invisible, and empty settings hooks does not mean nothing fires
3. Must never present diagnostics as proven runtime behavior — pattern-matching against known bugs is not observing the bugs happening
4. Must never let stale reports read as current — if settings changed since capture, the report is outdated
5. Must never imply completeness when plugin hooks are structurally invisible — the tool sees user-configured hooks only
6. Must never let "0 diagnostics" read as "all clear" — absence of detected patterns is not proof of correct behavior

## Highest-risk seam

**Observability/trace truth** — the boundary between what the tool claims to show (settings-based configuration diagnostics) and what users might expect ("which hooks are active and working"). The liar-paths are: settings snapshot reading as runtime trace, empty hooks implying nothing fires, diagnostics implying runtime proof, and plugin hooks being structurally invisible.
