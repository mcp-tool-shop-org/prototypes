/**
 * Amendment Simulator
 *
 * Simulates chain amendment activation in an isolated sandbox.
 * Captures state before and after activation, computes diffs,
 * and provides rollback capability.
 *
 * The simulator is chain-agnostic: amendment effects are expressed
 * as pure state transform functions, so the same engine works for
 * XRPL, Ethereum EIPs, Cosmos proposals, etc.
 */

import type { ConsensusEvent } from "../../plugins/api.js";
import type {
  AmendmentState,
  AmendmentStatus,
  AmendmentSimulationResult,
  StateDiff,
} from "./types.js";
import { SnapshotSerializer } from "./snapshot-serializer.js";
import { CoreEventBus } from "../../core/event-bus.js";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * An amendment effect function. Takes the current state and returns
 * the new state after the amendment is activated.
 * Must be a pure function for deterministic simulation.
 */
export type AmendmentEffect = (
  state: Record<string, unknown>,
  amendment: AmendmentState,
) => Record<string, unknown>;

export interface AmendmentDefinition {
  /** Amendment identity */
  id: string;
  name: string;
  description?: string;
  /** Pure function defining the amendment's effect on state */
  effect: AmendmentEffect;
  /** Optional prerequisites — amendment IDs that must be enabled first */
  prerequisites?: string[];
}

// ─── Simulator ──────────────────────────────────────────────────────

export class AmendmentSimulator {
  private readonly definitions = new Map<string, AmendmentDefinition>();
  private readonly amendments = new Map<string, AmendmentState>();
  private readonly snapshots: SnapshotSerializer;
  private readonly eventBus: CoreEventBus;
  private readonly history: AmendmentSimulationResult[] = [];

  constructor(snapshots?: SnapshotSerializer, eventBus?: CoreEventBus) {
    this.snapshots = snapshots ?? new SnapshotSerializer();
    this.eventBus = eventBus ?? new CoreEventBus();
  }

  /**
   * Register an amendment definition with its effect function.
   */
  define(definition: AmendmentDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Amendment "${definition.id}" is already defined`);
    }
    this.definitions.set(definition.id, definition);
    this.amendments.set(definition.id, {
      id: definition.id,
      name: definition.name,
      status: "proposed",
      description: definition.description,
    });
  }

  /**
   * Simulate activating an amendment against the given state.
   * Returns the before/after state, diff, and events.
   */
  simulate(
    amendmentId: string,
    state: Record<string, unknown>,
    sessionId: string = "default",
  ): AmendmentSimulationResult {
    const start = performance.now();
    const definition = this.definitions.get(amendmentId);

    if (!definition) {
      const amendment: AmendmentState = {
        id: amendmentId,
        name: amendmentId,
        status: "proposed",
      };
      return {
        amendment,
        stateBefore: state,
        stateAfter: state,
        diff: { added: [], removed: [], changed: [] },
        events: [],
        success: false,
        error: `Amendment "${amendmentId}" is not defined`,
        durationMs: Math.round(performance.now() - start),
      };
    }

    // Check prerequisites
    if (definition.prerequisites) {
      for (const prereq of definition.prerequisites) {
        const prereqState = this.amendments.get(prereq);
        if (!prereqState || prereqState.status !== "enabled") {
          const amendment = this.amendments.get(amendmentId)!;
          return {
            amendment,
            stateBefore: state,
            stateAfter: state,
            diff: { added: [], removed: [], changed: [] },
            events: [],
            success: false,
            error: `Prerequisite amendment "${prereq}" is not enabled`,
            durationMs: Math.round(performance.now() - start),
          };
        }
      }
    }

    // Snapshot state before
    this.snapshots.capture({
      sessionId,
      label: `Before ${definition.name}`,
      state,
      events: [],
      amendments: [...this.amendments.values()],
    });

    const stateBefore = structuredClone(state);
    let stateAfter: Record<string, unknown>;
    const events: ConsensusEvent[] = [];

    try {
      // Capture events emitted during simulation
      const unsub = this.eventBus.subscribe("*", (e) => { events.push(e); });

      // Apply the amendment effect
      stateAfter = definition.effect(structuredClone(state), this.amendments.get(amendmentId)!);

      // Update amendment status
      const amendmentState = this.amendments.get(amendmentId)!;
      amendmentState.status = "enabled";
      amendmentState.activatedAt = Date.now();

      // Emit activation event
      this.eventBus.publish("sandbox.amendment.activated", "amendment-simulator", {
        amendmentId,
        name: definition.name,
      });

      unsub();

      // Snapshot state after
      this.snapshots.capture({
        sessionId,
        label: `After ${definition.name}`,
        state: stateAfter,
        events,
        amendments: [...this.amendments.values()],
      });

      const diff = this.computeDiff(stateBefore, stateAfter);
      const result: AmendmentSimulationResult = {
        amendment: { ...this.amendments.get(amendmentId)! },
        stateBefore,
        stateAfter,
        diff,
        events,
        success: true,
        durationMs: Math.round(performance.now() - start),
      };

      this.history.push(result);

      this.eventBus.publish("sandbox.simulation.completed", "amendment-simulator", {
        amendmentId,
        success: true,
        diff,
      });

      return result;
    } catch (err) {
      const amendment = this.amendments.get(amendmentId)!;
      const result: AmendmentSimulationResult = {
        amendment: { ...amendment },
        stateBefore,
        stateAfter: stateBefore,
        diff: { added: [], removed: [], changed: [] },
        events,
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Math.round(performance.now() - start),
      };

      this.history.push(result);
      return result;
    }
  }

  /**
   * Veto (disable) an amendment.
   */
  veto(amendmentId: string): void {
    const amendment = this.amendments.get(amendmentId);
    if (!amendment) throw new Error(`Amendment "${amendmentId}" not found`);
    amendment.status = "vetoed";

    this.eventBus.publish("sandbox.amendment.vetoed", "amendment-simulator", {
      amendmentId,
      name: amendment.name,
    });
  }

  /**
   * Get all amendment states.
   */
  getAmendments(): AmendmentState[] {
    return [...this.amendments.values()];
  }

  /**
   * Get an amendment's current status.
   */
  getAmendment(id: string): AmendmentState | undefined {
    return this.amendments.get(id);
  }

  /**
   * Get simulation history.
   */
  getHistory(): readonly AmendmentSimulationResult[] {
    return [...this.history];
  }

  /**
   * Reset all amendments to proposed state and clear history.
   */
  reset(): void {
    for (const amendment of this.amendments.values()) {
      amendment.status = "proposed";
      amendment.activatedAt = undefined;
    }
    this.history.length = 0;
    this.snapshots.clear();
    this.eventBus.reset();
  }

  // ── Internal ────────────────────────────────────────────────────

  private computeDiff(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): StateDiff {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const added: StateDiff["added"] = [];
    const removed: StateDiff["removed"] = [];
    const changed: StateDiff["changed"] = [];

    for (const key of allKeys) {
      const inBefore = key in before;
      const inAfter = key in after;

      if (!inBefore && inAfter) {
        added.push({ key, value: after[key] });
      } else if (inBefore && !inAfter) {
        removed.push({ key, value: before[key] });
      } else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changed.push({ key, oldValue: before[key], newValue: after[key] });
      }
    }

    return { added, removed, changed };
  }
}
