---
title: Artifact Classes
description: The 6 evaluator classes that catch different categories of AI-generated drift.
sidebar:
  order: 2
---

Each artifact class targets a different category of AI-generated drift. Together they cover the full surface area of product identity violations.

## Visual Tokens

**Rule IDs:** TOK-001 to TOK-003

Catches raw design token bypass — the highest-volume violation class across all trials.

| Rule | What it catches |
|------|----------------|
| TOK-001 | Raw hex color literals instead of design tokens |
| TOK-002 | Off-scale spacing values (not multiples of your spacing unit) |
| TOK-003 | Unauthorized typography (font families, sizes, weights not in your token set) |

**Trial finding:** 96+ raw color literals across baselines. Inline-style architectures are ~10x more vulnerable than CSS-file architectures.

## Component Grammar

**Rule IDs:** GRAM-001 to GRAM-006

Catches structural violations in component usage and composition.

| Rule | What it catches |
|------|----------------|
| GRAM-001 | Banned components used in generated code |
| GRAM-002 | Unknown component categories |
| GRAM-003–006 | Composition rule violations (nesting, ordering, slot misuse) |

## Interaction Laws

**Rule IDs:** LAW-001 to LAW-004

Catches behavioral failures that no other class detects. In the isolation trial (Trial 7), these were the only behavioral violations — budgets, forbidden patterns, copy, and goldens all scored 0–0.

| Rule | What it catches |
|------|----------------|
| LAW-001 | Destructive actions without confirmation dialog |
| LAW-002 | Form submit without validation gate |
| LAW-003 | Navigation that loses unsaved drafts |
| LAW-004 | Dead-end empty states with no primary action |

**Trial finding:** "Clear All History" button that deleted all sessions in one click with no confirmation. The constrained run added two-phase confirmation with cancel.

## Copy Rules

**Rule IDs:** COPY-001 to COPY-004

Catches language and tone violations that erode product voice.

| Rule | What it catches |
|------|----------------|
| COPY-001 | Banned phrases and terminology |
| COPY-002 | Tone drift (wrong register for the product context) |
| COPY-003 | Unqualified AI claims ("I'll retry...", autonomy overclaiming) |
| COPY-004 | Persona overreach (assistant persona in non-chat tools) |

**Trial finding:** Copy rules caught autonomy overclaiming, assistant persona in non-chat tools, and marketing voice in creative products.

## Complexity Budgets

**Rule IDs:** BUD-001 to BUD-004

Catches scope creep and interface complexity bloat.

| Rule | What it catches |
|------|----------------|
| BUD-001 | Too many navigation items |
| BUD-002 | Too many actions per screen |
| BUD-003 | Too many modal layers |
| BUD-004 | Too many interaction modes |

**Trial finding:** Budget breaches and dashboard creep were among the highest-value catches. AI-generated UIs consistently exceeded action budgets.

## Forbidden Patterns

**Rule IDs:** FP-001 to FP-003

Catches explicitly banned layouts, components, and architectural patterns.

| Rule | What it catches |
|------|----------------|
| FP-001 | Banned layout patterns (e.g., dashboard metrics in a creative tool) |
| FP-002 | Banned component imports |
| FP-003 | Competing surfaces (multiple editing contexts) |

**Trial finding:** Dashboard creep in a creative tool — baseline produced a stat grid with export launcher (2 primary actions). Constrained run produced a read-only review surface with 0 actions.

## Golden Flows

In addition to the 6 rule-based classes, golden flow contracts protect critical user paths from silent regression.

**Trial finding:** A read-only export surface that mutated project state was the highest-severity finding across all trials. The golden flow invariant `canvas-not-modified-by-export` caught it. No other rule class would have.
