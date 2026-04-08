# Role OS Rollout — Org-Wide Decisions

Reusable answers that apply across multiple repos.

---

## 2026-03-24 — Rollout ordering for full-treatment repos

**Decision:** shipcheck → lockdown → treatment. Lockdown is the repo-safety layer between gate and action.

**Why:** Shipcheck validates treatment is lawful. Lockdown validates Role OS understands the repo enough to avoid damage. Treatment is the staffed execution.

**Applies to:** All repos undergoing full treatment.

**Supersedes:** Nothing (first decision).

---

## 2026-03-24 — Lockdown without shipcheck is valid

**Decision:** For repos not undergoing full treatment, lockdown can happen without shipcheck.

**Why:** Lockdown is broader than treatment. A repo can be locked (defended against generic orchestration drift) without needing the full 31-item quality gate.

**Applies to:** Lock candidates not scheduled for full treatment.

**Supersedes:** Nothing.

---

## 2026-03-24 — Context file authoring model

**Decision:** Claude drafts from repo truth. Human pressure-tests and tightens. Then lock.

**Why:** Claude knows repo history and drift risks. Human ensures law is sharp enough to enforce. Neither alone produces the right result.

**Applies to:** All repos.

**Supersedes:** Nothing.

---

## 2026-03-24 — Exit code semantics: checker failure vs gate failure

**Decision:** For CLI tools that evaluate gates/rules:
- Exit 1 = tool/runtime/integration failure (checker could not complete its job)
- Exit 2 = evaluated gate failure (repo/target was evaluated and failed a rule)

A fetch failure, missing dependency, or broken checker is exit 1. A repo that was evaluated and found non-compliant is exit 2. Conflating these makes automation lie about what happened.

**Why:** Discovered during shipcheck lockdown. Dogfood fetch failure was ambiguous between "checker broke" and "repo failed." The distinction matters for every tool that gates releases.

**Applies to:** All CLI tools in the org that produce pass/fail gate results.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Init --force must protect user content

**Decision:** When any CLI tool has an `--force` or `--update` flag for re-initialization, it must always protect user-customized content. For Role OS: `context/` files are never overwritten by `--force`.

**Why:** Discovered during role-os lockdown. The init update path was missing entirely. When added, the first principle is: canonical scaffold files can be refreshed, user content cannot.

**Applies to:** role-os init, and any future CLI tool with re-initialization.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Nested directory bugs in scaffold tools are blocking defects

**Decision:** If a scaffold/init tool creates incorrect directory nesting (e.g., `.claude/.claude/`), it is a blocking defect that must be fixed before lockdown, with remediation of all affected repos tracked in rollout state.

**Why:** Discovered during role-os lockdown. The double-nested `.claude/` bug affected 2 repos (commandui, shipcheck) and was invisible until the proving packet probed it.

**Applies to:** All scaffold/init tools in the org.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Reassurance drift is a reject-worthy change category (org-wide)

**Decision:** Automatic reject if a change makes human-facing reassurance stronger while leaving machine-facing semantics unchanged. Operator understanding must track machine semantics.

**Why:** Discovered during claude-guardian lockdown. A tool can technically pass all tests while its human text drifts toward comfort language. The machine still says "warn" but the text now says "minor concern." This is a truth regression even though no code behavior changed.

**Applies to:** All tools that produce operator-facing output alongside machine-consumable signals. Especially: shipcheck, claude-guardian, role-os status.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Publish patch bumps throughout rollout

**Decision:** When lockdown audits produce code fixes to published packages, publish a patch bump immediately — do not accumulate fixes across repos.

**Why:** Fixes discovered during lockdown (like the double-nested .claude/ bug) affect the entire org. Delaying publish means other repos init with broken tooling.

**Applies to:** All published packages touched during rollout.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — One seam minimum, add more later

**Decision:** Start with the highest-risk seam per repo. One seam is the minimum for lock. Add additional seam workflows only after the first lock is proven.

