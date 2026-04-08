import { z } from "zod";

// --- Visual Tokens ---

export const ColorTokenSchema = z.object({
  role: z.string().min(1),
  value: z.string().optional(),
  description: z.string().optional(),
});

export const TypographyTokenSchema = z.object({
  role: z.string().min(1),
  family: z.string().optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  size: z.string().optional(),
  description: z.string().optional(),
});

export const SpacingTokenSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
});

export const VisualTokenPackSchema = z.object({
  colors: z.array(ColorTokenSchema).default([]),
  typography: z.array(TypographyTokenSchema).default([]),
  spacing: z.array(SpacingTokenSchema).default([]),
  radii: z.array(SpacingTokenSchema).default([]),
  motion: z
    .array(
      z.object({
        name: z.string().min(1),
        duration: z.string().min(1),
        easing: z.string().optional(),
      })
    )
    .default([]),
});

// --- Component Grammar ---

export const CompositionRuleSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  rationale: z.string().optional(),
  sourceRef: z.string().optional(),
});

export const ComponentGrammarSchema = z.object({
  allowed: z.array(z.string()).default([]),
  banned: z.array(z.string()).default([]),
  compositionRules: z.array(CompositionRuleSchema).default([]),
});

// --- Interaction Laws ---

export const InteractionLawSchema = z.object({
  id: z.string().min(1),
  law: z.string().min(1),
  rationale: z.string().optional(),
  sourceRef: z.string().optional(),
  severity: z.enum(["error", "warn"]).default("error"),
});

// --- Copy Rules ---

export const CopyRuleSetSchema = z.object({
  bannedPhrases: z
    .array(
      z.object({
        phrase: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .default([]),
  toneWords: z
    .object({
      encouraged: z.array(z.string()).default([]),
      discouraged: z.array(z.string()).default([]),
    })
    .default({}),
  maxReadingLevel: z.string().optional(),
  claimQualifiers: z
    .array(
      z.object({
        pattern: z.string().min(1),
        qualifier: z.string().min(1),
      })
    )
    .default([]),
});

// --- Complexity Budgets ---

export const ComplexityBudgetSetSchema = z.object({
  maxTopLevelNavItems: z.number().int().positive().optional(),
  maxPrimaryActionsPerScreen: z.number().int().positive().optional(),
  maxModalDepth: z.number().int().positive().optional(),
  maxDistinctInteractionModesPerFlow: z.number().int().positive().optional(),
  custom: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        max: z.number(),
        unit: z.string().min(1),
      })
    )
    .default([]),
});

// --- Forbidden Patterns ---

export const ForbiddenPatternSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  reason: z.string().min(1),
  sourceRef: z.string().optional(),
  severity: z.enum(["error", "warn"]).default("error"),
  detection: z
    .object({
      componentNames: z.array(z.string()).optional(),
      classPatterns: z.array(z.string()).optional(),
      importPatterns: z.array(z.string()).optional(),
    })
    .optional(),
});

// --- Golden Flow Ref ---

export const GoldenFlowRefSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  routes: z.array(z.string()).min(1),
  invariants: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// --- Taste Pack (compiled output) ---

export const TastePackSchema = z.object({
  schemaVersion: z.literal("0.1.0"),
  packVersion: z.string().min(1),
  product: z.object({
    name: z.string().min(1),
    summary: z.string().min(1),
  }),
  provenance: z.object({
    sourceHash: z.string().min(1),
    compiledAt: z.string().min(1),
    compilerVersion: z.string().min(1),
  }),
  artifacts: z.object({
    visualTokens: VisualTokenPackSchema,
    componentGrammar: ComponentGrammarSchema,
    interactionLaws: z.array(InteractionLawSchema),
    copyRules: CopyRuleSetSchema,
    complexityBudgets: ComplexityBudgetSetSchema,
    forbiddenPatterns: z.array(ForbiddenPatternSchema),
  }),
  goldens: z.array(GoldenFlowRefSchema).default([]),
});

export type ColorToken = z.infer<typeof ColorTokenSchema>;
export type TypographyToken = z.infer<typeof TypographyTokenSchema>;
export type SpacingToken = z.infer<typeof SpacingTokenSchema>;
export type VisualTokenPack = z.infer<typeof VisualTokenPackSchema>;
export type CompositionRule = z.infer<typeof CompositionRuleSchema>;
export type ComponentGrammar = z.infer<typeof ComponentGrammarSchema>;
export type InteractionLaw = z.infer<typeof InteractionLawSchema>;
export type CopyRuleSet = z.infer<typeof CopyRuleSetSchema>;
export type ComplexityBudgetSet = z.infer<typeof ComplexityBudgetSetSchema>;
export type ForbiddenPattern = z.infer<typeof ForbiddenPatternSchema>;
export type GoldenFlowRef = z.infer<typeof GoldenFlowRefSchema>;
export type TastePack = z.infer<typeof TastePackSchema>;
