# ai-loadout — Questions

## Answered during lockdown

### Q1: When ai-loadout chooses a loadout, what must it say about why, and what must it never imply about capability or knowledge access?

**Answer:** See protect-dispatch-truth.md "Must say" / "Must never imply" sections. The system must report score, matched keywords/patterns, reason, mode, provenance, and conflicts. It must never imply that routing equals comprehension, that scores are semantic relevance, or that declared keywords are current truth.

### Q2: Is the malformed-layer silent skip a truth concern?

**Answer:** Yes — DT-1. A file that exists but contains bad JSON is indistinguishable from a missing file in the resolver output. Promoted to AILOADOUT-002 as a follow-up improvement packet. Not blocking because graceful degradation is the right default, but the operator deserves to know the difference.

### Q3: Should MIN_SCORE be configurable?

**Answer:** No. Single threshold, single constant. Making it configurable per-entry or per-layer would destroy the contract that "below 0.1 means excluded everywhere." If a consumer needs different sensitivity, they should adjust their keywords, not the threshold.
