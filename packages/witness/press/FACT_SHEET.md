# Witness — Fact Sheet

**Name:** Witness
**Category:** Local-first verification / event journal / integrity tooling
**Tagline:** Record what happened. Verify it later.
**Repository:** https://github.com/mcp-tool-shop/witness

## One sentence

Witness is a local-first, append-only journal that records human-AI workflow events as cryptographically verifiable evidence.

## Problem

As AI usage grows, "what happened" becomes hard to prove. Logs can be edited, screenshots are theater, and trust doesn't scale.

## Solution

Witness records events with:

- Canonical JSON (deterministic bytes)
- SHA-256 digests for artifacts
- Ed25519 signatures for authenticity
- Append-only storage
- Offline verification

## Key Features (Phase 1)

- Signed event records: intent + action + input/output digests
- Rotation events for key lifecycle (continuity and recovery)
- Verification that separates:
  - cryptographic validity (per-event)
  - timeline/audit validity (flags)
- Golden fixtures to lock invariants and prevent drift

## Design principles

- Local-first, no cloud requirement
- Append-only (no mutation)
- Boring crypto (auditor-friendly)
- Human-readable artifacts

## Audience

- Developers shipping AI-assisted systems
- Researchers needing experiment trails
- Teams needing audit-grade provenance without surveillance tooling
