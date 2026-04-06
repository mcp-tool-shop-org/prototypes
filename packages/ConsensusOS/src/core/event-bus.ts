/**
 * ConsensusOS Event Bus
 *
 * Central nervous system of the control plane. All inter-module communication
 * flows through the event bus — plugins never call each other directly.
 *
 * Properties:
 * - Ordered: events are assigned monotonic sequence numbers
 * - Typed: events carry structured payloads with topic routing
 * - Deterministic: same events in same order → same state
 * - Observable: full event log is replayable
 */

import type { ConsensusEvent, PluginId } from "../plugins/api.js";

// ─── Types ──────────────────────────────────────────────────────────

/** Callback for event subscriptions */
export type EventHandler<T = unknown> = (event: ConsensusEvent<T>) => void | Promise<void>;

/** Subscription handle — call to unsubscribe */
export type Unsubscribe = () => void;

/** Wildcard topic that receives every event */
export const WILDCARD = "*";

/** Event bus interface exposed to plugins */
export interface EventBus {
  /**
   * Publish an event to all matching subscribers.
   * Returns the assigned sequence number.
   */
  publish<T>(topic: string, source: PluginId, data: T): number;

  /**
   * Subscribe to events matching a topic pattern.
   * Use "*" to subscribe to all events.
   * Use "health.*" to match "health.check", "health.alert", etc.
   */
  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): Unsubscribe;

  /**
   * Get the full ordered event log (for replay / debugging).
   */
  history(): readonly ConsensusEvent[];

  /**
   * Clear the event log. Resets sequence counter.
   */
  reset(): void;
}

// ─── Implementation ─────────────────────────────────────────────────

interface Subscription {
  readonly topic: string;
  readonly handler: EventHandler<unknown>;
}

export class CoreEventBus implements EventBus {
  private sequence = 0;
  private readonly log: ConsensusEvent[] = [];
  private readonly subscriptions: Subscription[] = [];

  publish<T>(topic: string, source: PluginId, data: T): number {
    const seq = ++this.sequence;
    const event: ConsensusEvent<T> = {
      topic,
      source,
      timestamp: new Date().toISOString(),
      sequence: seq,
      data,
    };

    this.log.push(event as ConsensusEvent);
    this.dispatch(event as ConsensusEvent);
    return seq;
  }

  subscribe<T = unknown>(topic: string, handler: EventHandler<T>): Unsubscribe {
    const sub: Subscription = { topic, handler: handler as EventHandler<unknown> };
    this.subscriptions.push(sub);

    return () => {
      const idx = this.subscriptions.indexOf(sub);
      if (idx !== -1) this.subscriptions.splice(idx, 1);
    };
  }

  history(): readonly ConsensusEvent[] {
    return [...this.log];
  }

  reset(): void {
    this.sequence = 0;
    this.log.length = 0;
    this.subscriptions.length = 0;
  }

  // ── Internal ────────────────────────────────────────────────────

  private dispatch(event: ConsensusEvent): void {
    for (const sub of this.subscriptions) {
      if (this.matches(sub.topic, event.topic)) {
        try {
          // Fire-and-forget for async handlers — deterministic ordering
          // means we don't await. Errors are caught and logged, never propagated.
          const result = sub.handler(event);
          if (result instanceof Promise) {
            result.catch((err) => {
              console.error(
                `[EventBus] handler error for topic "${event.topic}":`,
                err
              );
            });
          }
        } catch (err) {
          console.error(
            `[EventBus] sync handler error for topic "${event.topic}":`,
            err
          );
        }
      }
    }
  }

  /**
   * Topic matching:
   * - "*" matches everything
   * - "health.*" matches "health.check", "health.alert", etc.
   * - "health.check" matches exactly "health.check"
   */
  private matches(pattern: string, topic: string): boolean {
    if (pattern === WILDCARD) return true;
    if (pattern === topic) return true;
    if (pattern.endsWith(".*")) {
      const prefix = pattern.slice(0, -2);
      return topic.startsWith(prefix + ".");
    }
    return false;
  }
}
