# brand — Questions

## Answered during lockdown

### Q1: Can this pipeline cause draft, variant, stale, derived, or wrong-context brand assets to look canonical?

**Answer:** Mostly no. Canonical identity is structurally unambiguous (one file per slug, manifest-tracked, CI-verified). Two bounded gaps: migrate can generate 404 URLs to non-existent logos (detectable by audit), and audit isn't in CI (manifest integrity IS enforced, reference correctness is manual).

### Q2: What makes something canonical vs derived?

**Answer:** Canonical = file at `logos/<slug>/readme.{png,jpg}` with a matching entry in `manifest.json`, verified by CI. Everything else (dist/, site/, social.png, badges) is derived or out of scope. The manifest is the authority.

### Q3: Can dual collection strategies produce conflicting identity?

**Answer:** Yes, theoretically. Sync (remote) only checks repo root. Collect (local) checks assets/ too. A logo in `assets/logo.png` would be captured by collect but never updated by sync. Both converge on `logos/<slug>/readme.<ext>` — the manifest doesn't care about provenance, only current state.
