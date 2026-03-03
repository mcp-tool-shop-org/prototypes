# Governance

This document describes how decisions are made in VectorCaliper.

---

## Decision Authority

**Maintainer:** mcp-tool-shop

The maintainer has final authority on:
- Accepting or rejecting contributions
- Interpreting frozen guarantees
- Planning future versions
- Enforcing freeze periods

---

## Decision Types

### Type 1: Bug Fixes

**Who decides:** Maintainer
**Process:** PR review, merge if tests pass and behavior is restored

### Type 2: Documentation

**Who decides:** Maintainer
**Process:** PR review, merge if accurate and non-normative

### Type 3: Additive Features (post-freeze)

**Who decides:** Maintainer after community input
**Process:**
1. Open issue with use case
2. Discussion period (minimum 7 days)
3. Decision documented in issue
4. Implementation if approved

### Type 4: Breaking Changes

**Who decides:** Maintainer
**Process:**
1. Open issue with `[v2-proposal]` label
2. Detailed analysis of impact on guarantees
3. Migration guide draft
4. Community feedback period (minimum 30 days)
5. Decision documented
6. Implementation only in major version

---

## Frozen Guarantees

The guarantees in [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md) are **immutable** for v1.x.

To modify a guarantee:
1. Requires major version bump (v2.0.0)
2. Requires explicit migration guide
3. Requires community notification

The maintainer cannot unilaterally change guarantees within a major version.

---

## Freeze Periods

Freeze periods (documented in [STOP.md](STOP.md)) enforce stability:

- **During freeze:** Only bug fixes accepted
- **After freeze:** Additive features considered
- **New freeze:** 30 days after each release

The maintainer sets freeze dates. Community cannot override.

---

## Conflict Resolution

If a contributor disagrees with a decision:

1. Request clarification in the issue
2. Provide additional context or use cases
3. Accept the maintainer's final decision

VectorCaliper is not a democracy. The maintainer's decision is final.

---

## Succession

If the maintainer becomes unavailable:

1. Repository transfers to `mcp-tool-shop-org` organization control
2. Frozen guarantees remain in effect
3. New maintainer must commit to existing constraints

---

## Changes to Governance

This document can be updated by the maintainer. Changes:

- Must be documented in commit history
- Cannot retroactively change frozen guarantees
- Cannot remove community visibility into decision-making
