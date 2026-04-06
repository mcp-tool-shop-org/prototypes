import { describe, it, expect } from "vitest";
import { ReceiptBuilder } from "@receipt-factory/core";
import { renderMarkdown } from "../markdown.js";
import { renderHtml } from "../html.js";

function makeReceipt() {
  return new ReceiptBuilder("ci_run")
    .subject({
      type: "repository",
      name: "my-repo",
      ref: "abc1234",
      url: "https://github.com/org/my-repo",
    })
    .intent("Verify tests pass on main branch")
    .createdAt("2026-03-03T12:00:00.000Z")
    .input("trigger", "push")
    .addOutput({
      name: "test-results.xml",
      digest: "sha256:abcdef1234567890abcdef1234567890",
      size: 45678,
    })
    .addEvidence({
      type: "workflow_run",
      url: "https://github.com/org/my-repo/actions/runs/123",
      description: "GitHub Actions CI run #123",
    })
    .addStep("Download the receipt JSON file")
    .addStep("Run the verify command below")
    .addCommand("rf verify receipts/ci/2026-03-03/123.json")
    .environment({
      runner: "ubuntu-latest",
      os: "Linux",
      tool_versions: { node: "20.11.0", pnpm: "10.28.2" },
    })
    .policy({
      redacted_fields: [],
      required_checks: ["all-tests-pass"],
    })
    .build();
}

describe("renderMarkdown", () => {
  it("renders a complete markdown document", () => {
    const md = renderMarkdown(makeReceipt());

    expect(md).toContain("# Ci run: my-repo");
    expect(md).toContain("Ci run on 2026-03-03");
    expect(md).toContain("## What happened");
    expect(md).toContain("Verify tests pass on main branch");
    expect(md).toContain("## Results");
    expect(md).toContain("test-results.xml");
    expect(md).toContain("## Evidence");
    expect(md).toContain("## How to verify");
    expect(md).toContain("rf verify");
    expect(md).toContain("## What this does NOT prove");
    expect(md).toContain("<details>");
    expect(md).toContain("### Integrity");
    expect(md).toContain("### Environment");
    expect(md).toContain("### Canonical JSON");
  });

  it("handles receipt with minimal fields", () => {
    const receipt = new ReceiptBuilder("release")
      .subject({ type: "package", name: "test-pkg" })
      .intent("Release v1.0.0")
      .createdAt("2026-03-03T12:00:00.000Z")
      .build();

    const md = renderMarkdown(receipt);
    expect(md).toContain("# Release: test-pkg");
    expect(md).toContain("Release v1.0.0");
    expect(md).not.toContain("## Results");
    expect(md).not.toContain("## Evidence");
  });

  it("formats file sizes correctly", () => {
    const receipt = new ReceiptBuilder("ci_run")
      .subject({ type: "repo", name: "test" })
      .intent("test")
      .createdAt("2026-03-03T12:00:00.000Z")
      .addOutput({ name: "big.tar", size: 1048576 })
      .addOutput({ name: "small.txt", size: 512 })
      .build();

    const md = renderMarkdown(receipt);
    expect(md).toContain("1.0 MB");
    expect(md).toContain("512 B");
  });
});

describe("renderHtml", () => {
  it("renders a complete HTML document", () => {
    const html = renderHtml(makeReceipt());

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Ci run: my-repo</title>");
    expect(html).toContain("<style>");
    expect(html).toContain("What happened");
    expect(html).toContain("Results");
    expect(html).toContain("Evidence");
    expect(html).toContain("How to verify");
    expect(html).toContain("What this does NOT prove");
    expect(html).toContain("Technical details");
    expect(html).toContain("receipt-factory");
  });

  it("escapes HTML in content", () => {
    const receipt = new ReceiptBuilder("ci_run")
      .subject({ type: "repo", name: "<script>alert('xss')</script>" })
      .intent("Test <b>injection</b>")
      .createdAt("2026-03-03T12:00:00.000Z")
      .build();

    const html = renderHtml(receipt);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;injection&lt;/b&gt;");
  });

  it("includes copy-to-clipboard for verification commands", () => {
    const html = renderHtml(makeReceipt());
    expect(html).toContain("copy-btn");
    expect(html).toContain("data-copy");
    expect(html).toContain("navigator.clipboard");
  });
});
