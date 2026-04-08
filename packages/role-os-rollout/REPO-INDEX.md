# Role OS Rollout — Repo Index

Last updated: 2026-03-24

## Classification Key

| Value | Meaning |
|-------|---------|
| **init only** | Stable/published, low blast radius. `roleos init` + context fill, no seam law needed yet. |
| **lock candidate** | Published, clear seams, blast radius matters. Full lockdown with proving packet. |
| **full treatment** | Needs shipcheck + lockdown + treatment (7-phase polish + publish). |
| **deferred** | Archived, stale, or test fork. Not in rollout scope yet. |

## Status Key

| Value | Meaning |
|-------|---------|
| unstarted | Not yet claimed |
| claimed | Claude has claimed, work not begun |
| in audit | Context audit in progress |
| awaiting answer | Blocked on human decision |
| locked | Lockdown complete, proving packet passed |
| deferred | Explicitly deferred |

---

## Full Treatment Candidates

| Repo | Package | Type | Init | Locked | Highest-Risk Seam | Workflow | Packet | Owner | Status | Notes |
|------|---------|------|------|--------|-------------------|----------|--------|-------|--------|-------|
| shipcheck | @mcptoolshop/shipcheck | node | yes | yes | Exit-code contract (primary) | protect-audit-gates.md | SHIPCHECK-001 | Claude | locked | First rollout repo. 3 decisions locked, 2 code changes pending. |
| role-os | role-os | node | yes | yes | Bootstrap truth + contract drift | protect-bootstrap-truth.md | ROLEOS-001 | Claude | locked | Meta: locks the locker. 4 decisions locked, 3 code fixes, 2 repos remediated. |
| claude-guardian | @mcptoolshop/claude-guardian | node | yes | yes | Health checks + budget-system truth | protect-health-budget-truth.md | GUARDIAN-001 | Claude | locked | Clean lock. 9 reject criteria. Reassurance drift rule promoted to org. |
| brand | @mcptoolshop/brand | node | yes | yes | Identity truth (canonical/variant/integrity) | protect-brand-truth.md | BRAND-001 | Claude | locked | Identity truth seam. Clean lock. BRAND-002/003 queued. 15th lock. |
| multi-claude | @mcptoolshop/multi-claude | node | yes | yes | Lane isolation + dispatch truthfulness | protect-lane-isolation.md | MULTICLAUDE-001 | Claude | locked | Most complex lock. 10 criteria, 6 operational gaps accepted. |
| ai-ui | @mcptoolshop/ai-ui | node | no | no | Design diagnostics pipeline | — | — | — | unstarted | |
| commandui | commandui | node | yes | yes | Raw play lifecycle + terminal passthrough | done | done | — | locked | Reference implementation |
| registry-sync | @mcptoolshop/registry-sync | node | yes | yes | Write-path mutation truth | protect-mutation-truth.md | REGSYNC-001 | Claude | locked | Mutation truth seam. 4 truth concerns (granularity, not lies). REGSYNC-002/003/004 queued. |
| repo-crawler-mcp | @mcptoolshop/repo-crawler-mcp | node | yes | yes | Crawl/discovery truth | protect-discovery-truth.md | CRAWLER-001 | Claude | locked | Discovery truth seam. 3 blocking fixes shipped (v1.3.1). CRAWLER-005 queued. |
| repo-knowledge | @mcptoolshop/repo-knowledge | node | yes | yes | Catalog/schema mutation truth | protect-catalog-truth.md | REPOKNOW-001 | Claude | locked | 3 blocking fixes shipped (v1.0.4). Findings idempotent, schema drift explicit, FTS5 rebuilt. |
| dogfood-labs | dogfood-labs | data+tools | yes | yes | Evidence/provenance truth | protect-evidence-truth.md | DOGFOOD-001 | Claude | locked | CRITICAL: stub provenance killed. 24 records remediated. Production uses real GitHub API. |
| civility-kernel | @mcptoolshop/civility-kernel | node | no | no | Policy enforcement chain | — | — | — | unstarted | |
| vocal-synth-engine | @mcptoolshop/vocal-synth-engine | node | no | no | Audio pipeline + codec contract | — | — | — | unstarted | |
| claude-sfx | @mcptoolshop/claude-sfx | node | no | no | Procedural audio generation | — | — | — | unstarted | |
| claude-hook-debug | @mcptoolshop/claude-hook-debug | node | yes | yes | Observability/trace truth | protect-trace-truth.md | HOOKDEBUG-001 | Claude | locked | Clean lock. Architecture matches claims. Settings validator, not tracer. |
| ai-loadout | @mcptoolshop/ai-loadout | node | yes | yes | Knowledge dispatch correctness | protect-dispatch-truth.md | AILOADOUT-001 | Claude | locked | Dispatch/routing truth seam. AILOADOUT-002 queued (malformed layer signaling). |

