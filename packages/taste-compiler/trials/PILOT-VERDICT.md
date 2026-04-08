# Taste Compiler — Pilot Verdict (Phase 2 + Phase 3 Complete)

**Date:** 2026-04-02
**Pilot scope:** 3 repos, 7 paired trials (Phase 2: 3, Phase 3: 4)
**Result:** Qualified pass → Strong qualified pass → **All 6 artifact classes live-proven**

---

## Promoted Truths

These findings are now proven by the pilot and should be treated as load-bearing facts for Phase 3 planning.

### PT-1: The pack changes what gets built, not just how violations are reported

The constrained runs produced structurally different solutions:

| Repo | Baseline shape | Constrained shape |
|------|---------------|-------------------|
| GlyphStudio | Dashboard + export launcher (2 actions, stat grid) | Read-only review surface (0 actions) |
| CommandUI | Guidance + acknowledge button (dual confirm) | Informational advisory (0 new actions) |
| World Forge | Full editing surface (5 mutations, stat row) | Read-only context inspector (0 mutations) |

This is not lint behavior. The pack steers product decisions.

### PT-2: Token bypass is the highest-volume early violation class

96 of 103 baseline violations were raw color literals. The CSS-var adapter is the workhorse checker.

Architecture vulnerability amplifies this: inline-style codebases (World Forge: 81 violations) drift ~10× harder than CSS-file codebases (CommandUI: 6, GlyphStudio: 9).

### PT-3: Forbidden patterns and budgets are the highest-value early violation class

Token checks generate volume. Forbidden patterns and budgets generate the catches that matter most:

- Dashboard creep prevented (GlyphStudio, World Forge)
- Action-budget breaches prevented (all 3)
- Competing editing surfaces prevented (World Forge)
- Dual-confirmation gate prevented (CommandUI)
- styles.ts bypass prevented (World Forge)

### PT-4: Pack-guided generation outperforms unconstrained generation

The constrained workflow (pack summary + plan-first + diff-first) produced zero violations across all 3 trials. The baseline workflow produced 103.

**Caveat:** The pilot tested a bundle (pack + plan-first + diff-first), not the pack in isolation. What is proven: the workflow works. Isolating the pack's individual contribution is a Phase 3 question, not a Phase 2 requirement.

### PT-5: Product identity preservation is real and measurable

The pack preserved:
- GlyphStudio's canvas-first, deterministic-editing identity (no dashboard, no export buttons)
- CommandUI's shell-first, terminal-central identity (no second confirmation, no new chrome)
- World Forge's spatial-first, canvas-serving identity (no editing in inspector, no stat tiles)

This is the core product proof.

---

## Open Hypotheses

These are not disproven — they are untested or insufficiently stressed by the current pilot set.

### OH-1: Copy rules deliver value (H3 — still open)

Copy violations were essentially absent in both baseline and constrained runs. The pilot tasks did not stress copy-sensitive surfaces (onboarding, error messages, empty states with personality). Needs tasks that tempt:
- Autonomy overclaiming ("I will...", "I've fixed...")
- Assistant persona in non-chat contexts
- Hedging language in deterministic outputs

### ~~OH-2: Interaction laws have measurable standalone value (H3 — still open)~~ RESOLVED

**Phase 3 result:** CommandUI interaction-law trial produced 4 law violations in baseline, 0 in constrained:
1. **LAW-001** — Clear All History + Delete Session: no confirmation dialog (2 destructive actions, zero guards)
2. **LAW-002** — Settings form submit always enabled, no validation on numeric/path fields
3. **LAW-003** — No explicit draft preservation or dirty tracking across tab switches
4. **LAW-004** — Empty history state with "No sessions" text and no CTA (user stranded)

**Critical finding:** Budget, forbidden patterns, copy, and goldens all scored 0–0 in both runs. The interaction-law violations were the *only* behavioral failures in the baseline. This is clean isolation — interaction laws catch a class of UX safety failure that no other rule class detects.

### OH-3: Goldens fire rarely but with high severity (H4 — ~~inconclusive~~ RESOLVED)

**Phase 3 result:** World Forge golden-stress trial produced 2 golden violations:
1. Validation-blocks-export bypass — export button always enabled, no validation gate
2. **Canvas-not-modified-by-export** — "Auto-Fix Drift" button calls `updateZone()`, mutating project state from the export preview surface

The silent mutation from an export-context component is the highest-severity finding across all 6 trials. Golden flows are a safety net with high value-per-trigger.

### OH-4: The pack's value is additive beyond plan-first discipline alone

The pilot bundled pack + plan-first + diff-first. An unconstrained run with plan-first (but no pack) might still produce better results than pure baseline. The question: how much of the 103→0 improvement is the pack vs the workflow? Not urgent — the bundle works — but relevant for product positioning.

---

## Checker Refinements

Concrete improvements to make before Phase 3 trials.

### CR-1: Inline-style scanner weight

The CSS-var adapter catches inline styles in TSX, but 81 violations in a single file is noisy. Consider:
- Grouping violations by declaration site (a `ROLE_COLORS` constant with 6 raw hex values = 1 finding, not 6)
- Reporting "violation density" (violations per 100 lines) alongside raw count
- Distinguishing constant-map violations (structural) from inline-prop violations (per-instance)

### CR-2: styles.ts bypass detection

World Forge's `fp-styles-ts-raw` forbidden pattern caught the styles.ts bypass, but only as a human judgment in the trial report. The checker should detect:
- Components in `packages/editor/src/panels/` that import zero primitives from `styles.ts`
- CSSProperties objects that redefine patterns already exported from `styles.ts` (e.g., panel backgrounds, section headers)

