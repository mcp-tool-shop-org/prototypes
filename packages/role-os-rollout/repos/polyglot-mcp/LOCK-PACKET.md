# POLYGLOT-001 — Translation Truth Lock

**Packet type:** lockdown proving packet
**Repo:** @mcptoolshop/polyglot-mcp
**Seam:** Translation dispatch + language negotiation
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, clean lock, fallback-warning criterion sharpened

---

## Objective

Prove that the Role OS setup for polyglot-mcp can reject changes that would silently produce wrong-language output, destroy markdown structure, add cloud dependencies, or hide translation failures behind success status.

## Invariants under test

### INV-1: Language resolution is deterministic

**Claim:** `resolveLanguage()` is a pure lookup. Same input always produces same output. Case-insensitive, name or code, underscore→dash normalization.

**Source:** `src/languages.ts:resolveLanguage()` — normalizes input, checks codeMap, then nameMap. Returns Language or undefined. No side effects, no randomness, no external state.

**Evidence:** The function calls `toLowerCase()` and `replace(/_/g, "-")`, then does two Map lookups. No Date, no Math.random(), no process state. Pure function.

**Test coverage:** `languages.test.ts` — 16 tests covering code lookup, name lookup, case insensitivity, undefined for unknown.

**Reject defense:**
- `protect-translation-truth.md` criterion #3 (makes resolution non-deterministic)
- `current-priorities.md` invariant #3 (deterministic resolution)

### INV-2: Fallback-to-source always produces a warning

**Claim:** When translation returns empty output and source text is substituted, the response includes a warning. Never silent.

**Source:** `src/translate.ts` — in the per-chunk loop:
```
try { validateTranslation(...) }
catch { warnings.push("Chunk translation returned empty output — using source text."); translated = chunk; }
```

**Evidence:** The catch block unconditionally pushes a warning string AND sets `translated = chunk`. Both happen together — no code path skips the warning while still doing the fallback.

**Test coverage:** `translate.test.ts` — tests for empty output handling and warning inclusion.

**Reject defense:**
- `protect-translation-truth.md` criterion #1 (silently produces wrong-language output)
- `product-brief.md` anti-thesis #2 (never silent substitution)
- `current-priorities.md` invariant #5 (fallback with warning, never silent)

### INV-3: All network calls are localhost:11434

**Claim:** No external endpoints. All Ollama calls go to localhost.

**Source:** `src/ollama.ts` — constructor sets `this.baseUrl = baseUrl || "http://localhost:11434"`. `src/index.ts` — creates `new OllamaClient()` with no arguments (uses default).

**Evidence:** Grep for `http://`, `https://`, `fetch(` across all source files shows only localhost:11434 references. No external URLs.

**Reject defense:**
- `protect-translation-truth.md` criterion #2 (adds external endpoints)
- `product-brief.md` anti-thesis #1 (never a cloud proxy)
- `current-priorities.md` invariant #2 (localhost only)

### INV-4: Protected segments survive translation unchanged

**Claim:** Code blocks, HTML blocks, horizontal rules, and blank lines are never sent to the translation model. They pass through as-is.

**Source:** `src/translateMarkdown.ts:segmentMarkdown()` — classifies segments as "protected" or translatable types. Protected segments are preserved in the reassembly step without modification.

**Evidence:** The segmentation function marks fenced code blocks (``` delimited), HTML blocks (`<tag`), horizontal rules (`---`), and blank lines as `type: "protected"`. The reassembly loop skips protected segments — they're joined into output unchanged.

**Test coverage:** `translateMarkdown.test.ts` — 35 tests including code block preservation, HTML passthrough.

**Reject defense:**
- `protect-translation-truth.md` criterion #4 (destroys markdown structure)
- `product-brief.md` anti-thesis #5 (format-destroying translator)
- `current-priorities.md` invariant #8 (protected segments pass through)

### INV-5: Cache path traversal is blocked

**Claim:** Cache file cannot be written outside the source file's directory.

**Source:** `src/cache.ts:getCachePath()`:
```
const resolved = resolve(cachePath);
if (!resolved.startsWith(dir)) { throw new Error("Cache path traversal blocked..."); }
```

**Test coverage:** `cache.test.ts` — explicit path traversal test.

**Reject defense:**
- `protect-translation-truth.md` criterion #6 (removes traversal protection)
- `product-brief.md` anti-thesis #6 (never writes outside working directory)
- `current-priorities.md` invariant #6 (traversal protection)

## Hypothetical violations

### Violation A: "Cloud fallback for reliability"

**Scenario:** A PR adds a Google Translate fallback when Ollama is unavailable: `if (!ollamaAvailable) return await googleTranslate(text, from, to)`.

**Would this be rejected?**
- `protect-translation-truth.md` criterion #2: YES — external endpoint
- `product-brief.md` anti-thesis #1: YES — cloud proxy
- `current-priorities.md` invariant #2: YES — localhost only
- `current-priorities.md` banned detour #1: YES — no cloud backends

**Verdict:** Rejected at 4 independent levels.

### Violation B: "Silent fallback cleanup"

**Scenario:** A PR removes the warning from the empty-output fallback: the catch block still does `translated = chunk` but no longer pushes to warnings[].

**Would this be rejected?**
- `protect-translation-truth.md` criterion #1: YES — silent wrong-language output
- `product-brief.md` anti-thesis #2: YES — silent substitution
- `current-priorities.md` invariant #5: YES — fallback must include warning
- INV-2 broken: fallback without warning

**Verdict:** Rejected at 4 independent levels.

### Violation C: "Fuzzy language matching"

**Scenario:** A PR changes `resolveLanguage()` to use Levenshtein distance for approximate language name matching: "Japanes" → "Japanese" (1 edit distance).

**Would this be rejected?**
- `protect-translation-truth.md` criterion #3: YES — non-deterministic resolution (fuzzy could match different languages at different thresholds)
- `current-priorities.md` invariant #3: YES — deterministic, no fuzzy matching
- INV-1 broken: pure lookup becomes approximate match

**Verdict:** Rejected at 3 independent levels.

## Known design tradeoffs (not blocking)

1. **Fallback-to-source is mixed-language output.** When a chunk fails, source text (in source language) appears in target-language output. Warning is present but caller must check it. This is a known limitation, not a defect.
2. **Batch separator is fragile.** If model outputs literal `---POLYGLOT_SEP---`, split misaligns. Fallback to individual translation catches this but adds latency.
3. **Cache has no atomic writes.** Crash during `saveCache()` can corrupt the file. `loadCache()` handles invalid JSON gracefully (returns empty cache).
4. **"pt-BR" resolves to "pt".** No separate Brazilian Portuguese. Language code aliases are not supported — documented but could surprise users.

## Post-review sharpening

**Criterion #1 expanded** per human review: reject if fallback warning remains technically present but becomes less machine-detectable (buried in prose instead of structured array) or less operator-legible (rewording that hides the severity). The easiest drift in this repo is not removing fallback — it's softening the signal until wrong-language output looks "good enough."

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source. 3 hypothetical violations proven rejectable at 3-4 independent levels each. 4 known design tradeoffs accepted as intentional. Criterion #1 sharpened for fallback-warning legibility.

Lockdown status: **locked**.
