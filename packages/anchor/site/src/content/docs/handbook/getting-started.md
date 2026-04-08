---
title: Getting Started
description: Install Anchor and run your first project in minutes.
sidebar:
  order: 1
---

## Prerequisites

Anchor is a Tauri 2 desktop application with a Rust backend and React frontend. You need:

- **Rust** (stable) — install via [rustup](https://rustup.rs/)
- **Node.js** v18 or later — download from [nodejs.org](https://nodejs.org/)
- **Tauri 2 system dependencies** — platform-specific build tools documented at [v2.tauri.app/start/prerequisites](https://v2.tauri.app/start/prerequisites/)

On Linux, this typically means `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, and `patchelf`. On macOS and Windows, Xcode Command Line Tools or Visual Studio Build Tools respectively.

## Installation

```bash
git clone https://github.com/mcp-tool-shop-org/anchor.git
cd anchor
npm install
```

## Development Mode

```bash
npm run tauri dev
```

The app opens with a demo project (**Forge Quest**) pre-loaded. This demo has artifacts in mixed states — the readiness gate is blocked, so you immediately see the "why blocked?" experience with concrete blocking reasons and remediation steps.

## Exploring Demo Scenarios

Anchor ships with four pre-built scenarios. Use the **Scenario Switcher** view or the **Ctrl+K** command palette to switch between them:

| Scenario | What It Shows |
|----------|---------------|
| **Forge Quest** | Mixed states — gate blocked by draft and unapproved artifacts |
| **Crystal Sanctum** | Healthy project — all approved, full traceability, gate ready |
| **Shadow Protocol** | Broken traceability — missing links, orphan artifacts, active drift alarms |
| **Ember Saga** | Post-amendment fallout — constitution changed, 7 artifacts stale |

## Running Tests

```bash
cd src-tauri
cargo test
```

This runs 166 tests across 21 modules covering the entire law engine: state machine transitions, traceability validation, drift detection, stale propagation, gate evaluation, export compilation, recovery actions, and persistence round-trips.

## Type Checking the Frontend

```bash
npx tsc --noEmit
```

## Production Build

```bash
npm run tauri build
```

This produces a native desktop installer for your platform.
