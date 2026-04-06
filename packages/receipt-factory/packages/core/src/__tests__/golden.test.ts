import { describe, it, expect } from "vitest";
import { canonicalize } from "../canonical.js";
import { computeDigest } from "../hash.js";
import type { ReceiptDraft } from "../types.js";

/**
 * Golden canonicalization test.
 *
 * This fixture freezes a known receipt draft and its expected canonical JSON
 * and SHA-256 hash. If this test passes on Node 20 AND Node 22 in CI,
 * canonicalization is proven stable across runtimes.
 *
 * DO NOT modify the fixture or expected values unless the canonicalization
 * algorithm intentionally changes (which requires a format version bump).
 */

const GOLDEN_DRAFT: ReceiptDraft = {
  receipt_version: "1.0.0",
  kind: "ci_run",
  created_at: "2025-01-15T12:00:00Z",
  subject: {
    type: "repository",
    name: "mcp-tool-shop-org/receipt-factory",
    ref: "refs/heads/main",
    url: "https://github.com/mcp-tool-shop-org/receipt-factory",
  },
  intent:
    "Verify that all tests pass and artifacts build correctly on Node 20 and 22.",
  inputs: {
    commit_sha: "abc123def456",
    branch: "main",
    triggered_by: "push",
  },
  outputs: [
    {
      name: "dist.tar.gz",
      digest: "sha256:deadbeef0123456789abcdef",
      url: "https://example.com/artifacts/dist.tar.gz",
      size: 102400,
    },
  ],
  evidence: [
    {
      type: "ci_run",
      url: "https://github.com/mcp-tool-shop-org/receipt-factory/actions/runs/12345",
      description: "GitHub Actions workflow run #12345",
    },
    {
      type: "commit",
      url: "https://github.com/mcp-tool-shop-org/receipt-factory/commit/abc123def456",
      description: "Source commit abc123d",
    },
  ],
  verification: {
    steps: [
      "Download the receipt JSON",
      "Run rf verify receipt.json",
      "Compare the digest with the CI run",
    ],
    commands: ["rf verify receipt.json", "sha256sum dist.tar.gz"],
  },
  environment: {
    runner: "ubuntu-latest",
    os: "Linux",
    tool_versions: {
      node: "22.0.0",
      pnpm: "10.28.2",
    },
  },
  policy: {
    redacted_fields: ["inputs.secrets"],
    required_checks: ["schema", "hash"],
  },
  metadata: {
    factory_version: "1.0.0",
    pipeline: "ci-receipts",
  },
};

/**
 * Frozen canonical JSON — keys sorted recursively, compact, deterministic.
 * Any change to canonicalize() that alters this output is a breaking change.
 */
const EXPECTED_CANONICAL =
  '{"created_at":"2025-01-15T12:00:00Z","environment":{"os":"Linux","runner":"ubuntu-latest","tool_versions":{"node":"22.0.0","pnpm":"10.28.2"}},"evidence":[{"description":"GitHub Actions workflow run #12345","type":"ci_run","url":"https://github.com/mcp-tool-shop-org/receipt-factory/actions/runs/12345"},{"description":"Source commit abc123d","type":"commit","url":"https://github.com/mcp-tool-shop-org/receipt-factory/commit/abc123def456"}],"inputs":{"branch":"main","commit_sha":"abc123def456","triggered_by":"push"},"intent":"Verify that all tests pass and artifacts build correctly on Node 20 and 22.","kind":"ci_run","metadata":{"factory_version":"1.0.0","pipeline":"ci-receipts"},"outputs":[{"digest":"sha256:deadbeef0123456789abcdef","name":"dist.tar.gz","size":102400,"url":"https://example.com/artifacts/dist.tar.gz"}],"policy":{"redacted_fields":["inputs.secrets"],"required_checks":["schema","hash"]},"receipt_version":"1.0.0","subject":{"name":"mcp-tool-shop-org/receipt-factory","ref":"refs/heads/main","type":"repository","url":"https://github.com/mcp-tool-shop-org/receipt-factory"},"verification":{"commands":["rf verify receipt.json","sha256sum dist.tar.gz"],"steps":["Download the receipt JSON","Run rf verify receipt.json","Compare the digest with the CI run"]}}';

/**
 * Frozen SHA-256 digest of the canonical JSON above.
 * If this changes, either the canonicalization or hashing algorithm changed.
 */
const EXPECTED_DIGEST =
  "2e71e086a7d3fbd31f8bf86cca20798a05456b62c68c4d49404a9c2061372579";

/**
 * Byte length of the canonical JSON (UTF-8).
 * Used in v1.1.0+ trust spine to catch truncation.
 */
const EXPECTED_BYTE_LENGTH = 1280;

describe("golden canonicalization", () => {
  it("canonical JSON matches frozen snapshot", () => {
    const canonical = canonicalize(GOLDEN_DRAFT);
    expect(canonical).toBe(EXPECTED_CANONICAL);
  });

  it("SHA-256 digest matches frozen hash", () => {
    const digest = computeDigest(GOLDEN_DRAFT);
    expect(digest).toBe(EXPECTED_DIGEST);
  });

  it("canonical byte length matches frozen value", () => {
    const canonical = canonicalize(GOLDEN_DRAFT);
    const byteLength = Buffer.byteLength(canonical, "utf-8");
    expect(byteLength).toBe(EXPECTED_BYTE_LENGTH);
  });

  it("round-trip through JSON.parse preserves canonical form", () => {
    const canonical = canonicalize(GOLDEN_DRAFT);
    const parsed = JSON.parse(canonical) as unknown;
    const recanonical = canonicalize(parsed);
    expect(recanonical).toBe(EXPECTED_CANONICAL);
  });

  it("hash is stable across re-canonicalization", () => {
    const digest1 = computeDigest(GOLDEN_DRAFT);
    const parsed = JSON.parse(canonicalize(GOLDEN_DRAFT)) as unknown;
    const digest2 = computeDigest(parsed);
    expect(digest1).toBe(digest2);
    expect(digest1).toBe(EXPECTED_DIGEST);
  });
});
