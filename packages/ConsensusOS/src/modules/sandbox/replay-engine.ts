/**
 * Replay Engine
 *
 * Deterministic event replay from captured history. Given a sequence
 * of events and an initial state, the engine re-applies each event
 * through registered handlers, producing an identical final state.
 *
 * Properties:
 * - Deterministic: same events + same initial state → same final state
 * - Observable: state diffs computed at each step
 * - Controllable: speed multiplier, max events, stop-at-sequence
 */

import type { ConsensusEvent } from "../../plugins/api.js";
import type { ReplayOptions, ReplayResult, StateDiff } from "./types.js";

// ─── Types ──────────────────────────────────────────────────────────

/**
 * A replay handler processes an event and returns the updated state.
 * Handlers must be pure functions for deterministic replay.
 */
export type ReplayHandler = (
  state: Record<string, unknown>,
  event: ConsensusEvent,
) => Record<string, unknown>;

// ─── Engine ─────────────────────────────────────────────────────────

export class ReplayEngine {
  private readonly handlers = new Map<string, ReplayHandler>();
  private readonly wildcardHandlers: ReplayHandler[] = [];

  /**
   * Register a handler for a specific event topic.
   * Use "*" for a wildcard handler that processes all events.
   */
  on(topic: string, handler: ReplayHandler): void {
    if (topic === "*") {
      this.wildcardHandlers.push(handler);
    } else {
      this.handlers.set(topic, handler);
    }
  }

  /**
   * Remove all handlers.
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.wildcardHandlers.length = 0;
  }

  /**
   * Replay a sequence of events, producing a final state and per-step diffs.
   */
  async replay(options: ReplayOptions): Promise<ReplayResult> {
    const start = performance.now();
    let state = structuredClone(options.initialState ?? {});
    const diffs: StateDiff[] = [];
    let eventsProcessed = 0;
    let eventsSkipped = 0;

    // Sort events by sequence number for deterministic ordering
    const sorted = [...options.events].sort((a, b) => a.sequence - b.sequence);

    try {
      for (const event of sorted) {
        // Check stop conditions
        if (options.maxEvents !== undefined && eventsProcessed >= options.maxEvents) {
          break;
        }
        if (options.stopAtSequence !== undefined && event.sequence > options.stopAtSequence) {
          break;
        }

        // Find matching handler
        const handler = this.handlers.get(event.topic);
        const applicableHandlers: ReplayHandler[] = [];

        if (handler) applicableHandlers.push(handler);
        applicableHandlers.push(...this.wildcardHandlers);

        // Also check prefix wildcards
        for (const [pattern, h] of this.handlers) {
          if (pattern.endsWith(".*")) {
            const prefix = pattern.slice(0, -2);
            if (event.topic.startsWith(prefix + ".") && h !== handler) {
              applicableHandlers.push(h);
            }
          }
        }

        if (applicableHandlers.length === 0) {
          eventsSkipped++;
          continue;
        }

        const before = structuredClone(state);

        // Apply all matching handlers in sequence
        for (const h of applicableHandlers) {
          state = h(state, event);
        }

        // Compute diff
        diffs.push(this.computeDiff(before, state));
        eventsProcessed++;

        // Simulate timing if speed > 0
        if (options.speed && options.speed > 0 && eventsProcessed < sorted.length) {
          const delay = Math.max(1, Math.round(1 / options.speed));
          await new Promise((r) => setTimeout(r, delay));
        }
      }

      return {
        finalState: state,
        eventsProcessed,
        eventsSkipped,
        diffs,
        durationMs: Math.round(performance.now() - start),
        success: true,
      };
    } catch (err) {
      return {
        finalState: state,
        eventsProcessed,
        eventsSkipped,
        diffs,
        durationMs: Math.round(performance.now() - start),
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Replay and compare: replay events from two different initial states
   * and return whether the final states are identical.
   */
  async replayAndCompare(
    eventsA: ConsensusEvent[],
    eventsB: ConsensusEvent[],
    initialState?: Record<string, unknown>,
  ): Promise<{ identical: boolean; diffA: ReplayResult; diffB: ReplayResult }> {
    const [diffA, diffB] = await Promise.all([
      this.replay({ events: eventsA, initialState }),
      this.replay({ events: eventsB, initialState }),
    ]);

    const identical =
      JSON.stringify(diffA.finalState) === JSON.stringify(diffB.finalState);

    return { identical, diffA, diffB };
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
