---
title: Registrum Handbook
description: Complete guide to the Registrum structural registrar — deterministic state transitions, dual-witness validation, and replayable history.
sidebar:
  order: 0
---

Welcome to the Registrum Handbook. This guide covers everything you need to understand, install, and use Registrum in your projects.

## What you will find here

Registrum is a **structural registrar** — a library that records, validates, and orders state transitions under explicit constraints. It ensures that as systems evolve and entropy accumulates, structure remains interpretable and change stays legible.

This handbook is organized into the following sections:

### [Getting Started](/Registrum/handbook/getting-started/)

Install Registrum, register your first state transition, and understand the two operating modes (legacy and registry). Includes working code examples you can run immediately.

### [Concepts](/Registrum/handbook/concepts/)

The design philosophy behind Registrum: why constraints beat intelligence, what "fail-closed" means in practice, and the core principle that entropy is allowed but illegibility is not.

### [How It Works](/Registrum/handbook/how-it-works/)

A deep dive into the dual-witness architecture. Learn how the Registry (compiled RPEG v1 DSL) and Legacy (TypeScript predicates) engines independently validate every transition, and why both must agree.

### [Governance](/Registrum/handbook/governance/)

Registrum operates under a constitutional governance model. Understand how the 11 structural invariants are protected, how changes are proposed, and why behavioral guarantees take precedence over feature velocity.

### [Attestation](/Registrum/handbook/attestation/)

Optional external witnessing via XRPL. Learn how Registrum can emit cryptographic attestations to an immutable ledger without affecting its internal authority or behavior.

### [Reference](/Registrum/handbook/reference/)

Complete API reference for the `StructuralRegistrar` class, all exported types, invariant lookup utilities, and the snapshot/replay persistence layer.

### [Beginner's Guide](/Registrum/handbook/beginners/)

New to Registrum? Start here. A step-by-step introduction covering what problem Registrum solves, key terminology, installation, your first registration walkthrough, common patterns, and frequently asked questions.

## Quick orientation

| Property | What it means |
|----------|---------------|
| **Structural** | Operates on form, not meaning |
| **Deterministic** | Same inputs produce the same outputs, always |
| **Fail-closed** | Invalid input causes hard failure, not partial recovery |
| **Replayable** | Historical decisions can be re-executed with identical results |
| **Non-agentic** | Never acts, decides, or optimizes |

## Project status

Registrum has reached a stable end-state. All phases (A through H) are complete, with 282 tests passing across 15 test suites. Development has transitioned from active building to stewardship. All future changes require formal governance.
