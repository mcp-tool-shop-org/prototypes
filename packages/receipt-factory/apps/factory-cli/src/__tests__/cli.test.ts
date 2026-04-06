import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, "..", "..", "dist", "cli.js");
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"));

function run(...args: string[]): string {
  return execFileSync("node", [cliPath, ...args], {
    encoding: "utf-8",
    timeout: 10_000,
  });
}

describe("rf CLI", () => {
  it("shows version", () => {
    const output = run("--version");
    expect(output.trim()).toBe(pkg.version);
  });

  it("shows help", () => {
    const output = run("--help");
    expect(output).toContain("receipt-factory");
    expect(output).toContain("make");
    expect(output).toContain("collect");
    expect(output).toContain("render");
    expect(output).toContain("verify");
    expect(output).toContain("index");
    expect(output).toContain("search");
    expect(output).toContain("graph");
    expect(output).toContain("policy");
    expect(output).toContain("bundle");
    expect(output).toContain("init");
  });

  it("make --help shows options", () => {
    const output = run("make", "--help");
    expect(output).toContain("--from");
    expect(output).toContain("--run");
    expect(output).toContain("--repo");
    expect(output).toContain("--pack");
  });

  it("collect --help shows options", () => {
    const output = run("collect", "--help");
    expect(output).toContain("--from");
    expect(output).toContain("--run");
    expect(output).toContain("--tag");
  });

  it("index --help shows options", () => {
    const output = run("index", "--help");
    expect(output).toContain("--output");
    expect(output).toContain("--validate");
  });

  it("search --help shows options", () => {
    const output = run("search", "--help");
    expect(output).toContain("--kind");
    expect(output).toContain("--repo");
    expect(output).toContain("--since");
    expect(output).toContain("--until");
  });

  it("verify --help shows options", () => {
    const output = run("verify", "--help");
    expect(output).toContain("--offline");
    expect(output).toContain("--follow");
    expect(output).toContain("--refs-strict");
    expect(output).toContain("--policy");
    expect(output).toContain("--require-policy-signature");
    expect(output).toContain("--require-bundle-signature");
  });

  it("render --help shows formats", () => {
    const output = run("render", "--help");
    expect(output).toContain("--format");
  });

  it("graph --help shows description", () => {
    const output = run("graph", "--help");
    expect(output).toContain("graph");
  });

  it("policy init --help shows options", () => {
    const output = run("policy", "init", "--help");
    expect(output).toContain("--output");
  });

  it("policy sign --help shows options", () => {
    const output = run("policy", "sign", "--help");
    expect(output).toContain("--keyless");
    expect(output).toContain("--key");
  });

  it("bundle create --help shows options", () => {
    const output = run("bundle", "create", "--help");
    expect(output).toContain("--follow");
    expect(output).toContain("--include-evidence");
    expect(output).toContain("--policy");
    expect(output).toContain("--out");
  });

  it("bundle verify --help shows options", () => {
    const output = run("bundle", "verify", "--help");
    expect(output).toContain("--strict");
    expect(output).toContain("--require-bundle-signature");
  });

  it("bundle sign --help shows options", () => {
    const output = run("bundle", "sign", "--help");
    expect(output).toContain("--keyless");
    expect(output).toContain("--key");
  });

  it("bundle inspect --help shows description", () => {
    const output = run("bundle", "inspect", "--help");
    expect(output).toContain("manifest");
  });
});