## Lock Candidates

| Repo | Package | Type | Init | Locked | Highest-Risk Seam | Workflow | Packet | Owner | Status | Notes |
|------|---------|------|------|--------|-------------------|----------|--------|-------|--------|-------|
| polyglot-mcp | @mcptoolshop/polyglot-mcp | node | yes | yes | Translation dispatch + language negotiation | protect-translation-truth.md | POLYGLOT-001 | Claude | locked | Clean lock. Fallback-warning legibility sharpened. |
| site-theme | @mcptoolshop/site-theme | node | yes | yes | Scaffold contract integrity | protect-scaffold-contract.md | SITETHEME-001 | Claude | locked | Clean lock. CI matrix protection added. |
| ai-rpg-engine | ai-rpg-engine | node | no | no | Game state machine | — | — | — | unstarted | |
| soundweave | soundweave | node | no | no | Audio routing graph | — | — | — | unstarted | |
| composecraft | composecraft | node | no | no | Composition engine | — | — | — | unstarted | |
| glyphstudio | glyphstudio | node | no | no | Font rendering pipeline | — | — | — | unstarted | |
| studioflow | studioflow | node | no | no | Workflow engine | — | — | — | unstarted | |
| world-forge | world-forge | node | no | no | World generation state | — | — | — | unstarted | |
| ledger-suite | ledger-suite | node | no | no | Ledger integrity | — | — | — | unstarted | |
| portlight-desktop | portlight-desktop | node | no | no | Desktop app lifecycle | — | — | — | unstarted | |

## Init Only

| Repo | Package | Type | Init | Locked | Highest-Risk Seam | Owner | Status | Notes |
|------|---------|------|------|--------|-------------------|-------|--------|-------|
| ConsensusOS | @mcptoolshop/consensus-os | node | no | no | — | — | unstarted | |
| Registrum | @mcptoolshop/registrum | node | no | no | — | — | unstarted | |
| ThrottleAI | @mcptoolshop/throttleai | node | no | no | — | — | unstarted | |
| ToolShopStudio | @mcptoolshop/toolshopstudio | node | no | no | — | — | unstarted | |
| VectorCaliper | @mcptoolshop/vector-caliper | node | no | no | — | — | unstarted | |
| artifact | @mcptoolshop/artifact | node | yes | yes | Ollama fallback determinism | protect-fallback-determinism.md | ARTIFACT-001 | Claude | locked | Fallback/provider truth seam. ARTIFACT-002 queued (Curator correction signaling). |
| audit-speedrun | @mcptoolshop/audit-speedrun | node | no | no | — | — | unstarted | |
| backprop | @mcptoolshop/backprop | node | no | no | — | — | unstarted | |
| claude-memories | @mcptoolshop/claude-memories | node | no | no | — | — | unstarted | |
| claude-rules | @mcptoolshop/claude-rules | node | no | no | — | — | unstarted | |
| claude-session-copilot | @mcptoolshop/claude-session-copilot | node | yes | yes | Hook binding + session truth | protect-session-truth.md | COPILOT-001 | Claude | locked | State binding truth seam. 2 truth fixes shipped (v1.0.1). COPILOT-002/003 queued. |
| mcp-aside | @mcptoolshop/mcp-aside | node | yes | yes | Ephemeral lifecycle truth | protect-ephemeral-truth.md | ASIDE-001 | Claude | locked | Clean lock. 3 laws verified, 5 pressure paths. Org decision: explicit lifecycle semantics. |
| mcp-file-forge | @mcptoolshop/file-forge | node | no | no | — | — | unstarted | |
| mcp-shipcheck | @mcptoolshop/shipcheck | node | no | no | — | — | unstarted | Duplicate of shipcheck? |
| mcp-tool-registry | @mcptoolshop/mcp-tool-registry | node | no | no | — | — | unstarted | |
| mcpt-publishing | @mcptoolshop/mcpt-publishing | node | no | no | — | — | unstarted | |
| npm-launcher | @mcptoolshop/npm-launcher | node | no | no | — | — | unstarted | |
| registry-stats | @mcptoolshop/registry-stats | node | no | no | — | — | unstarted | |
| polyglot | polyglot | node | no | no | — | — | unstarted | |
| ai-jam-sessions | @mcptoolshop/ai-jam-sessions | node | no | no | — | — | unstarted | |
| ai-music-sheets | @mcptoolshop/ai-music-sheets | node | no | no | — | — | unstarted | |
| game-dev-mcp | @mcptoolshop/game-dev-mcp | node | no | no | — | — | unstarted | |
| venvkit | @mcptoolshop/venvkit | node | no | no | — | — | unstarted | |
| mcpt-logo-presets | @mcptoolshop/logo-presets | node | no | no | — | — | unstarted | |
| mcpt-logo-studio | @mcptoolshop/logo-studio | node | no | no | — | — | unstarted | |
| nameops | @mcptoolshop/nameops | node | no | no | — | — | unstarted | |
| synthesis | @mcptoolshop/synthesis | node | yes | yes | Verdict truthfulness under ambiguity | protect-verdict-truth.md | SYNTHESIS-001 | Claude | locked | Evaluator truth seam. 3 code fixes shipped (v1.0.1). Org decision: explicit degradation. |
| clearance-opinion-engine | @mcptoolshop/clearance-opinion-engine | node | no | no | — | — | unstarted | |
| prov-engine-js | @mcptoolshop/prov-engine-js | node | no | no | — | — | unstarted | |
| websketch-cli | @mcptoolshop/websketch | node | no | no | — | — | unstarted | |
| websketch-mcp | @mcptoolshop/websketch-mcp | node | no | no | — | — | unstarted | |
| npm-escape-the-valley | @mcptoolshop/escape-the-valley | node | no | no | — | — | unstarted | |
| npm-portlight | @mcptoolshop/portlight | node | no | no | — | — | unstarted | |
| npm-saints-mile | @mcptoolshop/saints-mile | node | no | no | — | — | unstarted | |
| npm-sovereignty | @mcptoolshop/sovereignty | node | no | no | — | — | unstarted | |
| npm-star-freight | @mcptoolshop/star-freight | node | no | no | — | — | unstarted | |
| npm-xrpl-camp | @mcptoolshop/xrpl-camp | node | no | no | — | — | unstarted | |
| npm-xrpl-lab | @mcptoolshop/xrpl-lab | node | no | no | — | — | unstarted | |

