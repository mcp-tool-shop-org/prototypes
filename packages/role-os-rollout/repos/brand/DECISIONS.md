# brand — Repo-Local Decisions

## 2026-03-24 — Manifest is the identity authority, not the file system

**Decision:** Whether an asset is canonical is determined by its presence in `manifest.json` with a matching SHA-256 hash, not just by its location in `logos/`. A file in `logos/` without a manifest entry is untracked and should be treated as suspicious.

**Why:** The file system can be modified directly (push, script, manual copy). The manifest is the integrity contract. CI enforces manifest, not directory listing.

**Applies to:** All verification, audit, and distribution logic.

---

## 2026-03-24 — The pipeline stores and distributes; it does not generate

**Decision:** The brand pipeline never transforms, resizes, or generates logo assets. It collects them from repos, stores them in one canonical location, tracks integrity, and distributes references. Adding generation would contaminate the canonical surface.

**Why:** Generated assets are derived, not canonical. If the pipeline generates variants, those variants need their own canonical designation or they risk being mistaken for the official asset.

**Applies to:** Any proposal to add resizing, format conversion, dark-mode generation, or template-based logo creation to the pipeline.
