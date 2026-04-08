---
title: Civility Kernel Handbook
description: Complete guide to building preference-governed agent behavior with Civility Kernel.
sidebar:
  order: 0
---

Welcome to the Civility Kernel handbook. This guide covers everything you need to build agents that respect human preferences, enforce hard constraints, and never silently change their own policies.

## What is Civility Kernel?

Civility Kernel is a policy layer that makes agent behavior **preference-governed** instead of purely efficiency-maximizing. It sits between your agent's plan generation and plan execution, filtering candidates through hard constraints, scoring survivors by weighted preferences, and escalating to the human when uncertainty is too high.

The core pipeline:

```
generate -> filter (hard constraints) -> score (weights) -> choose OR ask
```

Hard constraints are non-negotiable. Soft preferences guide tradeoffs. Uncertainty forces "ask the human."

## What it does

Civility Kernel provides four operations, each designed to be deterministic and auditable:

1. **Lint** -- Catch broken or unsafe policy configurations before they ship. Validates constraint registrations, parameter schemas, weight sanity, and threshold bounds.

2. **Canonicalize** -- Normalize policies so equivalent inputs produce identical output. Fills Zod-validated defaults, sorts keys deterministically, and deduplicates constraints.

3. **Diff + Approve** -- Generate human-readable change summaries between two policy versions. Supports short (headline) and full (field-level) diff modes. Nothing applies without explicit consent.

4. **Rollback** -- Automatically back up the previous policy before any overwrite. One flag to restore it.

## Design principles

- **Fail closed:** Unknown constraints block the plan rather than silently allowing it.
- **Deterministic:** Same input always produces the same output. No randomness in policy evaluation.
- **No side effects:** The library makes zero network requests, collects no telemetry, and stores no credentials.
- **Human in the loop:** The governance loop (preview, propose, approve, apply) ensures no policy changes without explicit human consent.

## Handbook contents

| Page | Description |
|------|-------------|
| [Getting Started](/civility-kernel/handbook/getting-started/) | Installation, quick start, and CLI commands |
| [Policy Files](/civility-kernel/handbook/policy-files/) | Policy file format, constraints, weights, context rules, and calibration |
| [API Reference](/civility-kernel/handbook/api/) | Programmatic usage of all public functions and classes |
| [CLI & Security Reference](/civility-kernel/handbook/reference/) | Complete CLI reference, exit codes, and security model |
| [Beginners Guide](/civility-kernel/handbook/beginners/) | New to agent governance? Start here for concepts, walkthrough, and FAQ |
