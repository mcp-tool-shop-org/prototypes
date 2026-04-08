<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

A policy layer that makes agent behavior **preference-governed** instead of purely efficiency-maximizing.

Your agent generates candidate plans. The kernel decides what happens next:

**generate → filter (hard constraints) → score (weights) → choose OR ask**

Hard constraints are non-negotiable. Soft preferences guide tradeoffs. Uncertainty can force “ask the human.”

---

## Install

```bash
npm i @mcptoolshop/civility-kernel
```

## Quick start

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

The kernel wires constraints, scorers, and the decision engine in one call. Use `decideAsync()` for I/O-bound constraint checks.

## The human governance loop

You can always see what your policy does.
The agent must show changes before they apply.
You can roll back.
Nothing silently updates.

Preview the policy contract:
```bash
npm run policy:explain
```

Propose an update (shows diff, prompts for approval):
```bash
npm run policy:propose
```

Canonicalize the current policy file (format-only normalization):
```bash
npm run policy:canonicalize
```

### Automatic rollback safety

When applying changes, `policy-check` can back up the old policy first:

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## Policy files

Recommended convention:

- `policies/default.json` — active policy
- `policies/previous.json` — automatic rollback target
- `policies/profiles/*.json` — named profiles (work / low-friction / safe-mode)

## CLI options (policy-check)

- `--explain` — print a human-readable policy summary
- `--propose <file>` — lint + show canonicalized diff + prompt approval
- `--apply` — rewrite the policy file in canonical form
- `--write-prev <file>` — back up the old canonical policy before overwriting
- `--diff short|full` — short shows “headline” changes; full shows everything
- `--prev <file>` — deterministic CI diff mode

## Public API

**Kernel (recommended entry point):**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — pre-wired facade with decide, lint, explain, diff, and learning
- `PolicyBuilder` — fluent chainable API for constructing validated policies

**Policy operations:**

- `lintPolicy(policy, { registry, scorers })` — validate a policy for errors and warnings
- `canonicalizePolicy(policy, registry)` — normalize a policy to canonical form
- `diffPolicy(a, b, registry?)` — structured diff between two policies
- `explainPolicy(policy, registry, opts?)` — human-readable policy summary

**Persistence:**

- `loadPolicy(json)` — Zod-validated policy loading from unknown input
- `dumpPolicy(policy)` — deterministic JSON serialization (sorted keys)
- `PreferencePolicySchema` — exported Zod schema for runtime validation

**Decision engine:**

- `DecisionEngine` — evaluates candidate plans against a policy (filter → score → choose or ask)
- `decideAsync()` — async variant for I/O-bound constraint checks
- `compileEffectivePolicy(base, context, plans)` — applies context rules (supports glob patterns like `tool:*`)
- `onDecision` hook — optional callback for logging/metrics on every decision

**Registries:**

- `ConstraintRegistry` — register and evaluate hard constraints (with optional Zod parameter schemas + async support)
- `ScorerRegistry` — register scoring functions for weight keys
- `registerDefaultConstraints(registry)` — loads built-in constraints (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — loads built-in scorers (`efficiency`, `low_risk`, `concise`)

**Learning loop:**

- `proposePolicyUpdates(policy, events)` — suggest policy adjustments from user feedback events
- `applyPolicyProposal(policy, proposal)` — merge a proposal back into the policy (closes the loop)
- Extended feedback: `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`

**MCP integration:**

- `planFromMcpToolCall(call, meta?)` — convert an MCP tool call to a Plan
- `feedbackFromMcpResult(result, planId)` — convert an MCP result to a FeedbackEvent

**Utilities:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — auto-tag plans based on step content
- `matchesContext(pattern, context)` — glob-aware context pattern matching

## CI

CI runs:
- tests (143 tests across 17 files)
- build
- `policy-check --strict` against fixtures (`policies/default.json` vs `policies/previous.json`)

This prevents shipping broken policies or misleading diffs.

## Development

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## Security & Data Scope

Civility Kernel is a **pure library** — no network requests, no telemetry, no side effects.

- **Data accessed:** Reads JSON policy files from local filesystem. Validates, canonicalizes, and diffs policy documents in-process. All operations are deterministic.
- **Data NOT accessed:** No network requests. No telemetry. No credential storage. The kernel evaluates policy constraints — it does not observe or log agent actions.
- **Permissions required:** File system read for policy JSON files. Write only when explicitly requested via `--apply`.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Scorecard

| Category | Score |
|----------|-------|
| Security | 10/10 |
| Error Handling | 10/10 |
| Operator Docs | 10/10 |
| Shipping Hygiene | 10/10 |
| Identity | 10/10 |
| **Overall** | **50/50** |

---

## License

MIT (see LICENSE)

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
