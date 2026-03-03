# mcpt-link-fresh

Keep your public surfaces from going stale.

`mcpt-link-fresh` is a drift-fixing automation that syncs **mutable listings** (GitHub metadata, release notes, README blocks, and registry-facing links) back to your **evergreen canonical truth** (mcptoolshop.com + MarketIR-derived outputs).

It's built for solo scale: you ship more tools, the system keeps the "front doors" accurate.

---

## What it does

**Syncs what's editable:**

- GitHub repo **homepage**, **description**, **topics**
- GitHub **Release notes** (adds/refreshes a "Links + Proof" section)
- Repo **README blocks** (via PR, never force-push)

**Generates outreach queue (optional):**

- Drift events trigger **micro-campaign packets** paired with scored targets
- Conservative triggers: only proven claims, new evidence, material positioning changes
- Rate-limited, deduplicated, quiet-hours aware
- Produces `outreach-queue.json` + `outreach-queue.md` for human review
- **Never sends anything** — purely advisory

**Flags what requires a versioned release:**

- npm/PyPI metadata that can't be updated in-place opens a **metadata-only patch release PR** (optional mode)

**Never changes core code**. It updates surfaces, not functionality.

---

## Canonical truth sources

`mcpt-link-fresh` treats these as authoritative:

- `https://mcptoolshop.com/presskit/<slug>/presskit.json`
  (machine-readable tool truth: positioning, claims, evidence, GitHub facts snapshot, tracked links)
- `https://mcptoolshop.com/links.json`
  (canonical tracked go-links + UTM params)
- `https://mcptoolshop.com/tools/<slug>/` and `/press/<slug>/`
  (human-facing evergreen pages)

For outreach, it also reads from the marketing site's local filesystem:

- MarketIR tool definitions (`data/marketir/data/tools/<slug>.json`)
- Audience personas (`data/marketir/data/audiences/*.json`)
- Target lists (`public/targets/<slug>/targets.json`)
- Outreach templates (`public/outreach/<slug>/*.md`)
- Go-links registry (`data/links.json`)

Everything it writes is derived from these sources and time-stamped.

---

## Safety rails (non-negotiable)

- **Allowlist-only:** it will only touch repos explicitly configured.
- **Dry-run first:** produces a plan (JSON + Markdown) before applying changes.
- **Least privilege:** workflows request minimal GitHub permissions.
- **No secrets in output:** never writes tokens, never logs sensitive env.
- **Fail-soft:** partial permissions (e.g., traffic metrics) never break sync.
- **No HTML injection:** all derived text is sanitized; URLs are allowlisted (http/https).
- **Org freeze:** `freeze.disallowOwners` blocks writes to specific GitHub orgs/users.
- **Domain allowlist:** `rules.allowedDomains` restricts canonical URLs to trusted domains.
- **No sending:** outreach queue is advisory only. Zero code paths send emails, DMs, or post anything.
- **Proven-claims-only:** outreach items never reference aspirational or deprecated claims.

---

## How it operates (decision model)

It treats each "surface" as one of three action types:

1. **Direct update (safe):** GitHub metadata (description/homepage/topics)
2. **PR required (review):** README edits
3. **Release required (versioned):** registry metadata changes (optional mode)

When outreach is enabled, drift events are additionally classified:

4. **Outreach trigger:** Proven claim added, evidence added, release published, or material positioning change

---

## Quickstart (local)

> You typically run this via a scheduled workflow, but local runs are supported.

```bash
npm ci
node src/index.mjs --dry-run --config sync.config.json
```

To apply changes:

```bash
node src/index.mjs --apply --config sync.config.json
```

To apply a single target:

```bash
node src/index.mjs --apply --config sync.config.json --target zip-meta-map
```

## Configuration

Create `sync.config.json`:

