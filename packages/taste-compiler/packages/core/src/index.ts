// Schemas
export {
  TasteReferenceSchema,
  AntiExampleSchema,
  PrincipleSchema,
  CoreFlowStepSchema,
  CoreFlowSchema,
  CritiqueNoteSchema,
  BudgetInputSchema,
  ForbiddenPatternSeedSchema,
  TasteSourceSchema,
} from "./schemas/source.js";

export type {
  TasteReference,
  AntiExample,
  Principle,
  CoreFlowStep,
  CoreFlow,
  CritiqueNote,
  BudgetInput,
  ForbiddenPatternSeed,
  TasteSource,
} from "./schemas/source.js";

export {
  ColorTokenSchema,
  TypographyTokenSchema,
  SpacingTokenSchema,
  VisualTokenPackSchema,
  CompositionRuleSchema,
  ComponentGrammarSchema,
  InteractionLawSchema,
  CopyRuleSetSchema,
  ComplexityBudgetSetSchema,
  ForbiddenPatternSchema,
  GoldenFlowRefSchema,
  TastePackSchema,
} from "./schemas/pack.js";

export type {
  ColorToken,
  TypographyToken,
  SpacingToken,
  VisualTokenPack,
  CompositionRule,
  ComponentGrammar,
  InteractionLaw,
  CopyRuleSet,
  ComplexityBudgetSet,
  ForbiddenPattern,
  GoldenFlowRef,
  TastePack,
} from "./schemas/pack.js";

export {
  ViolationClassSchema,
  ViolationSeveritySchema,
  ViolationEvidenceSchema,
  TasteViolationSchema,
  TasteReportSchema,
} from "./schemas/violation.js";

export type {
  ViolationClass,
  ViolationSeverity,
  ViolationEvidence,
  TasteViolation,
  TasteReport,
} from "./schemas/violation.js";

// Rule IDs
export { RULE_PREFIX, BUILTIN_RULES } from "./rules/ids.js";
export type { RuleId } from "./rules/ids.js";

// Diagnostics
export {
  formatViolation,
  formatReportText,
  formatReportMarkdown,
} from "./diagnostics/format.js";
