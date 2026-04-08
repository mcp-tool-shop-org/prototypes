# ai-loadout — Repo-Local Decisions

## 2026-03-24 — MIN_SCORE is not configurable

**Decision:** MIN_SCORE (0.1) is a single constant, not a per-entry or per-layer setting. Below it means excluded.

**Why:** Configurability would destroy the single-threshold contract. Consumers who need different sensitivity should adjust their keywords and patterns, not the threshold. A configurable threshold creates ambiguity about what "matched" means across different contexts.

**Applies to:** match.ts scoring engine.

---

## 2026-03-24 — Routing is not comprehension

**Decision:** ai-loadout routes to knowledge payloads. It does not evaluate, validate, or guarantee those payloads. Language and output must never conflate routing with comprehension or capability.

**Why:** The subtlest liar-path for this repo is implying that a matched entry means the agent "knows" something. The system matches keywords against declarations — that's all. Whether the payload is current, accurate, or sufficient is the consumer's problem.

**Applies to:** All output, docs, reason strings, and CLI messaging.
