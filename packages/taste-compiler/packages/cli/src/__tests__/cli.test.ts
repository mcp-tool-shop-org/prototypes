import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CLI = join(process.cwd(), "..", "..", "packages", "cli", "dist", "bin.js");
const EXAMPLE_SOURCE = join(
  process.cwd(),
  "..",
  "..",
  "examples",
  "ritual-app",
  "taste",
  "source"
);
const EXAMPLE_APP = join(
  process.cwd(),
  "..",
  "..",
  "examples",
  "ritual-app",
  "app"
);

function run(args: string, cwd?: string): string {
  return execSync(`node ${CLI} ${args}`, {
    encoding: "utf-8",
    cwd: cwd ?? process.cwd(),
    timeout: 30000,
  });
}

function runMayFail(args: string, cwd?: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI} ${args}`, {
      encoding: "utf-8",
      cwd: cwd ?? process.cwd(),
      timeout: 30000,
    });
    return { stdout, exitCode: 0 };
  } catch (err: any) {
    return { stdout: err.stdout ?? "", exitCode: err.status ?? 1 };
  }
}

describe("CLI", () => {
  describe("help and version", () => {
    it("shows help with no args", () => {
      const output = run("");
      expect(output).toContain("taste");
      expect(output).toContain("Commands:");
    });

    it("shows version", () => {
      const output = run("--version");
      expect(output.trim()).toBe("0.1.0");
    });
  });

  describe("init", () => {
    let tempDir: string;

    beforeAll(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "taste-init-"));
    });

    afterAll(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("creates taste workspace", () => {
      const output = run(`init ${tempDir}`);
      expect(output).toContain("Taste workspace created");
    });

    it("creates source files", async () => {
      const product = await readFile(
        join(tempDir, "taste", "source", "product.yaml"),
        "utf-8"
      );
      expect(product).toContain("name:");
    });
  });

  describe("validate-source", () => {
    it("validates example ritual-app source", () => {
      const output = run(`validate-source --dir ${EXAMPLE_SOURCE}`);
      expect(output).toContain("Schema: VALID");
      expect(output).toContain("Ritual");
      expect(output).toContain("Principles: 3");
    });
  });

  describe("compile", () => {
    let tempDir: string;
    let packPath: string;

    beforeAll(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "taste-compile-"));
      packPath = join(tempDir, "taste-pack.json");
      run(`compile --source ${EXAMPLE_SOURCE} --out ${packPath}`);
    });

    afterAll(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("produces a valid pack file", async () => {
      const content = await readFile(packPath, "utf-8");
      const pack = JSON.parse(content);
      expect(pack.schemaVersion).toBe("0.1.0");
      expect(pack.product.name).toBe("Ritual");
    });

    it("pack has all 6 artifact classes", async () => {
      const content = await readFile(packPath, "utf-8");
      const pack = JSON.parse(content);
      expect(pack.artifacts.visualTokens).toBeDefined();
      expect(pack.artifacts.componentGrammar).toBeDefined();
      expect(pack.artifacts.interactionLaws).toBeDefined();
      expect(pack.artifacts.copyRules).toBeDefined();
      expect(pack.artifacts.complexityBudgets).toBeDefined();
      expect(pack.artifacts.forbiddenPatterns).toBeDefined();
    });

    it("pack has golden flows", async () => {
      const content = await readFile(packPath, "utf-8");
      const pack = JSON.parse(content);
      expect(pack.goldens.length).toBe(2);
      expect(pack.goldens[0].name).toBe("Create Ritual");
    });
  });

  describe("explain", () => {
    let tempDir: string;
    let packPath: string;

    beforeAll(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "taste-explain-"));
      packPath = join(tempDir, "taste-pack.json");
      run(`compile --source ${EXAMPLE_SOURCE} --out ${packPath}`);
    });

    afterAll(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("explains pack contents", () => {
      const output = run(`explain --pack ${packPath}`);
      expect(output).toContain("Product Constitution");
      expect(output).toContain("Ritual");
      expect(output).toContain("Forbidden Patterns");
      expect(output).toContain("What This Product Is Not");
    });
  });

  describe("check", () => {
    let tempDir: string;
    let packPath: string;

    beforeAll(async () => {
      tempDir = await mkdtemp(join(tmpdir(), "taste-check-"));
      packPath = join(tempDir, "taste-pack.json");
      run(`compile --source ${EXAMPLE_SOURCE} --out ${packPath}`);
    });

    afterAll(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it("detects violations in seeded app", () => {
      const { stdout, exitCode } = runMayFail(
        `check --pack ${packPath} --target ${EXAMPLE_APP}`
      );
      expect(exitCode).toBe(1); // Should fail — seeded violations
      expect(stdout).toContain("FAILED");
    });

    it("outputs JSON format", () => {
      const { stdout } = runMayFail(
        `check --pack ${packPath} --target ${EXAMPLE_APP} --format json`
      );
      const report = JSON.parse(stdout.trim()); // Status messages go to stderr in JSON mode
      expect(report.violations).toBeDefined();
      expect(report.summary.errors).toBeGreaterThan(0);
    });
  });
});
