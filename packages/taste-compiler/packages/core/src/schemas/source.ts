import { z } from "zod";

// --- Taste Source: raw human-authored inputs ---

export const TasteReferenceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["image", "url", "screenshot", "sketch", "note"]),
  uri: z.string().min(1),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const AntiExampleSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  uri: z.string().optional(),
  reason: z.string().min(1),
  category: z
    .enum([
      "too-enterprise",
      "too-playful",
      "too-dense",
      "too-chatty",
      "resemblance",
      "off-brand",
      "accessibility",
      "other",
    ])
    .optional(),
});

export const PrincipleSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().min(1),
});

export const CoreFlowStepSchema = z.union([
  z.object({
    route: z.string().min(1),
    purpose: z.string().optional(),
  }),
  z.string().min(1),
]);

export const CoreFlowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  steps: z.array(CoreFlowStepSchema).min(1),
  successCriteria: z.array(z.string()).optional(),
  invariants: z.array(z.string()).optional(),
});

export const CritiqueNoteSchema = z.object({
  id: z.string().min(1),
  target: z.string().optional(),
  note: z.string().min(1),
  severity: z.enum(["critical", "important", "suggestion"]).optional(),
});

export const BudgetInputSchema = z.object({
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
    .optional(),
});

export const ForbiddenPatternSeedSchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  rationale: z.string().min(1),
});

export const TasteSourceSchema = z.object({
  product: z.object({
    name: z.string().min(1),
    summary: z.string().min(1),
  }),
  references: z.array(TasteReferenceSchema).default([]),
  antiExamples: z.array(AntiExampleSchema).default([]),
  principles: z.array(PrincipleSchema).min(1),
  flows: z.array(CoreFlowSchema).default([]),
  critique: z.array(CritiqueNoteSchema).default([]),
  budgets: BudgetInputSchema.optional(),
  forbiddenPatternSeeds: z.array(ForbiddenPatternSeedSchema).default([]),
  metadata: z.object({
    createdBy: z.string().min(1),
    createdAt: z.string().min(1),
    version: z.string().min(1),
  }),
});

export type TasteReference = z.infer<typeof TasteReferenceSchema>;
export type AntiExample = z.infer<typeof AntiExampleSchema>;
export type Principle = z.infer<typeof PrincipleSchema>;
export type CoreFlowStep = z.infer<typeof CoreFlowStepSchema>;
export type CoreFlow = z.infer<typeof CoreFlowSchema>;
export type CritiqueNote = z.infer<typeof CritiqueNoteSchema>;
export type BudgetInput = z.infer<typeof BudgetInputSchema>;
export type ForbiddenPatternSeed = z.infer<typeof ForbiddenPatternSeedSchema>;
export type TasteSource = z.infer<typeof TasteSourceSchema>;
