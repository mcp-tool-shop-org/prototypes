# claude-hook-debug — Repo-Local Decisions

## 2026-03-24 — This is a settings validator, not a hook tracer

**Decision:** The tool reads static settings files and pattern-matches known bugs. It does not observe, intercept, or prove runtime hook behavior. All language and output must maintain this distinction.

**Why:** The name "hook-debug" could imply runtime observation. The tool's actual scope is settings inspection. This must be explicitly maintained in docs, output format, and any future feature additions.

**Applies to:** README, CLI help text, report output, any future feature proposals.

---

## 2026-03-24 — PLUGIN_HOOKS_INVISIBLE diagnostic must never be removed

**Decision:** The diagnostic that admits "plugin hooks are invisible to settings inspection" is the tool's most important truth signal. Removing it would hide the structural limitation.

**Why:** Plugin hooks are injected at runtime from manifests, not stored in settings files. Without this diagnostic, a user could assume the tool shows all active hooks.

**Applies to:** diagnostics.ts, any refactoring of diagnostic rules.