This is a World Forge-specific adapter, not a generic checker feature.

### CR-3: Action-budget counting

Budget breaches were scored by human judgment. The checker could partially automate this:
- Count `onClick` handlers that call store mutation methods (not navigation/selection)
- Compare to `maxPrimaryActionsPerScreen` budget
- Flag when count exceeds budget

Partial automation — human review still needed for mutation vs navigation distinction.

### CR-4: Forbidden-pattern detection hints

The compiler already generates detection hints from forbidden-pattern seeds. Verify these hints produce actionable grep-level checks:
- `fp-dashboard-metrics`: detect grid/flex containers with 3+ stat-like children
- `fp-styles-ts-raw`: detect missing styles.ts imports (see CR-2)
- `fp-chat-overlay`: detect chat-bubble CSS patterns
- `fp-dead-ai-button`: detect buttons with AI-action labels and no handler wiring

These are heuristic, not precise — false positives are acceptable if flagged as "review suggested."

---

## Next-Trial Task Shapes

Tasks designed to stress the open hypotheses and untested rule classes.

### Copy-stress tasks (OH-1)

| Repo | Task | What to catch |
|------|------|--------------|
| CommandUI | Add error recovery surface for failed commands | Autonomy overclaiming ("I'll retry..."), assistant persona, hedging |
| GlyphStudio | Add onboarding tooltip sequence for new users | Chatbot framing, personality injection, feature overclaiming |

### Interaction-law tasks (OH-2)

| Repo | Task | What to catch |
|------|------|--------------|
| World Forge | Add zone template quick-apply (creative mode operation) | Settings-panel clutter leaking into creative flow, mode confusion |
| GlyphStudio | Add animation preview with edit controls | Preview/commit blur, mutation during preview |

### Golden-stress tasks (OH-3)

| Repo | Task | What to catch |
|------|------|--------------|
| World Forge | Add export preview diff (show what engine will receive) | Export-truth divergence, data loss in conversion |
| CommandUI | Add command history with re-execute | Semantic/direct-mode blur, terminal demotion |

### Architecture-vulnerability tasks

| Repo | Task | Why |
|------|------|-----|
| World Forge (inline styles) | Any new panel | Confirms inline-styles vulnerability is systematic, not task-specific |
| CommandUI (CSS files) | Any new panel | Confirms CSS-file architecture is naturally more resistant |

---

## Phase 3 Entry Criteria

~~Phase 2 is complete. Phase 3 (broader trial matrix) should begin when:~~

~~1. **CR-1 shipped** — inline-style scanner grouping~~
~~2. **At least 2 copy-stress tasks run** — to resolve OH-1~~
~~3. **At least 1 golden-stress task run** — to resolve OH-3~~
~~4. **Taste Compiler v0.2.0 tagged**~~

**All 4 criteria met.** Phase 3 is complete. All open hypotheses resolved. OH-2 closed by CommandUI interaction-law trial (Trial 7).

---

## Phase 3 Results (2026-04-02)

4 additional targeted trials resolving all open hypotheses:

| Trial | Focus | Baseline | Constrained | Key Finding |
|-------|-------|----------|-------------|-------------|
| CommandUI — Recovery | Copy-stress | 56 (12 copy + 42 token + 1 FP + 1 budget) | 0 | Shell-tool copy: autonomy overclaiming, assistant persona |
| GlyphStudio — Onboarding | Copy-stress | 31 (12 copy + 18 token + 1 budget) | 0 | Creative-tool copy: marketing voice, personality injection |
| World Forge — Export Diff | Golden-stress | 44 (2 golden + 40 token + 2 FP) | 0 | First golden fire: silent mutation from read-only surface |
| **CommandUI — Session History** | **Interaction-law** | **11 (4 LAW + 7 token)** | **0** | **All 4 default laws violated; law-only behavioral catch** |

### Hypotheses now resolved

| Hypothesis | Status | Evidence |
|------------|--------|----------|
| H1 — Pack improves diffs | **Strongly supported** | 234→0 across 6 trials |
| H2 — FP + budgets strongest early | **Supported** | Highest value, not highest volume |
| H3 — Copy > interaction laws early | **Supported** | Copy proven early; interaction laws proven in dedicated trial (OH-2 resolved) |
| H4 — Goldens rare but severe | **Confirmed** | 2 golden violations in 1/6 trials, highest severity |
| H5 — Generation > post-hoc | **Strongly supported** | All constrained runs zero violations |

### Still open

- **OH-4** — Pack vs workflow isolation: still tested as bundle, not individually.

---

## Summary

| Question | Answer |
|----------|--------|
| Does the pack improve AI output? | **Yes** — 245 → 0 violations across 7 trials |
| Is it just cosmetic? | **No** — prevents dashboard creep, action-budget breaches, competing surfaces, persona drift, silent mutations, unconfirmed destructive actions, dead-end empty states |
| Which rule classes are proven? | **All 6: tokens, forbidden patterns, budgets, copy, goldens, interaction laws** |
| Which are still open? | **None.** OH-4 (pack vs workflow isolation) is a positioning question, not a rule-class gap. |
| Is the checker sufficient? | For tokens and interaction laws, yes. Copy and goldens need checker automation (CR-5, CR-6). |
| What is the biggest remaining risk? | Pack vs workflow isolation (OH-4) — unclear how much value comes from the pack alone vs the plan-first discipline. |
| Is Phase 3 done? | **Yes.** All 6 artifact classes live-proven. 7 paired trials, 245 baseline violations → 0 constrained. |