**Why:** Forces prioritization. Gets defense live faster. Prevents over-documentation before proving the first defense works.

**Applies to:** All lock and full-treatment repos.

**Supersedes:** Nothing.

---

## 2026-03-24 — Initialized is not locked

**Decision:** `roleos init` is step 1, not the finish line. Do not mark a repo as locked just because files exist.

**Why:** Context templates and generic scaffolds don't defend anything. Lock means the system can reject the wrong change.

**Applies to:** All repos.

**Supersedes:** Nothing.

---

## 2026-03-24 — No batch init (one repo at a time)

**Decision:** Do not batch-initialize repos. Each repo must be claimed and processed individually through the full classify → context → seam → status cycle.

**Why:** Batch init was attempted on 10 repos and reverted. It produced rubber-stamped context files with shallow seam identification — exactly the drift the doctrine prevents. Coverage is not the bottleneck; quality of setup is.

**Applies to:** All remaining repos in the rollout queue.

**Supersedes:** Nothing (corrects an attempted shortcut).

---

## 2026-03-24 — Active truth defects block lock (not just future improvements)

**Decision:** If a lockdown audit finds that current docs/output already overclaim the seam the lock is meant to protect, the repo cannot be locked until the false claims are fixed. Follow-up improvement packets are for deeper enhancements; baseline truth corrections are blocking.

**Why:** Discovered during claude-session-copilot lockdown. The proving packet found that README/CLAUDE.md said "auto-record" when the mechanism is prompt-based, and resume presented stale snapshots as current. These are not future improvements — they are active truth violations of the seam the lock protects. Locking around false claims defeats the purpose.

**Applies to:** All repos. If the seam the lock protects is currently being violated by the repo's own docs/output, fix first, then lock.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Evaluator outputs must degrade explicitly under weak evidence

**Decision:** Evaluator outputs must degrade explicitly under weak, partial, ambiguous, stale, or near-threshold evidence; they must not share the same success surface as a clear pass.

**Why:** Discovered during synthesis lockdown. The pivot checker's borderline pass (ack + similarity 0.30-0.45) shared the exact same `pass: true` surface as a clear pass (ack + follow-up + high similarity). For a repo whose thesis is "do not create false assurance," this is a truth defect, not a cosmetic issue. Fixed by adding `pass_strength` field.

**Applies to:** All evaluator/checker/gate tools in the org. Any tool that produces pass/fail verdicts must surface when the verdict was near-threshold or based on weak evidence.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Ephemeral state must define identity, lifetime, and resurrection explicitly

**Decision:** Ephemeral side-channel state must define identity, lifetime, and resurrection semantics explicitly; expired or deduplicated state must not share the same outward surface as fresh state.

**Why:** Discovered during mcp-aside lockdown. The repo's architecture already met this standard — expired items never surface, deduped pushes get distinct codes, no resurrection mechanism exists. Promoting as org law because any future ephemeral-state tool must meet the same bar.

**Applies to:** All tools that manage temporary/ephemeral state. Identity must be defined (what makes two items "the same"), lifetime must be explicit (when does it expire, is TTL mutable), and resurrection must be impossible or explicitly semantic (re-push creates new state, not revived old state).

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Write-path systems must distinguish materially different mutation outcomes

**Decision:** Write-path systems must distinguish acceptance, commit, retry, partial failure, rollback, and duplicate suppression explicitly; materially different mutation outcomes must not share the same success surface.

**Why:** Discovered during registry-sync lockdown. The system correctly reports per-action success/failure (outcome truth holds), but truth concerns remain: orphaned remote state from multi-step partial failure, duplicate issue creation from non-idempotent apply, 422 retry based on assumptions about the failure cause, and auth/permission failure indistinguishable from other errors. A write-path can be imperfect without being dishonest, as long as it clearly reports what did and did not happen — but it must not claim atomicity, idempotency, or failure classification it doesn't have.

