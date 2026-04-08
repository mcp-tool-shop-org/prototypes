# Role OS — Repo-Level Decisions

## 2026-03-24 — Version must be read from package.json at runtime

**Decision:** Remove hardcoded VERSION constant. Read from package.json using `import.meta.url` path resolution.

**Why:** Role-os is a packaging repo; version must have one source of truth. A hardcoded constant is exactly the kind of starter-pack/CLI drift this lock is supposed to prevent.

**Implementation:** Done. `bin/roleos.mjs` now reads `package.json` at startup. Regression test added: `--version` must match package.json.

**Status:** Locked + implemented.

---

## 2026-03-24 — Route coverage: no default disclosure note

**Decision:** Do not surface "26 more roles exist" in default `roleos route` output. Default output stays focused on detected type, recommended chain, and dependency verification.

**Why:** Route is about best ownership, not catalog marketing. Surfacing omitted roles by default creates noise and makes routing feel less decisive.

**Compromise:** May add to `--verbose` / `--explain` later if needed.

**Status:** Locked.

---

## 2026-03-24 — Init must support explicit --force for upgrades

**Decision:** Add `--force` flag that overwrites canonical scaffolded files (agents, schemas, policies, generic workflows) but NEVER touches user-filled context files.

**Requirements:**
- `--force` must be explicit (never default)
- Must report exactly what it overwrites (Updated section in output)
- Must not silently delete repo-local workflows or context
- `context/` is always protected

**Why:** Org rollout needs a lawful upgrade path. "Manual copy" is how starter-pack drift becomes permanent.

**Implementation:** Done. `init.mjs` supports `--force` with `protectedPaths: ["context/"]`. Regression test added.

**Status:** Locked + implemented.

---

## 2026-03-24 — Double-nested .claude/ was a blocking bootstrap-truth defect

**Decision:** `starter-pack/.claude/workflows/full-treatment.md` was a structural bug. Moved to `starter-pack/workflows/full-treatment.md`.

**Why:** Init copies starter-pack → .claude/, producing .claude/.claude/workflows/ — a double-nested directory that violates bootstrap truth, canonical scaffold correctness, and init idempotence expectations.

**Impact:** Affected commandui and shipcheck (both remediated and pushed). Regression tests added to prevent recurrence.

**Remediation log:**
- commandui: `.claude/.claude/workflows/full-treatment.md` → `.claude/workflows/full-treatment.md` (committed 659007d)
- shipcheck: `.claude/.claude/workflows/full-treatment.md` → `.claude/workflows/full-treatment.md` (committed 58c0bd1)

**Status:** Locked + implemented + remediated.
