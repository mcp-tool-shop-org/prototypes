# Product Brief — dogfood-labs

## What this is

Org evidence store for dogfood verification. Source repos dispatch structured submissions after exercising their tools; dogfood-labs ingests, verifies, persists, and indexes these records. Consumers (shipcheck Gate F, repo-knowledge, portfolio) read indexes to determine which repos have valid, current dogfood evidence.

## Type

Data repo (records in git) + verification tooling (Node.js CLI for ingest, verify, portfolio)

## Core value

Structured evidence that tools were actually exercised in a dogfood-worthy way. Schema-validated, policy-evaluated, verdict-computed records with per-repo per-surface indexes for fast consumer lookup.

## What it is not

- Not an auditor — stores and verifies evidence, does not perform dogfood runs
- Not a CI gate itself — provides evidence that shipcheck Gate F consumes
- Not real-time — records enter via dispatch, not streaming
- Not provenance-verified in production (currently) — stub provenance is the default

## Anti-thesis (7 statements)

1. Must never let unverified provenance pass as confirmed — the system must actually check that claimed GitHub runs exist
2. Must never let stale evidence read as current without explicit freshness signaling
3. Must never let policy-invalid records be consumable alongside valid records
4. Must never let rejected records be invisible to the org — rejection must be surfaced, not hidden
5. Must never let the index claim completeness when it only includes accepted records
6. Must never mint "verified: pass" verdicts on evidence whose source was never provenance-checked
7. Must never let manual portfolio generation be the only way to detect staleness

## Highest-risk seam

**Evidence/provenance truth** — the boundary where the system claims a record is verified, current, and policy-valid. The liar-paths are: stub provenance (never checked in production), stale records with no automation to detect them, policy-invalid records persisted to git, and rejected records invisible to consumers.
