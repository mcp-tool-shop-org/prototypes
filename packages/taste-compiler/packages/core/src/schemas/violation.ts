import { z } from "zod";

export const ViolationClassSchema = z.enum([
  "visual-token",
  "component-grammar",
  "interaction-law",
  "copy-rule",
  "budget",
  "forbidden-pattern",
]);

export const ViolationSeveritySchema = z.enum(["error", "warn", "info"]);

export const ViolationEvidenceSchema = z.object({
  file: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
  snippet: z.string().optional(),
  value: z.string().optional(),
});

export const TasteViolationSchema = z.object({
  id: z.string().min(1),
  severity: ViolationSeveritySchema,
  class: ViolationClassSchema,
  ruleId: z.string().min(1),
  message: z.string().min(1),
  rationale: z.string().min(1),
  evidence: z.array(ViolationEvidenceSchema).default([]),
  suggestedFix: z.string().optional(),
});

export const TasteReportSchema = z.object({
  packVersion: z.string().min(1),
  product: z.string().min(1),
  target: z.string().min(1),
  checkedAt: z.string().min(1),
  violations: z.array(TasteViolationSchema),
  summary: z.object({
    errors: z.number().int(),
    warnings: z.number().int(),
    infos: z.number().int(),
    passed: z.boolean(),
  }),
});

export type ViolationClass = z.infer<typeof ViolationClassSchema>;
export type ViolationSeverity = z.infer<typeof ViolationSeveritySchema>;
export type ViolationEvidence = z.infer<typeof ViolationEvidenceSchema>;
export type TasteViolation = z.infer<typeof TasteViolationSchema>;
export type TasteReport = z.infer<typeof TasteReportSchema>;
