---
title: API Reference
description: Programmatic API for linting, canonicalizing, diffing, and explaining policies.
sidebar:
  order: 3
---

All public exports are available from the package root:

```typescript
import {
  // Policy operations
  lintPolicy,
  canonicalizePolicy,
  diffPolicy,
  explainPolicy,

  // Registries
  ConstraintRegistry,
  ScorerRegistry,
  registerDefaultConstraints,
  registerDefaultScorers,

  // Decision engine
  DecisionEngine,

  // Context compilation
  compileEffectivePolicy,

  // Feature extraction
  extractTags,
  annotatePlanWithTags,

  // Feedback learning
  proposePolicyUpdates,

  // Types
  type PreferencePolicy,
  type Plan,
  type PlanEval,
  type DecisionTrace,
  type ConstraintSpec,
  type ConstraintResult,
  type ConstraintHandler,
  type LintReport,
  type LintIssue,
  type PolicyDiff,
  type PolicyDiffItem,
  type PolicyExplanation,
  type ExplainOptions,
  type ScorerFn,
  type FeedbackEvent,
  type PolicyUpdateProposal,
} from '@mcptoolshop/civility-kernel';
```

---

## lintPolicy

```typescript
function lintPolicy(
  policy: PreferencePolicy,
  deps: { registry: ConstraintRegistry; scorers?: ScorerRegistry }
): LintReport
```

Validates a policy for correctness and safety. Returns a `LintReport` with `ok: boolean` and an array of `LintIssue` objects.

**Checks performed:**
- `uncertaintyThreshold` is within `[0, 1]`
- No negative weights (warning) and weights do not sum to zero (error)
- All weight keys have registered scorers (warning if missing)
- All constraint IDs are registered (error if unknown)
- Constraint parameters pass Zod schema validation (error if invalid)
- No duplicate constraints with identical parameters (warning)
- Context rules do not add and remove the same constraint ID (warning)
- Context rule threshold overrides are within `[0, 1]`

**Issue severities:**
- `error` -- blocks the policy from being considered valid (`ok` will be `false`)
- `warn` -- the policy is technically valid but likely misconfigured
- `info` -- informational, does not affect validity

**Lint codes:**

| Code | Severity | Description |
|------|----------|-------------|
| `UNKNOWN_CONSTRAINT` | error | Constraint ID not found in registry |
| `INVALID_CONSTRAINT_PARAMS` | error | Parameters fail Zod schema validation |
| `DUPLICATE_CONSTRAINT` | warn | Same constraint with same params appears twice |
| `CONTEXT_CONSTRAINT_CONFLICT` | warn | Context rule adds and removes the same constraint |
| `MISSING_SCORER` | warn | Weight key has no registered scorer |
| `WEIGHTS_SUM_ZERO` | error | All weights are zero or negative |
| `NEGATIVE_WEIGHT` | warn | A weight has a negative value |
| `THRESHOLD_OUT_OF_RANGE` | error | Threshold is outside `[0, 1]` |

---

## canonicalizePolicy

```typescript
function canonicalizePolicy(
  policy: PreferencePolicy,
  registry: ConstraintRegistry
): PreferencePolicy
```

Returns a new `PreferencePolicy` in canonical form. The operation is idempotent -- calling it twice produces the same result.

**Normalization steps:**
1. Weight keys sorted alphabetically
2. Constraints sorted by ID, then by stable JSON serialization of parameters
3. Constraint parameters parsed through Zod schemas to fill defaults
4. Context rule adjustments (weights, added constraints, removed constraints) sorted

Use this before diffing to ensure meaningful comparisons, or before writing a policy to disk to maintain consistent formatting.

---

## diffPolicy

```typescript
function diffPolicy(
  a: PreferencePolicy,
  b: PreferencePolicy,
  registry?: ConstraintRegistry
): PolicyDiff
```

