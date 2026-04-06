import { describe, it, expect } from "vitest";
import { assemble } from "../assemble.js";
import type { GitHubReleaseEvidence } from "@receipt-factory/adapter-github";

function makeReleaseEvidence(): GitHubReleaseEvidence {
  return {
    release: {
      tag_name: "v1.0.0",
      name: "Release v1.0.0",
      body: "## What's New\n\n- Initial release\n- Feature A\n- Feature B",
      draft: false,
      prerelease: false,
      created_at: "2026-03-01T10:00:00Z",
      published_at: "2026-03-01T12:00:00Z",
      url: "https://api.github.com/repos/org/repo/releases/1",
      html_url: "https://github.com/org/repo/releases/tag/v1.0.0",
      author: "testuser",
    },
    assets: [
      {
        name: "dist.tar.gz",
        size: 102400,
        download_url: "https://github.com/org/repo/releases/download/v1.0.0/dist.tar.gz",
        content_type: "application/gzip",
      },
    ],
    commit: {
      sha: "abc123def456789",
      url: "https://github.com/org/repo/commit/abc123def456789",
    },
    repository: {
      full_name: "org/repo",
      url: "https://github.com/org/repo",
    },
  };
}

describe("release assemble", () => {
  it("produces a valid release receipt", () => {
    const receipt = assemble(makeReleaseEvidence());

    expect(receipt.kind).toBe("release");
    expect(receipt.subject.name).toBe("org/repo");
    expect(receipt.subject.ref).toBe("v1.0.0");
    expect(receipt.intent).toContain("v1.0.0");
    expect(receipt.id).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.integrity.algorithm).toBe("sha256");
  });

  it("includes release assets as outputs", () => {
    const receipt = assemble(makeReleaseEvidence());
    expect(receipt.outputs).toHaveLength(1);
    expect(receipt.outputs[0].name).toBe("dist.tar.gz");
    expect(receipt.outputs[0].size).toBe(102400);
  });

  it("includes evidence links", () => {
    const receipt = assemble(makeReleaseEvidence());
    expect(receipt.evidence.length).toBeGreaterThanOrEqual(3);
    const types = receipt.evidence.map((e) => e.type);
    expect(types).toContain("release");
    expect(types).toContain("tag");
    expect(types).toContain("commit");
  });

  it("includes changelog excerpt in metadata", () => {
    const receipt = assemble(makeReleaseEvidence());
    expect(receipt.metadata?.changelog_excerpt).toContain("What's New");
  });

  it("sets pipeline metadata", () => {
    const receipt = assemble(makeReleaseEvidence());
    expect(receipt.metadata?.pipeline).toBe("release-receipts");
    expect(receipt.metadata?.factory_version).toBe("1.7.2");
  });
});
