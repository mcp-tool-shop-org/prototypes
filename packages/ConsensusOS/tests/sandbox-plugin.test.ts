import { describe, it, expect, beforeEach, vi } from "vitest";
import { SandboxPlugin } from "../src/modules/sandbox/sandbox-plugin.js";
import { InMemoryContainerRuntime } from "../src/modules/sandbox/in-memory-runtime.js";
import { CoreEventBus } from "../src/core/event-bus.js";
import { CoreInvariantEngine } from "../src/core/invariant-engine.js";
import type { PluginContext, ConsensusEvent } from "../src/plugins/api.js";

function makeCtx(overrides: Partial<PluginContext> = {}): PluginContext {
  const events = new CoreEventBus();
  const invariants = new CoreInvariantEngine(events);
  return {
    events,
    invariants,
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    config: {},
    ...overrides,
  } as unknown as PluginContext;
}

describe("SandboxPlugin", () => {
  let plugin: SandboxPlugin;
  let ctx: PluginContext;

  beforeEach(async () => {
    plugin = new SandboxPlugin();
    ctx = makeCtx({ config: { maxSessions: 3, runtime: new InMemoryContainerRuntime() } as any });
    await plugin.init(ctx);
    await plugin.start();
  });

  // ── Session management ──────────────────────────────────────────

  it("creates and retrieves a session", async () => {
    const session = await plugin.createSession({
      label: "test-sandbox",
      createdBy: "dev",
      nodeCount: 2,
    });

    expect(session.id).toContain("session-");
    expect(session.label).toBe("test-sandbox");
    expect(session.state).toBe("running");
    expect(session.containers).toHaveLength(2);
    expect(plugin.getSession(session.id)).toBe(session);
  });

  it("lists all active sessions", async () => {
    await plugin.createSession({ label: "a", createdBy: "dev" });
    await plugin.createSession({ label: "b", createdBy: "dev" });
    expect(plugin.listSessions()).toHaveLength(2);
  });

  it("destroys a session and removes containers", async () => {
    const session = await plugin.createSession({ label: "gone", createdBy: "dev", nodeCount: 1 });
    const id = session.id;

    await plugin.destroySession(id);
    expect(plugin.getSession(id)).toBeUndefined();
    expect(plugin.listSessions()).toHaveLength(0);
  });

  it("throws when destroying a non-existent session", async () => {
    await expect(plugin.destroySession("fake")).rejects.toThrow("not found");
  });

  it("enforces max session limit", async () => {
    await plugin.createSession({ label: "1", createdBy: "dev" });
    await plugin.createSession({ label: "2", createdBy: "dev" });
    await plugin.createSession({ label: "3", createdBy: "dev" });

    await expect(
      plugin.createSession({ label: "4", createdBy: "dev" }),
    ).rejects.toThrow("Session limit reached");
  });

  // ── Session limit invariant ─────────────────────────────────────

  it("registers a session-limit invariant", async () => {
    const invariants = new CoreInvariantEngine(new CoreEventBus());
    const localPlugin = new SandboxPlugin();
    const localCtx = makeCtx({
      config: { maxSessions: 1, runtime: new InMemoryContainerRuntime() } as any,
      invariants,
    });

    await localPlugin.init(localCtx);
    expect((await invariants.check()).allowed).toBe(true);

    await localPlugin.createSession({ label: "x", createdBy: "dev" });
    expect((await invariants.check()).allowed).toBe(true); // At limit but <= is OK

    // Second session will throw before invariant can fail
    await expect(
      localPlugin.createSession({ label: "y", createdBy: "dev" }),
    ).rejects.toThrow("Session limit");
  });

  // ── Snapshots ───────────────────────────────────────────────────

  it("takes a snapshot of a session", async () => {
    const session = await plugin.createSession({ label: "snap", createdBy: "dev" });
    const snapshot = plugin.takeSnapshot(session.id, "initial", { ledger: 100 });

    expect(snapshot.id).toBeDefined();
    expect(snapshot.sessionId).toBe(session.id);
    expect(snapshot.state).toEqual({ ledger: 100 });
    expect(snapshot.checksum).toBeDefined();
  });

  it("restores a verified snapshot", async () => {
    const session = await plugin.createSession({ label: "snap", createdBy: "dev" });
    const snap = plugin.takeSnapshot(session.id, "v1", { version: 1 });

    const restored = plugin.restoreSnapshot(snap.id);
    expect(restored.id).toBe(snap.id);
    expect(restored.state).toEqual({ version: 1 });
  });

  it("throws when taking a snapshot on invalid session", async () => {
    expect(() => plugin.takeSnapshot("nope", "x", {})).toThrow("not found");
  });

  it("throws when restoring a non-existent snapshot", () => {
    expect(() => plugin.restoreSnapshot("bad-id")).toThrow("not found");
  });

  // ── Replay ──────────────────────────────────────────────────────

  it("replays events through the engine", async () => {
    const log: string[] = [];
    plugin.registerReplayHandler("tx.*", (state, event) => {
      log.push(event.topic);
      return { ...state, [`processed_${event.sequence}`]: true };
    });

    const events: ConsensusEvent[] = [
      { topic: "tx.submit", source: "test", data: {}, timestamp: Date.now(), sequence: 1 },
      { topic: "tx.confirm", source: "test", data: {}, timestamp: Date.now(), sequence: 2 },
      { topic: "other.event", source: "test", data: {}, timestamp: Date.now(), sequence: 3 },
    ];

    const result = await plugin.replayEvents({ events });
    expect(result.success).toBe(true);
    expect(result.eventsProcessed).toBe(2); // tx.submit, tx.confirm matched
    expect(result.eventsSkipped).toBe(1);   // other.event unmatched
    expect(log).toEqual(["tx.submit", "tx.confirm"]);
  });

  // ── Amendment simulation ────────────────────────────────────────

  it("defines and simulates an amendment", async () => {
    plugin.defineAmendment({
      id: "test-amendment",
      name: "Test",
      effect: (state) => ({ ...state, upgraded: true }),
    });

    const session = await plugin.createSession({ label: "amend", createdBy: "dev" });
    const result = plugin.simulateAmendment("test-amendment", { version: 1 }, session.id);

    expect(result.success).toBe(true);
    expect(result.stateAfter).toEqual({ version: 1, upgraded: true });
    expect(result.diff.added).toContainEqual({ key: "upgraded", value: true });
  });

  // ── Events ──────────────────────────────────────────────────────

  it("emits lifecycle events", async () => {
    const events: ConsensusEvent[] = [];
    (ctx.events as CoreEventBus).subscribe("sandbox.*", (e) => { events.push(e); });

    const session = await plugin.createSession({ label: "ev", createdBy: "dev" });
    plugin.takeSnapshot(session.id, "snap", { x: 1 });
    await plugin.destroySession(session.id);

    const topics = events.map((e) => e.topic);
    expect(topics).toContain("sandbox.session.created");
    expect(topics).toContain("sandbox.snapshot.taken");
    expect(topics).toContain("sandbox.session.destroyed");
  });

  // ── Lifecycle ───────────────────────────────────────────────────

  it("stop() cleans up all sessions", async () => {
    await plugin.createSession({ label: "a", createdBy: "dev" });
    await plugin.createSession({ label: "b", createdBy: "dev" });
    expect(plugin.listSessions()).toHaveLength(2);

    await plugin.stop();
    expect(plugin.listSessions()).toHaveLength(0);
  });

  it("destroy() clears internal state", async () => {
    const session = await plugin.createSession({ label: "x", createdBy: "dev" });
    plugin.takeSnapshot(session.id, "snap", { v: 1 });
    plugin.defineAmendment({ id: "a", name: "A", effect: (s) => s });

    await plugin.destroy();
    expect(plugin.listSessions()).toHaveLength(0);
  });
});
