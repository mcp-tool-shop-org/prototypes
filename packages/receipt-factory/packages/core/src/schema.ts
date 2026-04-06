import { z } from "zod";

export const receiptKindSchema = z.enum([
  "ci_run",
  "release",
  "registry_sync",
  "audit",
  "sbom",
  "delivery",
]);

export const receiptSubjectSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  ref: z.string().optional(),
  url: z.string().url().optional(),
});

export const receiptOutputSchema = z.object({
  name: z.string().min(1),
  digest: z.string().optional(),
  url: z.string().url().optional(),
  size: z.number().int().nonnegative().optional(),
});

export const receiptEvidenceSchema = z.object({
  type: z.string().min(1),
  url: z.string().url().optional(),
  description: z.string().min(1),
});

export const receiptVerificationSchema = z.object({
  steps: z.array(z.string()),
  commands: z.array(z.string()),
});

export const receiptEnvironmentSchema = z.object({
  runner: z.string().optional(),
  os: z.string().optional(),
  tool_versions: z.record(z.string(), z.string()),
});

export const receiptPolicySchema = z.object({
  redacted_fields: z.array(z.string()),
  required_checks: z.array(z.string()),
});

export const receiptIntegritySchema = z.object({
  algorithm: z.literal("sha256"),
  digest: z.string().min(1),
  canonical_format_version: z.literal("1.0"),
  canonical_length_bytes: z.number().int().positive(),
  signature: z.string().optional(),
  signed_by: z.string().optional(),
  signed_at: z.string().datetime().optional(),
  rekor_log_id: z.string().optional(),
});

export const policyIdentitySchema = z.object({
  hash: z.string().min(1),
  version: z.string().optional(),
  path: z.string().optional(),
  signed: z.boolean().optional(),
  signatureRef: z.string().optional(),
});

export const receiptReferenceSchema = z.object({
  kind: z.enum(["receipt", "evidence_pack"]),
  hash: z.string().min(1),
  description: z.string().min(1),
  path: z.string().optional(),
  url: z.string().url().optional(),
});

export const receiptSchema = z.object({
  receipt_version: z.literal("1.0.0"),
  kind: receiptKindSchema,
  id: z.string().min(1),
  created_at: z.string().datetime(),
  subject: receiptSubjectSchema,
  intent: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()),
  outputs: z.array(receiptOutputSchema),
  evidence: z.array(receiptEvidenceSchema),
  verification: receiptVerificationSchema,
  environment: receiptEnvironmentSchema,
  policy: receiptPolicySchema,
  integrity: receiptIntegritySchema,
  policy_identity: policyIdentitySchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  references: z.array(receiptReferenceSchema).optional(),
});

/** Validate a receipt object. Throws ZodError on failure. */
export function validateReceipt(data: unknown) {
  return receiptSchema.parse(data);
}

/** Safe validation — returns { success, data?, error? } */
export function safeValidateReceipt(data: unknown) {
  return receiptSchema.safeParse(data);
}
