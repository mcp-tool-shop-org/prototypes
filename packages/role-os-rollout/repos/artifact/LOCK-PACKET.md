# ARTIFACT-001 — Fallback Determinism Lock

**Repo:** @mcptoolshop/artifact v1.6.0
**Seam:** Ollama fallback determinism
**Date:** 2026-03-24
**Status:** PASS (clean)

## Invariants traced to source

### INV-1: DecisionPacket schema parity

Both paths produce identical schema. Verified by tracing output construction:

- **Fallback:** `fallback.ts:162-188` — returns complete DecisionPacket with all required fields
- **Curator:** `curator.ts:272-290` — returns complete DecisionPacket with all required fields
- **Schema definition:** `types.ts` — single DecisionPacket type used by both

**Verdict:** PASS. Both paths construct the same type. No mode-specific optional fields exist in the core packet.

### INV-2: driver_meta.mode honesty

- **Fallback:** `fallback.ts:184` — `mode: 'fallback'`, `host: null`, `model: null`
- **Curator:** `curator.ts:283-285` — `mode: 'ollama'`, `host: conn.host`, `model: conn.model`

**Verdict:** PASS. The two paths set mutually exclusive values. No code path can produce a fallback packet with `mode: 'ollama'`.

### INV-3: Hook atom_id validation

- **Fallback:** `fallback.ts:64-83` (pickHooks) — iterates hookTypes, calls pickAtom which filters by `atoms.filter(a => a.type === type)`. Only real atom IDs selected.
- **Curator:** `curator.ts:177-188` (validateHooks) — `atomIds = new Set(atoms.map(a => a.id))`, then `filter(h => atomIds.has(h.atom_id))`. Only real atom IDs survive.

**Verdict:** PASS. Both paths enforce that hooks reference real atoms. The fallback never invents IDs; the Curator's LLM output is post-validated.

### INV-4: Freshness grounding

- **Fallback:** `fallback.ts:155-173` — uses `pickAtom()` with explicit null coalescing to `'unknown — no X atoms found'`
- **Curator:** `curator.ts:216-231` (buildFreshnessPayload) — uses `resolveValue()` + fallback function that returns atom value or `'unknown — no X atoms found'`

**Verdict:** PASS. Both paths produce grounded freshness or explicit "unknown" language. The Curator path additionally resolves atom ID references the LLM might return.

### INV-5: Fallback determinism (seeded hash)

- **Hash function:** `fallback.ts:19-25` — `hash(s)` is a simple deterministic hash (shift-5 + charCode)
- **Seed construction:** `fallback.ts:111-112` — `seed = hash(repo_name + YYYY-MM-DD)`
- **All randomness flows from seed:** `seededPick()` uses LCG `(s * 1103515245 + 12345) & 0x7fffffff`

**Verdict:** PASS. Same repo name + same date = same seed = same output. The LCG is deterministic. No `Math.random()` or external entropy.

### INV-6: Stderr truth (three fallback trigger paths)

- **Path 1 (--no-curator):** `cli.ts:340` — `console.error('Curator: skipped (--no-curator)')`
- **Path 2 (invalid response):** `cli.ts:425` — `console.error('Curator: Ollama responded but output was invalid. Falling back.')`
- **Path 3 (unavailable):** `cli.ts:429` — `console.error('Curator: Ollama not available. Using fallback driver.')`
- **Success path:** `cli.ts:359` — `console.error('Curator: online (model=${conn.model})')`

**Verdict:** PASS. All four states produce distinct, truthful stderr messages. The operator can always tell which path was taken.

### INV-7: Exit code contract

- **Exit 1 (validation):** Used for missing args, invalid flags, repo not found, crawl with failures
- **Exit 2 (fatal):** `cli.ts` uncaught exception handler
- **Exit 0:** Implicit on success

**Verdict:** PASS. Consistent with org decision on exit code semantics (1 = checker failure, 2 = fatal).

### INV-8: Localhost boundary

- **Ollama connection:** `ollama.ts` — probes `127.0.0.1:11434`, `localhost:11434`, `host.docker.internal:11434` only
- **Environment override:** `OLLAMA_HOST` env var (still expected to be localhost)
- **No external calls** except GitHub API for `--remote` (requires explicit `GITHUB_TOKEN`)

**Verdict:** PASS. No cloud model providers. No external API calls in the decision path.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Friendly fallback" — make fallback output look more curated

**Hypothetical change:** Add richer callout text to fallback packets using template phrases like "The Curator recommends..." to make fallback output feel more complete.

