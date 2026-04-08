import {
  DecisionEngine,
  ConstraintRegistry,
  ScorerRegistry,
  registerDefaultConstraints,
  registerDefaultScorers,
  type PreferencePolicy,
  type Plan
} from "../src/index.js";

const constraints = new ConstraintRegistry();
registerDefaultConstraints(constraints);

const scorers = new ScorerRegistry();
registerDefaultScorers(scorers);

const engine = new DecisionEngine(constraints, scorers);

const policy: PreferencePolicy = {
  version: "1.1.0",
  weights: { efficiency: 0.6, low_risk: 0.4 },
  constraints: [
    "no_irreversible_changes",
    { id: "max_spend_without_confirm", params: { amount: 20, currency: "USD" } },
    { id: "require_confirm_if", params: { stakeGte: 0.7, irreversible: true } }
  ],
  contextRules: [
    {
      context: "work",
      adjust: {
        constraintsRemove: ["require_confirm_if"],
        constraintsAdd: [{ id: "max_spend_without_confirm", params: { amount: 200, currency: "USD" } }]
      }
    }
  ],
  uncertaintyThreshold: 0.7,
  memory: {},
  calibration: { riskTolerance: 0.3, verbosity: 0.4, initiative: 0.5 }
};

const plans: Plan[] = [
  {
    id: "buy-now-50",
    summary: "Buy now ($50)",
    steps: [{ kind: "purchase", detail: "Checkout" }],
    meta: {
      tags: ["spend_money"],
      estimatedCost: 50,
      stake: 0.8,
      uncertainty: 0.2,
      reversibility: 1,
      estimatedTimeSec: 10
    }
  },
  {
    id: "ask-confirm",
    summary: "Ask user to confirm purchase",
    steps: [{ kind: "ask_user", detail: "Confirm purchase?" }],
    meta: {
      stake: 0.8,
      uncertainty: 0.1,
      reversibility: 1,
      estimatedTimeSec: 45
    }
  }
];

// Try in "life-admin" (should reject buy-now-50 due to max_spend_without_confirm amount=20)
const life = engine.decide(policy, "life-admin", plans);
console.log("\n=== life-admin ===");
console.log("Outcome:", life.trace.outcome, "Chosen:", life.chosen?.id ?? "(none)");
console.log("Violations:", life.trace.candidates.find(c => c.plan.id === "buy-now-50")?.eval.violatedConstraints);

// Try in "work" (rule raises spend limit to 200 and removes require_confirm_if)
const work = engine.decide(policy, "work", plans);
console.log("\n=== work ===");
console.log("Outcome:", work.trace.outcome, "Chosen:", work.chosen?.id ?? "(none)");