**Applies to:** All tools that perform write mutations against remote systems. Especially: registry-sync, any future publish/deploy/apply tool.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Discovery systems must distinguish incomplete from complete explicitly

**Decision:** Discovery systems must distinguish absent, excluded, failed, unreachable, partial, and stale explicitly; incomplete discovery must not share the same outward surface as complete discovery.

**Why:** Discovered during repo-crawler-mcp lockdown. The audit found that cached data was stamped with fresh timestamps, rate-limit truncation was indistinguishable from complete results, `totalReposFound` read like org total when it was filtered+limited output, and failed repos were absent from JSON results. These are not just missing diagnostics — they change what the caller is justified in believing about the discovered reality.

**Applies to:** All tools that discover, crawl, scan, or enumerate external state. The caller must be able to assess coverage completeness, data freshness, and absence causes from the response surface alone.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Brand systems must distinguish canonical from non-canonical explicitly

**Decision:** Brand systems must distinguish canonical, approved variant, derived export, draft, and deprecated assets explicitly; non-canonical assets must not share the same outward surface as official identity assets.

**Why:** Discovered during brand lockdown. The repo's architecture already met this standard — one canonical location per logo, SHA-256 manifest, CI verification, PR-based sync. Promoting as org law because any future identity/brand/asset system must meet the same bar: one canonical surface, one integrity contract, structural separation of derived from official.

**Applies to:** All tools that manage brand assets, logos, package identity, registry metadata, or any canonical-vs-derived identity distinction.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Catalog systems must distinguish canonical findings from ingestion events

**Decision:** Catalog and evidence systems must distinguish canonical findings from ingestion events; repeated import must not alter posture without underlying state change, and missing schema or stale indexes must be surfaced explicitly rather than tolerated silently.

**Why:** Discovered during repo-knowledge lockdown. Audit findings used plain INSERT — re-importing the same audit created duplicate findings, inflating severity counts in posture queries. The system told the truth about rows while looking like it told the truth about findings. Additionally, missing audit tables were silently tolerated (returning undefined instead of errors), and FTS5 index was not rebuilt after audit import.

**Applies to:** All tools that store evidence, audit results, or derived posture/status. Repeated ingestion must be idempotent or explicitly rejected. Missing schema must fail hard. Stale indexes must be surfaced.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Evidence systems must perform real provenance verification

**Decision:** Evidence systems must perform real provenance verification before minting verification claims; stub, assumed, or test-only verification must be structurally impossible to use as the production default.

**Why:** Discovered during dogfood-labs lockdown. The org evidence store defaulted to `stubProvenance` (always confirms) in production. Every accepted record had `provenance_confirmed: true` without GitHub API verification. A crafted submission with a fake run URL would pass through and be indexed as `verified: pass`. This was the most consequential trust defect in the entire rollout. Fixed by: requiring explicit provenance adapter (no default), hard-failing stub in CI, remediating 24 historical records.

**Applies to:** All evidence, verification, and attestation systems. Stub/test adapters must be structurally blocked from production use. Historical records ingested under stub verification must be remediated or downgraded.

**Supersedes:** Nothing (new decision).

---

## 2026-03-24 — Observability tools must distinguish static config from runtime behavior

**Decision:** Observability tools must distinguish static configuration from runtime behavior; settings snapshots must never share the same outward surface as execution traces.

**Why:** Discovered during claude-hook-debug lockdown. The tool reads 4 static settings files and pattern-matches known bugs — it does NOT observe runtime hook execution. Despite the name "hook-debug," it resists overclaiming: README says "diagnostic," not "trace." The PLUGIN_HOOKS_INVISIBLE diagnostic is the tool's own structural honesty. Promoting as org law because any future observability tool must maintain the same distinction.

**Applies to:** All tools that inspect, diagnose, or report on system configuration or behavior. Static configuration snapshots must never be presented as runtime observation or execution traces.

**Supersedes:** Nothing (new decision).
