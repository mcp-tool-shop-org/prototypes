---
title: For Beginners
description: New to Anchor? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Anchor is a desktop application that helps you design software projects without losing track of your original vision. When you plan a complex project in phases, each phase tends to drift slightly from the original idea. By the end, the project may look organized but no longer does what it was supposed to do. Anchor prevents this by making you trace every decision back to your original product promise and blocking you from exporting your plan until everything is internally consistent.

Think of it as a strict editor for project design documents that refuses to let you ship incoherent plans.

## Who is this for?

Anchor is built for:

- **Software designers** planning complex products who need guarantees that their design stays coherent across multiple phases
- **Technical leads** who want to hand off a fully traceable, integrity-verified design package to an implementation team
- **Solo developers** building ambitious projects who want a disciplined framework to prevent scope drift and design rot
- **Game designers** planning multi-system games where feature interactions create hidden inconsistencies

Anchor is not a lightweight planning tool. It enforces strict ordering, mandatory traceability, and formal approval workflows. If you need a quick sketch pad, this is not the right tool.

## Prerequisites

Before installing Anchor, you need:

- **Rust** (stable toolchain) — install from [rustup.rs](https://rustup.rs/). Run `rustc --version` to verify.
- **Node.js** version 18 or later — download from [nodejs.org](https://nodejs.org/). Run `node --version` to verify.
- **Platform build tools** for Tauri 2:
  - **Windows:** Visual Studio Build Tools with the "Desktop development with C++" workload
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`

Full Tauri 2 prerequisites are documented at [v2.tauri.app/start/prerequisites](https://v2.tauri.app/start/prerequisites/).

## Your First 5 Minutes

1. **Clone and install:**
   ```bash
   git clone https://github.com/mcp-tool-shop-org/anchor.git
   cd anchor
   npm install
   ```

2. **Start the app:**
   ```bash
   npm run tauri dev
   ```
   The app opens with the **Forge Quest** demo project — a crafting RPG with artifacts in mixed states.

3. **Explore the blocked gate:** The left sidebar shows the artifact list. Click on the **Readiness Gate** view to see why export is blocked. Each blocking reason explains the rule and what to fix.

4. **Try the command palette:** Press **Ctrl+K** to open the command palette. Type "scenario" to switch to **Crystal Sanctum** — a healthy project where the gate is green and export is available.

5. **Inspect an artifact:** Click any artifact in the sidebar to see its state, trace links, active alarms, and legal state transitions. Try transitioning a Draft artifact to Complete and watch how validation layers respond.

## Common Mistakes

**Trying to skip ahead.** Anchor enforces strict artifact ordering. You cannot work on the Feature Map before the Constitution and User Fantasy are approved. If something is greyed out, check which upstream artifacts still need work.

**Ignoring stale propagation.** When you change an upstream artifact, everything downstream becomes Stale. Do not try to re-approve downstream artifacts without first editing them to reflect the upstream change. The gate will catch this, but it is faster to reconcile in order.

**Expecting the gate to be lenient.** The readiness gate runs six blocking checks and all must pass. A single missing trace link, one stale artifact, or an incomplete amendment will block export. Check the gate evaluation view for the complete list of blockers.

**Confusing "Complete" with "Approved".** An artifact in the Complete state has its fields filled, but it has not been validated relationally or reviewed for intent alignment. You must advance through Valid and then Approved. There is no shortcut from Complete to Approved — that transition is explicitly forbidden.

**Forgetting trace links.** Every artifact must answer "what justifies this?" with at least one upstream link. The traceability view highlights missing links and offers one-click authoring to fix them.

## Next Steps

- [Getting Started](/anchor/handbook/getting-started/) — detailed installation and first-run walkthrough
- [Architecture](/anchor/handbook/architecture/) — understand the artifact spine, state machine, and law engine
- [Drift & Recovery](/anchor/handbook/drift-recovery/) — how drift detection, stale propagation, and recovery work
- [Reference](/anchor/handbook/reference/) — complete list of artifact types, states, commands, and link types

## Glossary

| Term | Definition |
|------|-----------|
| **Artifact** | One of nine design documents in the project spine, each with a specific type and strict ordering |
| **Constitution** | The first and most important artifact — defines the product promise, user fantasy, anti-goals, quality bar, and failure condition |
| **Trace Link** | A typed connection between two artifacts that records their relationship (Justifies, DerivesFrom, Implements, etc.) |
| **Drift Alarm** | An automated alert raised when an artifact violates a rule — categories include traceability, constitution, sequence, quality, and scope drift |
| **Stale** | An artifact state indicating that an upstream dependency changed and the artifact needs reconciliation |
| **Readiness Gate** | A computed (not authored) evaluation of six blocking checks that must all pass before export is allowed |
| **Recovery Action** | A prioritized recommendation from the recovery engine telling you what to do next, with rule clause references |
| **Amendment** | A formal change to the constitution that follows a five-state lifecycle and triggers downstream reconciliation |
| **Export Package** | A 14-file output bundle including all artifacts, traceability reports, audit log, and integrity attestation |
| **Law Engine** | The Rust backend (12,400 lines, 21 modules) that is the final authority on all validation, state transitions, and readiness computation |
