# BRAND-001 — Identity Truth Lock

**Repo:** @mcptoolshop/brand v1.0.2
**Seam:** Identity truth (canonical, variant, integrity)
**Date:** 2026-03-24
**Status:** PASS (clean — architecture is strong, truth concerns are bounded)

## Three-law verification

### Canonical law

- **Single location:** `logos/<slug>/readme.{png,jpg}` — one file per repo, no alternatives
- **Manifest contract:** `manifest.json` tracks SHA-256 hash, size, format for every canonical asset
- **CI enforcement:** `ci.yml:54-55` — `brand manifest --check` fails if manifest disagrees with files
- **Immutable distribution:** URLs via `raw.githubusercontent.com` are git-commit-backed

**Verdict:** PASS. Canonical identity is structurally unambiguous. One location, one manifest, CI-enforced.

### Variant law

- **Format decision:** PNG vs JPEG per repo, no auto-conversion. Both are valid canonical formats.
- **One primary per slug:** Each `logos/<slug>/` contains exactly one `readme.{png,jpg}`
- **Social preview:** Optional `social.png`, collected but NOT manifest-tracked (intentional — scope is README logos only)
- **No resizing/transformation:** Pipeline stores and distributes, never transforms

**Verdict:** PASS. Variants are controlled by convention and structure, not by transformation pipeline.

### Integrity law

- **SHA-256 hashing:** `manifest.ts:46` — `sha256:<hex>` format, computed from file content
- **CI verification:** `brand manifest --check` detects tampered, added, and removed files
- **Sync is PR-based:** `sync.yml` opens PRs, never pushes directly to main
- **Badge filtering:** `readme-parser.ts` uses 3+ gates (shields.io patterns, `<a>` tag detection, `&logo=` param exclusion) to distinguish logos from badges

**Verdict:** PASS. Integrity pipeline is solid: hash → manifest → CI check → PR-based updates.

## Five pressure paths

### PP-1: Canonical vs variant — official logo, transparent, social, mockup

- **Official:** `logos/<slug>/readme.png` — manifest-tracked, SHA-256 verified
- **Social:** `logos/<slug>/social.png` — collected but NOT manifest-tracked. Cannot be mistaken for canonical because filename differs.
- **Mockup/export:** Not stored in `logos/`. Would need to be committed and would fail manifest check (unlisted file).
- **Generated dist/ artifacts:** Excluded from `logos/`, excluded from npm publish.

**Verdict:** PASS. Canonical is structurally distinct from non-canonical. Only `readme.{png,jpg}` is manifest-tracked.

### PP-2: Context misbinding — repo logo, README hero, social card

- **README logo:** Migration rewrites to `raw.githubusercontent.com/.../logos/<slug>/readme.<ext>`
- **Misbinding risk:** Migrate assumes PNG if neither format found → generates URL that 404s
- **Social card:** Out of scope (not managed by brand pipeline)

**Verdict:** TRUTH CONCERN. Migrate can generate dead URLs. See TC-1.

### PP-3: Supersession — old asset still present, newer introduced

- **History:** Git tracks all changes. `git log -- logos/<slug>/readme.png` shows full history.
- **Replacement:** Sync overwrites with new version, manifest regenerates. Old version exists in git history only.
- **Stale references:** If a repo README was NOT migrated, it still references the old local URL. Audit catches this (`no-logo-ref` issue).

**Verdict:** PASS for assets. TRUTH CONCERN for references (audit is manual). See TC-2.

### PP-4: Export contamination — generated previews, resized exports

- **No generation pipeline:** Brand repo does not generate, resize, or transform assets.
- **dist/ is compiled CLI, not logo exports:** `npm publish` excludes `logos/`.
- **Non-image files under logos/:** Silently ignored by manifest. Could cause confusion but not integrity failure.

**Verdict:** PASS. No generation pipeline to contaminate canonical assets.

### PP-5: Bundle integrity — manifest, naming, docs agreement

- **Manifest:** Tracks all `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp` under `logos/`
- **Naming:** Convention is `readme.{png,jpg}` only. Enforced by sync (normalizes to `readme.<ext>`).
- **Docs:** `docs/handbook.md` documents migration lessons and per-format decision rationale.
- **No manifest signature:** Manifest is plain JSON. Tampering requires both file AND manifest modification (but both are in the same repo, so a single push can modify both).