```json
{
  "version": "1.0.0",
  "canonical": {
    "presskitBaseUrl": "https://mcptoolshop.com/presskit",
    "linksUrl": "https://mcptoolshop.com/links.json",
    "toolPageBase": "https://mcptoolshop.com/tools",
    "pressPageBase": "https://mcptoolshop.com/press"
  },
  "targets": [
    {
      "slug": "zip-meta-map",
      "repo": "mcp-tool-shop-org/zip-meta-map",
      "enabled": true,
      "mode": "github-only",
      "topicsMax": 12
    }
  ],
  "rules": {
    "appendReleaseNotesSection": true,
    "openReadmePR": true,
    "registryDriftPR": false,
    "allowedDomains": ["mcptoolshop.com"]
  },
  "freeze": {
    "disallowOwners": []
  },
  "marketingSitePath": "",
  "outreach": {
    "enabled": false,
    "maxPerToolPerWeek": 3,
    "dedupeWindowDays": 14,
    "quietHours": { "start": "22:00", "end": "08:00", "tz": "America/New_York" },
    "topTargetsPerItem": 3
  }
}
```

### Config fields

| Field | Type | Description |
|-------|------|-------------|
| `canonical.presskitBaseUrl` | string | Base URL for presskit.json files |
| `canonical.linksUrl` | string | URL for the canonical links registry |
| `canonical.toolPageBase` | string | Base URL for tool detail pages |
| `canonical.pressPageBase` | string | Base URL for press pages |
| `targets[].slug` | string | Tool slug (matches presskit filename) |
| `targets[].repo` | string | `owner/repo` on GitHub |
| `targets[].enabled` | boolean | Whether to process this target |
| `targets[].mode` | string | `github-only` or `full` |
| `targets[].topicsMax` | number | Max number of GitHub topics (default 12) |
| `rules.appendReleaseNotesSection` | boolean | Add managed section to latest release |
| `rules.openReadmePR` | boolean | Open PR for README block updates |
| `rules.registryDriftPR` | boolean | Plan registry metadata patches (disabled by default) |
| `rules.allowedDomains` | string[] | Only allow canonical URLs from these hostnames |
| `freeze.disallowOwners` | string[] | Block writes to repos owned by these users/orgs |
| `marketingSitePath` | string | Path to local marketing site checkout (for outreach) |
| `outreach.enabled` | boolean | Enable outreach queue generation |
| `outreach.maxPerToolPerWeek` | number | Max queue items per tool per trailing 7 days |
| `outreach.dedupeWindowDays` | number | Suppress duplicate trigger+target combos within this window |
| `outreach.quietHours` | object | Suppress all items during these hours |
| `outreach.topTargetsPerItem` | number | Max targets per queue item (default 3) |

**Modes:**

- `github-only` (default): GitHub metadata + releases + README PRs
- `full`: also plans registry drift PRs (npm/PyPI) if enabled

**Outreach requires both:**

1. `outreach.enabled: true`
2. `marketingSitePath` set to a valid path

If either is missing, the outreach step is silently skipped.

## Outreach Queue

When enabled, the outreach queue generates micro-campaign packets from drift events.

### Trigger rules (conservative)

| Category | Condition | Priority |
|----------|-----------|----------|
| `claim-change` | Proven claim added or statement text changed | `high` |
| `evidence-added` | New evidence on existing proven claim | `normal` |
| `release-published` | Release notes drift + metadata changes | `normal` |
| `presskit-material` | Tagline, valueProps, or oneLiner changed | `normal` |

**Never triggers for:** topic reorder, whitespace-only changes, homepage trailing-slash normalization, README block injection, aspirational claims.

**Baseline run:** First run with no previous presskit snapshot produces zero triggers.

### Queue item contents

Each queue item includes:

- Trigger category and summary
- Best-fit audience (keyword overlap with painPoints)
- Top 3 scored targets from the slug's target list
- Suggested template (based on target type)
- Subject line suggestions (deterministic, no LLM)
- Go-link CTA
- Claims used (with status and statement)
- Resource links (presskit, outreach pack)

### Rate limits

