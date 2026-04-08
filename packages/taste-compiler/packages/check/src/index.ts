export { runChecks, buildReport } from "./checker.js";
export type { ExtractedTarget } from "./checker.js";

export { checkTokenViolations } from "./evaluators/token-checker.js";
export type { ExtractedStyle } from "./evaluators/token-checker.js";

export { checkGrammarViolations } from "./evaluators/grammar-checker.js";
export type {
  ExtractedComponent,
  ExtractedScreen,
} from "./evaluators/grammar-checker.js";

export { checkCopyViolations } from "./evaluators/copy-checker.js";
export type { ExtractedCopy } from "./evaluators/copy-checker.js";

export { checkBudgetViolations } from "./evaluators/budget-checker.js";
export type { ExtractedMetrics } from "./evaluators/budget-checker.js";

export { checkForbiddenPatternViolations } from "./evaluators/forbidden-checker.js";
export type { ExtractedClassUsage } from "./evaluators/forbidden-checker.js";

export { checkLawViolations } from "./evaluators/law-checker.js";
export type { ExtractedInteraction } from "./evaluators/law-checker.js";
