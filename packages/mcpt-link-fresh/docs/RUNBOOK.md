# Runbook

> Common failures and how to fix them.

## Error codes

All errors use the format `MKT.SYNC.<KIND>`:

| Code | Meaning | Fix |
|------|---------|-----|
| `MKT.SYNC.NO_CONFIG` | Config file not found or invalid | Check `--config` path; validate JSON |
| `MKT.SYNC.NO_TARGET` | `--target` slug not found in config | Check slug spelling against `sync.config.json` targets |
| `MKT.SYNC.FROZEN_OWNER` | Target repo owner is in `freeze.disallowOwners` | Remove owner from freeze list, or disable the target |
| `MKT.SYNC.DOMAIN_BLOCKED` | Canonical URL hostname not in `rules.allowedDomains` | Add the hostname to `rules.allowedDomains` |
| `MKT.SYNC.NO_PRESSKIT` | Press kit JSON not found for a slug | Run `gen-presskit.mjs` in the marketing site, then redeploy |
| `MKT.SYNC.FETCH_FAILED` | HTTP error fetching canonical data | Check network; verify mcptoolshop.com is live |
| `MKT.SYNC.API_DENIED` | GitHub API returned 401/403 | Check `GITHUB_TOKEN` has `repo` scope |
| `MKT.SYNC.API_QUOTA` | GitHub API rate limit hit | Wait for reset; use authenticated requests |
| `MKT.SYNC.PR_FAILED` | Could not open PR | Check token permissions; verify target branch exists |
| `MKT.SYNC.BAD_URL` | URL failed protocol allowlist | Only http/https URLs are allowed |
| `MKT.SYNC.OUTREACH_SKIP` | No MarketIR data for slug | Ensure tool JSON exists in marketing site data |
| `MKT.SYNC.OUTREACH_NO_TARGETS` | No targets.json for slug | Run `gen-targets.mjs` for this tool |
| `MKT.SYNC.OUTREACH_NO_CLAIMS` | Tool has no proven claims | Add proven claims with evidence to MarketIR definition |
| `MKT.SYNC.OUTREACH_DOMAIN` | Go-link URL hostname not in allowedDomains | Add hostname to `rules.allowedDomains` or fix go-link |
| `MKT.SYNC.QUEUE_RATE_LIMITED` | Items suppressed by weekly cap | Wait, or increase `outreach.maxPerToolPerWeek` |
| `MKT.SYNC.QUEUE_DEDUP` | Items suppressed by dedup window | Wait for window to expire, or reduce `dedupeWindowDays` |
| `MKT.SYNC.QUEUE_QUIET` | Items suppressed by quiet hours | Run outside quiet hours, or disable `quietHours` |

## Common scenarios

### "Press kit not found for slug X"

The press kit hasn't been generated yet, or the site hasn't been deployed.

```bash
# In the marketing site repo:
node scripts/gen-presskit.mjs
cd site && npm run build
# Deploy (push to main or run workflow)
```

### "API rate limit exceeded"

Set `GITHUB_TOKEN` for authenticated requests (5000 req/hr vs 60):

```bash
export GITHUB_TOKEN=ghp_...
node src/index.mjs --dry-run --config sync.config.json
```

### "Permission denied updating repo metadata"

The token needs `repo` scope to update description/homepage/topics. For public repos, `public_repo` scope is sufficient.

### "PR branch already exists"

A previous run created the branch but the PR wasn't merged. Either:

1. Merge or close the existing PR, then re-run
2. The tool will detect the existing branch and update it

### "Target repo owner is frozen"

The `freeze.disallowOwners` config blocks writes to specific GitHub owners. This is an intentional safety guard to prevent accidental writes during org-wide freezes (incident response, migrations, etc).

To unblock:

1. Remove the owner from `freeze.disallowOwners` in `sync.config.json`
2. Or disable the specific target (`"enabled": false`)

### "Domain not in allowlist"

The `rules.allowedDomains` config restricts which hostnames can appear in canonical URLs. If you're adding a new canonical source:

```json
"rules": {
  "allowedDomains": ["mcptoolshop.com", "new-domain.com"]
}
```

## Outreach queue scenarios

### "No MarketIR data for slug"

The tool's JSON file doesn't exist in the marketing site's data directory. Run the MarketIR generator:

```bash
# In the marketing site repo:
node scripts/gen-marketir.mjs
```

### "No targets.json for slug"

Target lists haven't been generated for this tool:

```bash
# In the marketing site repo:
GITHUB_TOKEN=ghp_... node scripts/gen-targets.mjs --slug zip-meta-map
```

### "No proven claims"

The tool has no claims with `status: "proven"` in its MarketIR definition. Outreach items are always traced to proven claims with evidence. Add claims and evidence to the tool's MarketIR JSON.

### "Items suppressed by rate limit"

The weekly cap (`outreach.maxPerToolPerWeek`) has been reached for a tool. Check `reports/outreach-history.json` to see recent items. Options:

1. Wait for the 7-day window to expire
2. Increase the cap in config (not recommended for most cases)

### "Items suppressed by dedup"

The same `{slug, triggerCategory, targetFullName}` combination was queued recently. Check `reports/outreach-history.json`. The dedup window is controlled by `outreach.dedupeWindowDays`.

### "Items suppressed by quiet hours"

The run timestamp fell within the configured quiet hours window. Re-run outside that window:

```json
"outreach": {
  "quietHours": { "start": "22:00", "end": "08:00", "tz": "America/New_York" }
}
```

### "Outreach queue is empty despite drift"

Outreach triggers are conservative by design. Common reasons for an empty queue:

1. **First run** — the first run with no previous presskit snapshot establishes a baseline. No triggers are produced.
2. **No material changes** — whitespace, casing, topic reorder, and trailing-slash changes are filtered out.
3. **No proven claims changed** — only proven claim additions, promotions, and text changes trigger outreach.
4. **All items suppressed** — check the suppressed array in `outreach-queue.json` for dedup/rate-limit/quiet-hours reasons.

### Resetting outreach history

To clear the dedup/rate-limit state and start fresh:

```bash
rm reports/outreach-history.json
```

To re-trigger outreach classification from scratch (force a "first run"):

```bash
rm reports/presskit-snapshots/<slug>.json
# Next run establishes a new baseline. The run after that will classify triggers.
```

## Manual override

If drift detection produces a false positive (canonical data is stale but GitHub is correct), skip a target temporarily:

```json
{
  "slug": "my-tool",
  "enabled": false
}
```

Re-enable after canonical data is refreshed.

## Workflow operations

### Weekly dry-run (automatic)

The `Weekly Drift Report` workflow runs every Monday at 08:00 UTC. It produces a plan artifact with no changes applied. Check the workflow run's "Summary" tab for the drift report.

### Manual apply

1. Go to Actions -> "Apply Drift Fixes"
2. Click "Run workflow"
3. Optionally enter a `target_slug` to apply to a single target
4. The `plan` job runs first (dry-run). Check the summary.
5. The `apply` job requires approval from the `link-fresh-apply` environment.
6. Approve in the GitHub UI to proceed with fixes.

> The `link-fresh-apply` environment must be created in GitHub repo settings with required reviewers.