Compares two policies and returns a structured diff. Pass canonicalized policies for clean results.

**Diff item kinds:**

| Kind | Description |
|------|-------------|
| `weight_changed` | A weight's value changed |
| `weight_added` | A new weight key appeared |
| `weight_removed` | A weight key was removed |
| `constraint_added` | A constraint was added |
| `constraint_removed` | A constraint was removed |
| `threshold_changed` | The uncertainty threshold changed |
| `calibration_changed` | A calibration knob changed |
| `context_rule_added` | A new context rule appeared |
| `context_rule_removed` | A context rule was removed |
| `context_rule_changed` | A context rule's conditions or adjustments changed |

Each `PolicyDiffItem` includes a human-readable `message`, a `path` pointing to the affected field, and optional `meta` with before/after values.

---

## explainPolicy

```typescript
function explainPolicy(
  policy: PreferencePolicy,
  registry: ConstraintRegistry,
  opts?: ExplainOptions
): PolicyExplanation
```

Generates a human-readable explanation of what a policy does.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `"text" \| "markdown"` | `"text"` | Output format (bullets vs. markdown lists) |
| `includeWeights` | `boolean` | `true` | Include weight percentages |
| `includeCalibration` | `boolean` | `true` | Include calibration knobs |
| `includeMemoryKeys` | `boolean` | `false` | List stored memory keys |

Returns a `PolicyExplanation` with:
- `summary` -- one-line policy overview
- `lines` -- formatted explanation lines
- `warnings` -- issues found during explanation (unknown constraints, invalid params)

---

## ConstraintRegistry

```typescript
class ConstraintRegistry {
  register(id: string, handler: ConstraintHandler): void;
  getHandler(id: string): ConstraintHandler | undefined;
  evaluate(
    specs: ConstraintSpec[],
    plan: Plan,
    policy: PreferencePolicy
  ): ConstraintResult[];
}
```

The constraint registry holds all known constraint handlers. Use `registerDefaultConstraints(registry)` to load the built-in set.

### Writing a custom constraint

```typescript
import { z } from 'zod';

const registry = new ConstraintRegistry();

registry.register('max_steps', {
  schema: z.object({ limit: z.number().int().positive() }),
  describe: (params) => `Maximum ${params?.limit ?? '?'} steps allowed`,
  evaluate: (spec, plan) => {
    const limit = (spec.params as any).limit;
    if (plan.steps.length > limit) {
      return {
        ok: false,
        id: spec.id,
        params: spec.params,
        reason: `Plan has ${plan.steps.length} steps, limit is ${limit}`,
      };
    }
    return { ok: true, id: spec.id, params: spec.params };
  },
});
```

**ConstraintHandler fields:**
- `schema` (optional) -- Zod schema for parameter validation. If provided, parameters are validated at lint time and evaluation time.
- `describe` (optional) -- Returns a human-readable description of the constraint for diffs and explanations.
- `evaluate` (required) -- Returns `{ ok: boolean, id, params?, reason? }`. Return `ok: false` to block the plan.

---

## ScorerRegistry

```typescript
class ScorerRegistry {
  register(key: string, fn: ScorerFn): void;
  has(key: string): boolean;
  score(plan: Plan, policy: PreferencePolicy): Record<string, number>;
}
```

The scorer registry maps weight keys to scoring functions. Each scorer takes a plan and the effective policy, and returns a number. Scores are clamped to `[0, 1]` internally.

Use `registerDefaultScorers(registry)` to load the built-in set.

### Built-in scorers

| Key | Logic |
|-----|-------|
| `efficiency` | `1 / (1 + estimatedTimeSec / 60)` -- faster plans score higher |
| `low_risk` | `1 - stake * (1 - riskTolerance)` -- low-stake plans score higher, adjusted by calibration |
| `concise` | Returns `1` if `verbosity < 0.5`, otherwise `0.5` |

### Writing a custom scorer

