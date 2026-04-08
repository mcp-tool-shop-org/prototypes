---
title: Feature-Reacher Handbook
description: Complete guide to Feature-Reacher — adoption risk auditing for product teams.
sidebar:
  order: 0
---

Welcome to the Feature-Reacher handbook. This is the reference for everything the tool does, how it works, and where it's headed.

## What Feature-Reacher is

Feature-Reacher is a **local-first web application** that audits your product documentation and release notes for adoption risk. It reads what you ship, identifies features users may never discover, and produces a ranked report with cited evidence and actionable recommendations.

- **Deterministic** — same input, same output, every time
- **Explainable** — every diagnosis traces back to an artifact passage
- **Local-first** — runs entirely in the browser, no server, no telemetry
- **Heuristic** — no ML, no LLM calls, no probabilistic models

## What Feature-Reacher is NOT

- Not a usage analytics tool (it reads docs, not user behavior)
- Not an AI/ML product (heuristics only, by design)
- Not a SaaS platform (local-first, no accounts, no server)
- Not a replacement for user research (it surfaces signals, you make decisions)

## Handbook contents

- [Getting Started](/feature-reacher/handbook/getting-started/) — Install, run, and complete your first audit
- [Audit Pipeline](/feature-reacher/handbook/audit-pipeline/) — The 6-step pipeline from raw text to ranked report
- [History & Compare](/feature-reacher/handbook/history-compare/) — Phase 2: saved audits, diffs, trends
- [Reference](/feature-reacher/handbook/reference/) — Architecture, diagnosis types, key files, roadmap
