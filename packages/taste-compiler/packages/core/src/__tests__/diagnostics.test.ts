import { describe, it, expect } from "vitest";
import {
  formatViolation,
  formatReportText,
  formatReportMarkdown,
} from "@taste-compiler/core";
import type { TasteViolation, TasteReport } from "@taste-compiler/core";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeViolation(overrides: Partial<TasteViolation> = {}): TasteViolation {
  return {
    id: "v1",
    severity: "error",
    class: "budget",
    ruleId: "budget-nav-items",
    message: "Too many nav items",
    rationale: "Budget limits nav to 5",
    evidence: [],
    ...overrides,
  };
}

function makeReport(overrides: Partial<TasteReport> = {}): TasteReport {
  return {
    packVersion: "0.1.0",
    product: "Ritual",
    target: "src/App.tsx",
    checkedAt: "2026-04-01T00:00:00Z",
    violations: [],
    summary: { errors: 0, warnings: 0, infos: 0, passed: true },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatViolation
// ---------------------------------------------------------------------------

describe("formatViolation", () => {
  it("includes rule ID in output", () => {
    const out = formatViolation(makeViolation());
    expect(out).toContain("budget-nav-items");
  });

  it("includes message in output", () => {
    const out = formatViolation(makeViolation());
    expect(out).toContain("Too many nav items");
  });

  it("includes rationale prefixed with Why:", () => {
    const out = formatViolation(makeViolation());
    expect(out).toContain("Why: Budget limits nav to 5");
  });

  it("shows ERROR prefix for error severity", () => {
    const out = formatViolation(makeViolation({ severity: "error" }));
    expect(out).toContain("[ERROR]");
  });

  it("shows WARN prefix for warn severity", () => {
    const out = formatViolation(makeViolation({ severity: "warn" }));
    expect(out).toContain("[WARN]");
  });

  it("shows INFO prefix for info severity", () => {
    const out = formatViolation(makeViolation({ severity: "info" }));
    expect(out).toContain("[INFO]");
  });

  it("includes evidence file location", () => {
    const v = makeViolation({
      evidence: [{ file: "src/Nav.tsx", line: 10 }],
    });
    const out = formatViolation(v);
    expect(out).toContain("src/Nav.tsx:10");
  });

  it("includes evidence snippet", () => {
    const v = makeViolation({
      evidence: [{ snippet: "<KPIPanel />" }],
    });
    const out = formatViolation(v);
    expect(out).toContain("<KPIPanel />");
  });

  it("includes evidence value", () => {
    const v = makeViolation({
      evidence: [{ value: "KPIPanel" }],
    });
    const out = formatViolation(v);
    expect(out).toContain("value: KPIPanel");
  });

  it("includes suggested fix when present", () => {
    const v = makeViolation({ suggestedFix: "Remove the panel" });
    const out = formatViolation(v);
    expect(out).toContain("Fix: Remove the panel");
  });

  it("omits fix line when no suggested fix", () => {
    const out = formatViolation(makeViolation());
    expect(out).not.toContain("Fix:");
  });
});

// ---------------------------------------------------------------------------
// formatReportText
// ---------------------------------------------------------------------------

describe("formatReportText", () => {
  it("includes product name and version", () => {
    const out = formatReportText(makeReport());
    expect(out).toContain("Ritual@0.1.0");
  });

  it("shows PASSED for passing report", () => {
    const out = formatReportText(makeReport());
    expect(out).toContain("PASSED");
  });

  it("shows FAILED for failing report", () => {
    const report = makeReport({
      violations: [makeViolation()],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportText(report);
    expect(out).toContain("FAILED");
  });

  it("includes target path", () => {
    const out = formatReportText(makeReport());
    expect(out).toContain("src/App.tsx");
  });

  it("includes violation counts", () => {
    const report = makeReport({
      summary: { errors: 2, warnings: 1, infos: 3, passed: false },
    });
    const out = formatReportText(report);
    expect(out).toContain("2 errors");
    expect(out).toContain("1 warnings");
    expect(out).toContain("3 info");
  });

  it("groups errors under Errors heading", () => {
    const report = makeReport({
      violations: [makeViolation({ severity: "error" })],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportText(report);
    expect(out).toContain("## Errors");
  });

  it("groups warnings under Warnings heading", () => {
    const report = makeReport({
      violations: [makeViolation({ id: "v2", severity: "warn" })],
      summary: { errors: 0, warnings: 1, infos: 0, passed: true },
    });
    const out = formatReportText(report);
    expect(out).toContain("## Warnings");
  });

  it("groups infos under Info heading", () => {
    const report = makeReport({
      violations: [makeViolation({ id: "v3", severity: "info" })],
      summary: { errors: 0, warnings: 0, infos: 1, passed: true },
    });
    const out = formatReportText(report);
    expect(out).toContain("## Info");
  });
});

// ---------------------------------------------------------------------------
// formatReportMarkdown
// ---------------------------------------------------------------------------

describe("formatReportMarkdown", () => {
  it("includes table headers", () => {
    const out = formatReportMarkdown(makeReport());
    expect(out).toContain("| Field | Value |");
    expect(out).toContain("|-------|-------|");
  });

  it("includes product in table", () => {
    const out = formatReportMarkdown(makeReport());
    expect(out).toContain("`Ritual@0.1.0`");
  });

  it("shows PASSED in bold", () => {
    const out = formatReportMarkdown(makeReport());
    expect(out).toContain("**PASSED**");
  });

  it("shows FAILED in bold for failing report", () => {
    const report = makeReport({
      violations: [makeViolation()],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportMarkdown(report);
    expect(out).toContain("**FAILED**");
  });

  it("says 'No violations found.' for empty report", () => {
    const out = formatReportMarkdown(makeReport());
    expect(out).toContain("No violations found.");
  });

  it("does not say 'No violations' when there are violations", () => {
    const report = makeReport({
      violations: [makeViolation()],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportMarkdown(report);
    expect(out).not.toContain("No violations found.");
  });

  it("renders violation rule ID in bold", () => {
    const report = makeReport({
      violations: [makeViolation()],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportMarkdown(report);
    expect(out).toContain("**budget-nav-items**");
  });

  it("renders evidence file in backticks", () => {
    const report = makeReport({
      violations: [
        makeViolation({
          evidence: [{ file: "src/Nav.tsx", line: 42 }],
        }),
      ],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportMarkdown(report);
    expect(out).toContain("`src/Nav.tsx:42`");
  });

  it("includes suggested fix in markdown", () => {
    const report = makeReport({
      violations: [makeViolation({ suggestedFix: "Remove the panel" })],
      summary: { errors: 1, warnings: 0, infos: 0, passed: false },
    });
    const out = formatReportMarkdown(report);
    expect(out).toContain("Fix: Remove the panel");
  });
});
