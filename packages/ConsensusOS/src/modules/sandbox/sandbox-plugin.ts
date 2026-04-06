/**
 * Sandbox Plugin
 *
 * Top-level orchestrator plugin for the sandbox engine. Manages sandbox
 * sessions, delegates to the snapshot serializer, replay engine, and
 * amendment simulator. Exposes sandbox capabilities to the CLI and
 * other plugins via the event bus.
 *
 * Capabilities: sandbox
 * Events emitted: sandbox.session.created, sandbox.session.destroyed,
 *   sandbox.snapshot.taken, sandbox.replay.completed
 * Invariants: sandbox.session-limit
 */

import type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginConfig,
  LifecycleResult,
  Logger,
  ConsensusEvent,
} from "../../plugins/api.js";
import type { EventBus } from "../../core/event-bus.js";
import type {
  ContainerRuntime,
  SandboxSession,
  SandboxState,
  Snapshot,
  AmendmentSimulationResult,
  ReplayResult,
  ReplayOptions,
} from "./types.js";
import { InMemoryContainerRuntime } from "./in-memory-runtime.js";
import { SnapshotSerializer } from "./snapshot-serializer.js";
import { ReplayEngine, type ReplayHandler } from "./replay-engine.js";
import { AmendmentSimulator, type AmendmentDefinition } from "./amendment-simulator.js";

// ─── Config ─────────────────────────────────────────────────────────

export interface SandboxPluginConfig {
  /** Maximum concurrent sandbox sessions (default: 10) */
  maxSessions?: number;
  /** Container runtime to use (default: InMemoryContainerRuntime) */
  runtime?: ContainerRuntime;
  /** Default container image for sandbox nodes */
  defaultImage?: string;
}

// ─── Plugin ─────────────────────────────────────────────────────────

export class SandboxPlugin implements Plugin {
  readonly manifest: PluginManifest = {
    id: "sandbox",
    name: "Sandbox Engine",
    version: "1.0.0",
    capabilities: ["sandbox"],
    description: "Isolated simulation environment — snapshots, replay, amendment simulation",
  };

  private events!: EventBus;
  private log!: Logger;
  private runtime!: ContainerRuntime;
  private maxSessions = 10;
  private defaultImage = "consensusos/sandbox-node:latest";

  // Sub-engines
  readonly snapshots = new SnapshotSerializer();
  readonly replay = new ReplayEngine();
  readonly amendments = new AmendmentSimulator();

  // Session management
  private readonly sessions = new Map<string, SandboxSession>();
  private sessionCounter = 0;

  async init(ctx: PluginContext): Promise<LifecycleResult> {
    this.events = ctx.events;
    this.log = ctx.log;

    const raw = ctx.config as PluginConfig & SandboxPluginConfig;
    this.maxSessions = raw.maxSessions ?? 10;
    this.runtime = raw.runtime ?? new InMemoryContainerRuntime();
    this.defaultImage = raw.defaultImage ?? "consensusos/sandbox-node:latest";

    // Register sandbox invariant
    ctx.invariants.register({
      name: "sandbox.session-limit",
      owner: this.manifest.id,
      description: `Maximum ${this.maxSessions} concurrent sandbox sessions`,
      check: () => this.sessions.size <= this.maxSessions,
    });

    this.log.info("Sandbox Engine initialized", { maxSessions: this.maxSessions });
    return { ok: true };
  }

  async start(): Promise<LifecycleResult> {
    this.events.publish("sandbox.ready", this.manifest.id, {
      maxSessions: this.maxSessions,
    });

    this.log.info("Sandbox Engine started");
    return { ok: true };
  }

  async stop(): Promise<LifecycleResult> {
    // Destroy all active sessions
    for (const session of this.sessions.values()) {
      await this.destroySession(session.id);
    }
    this.log.info("Sandbox Engine stopped");
    return { ok: true };
  }

  async destroy(): Promise<void> {
    this.sessions.clear();
    this.snapshots.clear();
    this.replay.clearHandlers();
    this.amendments.reset();
  }

  // ── Session Management ──────────────────────────────────────────

