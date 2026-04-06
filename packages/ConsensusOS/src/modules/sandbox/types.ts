/**
 * Sandbox Types
 *
 * Shared type definitions for the sandbox engine. The sandbox provides
 * isolated execution environments for simulating amendments, config changes,
 * and chain behavior without affecting live systems.
 */

import type { ConsensusEvent, PluginId } from "../../plugins/api.js";

// ─── Container Abstraction ──────────────────────────────────────────

/**
 * Container runtime interface. The sandbox engine does not bind to Docker
 * directly — it programs against this abstraction so any container runtime
 * (Docker, Podman, in-memory mock) can be injected.
 */
export interface ContainerRuntime {
  /** Create and start a container, returning its ID */
  create(spec: ContainerSpec): Promise<string>;
  /** Stop a running container */
  stop(containerId: string): Promise<void>;
  /** Remove a container */
  remove(containerId: string): Promise<void>;
  /** Execute a command inside a running container */
  exec(containerId: string, command: string[]): Promise<ExecResult>;
  /** Get container status */
  status(containerId: string): Promise<ContainerStatus>;
  /** List all sandbox containers */
  list(): Promise<ContainerInfo[]>;
}

export interface ContainerSpec {
  /** Container image */
  image: string;
  /** Container name (optional) */
  name?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Port mappings: hostPort → containerPort */
  ports?: Record<number, number>;
  /** Volume mounts: hostPath → containerPath */
  volumes?: Record<string, string>;
  /** Command to run */
  command?: string[];
  /** Labels for identification */
  labels?: Record<string, string>;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export type ContainerState = "created" | "running" | "stopped" | "removed" | "error";

export interface ContainerStatus {
  id: string;
  state: ContainerState;
  startedAt?: string;
  stoppedAt?: string;
  error?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  state: ContainerState;
  labels: Record<string, string>;
}

// ─── Sandbox Session ────────────────────────────────────────────────

export type SandboxState = "idle" | "provisioning" | "running" | "stopped" | "error";

export interface SandboxSession {
  /** Unique session identifier */
  readonly id: string;
  /** Human-readable label */
  readonly label: string;
  /** Current state */
  state: SandboxState;
  /** Container IDs in this session */
  containers: string[];
  /** Session-scoped event log */
  events: ConsensusEvent[];
  /** Session creation time */
  readonly createdAt: string;
  /** Who created the session */
  readonly createdBy: PluginId;
  /** Session metadata */
  metadata: Record<string, unknown>;
}

// ─── Snapshot ───────────────────────────────────────────────────────

export interface Snapshot {
  /** Unique snapshot ID */
  readonly id: string;
  /** Session this snapshot belongs to */
  readonly sessionId: string;
  /** Display label */
  readonly label: string;
  /** Full state capture */
  readonly state: Record<string, unknown>;
  /** Event history at time of snapshot */
  readonly events: ConsensusEvent[];
  /** Amendment state at time of snapshot */
  readonly amendments: AmendmentState[];
  /** ISO-8601 timestamp */
  readonly createdAt: string;
  /** Checksum of serialized state for integrity verification */
  readonly checksum: string;
}

// ─── Amendments ─────────────────────────────────────────────────────

export type AmendmentStatus = "proposed" | "enabled" | "vetoed" | "retired";

export interface AmendmentState {
  /** Amendment identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Current status */
  status: AmendmentStatus;
  /** Ledger at which status changed */
  activatedAt?: number;
  /** Description of what this amendment does */
  description?: string;
}

export interface AmendmentSimulationResult {
  /** The amendment that was simulated */
  amendment: AmendmentState;
  /** State before activation */
  stateBefore: Record<string, unknown>;
  /** State after activation */
  stateAfter: Record<string, unknown>;
  /** Diff of what changed */
  diff: StateDiff;
  /** Events emitted during simulation */
  events: ConsensusEvent[];
  /** Whether the simulation completed without errors */
  success: boolean;
  /** Error message if simulation failed */
  error?: string;
  /** Duration in ms */
  durationMs: number;
}

// ─── State Diff ─────────────────────────────────────────────────────

export interface StateDiff {
  added: Array<{ key: string; value: unknown }>;
  removed: Array<{ key: string; value: unknown }>;
  changed: Array<{ key: string; oldValue: unknown; newValue: unknown }>;
}

// ─── Replay ─────────────────────────────────────────────────────────

export interface ReplayOptions {
  /** Events to replay */
  events: ConsensusEvent[];
  /** Starting state (if restoring from snapshot) */
  initialState?: Record<string, unknown>;
  /** Speed multiplier (1.0 = real-time, 0 = instant) */
  speed?: number;
  /** Stop after this many events */
  maxEvents?: number;
  /** Stop at this sequence number */
  stopAtSequence?: number;
}

export interface ReplayResult {
  /** Final state after replay */
  finalState: Record<string, unknown>;
  /** Events processed */
  eventsProcessed: number;
  /** Events skipped (filtered) */
  eventsSkipped: number;
  /** State diffs at each step */
  diffs: StateDiff[];
  /** Duration in ms */
  durationMs: number;
  /** Whether replay completed without errors */
  success: boolean;
  /** Error if replay failed */
  error?: string;
}
