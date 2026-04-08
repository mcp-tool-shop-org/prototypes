---
title: Beginners Guide
description: New to agent governance? Learn the core concepts, build your first policy, and understand how Civility Kernel keeps agents in check.
sidebar:
  order: 99
---

This guide is for developers who are new to preference-governed agent behavior. It explains what Civility Kernel does, why it exists, and walks you through building your first policy from scratch.

## 1. What problem does this solve?

AI agents are good at optimizing for a goal. They are bad at knowing when to stop, when to ask, and what trade-offs you actually care about.

Without a governance layer, an agent that is told "book me a flight" might:
- Book the cheapest option without asking (ignoring your preference for direct flights)
- Spend $2,000 on a first-class ticket without confirmation
- Delete your existing reservation to "simplify" the itinerary

Civility Kernel solves this by inserting a policy layer between plan generation and plan execution. The agent generates candidate plans, and the kernel decides what happens next: execute the best option, ask the human, or reject everything.

The core pipeline:

```
generate -> filter (hard constraints) -> score (weights) -> choose OR ask
```

Hard constraints are non-negotiable rules (never spend more than $50 without asking). Weights express preferences (prefer faster options, but also prefer lower risk). When the agent is uncertain, it asks the human instead of guessing.

## 2. Key concepts

**Policy** -- A JSON document that defines your agent's boundaries and preferences. It contains constraints, weights, context rules, calibration knobs, and an uncertainty threshold. This is the single source of truth for how the agent should behave.

**Constraints** -- Hard rules that plans must pass. A plan that violates any constraint is rejected outright. Constraints can be simple (no irreversible changes) or parameterized (max spend $50 without confirmation). Unknown constraints fail closed -- they block the plan rather than silently allowing it.

**Weights** -- Numeric values that express how much you care about different dimensions (efficiency, risk, conciseness). The kernel normalizes weights internally, so `{ efficiency: 5, low_risk: 3 }` behaves the same as `{ efficiency: 0.5, low_risk: 0.3 }`.

**Scorers** -- Functions that evaluate a plan along one dimension and return a score between 0 and 1. Each weight key needs a matching scorer. The kernel multiplies each score by its weight and sums them to get a utility value.

**Uncertainty threshold** -- A number between 0 and 1. When the maximum uncertainty across candidate plans exceeds this threshold, the engine returns `ASK_USER` instead of executing automatically. Lower values make the agent ask more often.

**Context rules** -- Situational adjustments. In a "high-stakes-deploy" context, you might tighten the uncertainty threshold and boost the risk-avoidance weight. Context rules let one policy adapt to many situations without separate policy files.

**Calibration** -- Three behavioral knobs (riskTolerance, verbosity, initiative) that fine-tune how scorers evaluate plans. These are continuous values between 0 and 1.

## 3. Your first policy

Here is a minimal policy that you can save as `policies/default.json`:

```json
{
  "version": "1",
  "weights": {
    "efficiency": 0.6,
    "low_risk": 0.4
  },
  "constraints": [
    "no_irreversible_changes"
  ],
  "contextRules": [],
  "uncertaintyThreshold": 0.7,
  "memory": {},
  "calibration": {
    "riskTolerance": 0.3,
    "verbosity": 0.5,
    "initiative": 0.4
  }
}
```

This policy says:
- **Never** allow irreversible actions (hard constraint)
- Prefer efficiency (60%) over risk avoidance (40%)
- Ask the human when uncertainty exceeds 0.7
- Be somewhat cautious (riskTolerance 0.3), moderately verbose, and somewhat passive

## 4. Step-by-step walkthrough

### Install

```bash
npm i @mcptoolshop/civility-kernel
```

### Set up registries

Constraints and scorers live in typed registries. The library ships with sensible defaults:

```typescript
import {
  ConstraintRegistry,
  ScorerRegistry,
  registerDefaultConstraints,
  registerDefaultScorers,
  DecisionEngine,
  lintPolicy,
} from '@mcptoolshop/civility-kernel';

const constraints = new ConstraintRegistry();
registerDefaultConstraints(constraints);

const scorers = new ScorerRegistry();
registerDefaultScorers(scorers);
```

### Lint your policy

Always lint before using a policy. Linting catches misconfigured constraints, invalid parameters, and weight issues:

```typescript
const policy = {
  version: '1',
  weights: { efficiency: 0.6, low_risk: 0.4 },
  constraints: ['no_irreversible_changes'],
  contextRules: [],
  uncertaintyThreshold: 0.7,
  memory: {},
  calibration: { riskTolerance: 0.3, verbosity: 0.5, initiative: 0.4 },
};

const report = lintPolicy(policy, { registry: constraints, scorers });
if (!report.ok) {
  console.error('Policy has errors:', report.issues);
  process.exit(1);
}
console.log('Policy is valid');
```

### Define candidate plans

Plans represent the options your agent has generated. Each plan has an ID, summary, steps, and metadata:

```typescript
const plans = [
  {
    id: 'quick-fix',
    summary: 'Apply a quick automated patch',
    steps: [{ kind: 'code', detail: 'Apply patch to config file' }],
    meta: {
      estimatedTimeSec: 15,
      reversibility: 1,  // 1 = can be undone
      stake: 0.2,        // low stakes
      uncertainty: 0.1,  // high confidence
    },
  },
  {
    id: 'full-rewrite',
    summary: 'Rewrite the entire module',
    steps: [{ kind: 'code', detail: 'Delete and rewrite module from scratch' }],
    meta: {
      estimatedTimeSec: 3600,
      reversibility: 0,  // 0 = cannot be undone
      stake: 0.9,        // high stakes
      uncertainty: 0.5,
    },
  },
];
```

### Run the decision engine

