---
title: Adaptive Learning
description: How the rating system, weakness tracking, trend analysis, and fatigue detection adapt to your skill level.
sidebar:
  order: 2
---

Linux Dev Typer learns how you type and adjusts every session accordingly. Four engines work together: rating, mistake tracking, trend analysis, and fatigue detection.

## Elo-inspired rating system

Every language you practice gets its own independent rating, starting at 1200. After each session, the `RatingEngine` computes a new rating using a formula inspired by Elo chess ratings.

**How it works:**

1. The snippet's difficulty (D1 through D7) maps to an "opponent rating" using the formula: `base + (difficulty x scale)`. With defaults, D1 maps to 600 and D7 maps to 1800.
2. Your expected score uses the standard Elo formula: `E = 1 / (1 + 10^((opponent - player) / 400))`.
3. Your actual score blends accuracy (70% weight) and WPM (30% weight).
4. The rating shift is `K x (actual - expected)`, where K defaults to 32.

Ratings never drop below 100. All constants are tunable via practice profiles.

### Anti-yo-yo protection

The `DifficultyMemory` tracks your recent performance at each difficulty level per language. When it detects rapid alternation between difficulty bands with large accuracy swings (default: 20% within a 6-session window), it activates a **yo-yo lock** that holds you at your comfort zone for 3 sessions. This prevents frustrating oscillation between "too easy" and "too hard."

You can manually dismiss the yo-yo lock if you want to push through.

### Comfort-zone detection

A comfort zone is established when you average above the comfort accuracy threshold (default: 85%) across at least 3 sessions at a given difficulty. The engine then uses this as the anchor for the session planner's Target/Review/Stretch mix.

### Difficulty aging

Records older than 30 days are automatically pruned from difficulty memory. After a long absence, your comfort zone softens naturally rather than locking you into stale performance data.

## Per-character mistake tracking

Every mistyped character is recorded and classified into one of 10 symbol categories:

| Category | Characters |
|----------|-----------|
| Curly braces | `{ }` |
| Parentheses | `( )` |
| Square brackets | `[ ]` |
| Angle brackets | `< >` |
| Quotes | `" ' \`` |
| Operators | `= + - * / % ! & \| ^ ~` |
| Punctuation | `. , ; : ? @ # $ \ _` |
| Whitespace | space, tab, newline |
| Alphanumeric | letters and digits |
| Other | everything else |

### Mistake heatmap

The `MistakeHeatmap` in persisted state tracks per-character hit/miss counts at a finer granularity than category-level aggregation. This powers the confusion-pair detection: when you consistently type `{` instead of `[`, the engine knows exactly which pair is tripping you up.

### Rolling weakness window

The `WeaknessWindow` applies time-based decay to mistake data. Recent mistakes weigh more than older ones, so weaknesses you have since overcome naturally fade from the selection boost. No manual "I fixed it" action is needed.

### Weakness snapshots

The engine captures at most one weakness snapshot per day per language, stored for up to 90 days. This provides a historical view of how your weakness profile changes over time.

## Trend tracking

The `TrendEngine` computes rolling WPM and accuracy trends per language using a sliding-window approach:

1. Take the most recent N sessions (default window: 10).
2. Compare against the previous N sessions.
3. Classify each metric as **Improving**, **Stable**, **Declining**, or **Plateau**.

Trends require at least 5 sessions before reporting anything other than Stable (noise filter). Declining trends require 3 consecutive drops to avoid false alarms from a single bad session.

**Plateau detection** upgrades a Stable trend to Plateau when the last 10+ results show very low variance (standard deviation below threshold). Plateau means consistency, not stagnation.

## Fatigue detection

The `FatigueDetector` monitors your current "sitting" — a group of sessions with no gap longer than 30 minutes.

A break suggestion triggers when either condition is met:
- You have completed 5 or more sessions in the sitting (default).
- Your recent accuracy has dropped 3% or more below your peak accuracy from the first half of the sitting.

The suggestion is a single, non-judgmental message. No escalation levels, no forced breaks. All thresholds are tunable via practice profiles.

## Post-session insights

The `InsightEngine` generates up to 2 short insights after each session, prioritized by relevance:

1. **Personal best** — new WPM record for the language.
2. **Accuracy milestones** — 100%, 98%+, or first time hitting 95%+.
3. **Improving trend** — WPM trending upward over recent sessions.
4. **Declining trend** — accuracy has shifted (gated by a user preference).
5. **Plateau reassurance** — consistent performance over 15+ sessions.
6. **Comfort zone nudge** — you are strong at your current difficulty and might be ready to advance.
7. **Repeat mastery** — you have repeated a snippet enough times to move on.
8. **Intent-aware** — contextual feedback based on your chosen practice intent.
9. **First session** — welcome message with starting rating.
10. **Sloppy run** — XP reduction notice below 70% accuracy.

Insights are dismissible by type. The tone is always encouraging and informational, never pushy.
