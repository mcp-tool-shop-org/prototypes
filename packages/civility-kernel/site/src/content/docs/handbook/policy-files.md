---
title: Policy Files
description: Understand the PreferencePolicy format, constraints, weights, context rules, and calibration knobs.
sidebar:
  order: 2
---

A `PreferencePolicy` is the central data structure in Civility Kernel. It defines your agent's hard constraints, soft preferences, situational adjustments, and behavioral calibration -- all in a single JSON document.

## File conventions

The recommended directory layout:

```
policies/
  default.json      # Active policy
  previous.json     # Automatic rollback target
  profiles/
    work.json       # Named profile: high initiative, low verbosity
    safe-mode.json  # Named profile: low risk tolerance, ask more often
```

## Policy structure

A complete `PreferencePolicy` has these top-level fields:

```json
{
  "version": "1",
  "weights": { ... },
  "constraints": [ ... ],
  "contextRules": [ ... ],
  "uncertaintyThreshold": 0.7,
  "memory": {},
  "calibration": {
    "riskTolerance": 0.3,
    "verbosity": 0.5,
    "initiative": 0.4
  }
}
```

### version

A string identifying the policy schema version. Used for forward compatibility.

### weights

A record of `string -> number` pairs that define how the agent scores surviving plans. Each key names a scoring dimension (e.g., `efficiency`, `low_risk`, `concise`), and the value is the relative importance.

```json
{
  "efficiency": 0.5,
  "low_risk": 0.3,
  "concise": 0.2
}
```

Weights are normalized internally, so `{ efficiency: 5, low_risk: 3 }` and `{ efficiency: 0.5, low_risk: 0.3 }` produce the same behavior. Negative weights trigger a lint warning. All-zero weights are a lint error (the agent cannot score plans).

Each weight key must have a corresponding scorer registered in the `ScorerRegistry`. Missing scorers produce a lint warning and contribute zero utility.

### constraints

An array of hard constraints that plans must pass. Each entry is either a plain string (constraint ID) or an object with `id` and optional `params`:

```json
[
  "no_irreversible_changes",
  { "id": "max_spend_without_confirm", "params": { "amount": 50, "currency": "USD" } },
  { "id": "require_confirm_if", "params": { "stakeGte": 0.8, "irreversible": true } }
]
```

**Fail-closed behavior:** If a constraint ID is not registered in the `ConstraintRegistry`, it blocks the plan (fails closed) rather than silently allowing it. This is a deliberate safety choice.

**Parameter validation:** If a constraint handler defines a Zod schema, parameters are validated at lint time and at evaluation time. Invalid parameters cause the constraint to fail closed.

### Built-in constraints

Civility Kernel ships with three default constraints:

| ID | Parameters | Behavior |
|----|-----------|----------|
| `no_irreversible_changes` | None | Blocks any plan where `meta.reversibility === 0` |
| `max_spend_without_confirm` | `amount: number`, `currency?: string` | Blocks plans tagged `spend_money` whose `estimatedCost` exceeds `amount` |
| `require_confirm_if` | `stakeGte: number [0-1]`, `irreversible?: boolean` | Blocks plans where stake meets the threshold (and optionally where the plan is irreversible) |

You can register your own constraints with arbitrary logic and Zod-validated parameters.

### contextRules

Context rules let the policy adapt to different situations without creating separate policy files. Each rule matches a named context and adjusts the effective policy:

```json
{
  "context": "high-stakes-deploy",
  "when": {
    "minStake": 0.7,
    "tagsAny": ["deploy", "production"]
  },
  "adjust": {
    "weights": { "low_risk": 0.8 },
    "constraintsAdd": [{ "id": "require_confirm_if", "params": { "stakeGte": 0.5 } }],
    "constraintsRemove": [],
    "uncertaintyThreshold": 0.3,
    "calibration": { "initiative": 0.1 }
  }
}
```

**Matching logic:**
- `context` must match the context string passed to `DecisionEngine.decide()`.
- `when` conditions are optional. If present, all specified conditions must be met:
  - `minStake` -- the maximum stake across all candidate plans must be at least this value
  - `maxUncertainty` -- the maximum uncertainty must not exceed this value
  - `tagsAny` -- at least one candidate plan must have one of these tags

**Adjustments:**
- `weights` -- merge new weight values (overrides existing keys, adds new ones)
- `constraintsAdd` -- append additional constraints to the effective constraint list
- `constraintsRemove` -- remove constraints by ID from the effective list
- `uncertaintyThreshold` -- override the base threshold for this context
- `calibration` -- merge calibration overrides

Lint catches conflicts where the same constraint ID appears in both `constraintsAdd` and `constraintsRemove` within the same rule.

### uncertaintyThreshold

A number between 0 and 1. When the maximum uncertainty across candidate plans exceeds this threshold, the decision engine returns `ASK_USER` instead of `EXECUTE`, forcing the agent to present options to the human.

Lower values make the agent ask more often. Higher values make it more autonomous.

### calibration

Three behavioral knobs, each a number between 0 and 1:

| Knob | Low value | High value |
|------|-----------|------------|
| `riskTolerance` | Cautious -- prefers safe, low-stake plans | Bold -- tolerates higher-stake actions |
| `verbosity` | Terse -- brief explanations | Verbose -- detailed explanations |
| `initiative` | Passive -- waits for instructions | Proactive -- takes action when confident |

Calibration values feed into scorer functions. For example, the built-in `low_risk` scorer uses `riskTolerance` to adjust how strongly it penalizes high-stake plans.

### memory

A freeform `Record<string, unknown>` for storing persistent preferences or learned user behavior. The kernel does not interpret this field directly -- it is available for your application to read and write.

## Plan metadata

Plans submitted to the `DecisionEngine` carry metadata that constraints and scorers use:

```typescript
{
  id: string;
  summary: string;
  steps: Array<{ kind: string; detail: string }>;
  meta: {
    estimatedCost?: number;
    estimatedTimeSec?: number;
    reversibility?: 0 | 1;
    stake?: number;        // 0 = trivial, 1 = critical
    uncertainty?: number;  // 0 = certain, 1 = total guess
    tags?: string[];
  };
}
```

The `reversibility` field is binary: `1` means the action can be undone, `0` means it cannot. The `stake` and `uncertainty` fields are continuous values on the `[0, 1]` range.

## Canonicalization

Running `canonicalizePolicy()` on a policy:

1. Sorts weight keys alphabetically
2. Sorts constraints by ID, then by stable JSON of parameters
3. Fills Zod-validated defaults for constraint parameters
4. Sorts context rule adjustments (weights, added/removed constraints)

This ensures that semantically identical policies produce byte-identical JSON output, eliminating noisy diffs in version control.
