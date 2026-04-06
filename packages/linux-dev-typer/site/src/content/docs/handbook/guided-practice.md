---
title: Guided Practice
description: Session planner, guided mode, micro-drills, selection transparency, and plateau detection.
sidebar:
  order: 4
---

Linux Dev Typer offers an opt-in guided practice system that uses your weakness data to shape snippet selection. Everything in this section is optional. The default experience works without it.

## Session planner

The `SessionPlanner` controls the difficulty mix for each session using a **Target 50% / Review 30% / Stretch 20%** distribution:

| Category | Weight | Description |
|----------|--------|-------------|
| **Target** | 50% | At or near your comfort zone — your working level. |
| **Review** | 30% | One band below comfort — reinforcing mastery of familiar patterns. |
| **Stretch** | 20% | One band above comfort — a gentle push toward growth. |

When no comfort zone is established yet, all selections are Target (rating-based). The planner delegates actual snippet picking to `SnippetSelector` after determining the target difficulty band.

### Manual difficulty lock

You can override the planner by locking to a specific difficulty (D1-D7). When locked, the planner bypasses the mix distribution and always selects from your chosen band.

### Yo-yo stabilization

When the engine detects yo-yo patterns (rapid alternation between difficulty levels with large accuracy swings), the planner locks to your comfort zone until the pattern breaks. The lock lasts 3 sessions and can be manually dismissed.

## Guided mode

Guided mode is an opt-in toggle controlled by the `SignalPolicy` feature flags:

| Flag | Default | Effect |
|------|---------|--------|
| `GuidedMode` | off | Master switch. When off, all signal-based behavior is disabled. |
| `SignalsAffectSelection` | off | When on (and GuidedMode is on), snippet selection prefers snippets matching your weakness categories. |
| `SignalsAffectDifficulty` | off | Reserved for future use. |
| `SignalsAffectXP` | off | Reserved for future use. |

When guided mode is enabled, the `WeaknessDetector` provides recency-aware weak symbol categories to the `SnippetSelector`. The selector applies a **WeaknessBias** boost (+0 to +3) to snippets that contain your weak symbols. This boost influences which snippet is chosen within the selected difficulty band but never changes the difficulty band itself.

The bias is purely about selection order, not scoring. Your XP, rating, and difficulty progression are unaffected.

## Micro-drills

Micro-drills are 5-item focused practice sessions that target your top weakness category. Instead of the normal mix distribution, every snippet in a micro-drill is selected to exercise the symbol category where you make the most mistakes.

Micro-drills are a quick way to hammer a specific weakness without committing to a full session.

## Selection transparency

Every snippet selection comes with a human-readable explanation via the `ExplanationBuilder`:

- **"Practicing at D4"** — standard target selection.
- **"Reinforcing D3 mastery"** — review category, building confidence.
- **"Stretching to D5"** — stretch category, pushing growth.
- **"Stabilizing at D4 (yo-yo detected)"** — yo-yo lock is active.
- **"Manual lock at D3"** — user overrode the planner.

When weakness data is available, the reason is extended with context like **"targeting braces weakness"** so you always understand why the engine picked a specific snippet.

The `ReasonFormatter` produces these explanations. They are display-only metadata attached to the `SessionPlan` and never affect engine behavior.

## Practice intent picker

Before starting a session, you can optionally declare your intent:

| Intent | Description |
|--------|-------------|
| **Warmup** | Getting warmed up before serious practice. |
| **Explore** | Exploring a new language or snippet type. |
| **Drill** | Deliberate repetition to build muscle memory. |
| **Challenge** | Pushing beyond your comfort zone intentionally. |

Intent is purely descriptive. It has zero impact on scoring, XP, or difficulty. The `InsightEngine` uses it to provide contextual feedback — for example, if you chose Challenge and accuracy dropped, the insight says "Challenge accepted" rather than flagging declining performance.

## Session notes and browser

Each session result includes metadata for browsing and filtering: language, difficulty, WPM, accuracy, XP earned, timestamp, repeat count, group ID, and practice intent. The session browser lets you review past performance and spot patterns.

## Plateau detection

The `TrendEngine` distinguishes between **Stable** (not enough signal to classify) and **Plateau** (consistent performance with very low variance). Plateau is detected when:

- The trend is currently Stable.
- At least 10 recent results exist.
- Standard deviation of the selected metric (WPM or accuracy) falls below the threshold.

Plateau is presented as a positive signal: consistency is mastery. The `InsightEngine` generates a reassurance message after 15+ sessions of plateau performance.

If you want to break out of a plateau, increase your difficulty manually or switch to a new language. The engine does not force advancement.
