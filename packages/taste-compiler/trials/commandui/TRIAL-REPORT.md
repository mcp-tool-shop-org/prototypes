# CommandUI Trial #1 — Command Guidance Surface

**Date:** 2026-04-02
**Task:** Add a command guidance surface for risky commands
**Type:** Paired trial (baseline vs constrained)

---

## Compiler-Side Scoring

### Token Bypass (TOK-001)

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations | **6 errors** | **0** |
| Files with violations | 1 (CSS) | 0 |

**Baseline violations (all in CommandGuidance.css):**

| Line | Value | Context |
|------|-------|---------|
| 57 | `#ffd488` | `.cmd-guidance--medium` border-left (amber) |
| 174 | `#ffd488` | `.cmd-guidance-flags li` color (amber) |
| 247 | `rgba(255, 180, 192, 0.04)` | `.cmd-guidance--high .cmd-guidance-header` background tint |
| 251 | `rgba(255, 180, 192, 0.08)` | `.cmd-guidance--high .cmd-guidance-header:hover` background tint |
| 255 | `rgba(255, 212, 136, 0.04)` | `.cmd-guidance--medium .cmd-guidance-header` background tint |
| 259 | `rgba(255, 212, 136, 0.08)` | `.cmd-guidance--medium .cmd-guidance-header:hover` background tint |

**Constrained approach:** Used `color-mix(in srgb, var(--failure) 8%, transparent)` and `color-mix(in srgb, var(--accent) 8%, transparent)` instead of raw rgba values. Genuine innovation under constraint.

### Forbidden Patterns

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Chat/assistant framing | **No** | **No** |
| Untiered risk | No | No |
| Chatbot-as-shell | No | No |

Both runs avoided the most severe forbidden patterns. The baseline did not introduce chat bubbles or assistant avatars for this task.

### Budget Breaches

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Primary actions per screen | **2** ("I have reviewed the risks" + existing PlanPanel confirm) | **0** new (existing PlanPanel confirm unchanged) |
| Max budget | 1 | 1 |
| Budget breached? | **Yes** — adds a second confirmation button | **No** — informational only |

### Copy/Language

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Autonomy overclaiming | None detected | None detected |
| Language tone | Neutral/technical | Uses "suggested", "proposed" per constraints |

### Golden Flows

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| "Semantic Command Review" golden | Intact | Intact |
| "Direct Command Input" golden | Intact | Intact |

---

## Human-Side Scoring

### Does the terminal stay central?

- **Baseline:** Yes. The guidance surface lives inside PlanPanel, which already occupies the right column. Terminal remains on the left. No new panels or chrome.
- **Constrained:** Yes. Same placement strategy — enriches PlanPanel inline.

### Is guidance adjacent, not primary?

- **Baseline:** Mostly. But it introduces its own "I have reviewed the risks" acknowledgement button, which creates a second confirmation gate alongside PlanPanel's existing confirm checkbox. This is a competing action — the user now has two things to click to approve a command.
- **Constrained:** Yes. No new actions. Guidance is purely informational. The existing PlanPanel confirmation flow is untouched.

### Is the actual command visible?

- **Baseline:** Yes. Command stays in PlanPanel's textarea.
- **Constrained:** Yes. Same — guidance sits alongside the command, never replaces it.

### Is risk visible before execution?

- **Baseline:** Yes. Risk tier badge + colored accent bar + affected systems shown in header.
- **Constrained:** Yes. Risk tier row with badge and plain-language explanation + impact area rows.

### Would a reviewer trust the constrained result more?

**Moderately yes.** The behavioral differences are subtler than GlyphStudio. Both runs produced competent, well-structured guidance surfaces. The constrained run's advantages:
- Zero token violations (6 vs 0)
- No second confirmation button (respects single-action budget)
- Separated classifier into its own file (`classifyGuidance.ts`) vs inline in component
- `color-mix()` technique for severity tints — cleaner than raw rgba values
- Explicit "Preview only" framing absent in baseline

---

## Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Files | 2 (component + CSS) | 3 (component + CSS + classifier) |
| Component lines | 495 | 323 |
| CSS lines | 260 | 214 |
| New state | `acknowledged` boolean + `collapsed` toggle | `expanded` toggle only |
| New actions | "I have reviewed the risks" button | None |
| Mutations | Calls `onAcknowledge()` callback | None (read-only) |
| Severity tint technique | Raw rgba values | `color-mix()` with CSS variables |

---

## Verdict

**The pack improved the output, but this was a lighter catch than GlyphStudio.**

The baseline run was already reasonably disciplined — no chat framing, no assistant persona, no terminal demotion. The task itself didn't tempt toward the most severe forbidden patterns. This is closer to H3's prediction: "interaction laws noisier at first" — the baseline wasn't catastrophically wrong, but it made smaller judgment calls that the pack corrected.

The meaningful catches were:
1. **Token bypass** — 6 raw color literals (rgba for header tints, raw hex for amber). Constrained used `color-mix()`.
2. **Budget breach** — Second confirmation button competing with PlanPanel's existing flow. Constrained stayed informational-only.
3. **Separation of concerns** — Constrained put the classifier in its own file, making the analysis logic independently testable.

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Token violations | 6 | 0 |
| Forbidden pattern hits | 0 | 0 |
| Budget breaches | 1 (dual confirm) | 0 |
| Golden failures | 0 | 0 |
| Copy violations | 0 | 0 |
| **Total violations** | **7** | **0** |

**Classification: Moderate catch.** The pack prevented token drift and an action-budget breach, but the baseline didn't exhibit the severe identity drift seen in the GlyphStudio trial. The task was less drift-inducing than expected — CommandUI's shell-first identity is harder to accidentally violate than GlyphStudio's canvas-first identity.
