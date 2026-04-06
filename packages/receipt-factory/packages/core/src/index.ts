// Types
export type {
  Receipt,
  ReceiptDraft,
  ReceiptKind,
  ReceiptSubject,
  ReceiptOutput,
  ReceiptEvidence,
  ReceiptReference,
  ReceiptVerification,
  ReceiptEnvironment,
  ReceiptPolicy,
  PolicyIdentity,
  ReceiptIntegrity,
} from "./types.js";

// Schema validation (Zod)
export {
  receiptSchema,
  receiptKindSchema,
  receiptSubjectSchema,
  receiptOutputSchema,
  receiptEvidenceSchema,
  receiptVerificationSchema,
  receiptEnvironmentSchema,
  receiptPolicySchema,
  receiptIntegritySchema,
  receiptReferenceSchema,
  policyIdentitySchema,
  validateReceipt,
  safeValidateReceipt,
} from "./schema.js";

// Canonicalization
export { canonicalize } from "./canonical.js";

// Hashing / integrity
export { computeDigest, computeIntegrity, verifyIntegrity } from "./hash.js";

// Builder
export { ReceiptBuilder } from "./receipt.js";

// Errors
export { RfError, wrapError } from "./errors.js";