  /** Create a new sandbox session */
  async createSession(options: {
    label: string;
    createdBy: string;
    nodeCount?: number;
    image?: string;
    metadata?: Record<string, unknown>;
  }): Promise<SandboxSession> {
    if (this.sessions.size >= this.maxSessions) {
      throw new Error(`Session limit reached (${this.maxSessions})`);
    }

    const id = `session-${++this.sessionCounter}-${Date.now()}`;
    const image = options.image ?? this.defaultImage;
    const containers: string[] = [];

    // Provision containers
    const nodeCount = options.nodeCount ?? 1;
    for (let i = 0; i < nodeCount; i++) {
      const containerId = await this.runtime.create({
        image,
        name: `${id}-node-${i}`,
        labels: { session: id, role: "sandbox-node" },
      });
      containers.push(containerId);
    }

    const session: SandboxSession = {
      id,
      label: options.label,
      state: "running",
      containers,
      events: [],
      createdAt: new Date().toISOString(),
      createdBy: options.createdBy,
      metadata: options.metadata ?? {},
    };

    this.sessions.set(id, session);

    this.events.publish("sandbox.session.created", this.manifest.id, {
      sessionId: id,
      label: options.label,
      nodeCount,
    });

    this.log.info(`Session created: ${id}`, { nodeCount });
    return session;
  }

  /** Destroy a sandbox session and clean up containers */
  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);

    for (const containerId of session.containers) {
      try {
        await this.runtime.remove(containerId);
      } catch {
        // Container may already be gone — continue cleanup
      }
    }

    session.state = "stopped";
    session.containers = [];
    this.sessions.delete(sessionId);

    this.events.publish("sandbox.session.destroyed", this.manifest.id, {
      sessionId,
    });

    this.log.info(`Session destroyed: ${sessionId}`);
  }

  /** Get a session by ID */
  getSession(id: string): SandboxSession | undefined {
    return this.sessions.get(id);
  }

  /** List all active sessions */
  listSessions(): SandboxSession[] {
    return [...this.sessions.values()];
  }

  // ── Snapshots ───────────────────────────────────────────────────

  /** Take a snapshot of a session's current state */
  takeSnapshot(sessionId: string, label: string, state: Record<string, unknown>): Snapshot {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);

    const snapshot = this.snapshots.capture({
      sessionId,
      label,
      state,
      events: session.events,
      amendments: this.amendments.getAmendments(),
    });

    this.events.publish("sandbox.snapshot.taken", this.manifest.id, {
      snapshotId: snapshot.id,
      sessionId,
      label,
    });

    return snapshot;
  }

  /** Restore state from a snapshot */
  restoreSnapshot(snapshotId: string): Snapshot {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error(`Snapshot "${snapshotId}" not found`);

    if (!this.snapshots.verify(snapshot)) {
      throw new Error(`Snapshot "${snapshotId}" failed integrity verification`);
    }

    this.events.publish("sandbox.snapshot.restored", this.manifest.id, {
      snapshotId,
      sessionId: snapshot.sessionId,
    });

    return snapshot;
  }

  // ── Replay ──────────────────────────────────────────────────────

  /** Register a replay handler */
  registerReplayHandler(topic: string, handler: ReplayHandler): void {
    this.replay.on(topic, handler);
  }

  /** Replay events through the engine */
  async replayEvents(options: ReplayOptions): Promise<ReplayResult> {
    const result = await this.replay.replay(options);

    this.events.publish("sandbox.replay.completed", this.manifest.id, {
      eventsProcessed: result.eventsProcessed,
      eventsSkipped: result.eventsSkipped,
      success: result.success,
    });

    return result;
  }

  // ── Amendment Simulation ────────────────────────────────────────

  /** Define an amendment for simulation */
  defineAmendment(definition: AmendmentDefinition): void {
    this.amendments.define(definition);
  }

  /** Simulate an amendment activation */
  simulateAmendment(
    amendmentId: string,
    state: Record<string, unknown>,
    sessionId?: string,
  ): AmendmentSimulationResult {
    return this.amendments.simulate(amendmentId, state, sessionId);
  }
}

/** Factory export */
export function createSandboxPlugin(): Plugin {
  return new SandboxPlugin();
}
