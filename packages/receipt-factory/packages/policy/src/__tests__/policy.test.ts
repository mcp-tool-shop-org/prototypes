import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DEFAULT_POLICY, DEFAULT_RULES, loadPolicy } from "../index.js";
import type { PolicyPack } from "../types.js";

function makeTmpDir(): string {
  const dir = join(tmpdir(), `rf-policy-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("DEFAULT_POLICY", () => {
  it("has expected structure", () => {
    expect(DEFAULT_POLICY.policy_version).toBe("1.0");
    expect(DEFAULT_POLICY.name).toBe("default");
    expect(DEFAULT_POLICY.rules.intent_min_length).toBe(10);
    expect(DEFAULT_POLICY.rules.require_evidence).toBe(true);
    expect(DEFAULT_POLICY.rules.require_references).toBe(false);
  });

  it("DEFAULT_RULES matches DEFAULT_POLICY.rules", () => {
    expect(DEFAULT_RULES).toEqual(DEFAULT_POLICY.rules);
  });
});

describe("loadPolicy", () => {
  it("loads a valid policy file", () => {
    const dir = makeTmpDir();
    const policyPath = join(dir, "policy.json");
    const pack: PolicyPack = {
      policy_version: "1.0",
      name: "test-policy",
      description: "A test policy",
      rules: {
        ...DEFAULT_RULES,
        intent_min_length: 50,
        require_references: true,
      },
    };
    writeFileSync(policyPath, JSON.stringify(pack));

    const loaded = loadPolicy(policyPath);
    expect(loaded.name).toBe("test-policy");
    expect(loaded.rules.intent_min_length).toBe(50);
    expect(loaded.rules.require_references).toBe(true);
    // Other rules stay at defaults
    expect(loaded.rules.require_evidence).toBe(true);
    expect(loaded.rules.min_evidence).toBe(1);

    rmSync(dir, { recursive: true, force: true });
  });

  it("fills missing rules from defaults", () => {
    const dir = makeTmpDir();
    const policyPath = join(dir, "policy.json");
    const minimal = {
      policy_version: "1.0",
      name: "minimal",
      description: "Only overrides one rule",
      rules: {
        intent_min_length: 20,
      },
    };
    writeFileSync(policyPath, JSON.stringify(minimal));

    const loaded = loadPolicy(policyPath);
    expect(loaded.rules.intent_min_length).toBe(20);
    expect(loaded.rules.require_verification_steps).toBe(true);
    expect(loaded.rules.min_verification_steps).toBe(1);
    expect(loaded.rules.require_references).toBe(false);

    rmSync(dir, { recursive: true, force: true });
  });

  it("throws on missing file", () => {
    expect(() => loadPolicy("/nonexistent/policy.json")).toThrow("Failed to read policy file");
  });

  it("throws on invalid JSON", () => {
    const dir = makeTmpDir();
    const policyPath = join(dir, "bad.json");
    writeFileSync(policyPath, "not json {{{");

    expect(() => loadPolicy(policyPath)).toThrow("not valid JSON");

    rmSync(dir, { recursive: true, force: true });
  });

  it("throws on wrong policy version", () => {
    const dir = makeTmpDir();
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify({
      policy_version: "2.0",
      name: "future",
      rules: {},
    }));

    expect(() => loadPolicy(policyPath)).toThrow("Unsupported policy version");

    rmSync(dir, { recursive: true, force: true });
  });

  it("throws on missing name", () => {
    const dir = makeTmpDir();
    const policyPath = join(dir, "policy.json");
    writeFileSync(policyPath, JSON.stringify({
      policy_version: "1.0",
      rules: {},
    }));

    expect(() => loadPolicy(policyPath)).toThrow("missing a name");

    rmSync(dir, { recursive: true, force: true });
  });
});