**Why rejected:** Violates reject criteria #6 (blurs primary-path failure with fallback success) and #9 (reassurance stronger while semantics unchanged). The fallback callouts are intentionally sparse (`veto: '', risk: ''`) because the fallback doesn't reason — it picks. Making it sound like it reasoned is a lie.

### LP-2: "Smart fallback" — add heuristics to improve fallback quality

**Hypothetical change:** Replace seeded hash with a scoring heuristic that picks "better" formats based on repo characteristics, making fallback output less random-feeling.

**Why rejected:** Violates reject criteria #5 (breaks fallback determinism). The seeded hash guarantees same-day reproducibility. Any scoring heuristic that depends on mutable state, atom ordering, or non-deterministic comparisons breaks this guarantee. The fallback is intentionally simple because simplicity is what makes it trustworthy.

### LP-3: "Graceful degradation" — hide Ollama unavailability from operator

**Hypothetical change:** Remove stderr messages about Ollama status when fallback succeeds, since the operator "doesn't need to know" if the output is valid either way.

**Why rejected:** Violates reject criteria #1 (makes fallback silent) and #6 (blurs primary-path failure). The operator needs to know which mode drove the decision because the two modes have different properties: Curator reasons within constraints, fallback rotates deterministically. Hiding which path was taken removes the operator's ability to judge the decision's provenance.

## Design tradeoffs (named, not blocking)

### DT-1: Fallback callouts are sparse

Fallback packets have mostly empty callouts (`veto: '', risk: ''`). This is intentional — the fallback doesn't reason, so it shouldn't pretend to have opinions. But it means fallback output is visually less rich.

**Acceptable because:** The alternative (inventing callout text) would violate grounding truth. Sparse is honest.

### DT-2: Date-seeded determinism means daily rotation

The seed is `hash(repo_name + YYYY-MM-DD)`, so the same repo gets the same fallback output all day but different output tomorrow. This is a design choice, not a bug.

**Acceptable because:** It balances reproducibility (debugging, testing) with variety (org-wide freshness).

### DT-3: Curator validation falls back to defaults, not errors

When the Curator produces invalid JSON or invalid field values, `validateTier()` returns `'Fun'`, `validateFormats()` returns first 3 from pool, etc. This silently corrects rather than failing.

**Acceptable because:** The alternative is rejecting the entire Curator response on any field error, which would make the system fragile. The current behavior is documented: invalid Curator output → corrected packet with `mode: 'ollama'`. However, this means an operator could get a Curator-tagged packet with partially defaulted content.

**Note:** This is the closest thing to a truth concern. The packet says `mode: 'ollama'` but some fields may have been corrected to defaults. The system is honest about using Ollama (the model did respond) but doesn't signal which specific fields were corrected. Worth monitoring.

### DT-4: Crawl mode forces --no-curator

`crawl.ts` sets `noCurator: true` for batch operations. This means org-wide curation runs always use fallback. The operator sees this in output but it's not prominently flagged.

**Acceptable because:** Batch Ollama calls would be slow and resource-heavy. Fallback is the right choice for batch. But operators should know.

## Summary

| Check | Result |
|-------|--------|
| Schema parity | PASS |
| driver_meta honesty | PASS |
| Hook validation | PASS |
| Freshness grounding | PASS |
| Fallback determinism | PASS |
| Stderr truth | PASS |
| Exit code contract | PASS |
| Localhost boundary | PASS |
| Liar-path LP-1 | Correctly rejected |
| Liar-path LP-2 | Correctly rejected |
| Liar-path LP-3 | Correctly rejected |

**Overall: PASS.** No blocking defects. 4 design tradeoffs documented. DT-3 (Curator validation defaults) promoted to follow-up packet ARTIFACT-002.

---

## ARTIFACT-002 — Curator Correction Signaling Truth (queued)

**Status:** Follow-up improvement packet (not blocking lock)
**Source:** DT-3 from ARTIFACT-001

**Problem:** When the Curator returns invalid field values, `validateTier()` defaults to `'Fun'`, `validateFormats()` returns pool defaults, etc. The packet is tagged `mode: 'ollama'` because Ollama did respond — but the operator cannot tell which specific fields were the model's choice vs system defaults.

**Goal:**
- Make corrected/defaulted Curator fields explicitly signal what was corrected
- Preserve determinism and hook grounding
- Avoid implying a fully original Curator packet when partial correction occurred

**Possible approaches:**
1. Add a `corrections` array to `driver_meta` listing which fields were defaulted
2. Add a `driver_meta.quality` field: `'full'` | `'partial'` | `'fallback'`
3. Log corrections to stderr so the operator can see them

**Constraint:** Must not break DecisionPacket schema parity or existing consumers. Must not make the system fragile (rejecting on any field error is worse than defaulting).