```typescript
const scorers = new ScorerRegistry();

scorers.register('cost_efficiency', (plan, policy) => {
  const cost = plan.meta.estimatedCost ?? 0;
  // Lower cost = higher score, scaled by risk tolerance
  return 1 / (1 + cost * (1 - policy.calibration.riskTolerance));
});
```

---

## DecisionEngine

```typescript
class DecisionEngine {
  constructor(
    constraints: ConstraintRegistry,
    scorers: ScorerRegistry
  );

  decide(
    basePolicy: PreferencePolicy,
    context: string,
    plans: Plan[]
  ): { chosen?: Plan; trace: DecisionTrace };
}
```

The decision engine is the core runtime. It:

1. Compiles the effective policy by applying matching context rules
2. Evaluates all plans against hard constraints (fail-closed)
3. Scores surviving plans using registered scorers and policy weights
4. Computes utility as the weighted sum of scores
5. Returns the highest-utility plan, or escalates to the human

**Decision outcomes:**

| Outcome | Condition |
|---------|-----------|
| `EXECUTE` | At least one plan passes constraints and uncertainty is below threshold |
| `ASK_USER` | Plans pass constraints but uncertainty exceeds the threshold |
| `NO_VALID_PLAN` | All plans violated at least one hard constraint |

The `DecisionTrace` records everything: the effective policy, all candidates with their evaluations, the chosen plan ID, the outcome, rationale messages, and a timestamp. Use traces for auditing and debugging.

---

## compileEffectivePolicy

```typescript
function compileEffectivePolicy(
  base: PreferencePolicy,
  context: string,
  plans: Plan[]
): PreferencePolicy
```

Applies matching context rules to produce the effective policy for a given decision. This is called internally by `DecisionEngine.decide()` but is also exported for inspection and testing.

Context rules are evaluated in order. A rule applies when:
1. Its `context` field matches the provided context string
2. All `when` conditions are satisfied (or `when` is omitted)

Multiple matching rules are applied sequentially -- later rules can override earlier ones.

---

## extractTags / annotatePlanWithTags

```typescript
function extractTags(plan: Plan): string[]
function annotatePlanWithTags(plan: Plan): Plan
```

Automatic tag extraction from plan step content. `extractTags` scans each step's `detail` field for keywords and returns matching tags. `annotatePlanWithTags` returns a new plan with `meta.tags` populated.

**Detected tags:**

| Tag | Trigger keywords |
|-----|-----------------|
| `spend_money` | spend, purchase, buy, pay |
| `irreversible` | irreversible, cannot undo, permanent |
| `contact_external` | email, message, contact |
| `delete_file` | delete, remove, erase |

Tags are used by constraints like `max_spend_without_confirm` which checks for the `spend_money` tag.

---

## proposePolicyUpdates

```typescript
function proposePolicyUpdates(
  policy: PreferencePolicy,
  events: FeedbackEvent[]
): PolicyUpdateProposal[]
```

Analyzes user feedback events and proposes policy adjustments. This is the learning loop -- it turns patterns in user behavior into concrete policy patches that can be reviewed and approved through the normal governance workflow.

**FeedbackEvent types:**

| Type | Description |
|------|-------------|
| `CHOOSE_PLAN` | User selected a specific plan |
| `UNDO` | User undid an agent action |
| `THUMBS_UP` | Positive feedback on a decision |
| `THUMBS_DOWN` | Negative feedback (optionally with `weightKey`) |

**Proposal triggers:**

- 3+ `UNDO` events: proposes reducing `initiative` by 0.1 (actions are too proactive)
- 2+ `THUMBS_DOWN` with `weightKey: "concise"`: proposes reducing `verbosity` by 0.1
- 5+ `THUMBS_DOWN` with no other proposals: suggests requesting user clarification

Each `PolicyUpdateProposal` includes a `reason` string and a `patch` (partial policy) that can be merged after human review.