**Verdict:** PASS for structure. Design caveat for manifest unsigned (DC-3).

## Truth concerns (2 found)

### TC-1: Migrate generates URLs without existence check

**Finding:** `migrate.ts:37` assumes PNG default. If `logos/<slug>/` has neither format, migrate generates a URL to `readme.png` that will 404.

**Impact:** A repo's README gets rewritten to reference a non-existent logo. The README renders with a broken image until someone runs `brand audit` manually.

**Lock decision:** Not blocking. The existing audit command detects this (`missing-brand-asset` issue). The gap is that audit isn't in CI. **Promoted to BRAND-002** — add existence validation to migrate command.

### TC-2: Audit not in CI

**Finding:** `brand audit` detects broken references, missing assets, and indentation traps. But it runs manually — CI only runs `brand manifest --check` (integrity), not `brand audit` (reference correctness).

**Impact:** Broken README references can persist indefinitely until someone runs audit manually.

**Lock decision:** Not blocking. Manifest integrity (the canonical law) IS enforced by CI. Reference correctness (the distribution law) is available but not automated. **Promoted to BRAND-003** — add audit to CI pipeline.

## Liar-path rejection tests (3 hypothetical violations)

### LP-1: "Auto-generate variants" — add resizing/format conversion to the pipeline

**Hypothetical change:** Add a build step that generates dark-mode, light-mode, and social-size variants from each canonical logo.

**Why rejected:** Violates reject criteria #3 (generated assets storable as official). The pipeline stores and distributes — it does not transform. Generated variants would need a separate canonical designation or they contaminate the `logos/` directory.

### LP-2: "Manifest optional in CI" — skip verification for small changes

**Hypothetical change:** Make CI skip `brand manifest --check` for changes that only touch README translations, not logos.

**Why rejected:** Violates the integrity law. CI verification is the only automated check that files and manifest agree. Skipping it for any change to the repo creates a window where tampering is undetected.

### LP-3: "Smart sync" — infer logo location from README instead of scanning root

**Hypothetical change:** Instead of looking at fixed filenames in repo root, parse each repo's README to find where the logo is referenced and download that.

**Why rejected:** Violates reject criteria #7 (collection strategies diverge). This would create a third collection strategy with different behavior. The fix for "sync misses logos in assets/" is to document the scope limitation, not to add inference.

## Design caveats (named, not blocking)

### DC-1: Dual collection strategies

`sync-org-logos.sh` (remote, root-only) and `collect-logos.sh` (local, assets-aware) scan different locations. A logo added via local collect may never be updated by remote sync.

**Acceptable because:** Both strategies converge on the same output (`logos/<slug>/readme.<ext>`). The manifest doesn't care how the file got there — it hashes whatever exists. But the divergence should be documented.

### DC-2: Social preview not manifest-tracked

`social.png` files are collected but not hashed in manifest. This is intentional (scope is README logos), but means social previews have no integrity verification.

**Acceptable because:** Social previews are not the canonical brand identity. Adding them to manifest scope would be a scope expansion, not a bug fix.

### DC-3: Manifest is unsigned

Plain JSON with no cryptographic signature. A single push can modify both a logo file and its manifest entry.

**Acceptable because:** Git commit history provides auditability. Adding signatures would require key management infrastructure. The risk is mitigated by PR-based sync and code review.

## Summary

| Check | Result |
|-------|--------|
| Canonical law (one location, manifest, CI) | PASS |
| Variant law (format decision, one per slug) | PASS |
| Integrity law (SHA-256, CI verify, PR sync) | PASS |
| PP-1: Canonical vs variant | PASS |
| PP-2: Context misbinding | TRUTH CONCERN (migrate 404) |
| PP-3: Supersession | PASS (assets), CONCERN (refs) |
| PP-4: Export contamination | PASS |
| PP-5: Bundle integrity | PASS |
| LP-1: Auto-generate variants | Correctly rejected |
| LP-2: Manifest optional | Correctly rejected |
| LP-3: Smart sync | Correctly rejected |

**Overall: PASS (clean).** The canonical identity pipeline is strong: one location, SHA-256 manifest, CI verification, PR-based sync. Two truth concerns are bounded: migrate 404 (detectable by audit) and audit not in CI (manifest integrity is still enforced). Follow-up packets target reference-level truth, not canonical-level truth. The system's identity integrity holds.