```typescript
const engine = new DecisionEngine(constraints, scorers);
const { chosen, trace } = engine.decide(policy, 'code-review', plans);

console.log('Outcome:', trace.outcome);
console.log('Chosen:', chosen?.summary ?? '(none)');
console.log('Rationale:', trace.rationale.join(' | '));
```

In this example, `full-rewrite` is rejected because it has `reversibility: 0` and the policy includes `no_irreversible_changes`. The engine selects `quick-fix` and returns `EXECUTE`.

### Inspect the trace

The `DecisionTrace` records everything about the decision for auditing:

```typescript
for (const candidate of trace.candidates) {
  const status = candidate.eval.passesConstraints ? 'PASS' : 'REJECT';
  console.log(`${candidate.plan.id}: ${status}, utility=${candidate.eval.utility}`);
}
```

## 5. Common patterns

### Adding a spending limit

Use the `max_spend_without_confirm` constraint to require human approval for purchases over a threshold:

```json
{
  "constraints": [
    "no_irreversible_changes",
    { "id": "max_spend_without_confirm", "params": { "amount": 50, "currency": "USD" } }
  ]
}
```

Plans with the `spend_money` tag and an `estimatedCost` exceeding 50 will be blocked. The agent must ask the human before proceeding.

### Context-specific rules

Use context rules to adjust behavior in different situations. For example, tighten controls during production deployments:

```json
{
  "contextRules": [
    {
      "context": "production-deploy",
      "when": { "minStake": 0.5 },
      "adjust": {
        "uncertaintyThreshold": 0.3,
        "weights": { "low_risk": 0.8, "efficiency": 0.2 },
        "calibration": { "initiative": 0.1 }
      }
    }
  ]
}
```

When the engine receives context `"production-deploy"` and at least one plan has stake >= 0.5, the policy shifts to favor risk avoidance and reduce autonomous initiative.

### Auto-tagging plans

Use `annotatePlanWithTags` to automatically detect relevant tags from plan step descriptions:

```typescript
import { annotatePlanWithTags } from '@mcptoolshop/civility-kernel';

const plan = {
  id: 'buy-item',
  summary: 'Purchase the item',
  steps: [{ kind: 'action', detail: 'Buy item and pay with saved card' }],
  meta: { estimatedCost: 75 },
};

const tagged = annotatePlanWithTags(plan);
// tagged.meta.tags will include 'spend_money' (detected from 'buy' and 'pay')
```

### Writing a custom constraint

Register your own constraints with arbitrary logic:

```typescript
import { z } from 'zod';

constraints.register('max_steps', {
  schema: z.object({ limit: z.number().int().positive() }),
  describe: (params) => `Maximum ${(params as any)?.limit ?? '?'} steps`,
  evaluate: (spec, plan) => {
    const limit = (spec.params as any).limit;
    if (plan.steps.length > limit) {
      return { ok: false, id: spec.id, params: spec.params, reason: `Plan has ${plan.steps.length} steps (limit: ${limit})` };
    }
    return { ok: true, id: spec.id, params: spec.params };
  },
});
```

## 6. Governance workflow

Civility Kernel includes a CLI (`policy-check`) for managing policy files on disk. The intended workflow:

1. **Preview** -- See what your current policy does:
   ```bash
   npm run policy:explain
   ```

2. **Edit** -- Modify the policy file or create a new one.

3. **Propose** -- Lint the proposed policy, canonicalize it, and see a diff:
   ```bash
   npm run policy:propose
   ```

4. **Approve** -- The CLI prompts for explicit y/n consent. Nothing applies silently.

5. **Apply** -- The previous policy is backed up automatically, and the new canonical policy is written.

To roll back, copy the backup:
```bash
cp policies/previous.json policies/default.json
```

The governance workflow ensures that no policy change is ever applied without human review and explicit approval.

## 7. FAQ

**Q: What happens if I use a constraint that is not registered?**

The engine fails closed. The plan is blocked with a reason of "Unknown constraint (fail-closed)." This is deliberate -- it prevents silently allowing actions that should be governed.

**Q: Do I need Zod to use this library?**

Zod is a runtime dependency used for constraint parameter validation. You do not need to import Zod yourself unless you are writing custom constraints with parameter schemas. The built-in constraints use Zod internally.

**Q: Can I use this without the CLI?**

Yes. The CLI (`policy-check`) is a convenience wrapper. All core operations (lint, canonicalize, diff, explain, decide) are available as programmatic functions. Import them from `@mcptoolshop/civility-kernel` and use them directly in your application.

**Q: How do weights work? Do they need to sum to 1?**

No. Weights are normalized internally. `{ efficiency: 5, low_risk: 3 }` behaves identically to `{ efficiency: 0.625, low_risk: 0.375 }`. Use whatever scale is intuitive for you.

**Q: What are the three decision outcomes?**

- `EXECUTE` -- At least one plan passes all constraints, and uncertainty is below the threshold. The highest-utility plan is selected.
- `ASK_USER` -- Plans pass constraints, but the maximum uncertainty exceeds the threshold. The agent should present options to the human.
- `NO_VALID_PLAN` -- Every plan violated at least one hard constraint. The agent must ask the user to relax constraints or propose new options.

**Q: How does the learning system work?**

The `proposePolicyUpdates` function analyzes user feedback events (undo, thumbs up/down) and suggests concrete policy patches. For example, if the user frequently undoes actions, it proposes reducing the `initiative` calibration knob. Proposals are suggestions only -- they go through the same governance review workflow as any other policy change.

**Q: Is this library safe to use in production?**

Civility Kernel is a pure library with zero network requests, no telemetry, and no side effects. All operations are deterministic. It reads JSON policy files from the local filesystem and writes only when explicitly requested. See the [CLI & Security Reference](/civility-kernel/handbook/reference/) for the full threat model.
