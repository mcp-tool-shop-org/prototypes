# SYNC-SPEC

> What is canonical, what "drift" means, and what actions are allowed when syncing public surfaces.
> Intentionally conservative: correctness beats cleverness.

---

## 1. Definitions

### Canonical truth

The source of record for tool messaging and links.

Primary canonical endpoint per tool:

- `PRESSKIT_JSON = https://mcptoolshop.com/presskit/<slug>/presskit.json`

Optional canonical link registry:

- `LINKS_JSON = https://mcptoolshop.com/links.json`

### Surface

A public place where people discover a project:

- GitHub repo metadata (description/topics/homepage)
- GitHub releases
- README on default branch
- Package registry metadata (npm/PyPI) *(optional)*

### Drift

A mismatch between a surface value and its canonical value.

---

## 2. Canonical fields and mapping

The press kit JSON is the source of truth.

### Tool identity

- `slug` from config target
- `name` from `presskit.name`

### Positioning

- Canonical one-liner: `presskit.tagline`

### Links (canonical)

Prefer tracked links (from `presskit.trackedLinks[]` if present), otherwise fall back to site routes:

- Tool page: `https://mcptoolshop.com/tools/<slug>/`
- Press page: `https://mcptoolshop.com/press/<slug>/`
- Press kit: `https://mcptoolshop.com/presskit/<slug>/`

### GitHub facts (observed)

Optional, time-stamped:

- `presskit.githubFacts.*` with `observedAt`

These are used only for *presentation* (release note section), not as canonical truth.

---

## 3. Surface sync rules

### 3.1 GitHub repo metadata (Direct update)

**Fields:** Homepage URL, Description, Topics

**Mapping:**

- `homepage` <- canonical tool page URL
- `description` <- canonical one-liner (sanitized, trimmed to 350 chars)
- `topics` <- targeting topics if available; otherwise derived keywords (bounded)

**Constraints:**

- Topics maximum: `topicsMax` (default 12)
- All URLs must pass allowlist (`http/https` only)
- Description max length enforced (GitHub limits apply)

**Action type:** `DIRECT_UPDATE`
**Failure behavior:** if a field cannot be updated, record error and continue.

---

### 3.2 GitHub release notes (Direct update, scoped)

**Purpose:** keep releases pointing at evergreen, proof-based resources.

`mcpt-link-fresh` manages a single bounded section delimited by markers:

```
<!-- mcpt:links:start -->
### Links + Proof (mcptoolshop.com)
- [Tool page](...)
- [Press page](...)
- [Press kit](...)
<!-- mcpt:links:end -->
```

**Rules:**

- The managed section is **idempotent**:
  - if markers present -> replace only that section
  - if absent -> append at end
- Never rewrite the rest of the release notes.
- Use tracked `/go/` links when available, otherwise direct links.

**Action type:** `DIRECT_UPDATE`
**Failure behavior:** if release edit fails (permissions), warn and continue.

---

### 3.3 README updates (PR required)

READMEs are human-owned. We do not force-push.

`mcpt-link-fresh` proposes a PR that updates managed blocks only:

- `<!-- mcpt:links:start --> ... <!-- mcpt:links:end -->`

**Rules:**

- If markers exist -> replace within markers only
- If missing -> optionally add block under a "Links" heading (config-controlled)
- Never touch unrelated sections

**Action type:** `PR_REQUIRED`
**Failure behavior:** if PR cannot be opened, warn and continue.

---

### 3.4 Registry metadata (Release required, optional)

**Important:** npm/PyPI artifacts are not meant to be edited in-place.

If canonical URLs/keywords drift from registry metadata, `mcpt-link-fresh` may open a PR that:

- bumps **patch** version
- updates metadata fields only
- contains no functional code changes

**Action type:** `RELEASE_REQUIRED`
**Default:** disabled unless `registryDriftPR: true`

---

## 4. Sanitization and URL policy

All text emitted into Markdown/HTML is escaped/sanitized.

All URLs must match:

- Allowed protocols: `http`, `https`
- Forbidden: `javascript:`, `data:`, `vbscript:`, `file:`

Domain allowlist (recommended for "official" links):

- `mcptoolshop.com`
- `github.com`
- `pypi.org`
- `npmjs.com`

---

## 5. Determinism

A run is deterministic given:

- the same config
- the same canonical presskit.json and links.json
- the same GitHub API snapshot responses

Outputs are ordered and stable:

- sorted targets by slug
- stable diff formatting
- report files include timestamps but preserve stable key ordering

---

## 6. Modes

### github-only

- GitHub metadata + release notes + README PRs
- No registry PRs

### full

- includes registry drift planning (if enabled)
- still never mutates registry artifacts directly

---

## 7. Audit outputs

Every run must produce:

- `plan.json` (machine-readable drift + intended actions)
- `plan.md` (human-readable checklist)
- `results.json` (applied changes + links to PRs/edits)

Each change includes provenance:

- canonical source URL(s)
- observedAt timestamps (where relevant)
- action type and outcome

---

## 8. Non-goals

- Sending emails/DMs
- Scraping non-GitHub web sources
- Editing published package artifacts in-place
- Making subjective marketing judgments (that belongs in MarketIR)
