import { describe, it, expect, beforeEach } from "vitest";
import { CoreEventBus, WILDCARD } from "../src/core/event-bus.js";
import type { ConsensusEvent } from "../src/plugins/api.js";

describe("CoreEventBus", () => {
  let bus: CoreEventBus;

  beforeEach(() => {
    bus = new CoreEventBus();
  });

  it("assigns monotonic sequence numbers", () => {
    const s1 = bus.publish("a", "test", {});
    const s2 = bus.publish("b", "test", {});
    const s3 = bus.publish("c", "test", {});
    expect(s1).toBe(1);
    expect(s2).toBe(2);
    expect(s3).toBe(3);
  });

  it("delivers events to exact-topic subscribers", () => {
    const received: ConsensusEvent[] = [];
    bus.subscribe("health.check", (e) => received.push(e));

    bus.publish("health.check", "sentinel", { ok: true });
    bus.publish("health.alert", "sentinel", { ok: false });

    expect(received).toHaveLength(1);
    expect(received[0].topic).toBe("health.check");
    expect(received[0].data).toEqual({ ok: true });
  });

  it("delivers events to wildcard subscribers", () => {
    const received: ConsensusEvent[] = [];
    bus.subscribe(WILDCARD, (e) => received.push(e));

    bus.publish("health.check", "s1", {});
    bus.publish("config.updated", "s2", {});

    expect(received).toHaveLength(2);
  });

  it("supports prefix-wildcard matching (topic.*)", () => {
    const received: ConsensusEvent[] = [];
    bus.subscribe("health.*", (e) => received.push(e));

    bus.publish("health.check", "s1", {});
    bus.publish("health.alert", "s1", {});
    bus.publish("config.updated", "s2", {}); // should NOT match

    expect(received).toHaveLength(2);
    expect(received.map((e) => e.topic)).toEqual([
      "health.check",
      "health.alert",
    ]);
  });

  it("unsubscribe stops delivery", () => {
    const received: ConsensusEvent[] = [];
    const unsub = bus.subscribe("test", (e) => received.push(e));

    bus.publish("test", "src", { n: 1 });
    unsub();
    bus.publish("test", "src", { n: 2 });

    expect(received).toHaveLength(1);
    expect(received[0].data).toEqual({ n: 1 });
  });

  it("preserves full ordered history", () => {
    bus.publish("a", "s1", {});
    bus.publish("b", "s2", {});
    bus.publish("c", "s3", {});

    const h = bus.history();
    expect(h).toHaveLength(3);
    expect(h.map((e) => e.topic)).toEqual(["a", "b", "c"]);
    expect(h.map((e) => e.sequence)).toEqual([1, 2, 3]);
  });

  it("reset clears history and sequence", () => {
    bus.publish("a", "s", {});
    bus.publish("b", "s", {});
    bus.reset();

    expect(bus.history()).toHaveLength(0);
    const seq = bus.publish("c", "s", {});
    expect(seq).toBe(1); // counter resets
  });

  it("catches errors in sync handlers without stopping dispatch", () => {
    const received: string[] = [];

    bus.subscribe("test", () => {
      throw new Error("boom");
    });
    bus.subscribe("test", (e) => {
      received.push(e.topic);
    });

    // Should not throw
    bus.publish("test", "s", {});

    // Second handler still received the event
    expect(received).toEqual(["test"]);
  });

  it("events have ISO-8601 timestamps", () => {
    bus.publish("test", "s", {});
    const event = bus.history()[0];
    expect(() => new Date(event.timestamp)).not.toThrow();
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp);
  });
});