- `maxPerToolPerWeek`: Hard cap on items per slug per trailing 7 days
- `dedupeWindowDays`: Same `{slug, category, target}` combo suppressed within window
- `quietHours`: All items suppressed during specified hours
- History tracked in `reports/outreach-history.json` (append-only, pruned to 90 days)

## Workflows

### Weekly Drift Report (scheduled)

Runs every Monday at 08:00 UTC. Detects drift across all targets and uploads a report artifact. No changes are made.

### Apply Drift Fixes (manual)

Triggered via `workflow_dispatch` with an optional `target_slug` input. Runs a dry-run first, then applies fixes behind a `link-fresh-apply` environment gate that requires manual approval.

## Outputs

Every run produces a deterministic report:

```
reports/<date>/plan.json
reports/<date>/plan.md
reports/<date>/outreach-queue.json  (when outreach enabled)
reports/<date>/outreach-queue.md    (when outreach enabled)
reports/<date>/results.json         (when --apply)
reports/presskit-snapshots/<slug>.json
reports/outreach-history.json
```

Each change includes: what drift was detected, what source fields were used, what updates were applied/proposed, timestamps and provenance.

### Plan explainability

Every action in `plan.md` shows:

- **Safety label**: "Safe to auto-apply" (API) or "Requires review" (PR)
- **API endpoint**: The exact GitHub API route that would be called
- **Current vs canonical**: Side-by-side comparison of stale vs expected values
- **Summary**: Count of safe, review-required, and manual-release actions

## Error codes

| Code | Meaning | Fix |
|------|---------|-----|
| `MKT.SYNC.NO_CONFIG` | Config file not found or invalid JSON | Check `--config` path |
| `MKT.SYNC.NO_TARGET` | `--target` slug not found in config | Check slug spelling |
| `MKT.SYNC.FROZEN_OWNER` | Target repo owner is in `freeze.disallowOwners` | Remove from freeze list or disable target |
| `MKT.SYNC.DOMAIN_BLOCKED` | Canonical URL hostname not in `rules.allowedDomains` | Add hostname to allowlist |
| `MKT.SYNC.FETCH_FAILED` | Network error fetching presskit, links, or GitHub data | Check connectivity and URLs |
| `MKT.SYNC.NO_PRESSKIT` | No presskit.json found for a target slug | Generate press kit and deploy site |
| `MKT.SYNC.API_DENIED` | GitHub API returned 403/401 | Check GITHUB_TOKEN permissions |
| `MKT.SYNC.OUTREACH_SKIP` | No MarketIR data for slug | Ensure tool JSON exists in marketing site |
| `MKT.SYNC.OUTREACH_NO_TARGETS` | No targets.json for slug | Run gen-targets.mjs for this slug |
| `MKT.SYNC.OUTREACH_NO_CLAIMS` | Tool has no proven claims | Add proven claims with evidence |
| `MKT.SYNC.OUTREACH_DOMAIN` | Go-link URL hostname not in allowedDomains | Check go-link URL or add hostname |
| `MKT.SYNC.QUEUE_RATE_LIMITED` | Items suppressed due to weekly cap | Wait or increase maxPerToolPerWeek |
| `MKT.SYNC.QUEUE_DEDUP` | Items suppressed due to recent duplicates | Wait for dedup window to expire |
| `MKT.SYNC.QUEUE_QUIET` | Items suppressed due to quiet hours | Run outside quiet hours |

## Testing

```bash
npm test            # unit tests (98 tests)
npm run test:e2e    # integration tests with golden snapshots (22 tests)
npm run test:queue  # outreach-specific tests only
npm run test:all    # all tests (120 tests)
```

## Docs

- [docs/SYNC-SPEC.md](docs/SYNC-SPEC.md) -- canonical fields, drift rules, and action types
- [docs/RUNBOOK.md](docs/RUNBOOK.md) -- common failures and fixes

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | GitHub repo metadata (via API), README files (read/write), marketing site data |
| **Data NOT touched** | No user credentials stored, no databases, no telemetry |
| **Permissions** | GitHub token required for API access (read repos, write metadata) |
| **Network** | GitHub API only |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT
