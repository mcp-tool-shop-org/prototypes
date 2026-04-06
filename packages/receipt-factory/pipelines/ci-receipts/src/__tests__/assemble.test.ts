import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import type { GitHubCIEvidence } from "@receipt-factory/adapter-github";
import { verifyIntegrity } from "@receipt-factory/core";

const mockEvidence: GitHubCIEvidence = {
  run: {
    id: 12345,
    name: "CI",
    status: "completed",
    conclusion: "success",
    url: "https://github.com/org/repo/actions/runs/12345",
    created_at: "2026-03-03T12:00:00Z",
    updated_at: "2026-03-03T12:05:00Z",
  },
  commit: {
    sha: "abc1234567890def",
    message: "Fix bug in parser",
    author: "developer",
    ref: "main",
    url: "https://github.com/org/repo/commit/abc1234567890def",
  },
  jobs: [
    {
      name: "test",
      status: "completed",
      conclusion: "success",
      runner_os: "ubuntu-latest",
      steps: [
        { name: "Checkout", status: "completed", conclusion: "success" },
        { name: "Install", status: "completed", conclusion: "success" },
        { name: "Test", status: "completed", conclusion: "success" },
      ],
    },
  ],
  artifacts: [
    { name: "coverage", size: 12345, url: "https://api.github.com/artifacts/1" },
  ],
  repository: {
    full_name: "org/repo",
    url: "https://github.com/org/repo",
  },
  workflow: {
    name: "CI",
    path: ".github/workflows/ci.yml",
  },
};

describe("assemble", () => {
  it("builds a valid receipt from GitHub evidence", () => {
    const receipt = assemble(mockEvidence);

    expect(receipt.receipt_version).toBe("1.0.0");
    expect(receipt.kind).toBe("ci_run");
    expect(receipt.subject.name).toBe("org/repo");
    expect(receipt.subject.ref).toBe("abc1234567890def");
    expect(receipt.intent).toContain("CI workflow success");
    expect(receipt.outputs).toHaveLength(1);
    expect(receipt.outputs[0].name).toBe("coverage");
    expect(receipt.evidence.length).toBeGreaterThan(0);
    expect(receipt.verification.commands.length).toBeGreaterThan(0);
    expect(receipt.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produced receipt passes integrity check", () => {
    const receipt = assemble(mockEvidence);
    expect(verifyIntegrity(receipt as unknown as Record<string, unknown>)).toBe(true);
  });

  it("includes job names in required checks", () => {
    const receipt = assemble(mockEvidence);
    expect(receipt.policy.required_checks).toContain("test");
  });

  it("stores run metadata", () => {
    const receipt = assemble(mockEvidence);
    expect(receipt.metadata?.github_run_id).toBe(12345);
    expect(receipt.metadata?.conclusion).toBe("success");
  });
});
