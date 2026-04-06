import { describe, it, expect, beforeEach } from "vitest";
import { ReplayEngine } from "../src/modules/sandbox/replay-engine.js";
import type { ConsensusEvent } from "../src/plugins/api.js";

function makeEvent(seq: number, topic: string, data: unknown = {}): ConsensusEvent {
  return {
    topic,
    source: "test",
    timestamp: new Date().toISOString(),
    sequence: seq,
    data,
  };
}

describe("ReplayEngine", () => {
  let engine: ReplayEngine;

  beforeEach(() => {
    engine = new ReplayEngine();
  });

  it("replays events through registered handlers", async () => {
    engine.on("counter.increment", (state, event) => {
      const amount = (event.data as { amount: number }).amount;
      return { ...state, count: ((state.count as number) ?? 0) + amount };
    });

    const result = await engine.replay({
      events: [
        makeEvent(1, "counter.increment", { amount: 1 }),
        makeEvent(2, "counter.increment", { amount: 5 }),
        makeEvent(3, "counter.increment", { amount: 3 }),
      ],
    });

    expect(result.success).toBe(true);
    expect(result.finalState).toEqual({ count: 9 });
    expect(result.eventsProcessed).toBe(3);
    expect(result.eventsSkipped).toBe(0);
    expect(result.diffs).toHaveLength(3);
  });

  it("starts from provided initial state", async () => {
    engine.on("counter.increment", (state) => ({
      ...state,
      count: (state.count as number) + 1,
    }));

    const result = await engine.replay({
      events: [makeEvent(1, "counter.increment")],
      initialState: { count: 100 },
    });

    expect(result.finalState.count).toBe(101);
  });

  it("respects event ordering by sequence number", async () => {
    const order: number[] = [];
    engine.on("*", (state, event) => {
      order.push(event.sequence);
      return state;
    });

    await engine.replay({
      events: [
        makeEvent(3, "a"),
        makeEvent(1, "b"),
        makeEvent(2, "c"),
      ],
    });

    expect(order).toEqual([1, 2, 3]);
  });

  it("skips events without matching handlers", async () => {
    engine.on("known.topic", (state) => ({ ...state, hit: true }));

    const result = await engine.replay({
      events: [
        makeEvent(1, "unknown.topic"),
        makeEvent(2, "known.topic"),
        makeEvent(3, "also.unknown"),
      ],
    });

    expect(result.eventsProcessed).toBe(1);
    expect(result.eventsSkipped).toBe(2);
    expect(result.finalState.hit).toBe(true);
  });

  it("stops at maxEvents", async () => {
    engine.on("*", (state, event) => ({
      ...state,
      last: event.sequence,
    }));

    const result = await engine.replay({
      events: [makeEvent(1, "a"), makeEvent(2, "b"), makeEvent(3, "c")],
      maxEvents: 2,
    });

    expect(result.eventsProcessed).toBe(2);
    expect(result.finalState.last).toBe(2);
  });

  it("stops at stopAtSequence", async () => {
    engine.on("*", (state, event) => ({
      ...state,
      last: event.sequence,
    }));

    const result = await engine.replay({
      events: [makeEvent(1, "a"), makeEvent(2, "b"), makeEvent(3, "c")],
      stopAtSequence: 2,
    });

    expect(result.eventsProcessed).toBe(2);
    expect(result.finalState.last).toBe(2);
  });

  it("computes diffs at each step", async () => {
    engine.on("set", (state, event) => {
      const { key, value } = event.data as { key: string; value: unknown };
      return { ...state, [key]: value };
    });

    const result = await engine.replay({
      events: [
        makeEvent(1, "set", { key: "a", value: 1 }),
        makeEvent(2, "set", { key: "b", value: 2 }),
      ],
    });

    expect(result.diffs).toHaveLength(2);
    expect(result.diffs[0].added).toEqual([{ key: "a", value: 1 }]);
    expect(result.diffs[1].added).toEqual([{ key: "b", value: 2 }]);
  });

  it("handles handler errors gracefully", async () => {
    engine.on("crash", () => {
      throw new Error("handler exploded");
    });

    const result = await engine.replay({
      events: [makeEvent(1, "crash")],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("handler exploded");
  });

  it("deterministically replays to same final state", async () => {
    engine.on("add", (state, event) => {
      const n = (event.data as { n: number }).n;
      return { ...state, sum: ((state.sum as number) ?? 0) + n };
    });

    const events = [
      makeEvent(1, "add", { n: 10 }),
      makeEvent(2, "add", { n: 20 }),
      makeEvent(3, "add", { n: 30 }),
    ];

    const r1 = await engine.replay({ events });
    const r2 = await engine.replay({ events });

    expect(r1.finalState).toEqual(r2.finalState);
    expect(r1.finalState.sum).toBe(60);
  });

  it("compares two replays", async () => {
    engine.on("set", (state, event) => {
      const { key, value } = event.data as { key: string; value: unknown };
      return { ...state, [key]: value };
    });

    const eventsA = [makeEvent(1, "set", { key: "x", value: 1 })];
    const eventsB = [makeEvent(1, "set", { key: "x", value: 1 })];
    const eventsC = [makeEvent(1, "set", { key: "x", value: 999 })];

    const same = await engine.replayAndCompare(eventsA, eventsB);
    expect(same.identical).toBe(true);

    const different = await engine.replayAndCompare(eventsA, eventsC);
    expect(different.identical).toBe(false);
  });

  it("supports wildcard handlers", async () => {
    engine.on("*", (state, event) => ({
      ...state,
      lastTopic: event.topic,
    }));

    const result = await engine.replay({
      events: [makeEvent(1, "any.topic.here")],
    });

    expect(result.finalState.lastTopic).toBe("any.topic.here");
  });
});
