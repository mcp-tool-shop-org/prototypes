---
title: History & Compare
description: "Phase 2 features: audit history, auto-save, artifact sets, side-by-side comparison, feature trends, and executive narrative."
sidebar:
  order: 3
---

Phase 2 adds persistence and comparison — turning one-off audits into an ongoing adoption risk practice.

## Audit history

All audits are stored in **IndexedDB** in the browser. No server, no cloud sync. Your audit history stays on your machine.

- Browse past audits at `/history`
- Each entry shows the date, artifact name, feature count, and top risk
- Click any audit to view the full ranked report

## Auto-save toggle

By default, every completed audit is saved automatically. Toggle auto-save off in settings if you prefer manual control — useful when running quick exploratory audits you don't need to keep.

## Artifact sets

Group related artifacts into named **Artifact Sets** for repeatable audit workflows:

- "Q1 Release Notes" — all release notes from the quarter
- "Onboarding Docs" — the docs a new user encounters first
- "API Reference" — the full API surface

Run an audit against any saved set with one click. The set definition is saved, so you can re-audit as docs evolve.

## Audit compare

Select any two audits and view a **side-by-side diff**:

- **New risks** — features flagged in the newer audit but not the older one
- **Resolved** — features that were flagged before but no longer appear
- **Diagnosis changes** — features where the diagnosis type shifted (e.g., Buried to Undocumented)
- **Score delta** — risk score changes per feature

This is the core feedback loop: ship docs improvements, re-audit, and see the diff.

## Feature trends

The `/trends` view shows **sparkline risk trajectories** for individual features across multiple audits:

- Is a feature's risk score trending down after doc improvements?
- Is a newly shipped feature accumulating risk as it ages?
- Which features have been consistently high-risk across audits?

## Executive narrative

For stakeholder communication, the compare view generates an **executive narrative** — a short, plain-language summary of what changed between two audits:

> "12 features audited. 3 new risks identified (2 Buried, 1 Undocumented). 2 previously flagged features resolved. Overall risk trending down."

Export as plain text for Slack, or printable HTML for reports.