## Marketing Wing

| Repo | Package | Type | Init | Locked | Highest-Risk Seam | Owner | Status | Notes |
|------|---------|------|------|--------|-------------------|-------|--------|-------|
| mcp-tool-shop | mcp-tool-shop | node | no | no | Site build + data pipeline | — | unstarted | Marketing site |
| mcpt-marketing | mcpt-marketing | node | no | no | Claims/evidence integrity | — | unstarted | MarketIR |
| mcpt-link-fresh | @mcptoolshop/mcpt-link-fresh | node | no | no | Link drift detection | — | unstarted | Freshness sync |

## Deferred (Fresh/Test Forks)

backprop-fresh, backprop-test, backprop-audit, brand-fresh, shipcheck-fresh, InControl-Desktop-fresh, integradio-fresh, headless-wheel-builder-fresh, linux-dev-typer-fresh, vscode-voice-soundboard-fresh, backpropagate-fresh

## Deferred (Archived/Stale — 60+ days no commits)

ClaimLedger, CreatorLedger, CursorAssist, DeterministicMouseTrainingEngine, MouseTrainer, NextLedger, ScalarScope-Desktop, Trace, ally-demo-python, aspire-ai, audiobooker, backpropagate, brain-dev, code-batch, code-covered, context-window-manager, file-compass, flexiflow, nexus-attest, nexus-control, nexus-router, nexus-router-adapter-http, nexus-router-adapter-stdout, nexus-suite, nullout, pathway, py-polyglot, tool-compass, voice-soundboard, witness, xrpl-lab, zip-meta-map, avatar-face-mvp, avatar-runtime, build-governor, claude-collaborate, codeteam, codeteam-suite, dev-op-typer, jam-session-plugin, linux-dev-typer, mcp-bouncer, mcp-examples, mcp-org-github, mcp-personify, mcp-stress-test, mcp-voice-engine, mcp-voice-soundboard, meta-content-system, prototypes, receipt-factory, runforge-desktop, siege-kit, soundboard-maui, soundboard-plugin, stresskit-mcp, training-studio, homebrew-core, homebrew-mcp-tools, homebrew-mcp-tools-fix, nuget-signing-kit, registry-pulse
