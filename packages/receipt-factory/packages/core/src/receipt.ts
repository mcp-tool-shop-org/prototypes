import { computeDigest, computeIntegrity } from "./hash.js";
import type {
  Receipt,
  ReceiptDraft,
  ReceiptKind,
  ReceiptSubject,
  ReceiptOutput,
  ReceiptEvidence,
  ReceiptVerification,
  ReceiptEnvironment,
  ReceiptPolicy,
  PolicyIdentity,
  ReceiptReference,
} from "./types.js";

/**
 * Fluent builder for constructing receipts.
 *
 * Usage:
 *   const receipt = new ReceiptBuilder("ci_run")
 *     .subject({ type: "repository", name: "my-repo", ref: "abc123" })
 *     .intent("Verify that tests pass on main branch")
 *     .addOutput({ name: "test-results", digest: "sha256:..." })
 *     .build();
 */
export class ReceiptBuilder {
  private _kind: ReceiptKind;
  private _subject?: ReceiptSubject;
  private _intent?: string;
  private _inputs: Record<string, unknown> = {};
  private _outputs: ReceiptOutput[] = [];
  private _evidence: ReceiptEvidence[] = [];
  private _verification: ReceiptVerification = { steps: [], commands: [] };
  private _environment: ReceiptEnvironment = { tool_versions: {} };
  private _policy: ReceiptPolicy = { redacted_fields: [], required_checks: [] };
  private _policyIdentity?: PolicyIdentity;
  private _metadata?: Record<string, unknown>;
  private _references: ReceiptReference[] = [];
  private _createdAt?: string;

  constructor(kind: ReceiptKind) {
    this._kind = kind;
  }

  subject(s: ReceiptSubject): this {
    this._subject = s;
    return this;
  }

  intent(i: string): this {
    this._intent = i;
    return this;
  }

  input(key: string, value: unknown): this {
    this._inputs[key] = value;
    return this;
  }

  inputs(obj: Record<string, unknown>): this {
    Object.assign(this._inputs, obj);
    return this;
  }

  addOutput(o: ReceiptOutput): this {
    this._outputs.push(o);
    return this;
  }

  addEvidence(e: ReceiptEvidence): this {
    this._evidence.push(e);
    return this;
  }

  verification(v: ReceiptVerification): this {
    this._verification = v;
    return this;
  }

  addStep(step: string): this {
    this._verification.steps.push(step);
    return this;
  }

  addCommand(cmd: string): this {
    this._verification.commands.push(cmd);
    return this;
  }

  environment(e: ReceiptEnvironment): this {
    this._environment = e;
    return this;
  }

  toolVersion(tool: string, version: string): this {
    this._environment.tool_versions[tool] = version;
    return this;
  }

  policy(p: ReceiptPolicy): this {
    this._policy = p;
    return this;
  }

  policyIdentity(pi: PolicyIdentity): this {
    this._policyIdentity = pi;
    return this;
  }

  meta(key: string, value: unknown): this {
    if (!this._metadata) this._metadata = {};
    this._metadata[key] = value;
    return this;
  }

  addReference(r: ReceiptReference): this {
    this._references.push(r);
    return this;
  }

  createdAt(iso: string): this {
    this._createdAt = iso;
    return this;
  }

  /**
   * Finalize the receipt: compute integrity hash and content-addressed ID.
   */
  build(): Receipt {
    if (!this._subject) throw new Error("Receipt requires a subject");
    if (!this._intent) throw new Error("Receipt requires an intent");

    const draft: ReceiptDraft = {
      receipt_version: "1.0.0",
      kind: this._kind,
      created_at: this._createdAt ?? new Date().toISOString(),
      subject: this._subject,
      intent: this._intent,
      inputs: this._inputs,
      outputs: this._outputs,
      evidence: this._evidence,
      verification: this._verification,
      environment: this._environment,
      policy: this._policy,
    };

    if (this._policyIdentity) {
      (draft as Record<string, unknown>).policy_identity = this._policyIdentity;
    }

    if (this._metadata && Object.keys(this._metadata).length > 0) {
      (draft as Record<string, unknown>).metadata = this._metadata;
    }

    if (this._references.length > 0) {
      (draft as Record<string, unknown>).references = this._references;
    }

    const integrity = computeIntegrity(draft as Record<string, unknown>);
    const id = computeDigest(draft);

    return {
      ...draft,
      id,
      integrity,
    };
  }
}
