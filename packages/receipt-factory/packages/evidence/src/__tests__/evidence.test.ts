import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeEvidencePack } from "../write.js";
import { readEvidencePack } from "../read.js";

const sampleEvidence = {
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
    sha: "abc123",
    message: "fix: update tests",
    author: "dev",
    ref: "main",
    url: "https://github.com/org/repo/commit/abc123",
  },
  jobs: [],
  artifacts: [],
  repository: { full_name: "org/repo", url: "https://github.com/org/repo" },
  workflow: { name: "CI", path: ".github/workflows/ci.yml" },
};

describe("evidence packs", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "rf-evidence-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("writes manifest and evidence data", () => {
    const packDir = join(tmpDir, "pack");
    const manifest = writeEvidencePack(packDir, "ci_run", "github", sampleEvidence);

    expect(manifest.pack_version).toBe("1.0");
    expect(manifest.kind).toBe("ci_run");
    expect(manifest.source).toBe("github");
    expect(manifest.files["evidence/data.json"]).toBeDefined();
    expect(manifest.files["evidence/data.json"].algorithm).toBe("sha256");
    expect(manifest.files["evidence/data.json"].size_bytes).toBeGreaterThan(0);

    // Files exist on disk
    const manifestOnDisk = JSON.parse(readFileSync(join(packDir, "manifest.json"), "utf-8"));
    expect(manifestOnDisk.kind).toBe("ci_run");

    const dataOnDisk = JSON.parse(readFileSync(join(packDir, "evidence", "data.json"), "utf-8"));
    expect(dataOnDisk.run.id).toBe(12345);
  });

  it("round-trips: write then read preserves data", () => {
    const packDir = join(tmpDir, "roundtrip");
    writeEvidencePack(packDir, "ci_run", "github", sampleEvidence);

    const { manifest, data } = readEvidencePack(packDir);
    expect(manifest.kind).toBe("ci_run");
    expect(manifest.source).toBe("github");
    expect((data as typeof sampleEvidence).run.id).toBe(12345);
    expect((data as typeof sampleEvidence).commit.sha).toBe("abc123");
  });

  it("detects tampered evidence data", () => {
    const packDir = join(tmpDir, "tampered");
    writeEvidencePack(packDir, "ci_run", "github", sampleEvidence);

    // Tamper with the evidence file
    const dataPath = join(packDir, "evidence", "data.json");
    const original = readFileSync(dataPath, "utf-8");
    writeFileSync(dataPath, original.replace("12345", "99999"), "utf-8");

    expect(() => readEvidencePack(packDir)).toThrow(/mismatch/i);
  });

  it("throws on missing manifest", () => {
    const packDir = join(tmpDir, "missing");
    expect(() => readEvidencePack(packDir)).toThrow(/not found/i);
  });

  it("throws on missing evidence file", () => {
    const packDir = join(tmpDir, "incomplete");
    writeEvidencePack(packDir, "ci_run", "github", sampleEvidence);

    // Delete the evidence file
    rmSync(join(packDir, "evidence", "data.json"));

    expect(() => readEvidencePack(packDir)).toThrow(/missing/i);
  });

  it("works with release evidence", () => {
    const releaseEvidence = {
      release: {
        tag_name: "v1.0.0",
        name: "v1.0.0",
        body: "Initial release",
        draft: false,
        prerelease: false,
        created_at: "2026-03-03T12:00:00Z",
        published_at: "2026-03-03T12:00:00Z",
        url: "https://api.github.com/repos/org/repo/releases/1",
        html_url: "https://github.com/org/repo/releases/tag/v1.0.0",
        author: "dev",
      },
      assets: [],
      commit: { sha: "abc123", url: "https://github.com/org/repo/commit/abc123" },
      repository: { full_name: "org/repo", url: "https://github.com/org/repo" },
    };

    const packDir = join(tmpDir, "release-pack");
    writeEvidencePack(packDir, "release", "github", releaseEvidence);

    const { manifest, data } = readEvidencePack(packDir);
    expect(manifest.kind).toBe("release");
    expect((data as typeof releaseEvidence).release.tag_name).toBe("v1.0.0");
  });

  it("includes collector version in manifest", () => {
    const packDir = join(tmpDir, "version");
    const manifest = writeEvidencePack(packDir, "ci_run", "github", sampleEvidence, "2.0.0");
    expect(manifest.collector_version).toBe("2.0.0");
  });
});
