
import { ConstraintRegistry, registerDefaultConstraints, explainPolicy, type PreferencePolicy } from "../src/index.js";

const reg = new ConstraintRegistry();
registerDefaultConstraints(reg);

// Debug: direct call to getHandler (after reg is initialized)
console.log('Direct getHandler:', reg.getHandler('no_irreversible_changes'));
// Debug: print registered constraint IDs
console.log("Registered constraint IDs:", Array.from(reg["handlers"].keys()));

const policy: PreferencePolicy = {
  version: "1.2.0",
  weights: { efficiency: 0.6, low_risk: 0.4 },
  constraints: [
    "no_irreversible_changes",
    { id: "max_spend_without_confirm", params: { amount: 20, currency: "USD" } }
  ],
  contextRules: [],
  uncertaintyThreshold: 0.65,
  memory: {},
  calibration: { riskTolerance: 0.3, verbosity: 0.4, initiative: 0.5 }
};

const exp = explainPolicy(policy, reg, { format: "markdown" });
console.log(exp.summary);
console.log(exp.lines.join("\n"));
if (exp.warnings.length) console.log("\nWarnings:\n" + exp.warnings.join("\n"));
