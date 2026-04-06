import { describe, it, expect, beforeEach } from "vitest";
import { ReleaseVerifier } from "../src/modules/verifier/release-verifier.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import { createLogger } from "../src/core/logger.js";
import type { PluginContext, ConsensusEvent } from "../src/plugins/api.js";
import type { HashAlgorithm } from "../src/modules/verifier/release-verifier.js";

/** Fake hash function — returns predictable hashes */
function fakeHashFn(hashes: Record<string, string>) {
  return async (path: string, _alg: HashAlgorithm) => hashes[path] ?? "0000";
}

function createCtx(config: Record<string, unknown> = {}): PluginContext {
  return {
    events: new CoreEventBus(),
    invariants: new CoreInvariantEngine(),
    config,
    log: createLogger("release-verifier-test"),
  };
}

describe("ReleaseVerifier", () => {
  let verifier: ReleaseVerifier;

  beforeEach(() => {
    verifier = new ReleaseVerifier();
  });

  it("initializes and registers invariant", async () => {
    const ctx = createCtx({
      hashFn: fakeHashFn({}),
    });
    const result = await verifier.init(ctx);
    expect(result.ok).toBe(true);
    expect(ctx.invariants.registered()).toContain("release.hash-integrity");
  });

  it("verifies a matching artifact", async () => {
    const ctx = createCtx({
      artifacts: [
        { path: "/bin/app", expectedHash: "abc123", algorithm: "sha256" },
      ],
      hashFn: fakeHashFn({ "/bin/app": "abc123" }),
    });

    await verifier.init(ctx);
    await verifier.start();

    const report = await verifier.verifyAll();
    expect(report.allPassed).toBe(true);
    expect(report.results[0].hashMatch).toBe(true);
    expect(report.results[0].artifact).toBe("app");
  });

  it("detects hash mismatch", async () => {
    const events: ConsensusEvent[] = [];
    const bus = new CoreEventBus();
    bus.subscribe("release.verification.failed", (e) => events.push(e));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        artifacts: [
          { path: "/bin/tampered", expectedHash: "expected", algorithm: "sha256" },
        ],
        hashFn: fakeHashFn({ "/bin/tampered": "actual-different" }),
      },
      log: createLogger("test"),
    };

    await verifier.init(ctx);
    await verifier.start();

    const report = await verifier.verifyAll();
    expect(report.allPassed).toBe(false);
    expect(report.results[0].hashMatch).toBe(false);
    expect(report.results[0].expectedHash).toBe("expected");
    expect(report.results[0].actualHash).toBe("actual-different");
    expect(events).toHaveLength(1);
  });

  it("handles hash errors gracefully", async () => {
    const ctx = createCtx({
      artifacts: [
        { path: "/bin/missing", expectedHash: "abc" },
      ],
      hashFn: async () => { throw new Error("ENOENT"); },
    });

    await verifier.init(ctx);
    await verifier.start();

    const report = await verifier.verifyAll();
    expect(report.allPassed).toBe(false);
    expect(report.results[0].error).toBe("ENOENT");
    expect(report.results[0].hashMatch).toBe(false);
  });

  it("validates signatures when provided", async () => {
    const ctx = createCtx({
      artifacts: [
        { path: "/bin/signed", expectedHash: "aaa", signature: "sig123" },
      ],
      hashFn: fakeHashFn({ "/bin/signed": "aaa" }),
      signatureVerifier: async (_h: string, sig: string) => sig === "sig123",
    });

    await verifier.init(ctx);
    await verifier.start();

    const report = await verifier.verifyAll();
    expect(report.allPassed).toBe(true);
    expect(report.results[0].signatureValid).toBe(true);
  });

  it("fails when signature is invalid", async () => {
    const ctx = createCtx({
      artifacts: [
        { path: "/bin/badsig", expectedHash: "aaa", signature: "wrong" },
      ],
      hashFn: fakeHashFn({ "/bin/badsig": "aaa" }),
      signatureVerifier: async (_h: string, sig: string) => sig === "correct",
    });

    await verifier.init(ctx);
    await verifier.start();

    const report = await verifier.verifyAll();
    expect(report.allPassed).toBe(false);
    expect(report.results[0].hashMatch).toBe(true);
    expect(report.results[0].signatureValid).toBe(false);
  });

  it("emits release.verified for passing artifacts", async () => {
    const bus = new CoreEventBus();
    const topics: string[] = [];
    bus.subscribe("*", (e) => topics.push(e.topic));

    const ctx: PluginContext = {
      events: bus,
      invariants: new CoreInvariantEngine(),
      config: {
        artifacts: [{ path: "/bin/ok", expectedHash: "match" }],
        hashFn: fakeHashFn({ "/bin/ok": "match" }),
      },
      log: createLogger("test"),
    };

    await verifier.init(ctx);
    await verifier.start();
    await verifier.verifyAll();

    expect(topics).toContain("release.verifier.ready");
    expect(topics).toContain("release.verified");
  });

  it("enforces hash-integrity invariant", async () => {
    const invariants = new CoreInvariantEngine();
    const ctx: PluginContext = {
      events: new CoreEventBus(),
      invariants,
      config: {
        artifacts: [{ path: "/bin/bad", expectedHash: "good" }],
        hashFn: fakeHashFn({ "/bin/bad": "bad" }),
      },
      log: createLogger("test"),
    };

    await verifier.init(ctx);
    await verifier.start();
    await verifier.verifyAll();

    const verdict = await invariants.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations.some((v) => v.name === "release.hash-integrity")).toBe(true);
  });
});
