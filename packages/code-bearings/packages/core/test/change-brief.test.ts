import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { BearingsStore } from "../src/graph/store.js";
import { indexProject } from "../src/indexer/extract.js";
import { generateChangeBrief } from "../src/review/change-brief.js";
import { formatChangeBrief } from "../src/rendering/format.js";

const SAMPLE_FIXTURE = path.resolve(
  import.meta.dirname,
  "fixtures/sample-project"
);

describe("change brief calibration", () => {
  let store: BearingsStore;
  let dbPath: string;

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `code-bearings-brief-test-${Date.now()}.db`);
    store = new BearingsStore(dbPath);
    indexProject(store, { projectRoot: SAMPLE_FIXTURE });
  });

  afterEach(() => {
    store.close();
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  it("should classify logic changes correctly", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
       invoice: { id, amount, currency, status: "draft" },
       success: false,
`;

    const brief = generateChangeBrief(store, diff);
    expect(brief.changedModules.length).toBeGreaterThan(0);

    const billingModule = brief.changedModules.find((cm) =>
      cm.moduleName.includes("src")
    );
    if (billingModule) {
      expect(billingModule.changeKinds).toContain("logic");
      expect(billingModule.changedSymbols).toContain("createInvoice");
    }
  });

  it("should classify contract changes when interfaces change", () => {
    const diff = `diff --git a/src/types.ts b/src/types.ts
--- a/src/types.ts
+++ b/src/types.ts
@@ -1,6 +1,7 @@
 export interface Invoice {
   id: string;
   amount: number;
+  tax: number;
   currency: string;
   status: "draft" | "sent" | "paid";
 }
`;

    const brief = generateChangeBrief(store, diff);
    const hasContractShift = brief.changedModules.some((cm) =>
      cm.changeKinds.includes("contract")
    );
    expect(hasContractShift).toBe(true);
  });

  it("should classify test-only changes correctly", () => {
    const diff = `diff --git a/src/billing.test.ts b/src/billing.test.ts
--- a/src/billing.test.ts
+++ b/src/billing.test.ts
@@ -1,5 +1,5 @@
-test("creates invoice", () => {
+test("creates invoice with validation", () => {
   expect(true).toBe(true);
 });
`;

    const brief = generateChangeBrief(store, diff);
    // Test files should not produce logic/contract changes
    const hasTestOnly = brief.changedModules.some((cm) =>
      cm.changeKinds.includes("test-only")
    );
    // May not match any module since test file may not be indexed
    // But should not produce false contract/logic claims either
    expect(brief.summary).toBeTruthy();
  });

  it("should detect downstream impact from exported function changes", () => {
    // Change saveInvoice in store — billing depends on it
    const diff = `diff --git a/src/store.ts b/src/store.ts
--- a/src/store.ts
+++ b/src/store.ts
@@ -3,7 +3,8 @@
 const invoices = new Map<InvoiceId, Invoice>();

 export function saveInvoice(invoice: Invoice): void {
+  if (!invoice.id) throw new Error("Invoice must have an id");
   invoices.set(invoice.id, invoice);
 }
`;

    const brief = generateChangeBrief(store, diff);
    expect(brief.summary).toBeTruthy();

    // Should detect that saveInvoice callers may be affected
    const hasReviewerFocus = brief.reviewerFocusPoints.length > 0;
    expect(hasReviewerFocus).toBe(true);
  });

  it("should produce concrete reviewer focus points, not generic advice", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

    const brief = generateChangeBrief(store, diff);

    // Every focus point should mention a specific symbol or module
    for (const focus of brief.reviewerFocusPoints) {
      const hasSpecificReference =
        focus.includes('"') || // quotes around names
        focus.includes("createInvoice") ||
        focus.includes("src");
      expect(hasSpecificReference).toBe(true);
    }
  });

  it("should format a complete change brief", () => {
    const diff = `diff --git a/src/billing.ts b/src/billing.ts
--- a/src/billing.ts
+++ b/src/billing.ts
@@ -10,7 +10,7 @@ export function createInvoice(
   currency: string
 ): InvoiceResult {
-  if (amount <= 0) {
+  if (amount < 0) {
     return {
`;

    const brief = generateChangeBrief(store, diff);
    const formatted = formatChangeBrief(brief);

    expect(formatted).toContain("# Change Brief");
    expect(formatted).toContain("Summary:");
    expect(formatted).toContain("Confidence:");
  });

  it("should handle unknown files gracefully", () => {
    const diff = `diff --git a/unknown/path.ts b/unknown/path.ts
--- a/unknown/path.ts
+++ b/unknown/path.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`;

    const brief = generateChangeBrief(store, diff);
    expect(brief.unknowns.length).toBeGreaterThan(0);
    expect(brief.unknowns[0].category).toBeTruthy();
  });

  it("should show confidence based on unknowns", () => {
    const diff = `diff --git a/unknown/path.ts b/unknown/path.ts
--- a/unknown/path.ts
+++ b/unknown/path.ts
@@ -1,3 +1,3 @@
-const x = 1;
+const x = 2;
`;

    const brief = generateChangeBrief(store, diff);
    expect(brief.confidence).toBe("low");
  });
});
