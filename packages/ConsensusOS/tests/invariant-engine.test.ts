import { describe, it, expect, beforeEach } from "vitest";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";

describe("CoreInvariantEngine", () => {
  let engine: CoreInvariantEngine;

  beforeEach(() => {
    engine = new CoreInvariantEngine();
  });

  it("allows transitions when no invariants are registered", async () => {
    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(true);
    expect(verdict.results).toHaveLength(0);
    expect(verdict.violations).toHaveLength(0);
  });

  it("registers and enforces a passing invariant", async () => {
    engine.register({
      name: "positive-balance",
      owner: "test",
      description: "Balance must be positive",
      check: (ctx: { balance: number }) => ctx.balance > 0,
    });

    const verdict = await engine.check({ balance: 100 });
    expect(verdict.allowed).toBe(true);
    expect(verdict.results).toHaveLength(1);
    expect(verdict.results[0].passed).toBe(true);
  });

  it("rejects transitions when an invariant fails", async () => {
    engine.register({
      name: "positive-balance",
      owner: "test",
      description: "Balance must be positive",
      check: (ctx: { balance: number }) => ctx.balance > 0,
    });

    const verdict = await engine.check({ balance: -5 });
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations).toHaveLength(1);
    expect(verdict.violations[0].name).toBe("positive-balance");
  });

  it("fail-closed: throwing invariants count as failures", async () => {
    engine.register({
      name: "explosive",
      owner: "test",
      description: "Always throws",
      check: () => {
        throw new Error("kaboom");
      },
    });

    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.violations).toHaveLength(1);
    expect(verdict.violations[0].name).toBe("explosive");
  });

  it("supports async invariant checks", async () => {
    engine.register({
      name: "async-check",
      owner: "test",
      description: "Async invariant",
      check: async (ctx: { ready: boolean }) => {
        await new Promise((r) => setTimeout(r, 10));
        return ctx.ready;
      },
    });

    const passing = await engine.check({ ready: true });
    expect(passing.allowed).toBe(true);

    const failing = await engine.check({ ready: false });
    expect(failing.allowed).toBe(false);
  });

  it("prevents duplicate invariant registration", () => {
    engine.register({
      name: "unique",
      owner: "test",
      description: "First",
      check: () => true,
    });

    expect(() =>
      engine.register({
        name: "unique",
        owner: "test2",
        description: "Duplicate",
        check: () => true,
      })
    ).toThrow(/already registered/);
  });

  it("checks ALL invariants even if early ones fail", async () => {
    engine.register({
      name: "first",
      owner: "test",
      description: "Fails",
      check: () => false,
    });

    engine.register({
      name: "second",
      owner: "test",
      description: "Passes",
      check: () => true,
    });

    engine.register({
      name: "third",
      owner: "test",
      description: "Fails",
      check: () => false,
    });

    const verdict = await engine.check({});
    expect(verdict.allowed).toBe(false);
    expect(verdict.results).toHaveLength(3); // all checked
    expect(verdict.violations).toHaveLength(2); // first & third
  });

  it("maintains an audit log of all verdicts", async () => {
    engine.register({
      name: "check",
      owner: "test",
      description: "Conditional",
      check: (ctx: { ok: boolean }) => ctx.ok,
    });

    await engine.check({ ok: true });
    await engine.check({ ok: false });
    await engine.check({ ok: true });

    const log = engine.auditLog();
    expect(log).toHaveLength(3);
    expect(log.map((v) => v.allowed)).toEqual([true, false, true]);
  });

  it("registered() returns all invariant names", () => {
    engine.register({
      name: "alpha",
      owner: "a",
      description: "",
      check: () => true,
    });
    engine.register({
      name: "beta",
      owner: "b",
      description: "",
      check: () => true,
    });

    expect(engine.registered()).toEqual(["alpha", "beta"]);
  });
});
