---
title: Anchor Handbook
description: Complete guide to the drift-prevention engine for serious creative software design.
sidebar:
  order: 0
---

Anchor is a local-first Tauri 2 desktop application that enforces constitution-first, fully traceable project design. It prevents the classic failure mode where progress looks organized but no longer does what it was born to do.

## The Problem Anchor Solves

Phase-by-phase development has a hidden failure mode: each checkpoint becomes a tiny regime change. The original product thesis gets nibbled to death by "reasonable" adjustments. Completing steps in ways that no longer agree with each other is the sneakier failure.

Anchor enforces **coherence**, not just completion.

## How It Works

Every project flows through exactly **nine artifacts**, worked in strict order — from Constitution (the product promise) through Execution Readiness Gate (the computed final judge). No artifact can skip ahead. No export happens until the gate clears.

The Rust backend is the final authority. The React frontend renders what the engine decides — it never computes readiness, invents transitions, or skips checks.

## Core Principles

- **Constitution-first** — every decision traces back to the original product promise
- **Bidirectional traceability** — every node answers "what justifies this?" and "what depends on this?"
- **Stale propagation** — upstream changes automatically invalidate downstream artifacts
- **Explainable blocking** — the gate never says "blocked" without telling you exactly why and what to do
- **Local-first** — no cloud dependency, no network required, local JSON storage with integrity hashing

## What's in This Handbook

- [Getting Started](/anchor/handbook/getting-started/) — prerequisites, installation, first run
- [Architecture](/anchor/handbook/architecture/) — the artifact spine, state machine, and law engine
- [Drift & Recovery](/anchor/handbook/drift-recovery/) — drift alarms, stale propagation, and the recovery engine
- [Reference](/anchor/handbook/reference/) — all commands, artifact types, states, and link types
- [For Beginners](/anchor/handbook/beginners/) — plain-English introduction for newcomers
