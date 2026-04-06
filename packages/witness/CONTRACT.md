# Witness Phase 1 — Contract

This file tells you what is **law** vs **example**.

## Authoritative documents

| Document | Purpose |
|----------|---------|
| `IMPLEMENTATION_NOTES.md` | Locked invariants. Do not change without schema bump. |
| `VERIFICATION.md` | Crypto rules + worked examples. |
| `tests/fixtures/golden/*` | Ground truth. Implementation must match these exactly. |
| `tests/fixtures/golden/expected_flags.json` | Expected timeline flags per fixture. |

## Rules

1. **Never edit fixtures manually** — use `tools/gen_golden.py`
2. **CI gates on `tools/verify_golden.py`** — crypto correctness
3. **Tests must assert flags from `expected_flags.json`** — timeline correctness
4. **Verification script checks crypto only** — timeline analysis is a separate concern
5. **Any change to canonicalization, digest scope, or signing rules requires regenerating golden fixtures and updating expected flags**

## Separation of concerns

| Layer | Tool | What it checks |
|-------|------|----------------|
| Crypto | `verify_golden.py` | Digest matches, signature verifies |
| Timeline | Unit tests | Flags match `expected_flags.json` |

This separation is intentional. `verify_golden.py` is not a policy engine.

## Quick start for new contributors

1. Run `python tools/verify_golden.py` — should pass
2. Read `IMPLEMENTATION_NOTES.md` — understand the invariants
3. Read `VERIFICATION.md` — understand the crypto rules
4. Implement against the golden fixtures — they are the spec

## Handoff note

> The fixtures are the contract. Do not interpret the spec—implement to the golden files.
> CI gates on `tools/verify_golden.py` (crypto correctness) and tests must assert flags from `expected_flags.json` (timeline correctness).
> Never edit fixtures manually; regenerate using `tools/gen_golden.py`.
