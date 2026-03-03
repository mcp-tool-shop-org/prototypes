# NameOps Operational Playbook

## Weekly Cadence

NameOps runs on a weekly schedule (Tuesday 06:00 UTC) via the marketing repo's `nameops-scheduled.yml` workflow. The cycle:

1. **Tuesday**: Scheduled workflow runs, ingests artifacts, opens PR
2. **Tuesday–Thursday**: Review PR — check GREEN candidates, review RED/YELLOW collision cards
3. **Thursday**: Weekly clearance freshness runs (separate workflow, refreshes stale reports)
4. **Friday**: Merge approved PRs, lab pages update on deploy

## PR Review Process

Each scheduled run opens a PR with a structured body:

- **Summary**: Name count, tier distribution, runtime
- **GREEN candidates**: Ready to claim — verify availability before acting
- **Risky names (YELLOW/RED)**: Review collision cards, decide whether to drop
- **Cost stats**: Adapter call counts, cache hit rate
- **Review checklist**: Standardized items for consistent review

### Review Actions

| Tier | Action |
|------|--------|
| GREEN (score >= 80) | Safe to proceed — spot-check top conflicts |
| GREEN (score 60-79) | Review carefully — borderline cases may have hidden conflicts |
| YELLOW | Read collision cards — usually means partial namespace conflict |
| RED | Do NOT proceed — significant naming collision detected |

## RED Name Handling

When a name gets RED tier:

1. **Do not claim** the name on any registry
2. Review the collision cards to understand the conflict
3. Consider alternatives:
   - Add a prefix/suffix (`mcpt-<name>`, `<name>-cli`)
   - Choose a different name entirely
   - If the conflict is false positive, file an issue on the COE repo
4. Remove the name from `data/names.txt` or add a comment explaining the decision

## Adding Names

1. Edit `data/names.txt` in the nameops repo
2. One name per line, `#` for comments
3. Max 500 names (COE hard limit)
4. Push to `main` — the workflow triggers on data file changes
5. Or wait for the next scheduled Tuesday run

## Cost Monitoring

Each run logs adapter call counts and cache hit rates. Monitor:

- **Cache hit rate**: Should be >50% for recurring runs. Low rates mean stale cache or new names
- **Total calls**: Watch for spikes — may indicate rate limit issues
- **Runtime**: Target <15 minutes. If exceeding, reduce concurrency or name count

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Workflow timeout | Reduce `maxRuntimeMinutes` in profile.json or reduce name count |
| Rate limit errors | Increase `maxAgeHours` to use more cached results |
| COE not found | Check `npm install -g @mcptoolshop/clearance-opinion-engine` step |
| Empty results | Verify `data/names.txt` has uncommented names |
| PAT expired | Rotate the `NAMEOPS_PAT` secret in marketing repo settings |

## Configuration Changes

All configuration lives in `data/profile.json`. Changes take effect on next run.

Key levers:
- `concurrency`: Number of parallel COE checks (default 3)
- `maxAgeHours`: Cache staleness threshold (default 168 = 7 days)
- `channels`: Which registries to check (`all`, `core`, or comma-separated list)
- `risk`: Risk tolerance (`conservative`, `balanced`, `aggressive`)
