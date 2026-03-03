# Contributing to VectorCaliper

Thank you for your interest in VectorCaliper. This document explains the contribution philosophy and constraints.

---

## Contribution Philosophy

VectorCaliper's value comes from **stability and predictability**. Contributions must preserve:

1. **Frozen guarantees** — v1.x semantics cannot change
2. **Determinism** — same input must produce same output
3. **No interpretation** — visual encodings do not imply meaning
4. **Explicit limits** — rejection over silent degradation

---

## What We Accept

### During v1 Freeze (until 2026-03-07)

- Bug fixes that restore documented behavior
- Documentation corrections
- Test additions (no new functionality)
- Performance improvements (same output, faster)
- Security patches

### After v1 Freeze

- New adapters (framework integrations)
- New export formats
- New projections (additive only)
- Documentation improvements

---

## What We Do Not Accept

### Ever

- Changes to frozen guarantees without major version bump
- Automatic smoothing or interpolation
- Health metrics, anomaly detection, or recommendations
- Normative language ("healthy", "optimal", "anomaly")

### During v1.x

- Breaking changes to API
- Changes to visual mapping semantics
- New features that alter existing behavior

---

## How to Contribute

### 1. Check the Freeze Status

Read [STOP.md](STOP.md). If we're in a freeze period, only bug fixes are accepted.

### 2. Open an Issue First

Before writing code:
- For bugs: describe expected vs. actual behavior
- For features: explain the use case and how it fits guarantees
- For questions: ask in an issue, not a PR

### 3. Follow the Constraints

Your contribution must:
- Pass all existing tests (1191+)
- Add tests for new behavior
- Not introduce normative language
- Not change deterministic output

### 4. Submit a Pull Request

- Reference the issue
- Describe what changed and why
- Confirm you've read VECTORCALIPER_V1_GUARANTEES.md

---

## Code Style

- TypeScript strict mode
- No `any` types without justification
- Explicit return types on exported functions
- Comments explain "why", not "what"

---

## Semantic Guarantees Are Non-Negotiable

The guarantees in [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md) are frozen for v1.x.

If your contribution would violate a guarantee, it cannot be accepted in v1.x. Open an issue labeled `[v2-proposal]` to discuss for a future major version.

---

## Review Process

1. Maintainer reviews for guarantee compliance
2. CI must pass (tests, lint)
3. Documentation updated if needed
4. Merged when approved

---

## Questions?

Open an issue with the label `question`.

Thank you for respecting VectorCaliper's constraints.
