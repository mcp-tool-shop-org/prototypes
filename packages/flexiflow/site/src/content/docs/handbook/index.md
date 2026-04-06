---
title: FlexiFlow Handbook
description: The complete guide to FlexiFlow — a lightweight async component engine with events, state machines, and a minimal CLI.
sidebar:
  order: 0
---

Welcome to the **FlexiFlow Handbook**. This is the authoritative reference for everything FlexiFlow — from installation to production persistence.

## Why FlexiFlow?

Most workflow engines are heavyweight, opinionated, and assume you want a DAG runner. FlexiFlow is none of those things.

FlexiFlow gives you async components with declarative rules, an event bus with priority and delivery modes, state machines with built-in and custom states, structured logging with correlation IDs, and persistence with snapshot history — all in **under 2,000 lines of pure Python**. No heavy dependencies. No magic.

## What's in this handbook

- **[Getting Started](getting-started/)** — Install, configure, and run your first component via CLI or embedded Python.
- **[Event Bus](event-bus/)** — Priority subscriptions, delivery modes, error policies, observability events, and retry.
- **[State Machines](state-machines/)** — Built-in message types, custom states, YAML state packs, and config introspection.
- **[Reference](reference/)** — Persistence backends, error handling hierarchy, structured logging, and security scope.

## Design principles

1. **Lightweight** — Under 2,000 lines. No framework lock-in.
2. **Async-native** — Built on `asyncio` from the ground up.
3. **Declarative** — Define rules and states in config, not code.
4. **Observable** — Every state change and message is an event you can subscribe to.
5. **Local-first** — No cloud sync, no telemetry, no network calls.
