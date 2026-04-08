# Role OS Rollout — Work Queue

Last updated: 2026-03-24

## Current

| Repo | Owner | Phase | Status |
|------|-------|-------|--------|
| asset-forge | Claude (this session) | lockdown | Claimed 2026-03-24. Lock candidate — generation/export truth. |

**Note:** 10 repos have scaffolded `.claude/` dirs but no context files. Each must be claimed and processed individually per doctrine.

## Recently completed

| Repo | Owner | Phase | Date | Verdict |
|------|-------|-------|------|---------|
| multi-claude | Claude | lockdown | 2026-03-24 | locked (10 criteria, 6 operational gaps) |
| artifact | Claude | lockdown | 2026-03-24 | locked (9 criteria, ARTIFACT-002 queued for correction signaling) |
| ai-loadout | Claude | lockdown | 2026-03-24 | locked (8 criteria, AILOADOUT-002 queued for malformed layer signaling) |
| claude-session-copilot | Claude | lockdown | 2026-03-24 | locked (9 criteria, 2 truth fixes shipped v1.0.1, COPILOT-002/003 queued) |
| synthesis | Claude | lockdown | 2026-03-24 | locked (8 criteria, 3 code fixes v1.0.1, org decision: explicit degradation) |
| mcp-aside | Claude | lockdown | 2026-03-24 | locked (8 criteria, clean lock, org decision: explicit lifecycle semantics) |
| registry-sync | Claude | lockdown | 2026-03-24 | locked (9 criteria, 4 truth concerns = granularity not lies, org decision: mutation outcome truth) |
| repo-crawler-mcp | Claude | lockdown | 2026-03-24 | locked (9 criteria, 3 blocking fixes v1.3.1, org decision: discovery truth) |
| brand | Claude | lockdown | 2026-03-24 | locked (9 criteria, clean lock, org decision: canonical identity truth) |
| repo-knowledge | Claude | lockdown | 2026-03-24 | locked (8 criteria, 3 blocking fixes v1.0.4, org decision: catalog evidence truth) |
| dogfood-labs | Claude | lockdown | 2026-03-24 | locked (9 criteria, CRITICAL provenance fix + 24 records remediated, org decision: real provenance required) |
| claude-hook-debug | Claude | lockdown | 2026-03-24 | locked (8 criteria, clean lock, org decision: config ≠ runtime observation) |

## Next (single-repo claims only)

| Order | Repo | Classification | Why next |
|-------|------|----------------|----------|
| 10 | claude-session-copilot | lock candidate | Hook binding, session truth |
| 11 | synthesis | lock candidate | Checker accuracy, false assurance risk |
| 12 | mcp-aside | lock candidate | TTL/dedupe contract |

**Init-only queue** (after lock candidates):
claude-memories, claude-rules, venvkit, nameops, websketch-cli

## Blocked

None.

## Completed

| Repo | Date | Verdict |
|------|------|---------|
| commandui | pre-rollout | locked (reference implementation) |
| shipcheck | 2026-03-24 | locked (first org rollout repo) |
| role-os | 2026-03-24 | locked (meta: tool that locks repos. 3 code fixes + remediation) |
| claude-guardian | 2026-03-24 | locked (clean lock. 9 reject criteria. Reassurance drift → org decision) |
| polyglot-mcp | 2026-03-24 | locked (clean lock. Fallback-warning legibility sharpened.) |
| site-theme | 2026-03-24 | locked (clean lock. CI matrix protection added.) |
| multi-claude | 2026-03-24 | locked (10 criteria, 6 operational gaps. Inverse liar-path added.) |
