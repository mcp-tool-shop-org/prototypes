import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ReceiptBuilder } from "@receipt-factory/core";
import type { Receipt } from "@receipt-factory/core";
import { buildIndex } from "../build.js";
import { searchIndex } from "../search.js";

function makeReceipt(overrides: {
  kind?: "ci_run" | "release";
  name?: string;
  ref?: string;
  intent?: string;
  createdAt?: string;
}): Receipt {
  return new ReceiptBuilder(overrides.kind ?? "ci_run")
    .subject({
      type: "repository",
      name: overrides.name ?? "org/test-repo",
      ref: overrides.ref ?? "abc123",
      url: "https://github.com/org/test-repo",
    })
    .intent(overrides.intent ?? "Verify tests pass on main branch")
    .createdAt(overrides.createdAt ?? "2026-03-03T12:00:00Z")
    .addEvidence({
      type: "workflow_run",
      url: "https://github.com/org/test-repo/actions/runs/1",
      description: "CI run #1",
    })
    .addStep("Download the receipt JSON file")
    .addCommand("rf verify receipt.json")
    .policy({
      redacted_fields: [],
      required_checks: ["build"],
    })
    .build();
}

describe("receipt index", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "rf-index-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("builds index from receipt files", async () => {
    const receipt = makeReceipt({});
    const receiptDir = join(tmpDir, "ci", "2026-03-03");
    mkdirSync(receiptDir, { recursive: true });
    writeFileSync(
      join(receiptDir, "12345.json"),
      JSON.stringify(receipt, null, 2),
      "utf-8",
    );

    const index = await buildIndex(tmpDir);
    expect(index.index_version).toBe("1.0");
    expect(index.count).toBe(1);
    expect(index.receipts[0].id).toBe(receipt.id);
    expect(index.receipts[0].kind).toBe("ci_run");
    expect(index.receipts[0].subject.name).toBe("org/test-repo");
    expect(index.receipts[0].file).toContain("12345.json");
  });

  it("skips non-receipt JSON files", async () => {
    writeFileSync(
      join(tmpDir, "config.json"),
      JSON.stringify({ key: "value" }),
      "utf-8",
    );

    const index = await buildIndex(tmpDir);
    expect(index.count).toBe(0);
  });

  it("skips index.json itself", async () => {
    const receipt = makeReceipt({});
    writeFileSync(
      join(tmpDir, "receipt.json"),
      JSON.stringify(receipt, null, 2),
      "utf-8",
    );
    writeFileSync(
      join(tmpDir, "index.json"),
      JSON.stringify({ index_version: "1.0", receipts: [] }),
      "utf-8",
    );

    const index = await buildIndex(tmpDir);
    expect(index.count).toBe(1);
  });

  it("handles empty directory", async () => {
    const index = await buildIndex(tmpDir);
    expect(index.count).toBe(0);
    expect(index.receipts).toEqual([]);
  });

  it("validates integrity when validate option is set", async () => {
    const receipt = makeReceipt({});
    writeFileSync(
      join(tmpDir, "valid.json"),
      JSON.stringify(receipt, null, 2),
      "utf-8",
    );

    // Tamper with a copy
    const tampered = { ...receipt, intent: "Tampered intent" };
    writeFileSync(
      join(tmpDir, "tampered.json"),
      JSON.stringify(tampered, null, 2),
      "utf-8",
    );

    const index = await buildIndex(tmpDir, { validate: true });
    expect(index.count).toBe(2);
    const validEntry = index.receipts.find((r) => r.file === "valid.json");
    const tamperedEntry = index.receipts.find((r) => r.file === "tampered.json");
    expect(validEntry?.valid).toBe(true);
    expect(tamperedEntry?.valid).toBe(false);
  });

  it("sorts receipts by created_at descending", async () => {
    const older = makeReceipt({ createdAt: "2026-03-01T12:00:00Z", intent: "Older receipt run" });
    const newer = makeReceipt({ createdAt: "2026-03-03T12:00:00Z", intent: "Newer receipt run" });

    writeFileSync(join(tmpDir, "older.json"), JSON.stringify(older, null, 2), "utf-8");
    writeFileSync(join(tmpDir, "newer.json"), JSON.stringify(newer, null, 2), "utf-8");

    const index = await buildIndex(tmpDir);
    expect(index.receipts[0].created_at).toBe("2026-03-03T12:00:00Z");
    expect(index.receipts[1].created_at).toBe("2026-03-01T12:00:00Z");
  });
});

describe("search index", () => {
  const receipt1 = makeReceipt({
    kind: "ci_run",
    name: "org/alpha",
    createdAt: "2026-03-01T12:00:00Z",
    intent: "Verify alpha CI run passes",
  });
  const receipt2 = makeReceipt({
    kind: "release",
    name: "org/beta",
    createdAt: "2026-03-02T12:00:00Z",
    intent: "Published v1.0.0 of org/beta",
  });
  const receipt3 = makeReceipt({
    kind: "ci_run",
    name: "org/alpha",
    createdAt: "2026-03-03T12:00:00Z",
    intent: "Verify alpha CI run two passes",
  });

  const index = {
    index_version: "1.0" as const,
    generated_at: "2026-03-03T12:00:00Z",
    count: 3,
    receipts: [receipt1, receipt2, receipt3].map((r, i) => ({
      id: r.id,
      kind: r.kind,
      created_at: r.created_at,
      subject: r.subject,
      intent: r.intent,
      file: `receipt-${i}.json`,
      valid: true,
    })),
  };

  it("filters by kind", () => {
    const results = searchIndex(index, { kind: "ci_run" });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.kind === "ci_run")).toBe(true);
  });

  it("filters by repo name", () => {
    const results = searchIndex(index, { repo: "alpha" });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.subject.name.includes("alpha"))).toBe(true);
  });

  it("filters by date range (since)", () => {
    const results = searchIndex(index, { since: "2026-03-02" });
    expect(results).toHaveLength(2);
  });

  it("filters by date range (until)", () => {
    const results = searchIndex(index, { until: "2026-03-01T23:59:59Z" });
    expect(results).toHaveLength(1);
  });

  it("combines filters", () => {
    const results = searchIndex(index, { kind: "ci_run", repo: "alpha", since: "2026-03-02" });
    expect(results).toHaveLength(1);
    expect(results[0].subject.name).toBe("org/alpha");
    expect(results[0].created_at).toBe("2026-03-03T12:00:00Z");
  });

  it("returns all when no filters", () => {
    const results = searchIndex(index, {});
    expect(results).toHaveLength(3);
  });
});
