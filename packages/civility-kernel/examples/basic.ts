
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
  version: "1.0.0",
  weights: { efficiency: 0.7, low_risk: 0.3 },
  constraints: ["no_irreversible_changes", "confirm_spend_money"],
  contextRules: [
    {
      context: "high-stakes",
      when: { minStake: 0.7 },
      adjust: {
        uncertaintyThreshold: 0.35,
        weights: { low_risk: 0.6, efficiency: 0.4 }
      }
    }
  ],
  uncertaintyThreshold: 0.65,
  memory: {},
  calibration: { riskTolerance: 0.2, verbosity: 0.5, initiative: 0.5 }
};

const plans: Plan[] = [
  {
    id: "p1",
    summary: "Buy the item immediately",
    steps: [{ kind: "purchase", detail: "Checkout now" }],
    meta: {
      tags: ["spend_money"],
      uncertainty: 0.3,
      stake: 0.8,
      reversibility: 0,
      estimatedTimeSec: 10
    }
  },
  {
    id: "p2",
    summary: "Ask for budget and confirm, then buy",
    steps: [{ kind: "ask_user", detail: "What’s your max budget? Confirm purchase?" }],
    meta: {
      uncertainty: 0.15,
      stake: 0.8,
      reversibility: 1,
      estimatedTimeSec: 45
    }
  }
];

const { chosen, trace } = engine.decide(policy, "high-stakes", plans);

console.log("Outcome:", trace.outcome);
console.log("Chosen:", chosen?.id ?? "(none)");
console.log("Rationale:", trace.rationale.join(" | "));
console.log("\nTrace candidates:");
for (const c of trace.candidates) {
  console.log("-", c.plan.id, c.eval.passesConstraints ? "OK" : `REJECT(${c.eval.violatedConstraints.join(",")})`, "U=", c.eval.utility);
}
