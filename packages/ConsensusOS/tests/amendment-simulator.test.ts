import { describe, it, expect, beforeEach } from "vitest";
import { AmendmentSimulator } from "../src/modules/sandbox/amendment-simulator.js";

describe("AmendmentSimulator", () => {
  let sim: AmendmentSimulator;

  beforeEach(() => {
    sim = new AmendmentSimulator();
  });

  it("defines and simulates an amendment", () => {
    sim.define({
      id: "fix-nft-buy-offers",
      name: "fixNFTokenBuyOffers",
      description: "Fixes NFT buy offer matching logic",
      effect: (state) => ({ ...state, nftBuyOfferFixed: true }),
    });

    const result = sim.simulate("fix-nft-buy-offers", { ledger: 90000000 });

    expect(result.success).toBe(true);
    expect(result.stateBefore).toEqual({ ledger: 90000000 });
    expect(result.stateAfter).toEqual({ ledger: 90000000, nftBuyOfferFixed: true });
    expect(result.amendment.status).toBe("enabled");
    expect(result.diff.added).toHaveLength(1);
    expect(result.diff.added[0].key).toBe("nftBuyOfferFixed");
  });

  it("rejects simulation of undefined amendment", () => {
    const result = sim.simulate("nonexistent", {});
    expect(result.success).toBe(false);
    expect(result.error).toContain("not defined");
  });

  it("enforces prerequisites", () => {
    sim.define({
      id: "base",
      name: "Base Amendment",
      effect: (state) => ({ ...state, base: true }),
    });

    sim.define({
      id: "dependent",
      name: "Dependent Amendment",
      prerequisites: ["base"],
      effect: (state) => ({ ...state, dependent: true }),
    });

    // Simulate dependent without base enabled → should fail
    const fail = sim.simulate("dependent", {});
    expect(fail.success).toBe(false);
    expect(fail.error).toContain("base");

    // Enable base first, then dependent
    sim.simulate("base", {});
    const ok = sim.simulate("dependent", { base: true });
    expect(ok.success).toBe(true);
    expect(ok.stateAfter.dependent).toBe(true);
  });

  it("prevents duplicate amendment definitions", () => {
    sim.define({ id: "a", name: "A", effect: (s) => s });
    expect(() => sim.define({ id: "a", name: "A2", effect: (s) => s })).toThrow("already defined");
  });

  it("tracks amendment status changes", () => {
    sim.define({ id: "x", name: "X", effect: (s) => ({ ...s, x: true }) });

    expect(sim.getAmendment("x")?.status).toBe("proposed");

    sim.simulate("x", {});
    expect(sim.getAmendment("x")?.status).toBe("enabled");
    expect(sim.getAmendment("x")?.activatedAt).toBeDefined();
  });

  it("vetoes amendments", () => {
    sim.define({ id: "bad", name: "Bad", effect: (s) => s });
    sim.veto("bad");
    expect(sim.getAmendment("bad")?.status).toBe("vetoed");
  });

  it("computes state diffs correctly", () => {
    sim.define({
      id: "change-port",
      name: "ChangePort",
      effect: (state) => {
        const { oldField, ...rest } = state as Record<string, unknown> & { oldField?: unknown };
        return { ...rest, port: 8080, newField: true };
      },
    });

    const result = sim.simulate("change-port", { port: 3000, oldField: "bye" });
    expect(result.diff.changed).toEqual([{ key: "port", oldValue: 3000, newValue: 8080 }]);
    expect(result.diff.removed).toEqual([{ key: "oldField", value: "bye" }]);
    expect(result.diff.added).toEqual([{ key: "newField", value: true }]);
  });

  it("records simulation history", () => {
    sim.define({ id: "a", name: "A", effect: (s) => ({ ...s, a: 1 }) });
    sim.define({ id: "b", name: "B", effect: (s) => ({ ...s, b: 2 }) });

    sim.simulate("a", {});
    sim.simulate("b", {});

    const history = sim.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].amendment.id).toBe("a");
    expect(history[1].amendment.id).toBe("b");
  });

  it("captures events during simulation", () => {
    sim.define({ id: "x", name: "X", effect: (s) => s });
    const result = sim.simulate("x", {});
    // Event bus emits sandbox.amendment.activated
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.events.some((e) => e.topic === "sandbox.amendment.activated")).toBe(true);
  });

  it("handles effect errors gracefully", () => {
    sim.define({
      id: "crash",
      name: "Crash",
      effect: () => { throw new Error("effect boom"); },
    });

    const result = sim.simulate("crash", { safe: true });
    expect(result.success).toBe(false);
    expect(result.error).toContain("effect boom");
    expect(result.stateAfter).toEqual({ safe: true }); // Unchanged
  });

  it("resets all amendments and history", () => {
    sim.define({ id: "a", name: "A", effect: (s) => s });
    sim.simulate("a", {});

    expect(sim.getAmendment("a")?.status).toBe("enabled");
    expect(sim.getHistory()).toHaveLength(1);

    sim.reset();
    expect(sim.getAmendment("a")?.status).toBe("proposed");
    expect(sim.getHistory()).toHaveLength(0);
  });

  it("lists all amendments", () => {
    sim.define({ id: "a", name: "A", effect: (s) => s });
    sim.define({ id: "b", name: "B", effect: (s) => s });
    sim.define({ id: "c", name: "C", effect: (s) => s });

    const amendments = sim.getAmendments();
    expect(amendments).toHaveLength(3);
    expect(amendments.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});
