/**
 * VectorCaliper - Interactive Diagnostics
 *
 * Logging and diagnostic utilities for interactive features.
 * Tracks what was touched, when, and what changed.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * A single diagnostic event.
 */
export interface DiagnosticEvent {
  /** Event type */
  readonly type:
    | 'tooltip_access'
    | 'layer_toggle'
    | 'layer_focus'
    | 'timeline_scrub'
    | 'state_compare'
    | 'scene_render'
    | 'snapshot_taken';

  /** Timestamp */
  readonly timestamp: number;

  /** Event-specific data */
  readonly data: Record<string, unknown>;

  /** Optional metadata */
  readonly meta?: Record<string, unknown>;
}

/**
 * Configuration for diagnostic logger.
 */
export interface DiagnosticConfig {
  /** Enable verbose console logging */
  readonly verbose: boolean;

  /** Maximum events to keep in memory */
  readonly maxEvents: number;

  /** Categories to log (empty = all) */
  readonly categories: readonly string[];
}

/**
 * Default configuration.
 */
export const DEFAULT_DIAGNOSTIC_CONFIG: DiagnosticConfig = {
  verbose: false,
  maxEvents: 1000,
  categories: [],
};

// =============================================================================
// Diagnostic Logger
// =============================================================================

/**
 * Logger for tracking interactive events.
 */
export class DiagnosticLogger {
  private config: DiagnosticConfig;
  private events: DiagnosticEvent[] = [];
  private sessionId: string;
  private startTime: number;

  constructor(config: Partial<DiagnosticConfig> = {}) {
    this.config = { ...DEFAULT_DIAGNOSTIC_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  // ---------------------------------------------------------------------------
  // Event Logging
  // ---------------------------------------------------------------------------

  /**
   * Log a tooltip access event.
   */
  logTooltipAccess(nodeId: string, stateId: string | null, variables: string[]): void {
    this.log({
      type: 'tooltip_access',
      timestamp: Date.now(),
      data: {
        nodeId,
        stateId,
        variableCount: variables.length,
        variables,
      },
    });
  }

  /**
   * Log a layer toggle event.
   */
  logLayerToggle(
    layerId: string,
    previousVisible: boolean,
    newVisible: boolean,
    isIdempotent: boolean
  ): void {
    this.log({
      type: 'layer_toggle',
      timestamp: Date.now(),
      data: {
        layerId,
        previousVisible,
        newVisible,
        isIdempotent,
        changed: previousVisible !== newVisible,
      },
    });
  }

  /**
   * Log a layer focus event.
   */
  logLayerFocus(
    action: 'enable' | 'disable' | 'focus' | 'unfocus' | 'clear',
    layerId?: string,
    focusedLayers?: string[]
  ): void {
    this.log({
      type: 'layer_focus',
      timestamp: Date.now(),
      data: {
        action,
        layerId,
        focusedLayers,
      },
    });
  }

  /**
   * Log a timeline scrub event.
   */
  logTimelineScrub(
    time: number,
    previousTime: number,
    currentIndex: number,
    snapshotHash: string
  ): void {
    this.log({
      type: 'timeline_scrub',
      timestamp: Date.now(),
      data: {
        time,
        previousTime,
        currentIndex,
        snapshotHash,
        timeDelta: time - previousTime,
      },
    });
  }

  /**
   * Log a state comparison event.
   */
  logStateCompare(
    stateAId: string,
    stateBId: string,
    summary: { increases: number; decreases: number; unchanged: number },
    isSymmetric: boolean
  ): void {
    this.log({
      type: 'state_compare',
      timestamp: Date.now(),
      data: {
        stateAId,
        stateBId,
        summary,
        isSymmetric,
      },
    });
  }

  /**
   * Log a scene render event.
   */
  logSceneRender(
    sceneId: string,
    nodeCount: number,
    layerCount: number,
    renderTime: number
  ): void {
    this.log({
      type: 'scene_render',
      timestamp: Date.now(),
      data: {
        sceneId,
        nodeCount,
        layerCount,
        renderTimeMs: renderTime,
      },
    });
  }

  /**
   * Log a snapshot event.
   */
  logSnapshotTaken(time: number, hash: string, nodeCount: number): void {
    this.log({
      type: 'snapshot_taken',
      timestamp: Date.now(),
      data: {
        time,
        hash,
        nodeCount,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Event Management
  // ---------------------------------------------------------------------------

  /**
   * Log an event.
   */
  private log(event: DiagnosticEvent): void {
    // Check category filter
    if (
      this.config.categories.length > 0 &&
      !this.config.categories.includes(event.type)
    ) {
      return;
    }

    // Add to events
    this.events.push(event);

    // Trim if over max
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Console log if verbose
    if (this.config.verbose) {
      console.log(`[VectorCaliper] ${event.type}:`, event.data);
    }
  }

  /**
   * Get all events.
   */
  getEvents(): readonly DiagnosticEvent[] {
    return this.events;
  }

  /**
   * Get events by type.
   */
  getEventsByType(type: DiagnosticEvent['type']): readonly DiagnosticEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Clear all events.
   */
  clear(): void {
    this.events = [];
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  /**
   * Export log as JSON.
   */
  exportLog(): DiagnosticLog {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: Date.now() - this.startTime,
      eventCount: this.events.length,
      events: this.events,
      summary: this.computeSummary(),
    };
  }

  /**
   * Export log as formatted text.
   */
  exportText(): string {
    let text = `VectorCaliper Diagnostic Log\n`;
    text += `Session: ${this.sessionId}\n`;
    text += `Duration: ${Date.now() - this.startTime}ms\n`;
    text += `Events: ${this.events.length}\n`;
    text += `${'─'.repeat(60)}\n\n`;

    for (const event of this.events) {
      const relativeTime = event.timestamp - this.startTime;
      text += `[+${relativeTime}ms] ${event.type}\n`;
      text += `  ${JSON.stringify(event.data, null, 2).replace(/\n/g, '\n  ')}\n\n`;
    }

    return text;
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  /**
   * Compute summary statistics.
   */
  private computeSummary(): DiagnosticSummary {
    const byType: Record<string, number> = {};

    for (const event of this.events) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }

    // Compute specific metrics
    const layerToggles = this.getEventsByType('layer_toggle');
    const idempotentToggles = layerToggles.filter(
      (e) => e.data.isIdempotent
    ).length;

    const timelineScrubs = this.getEventsByType('timeline_scrub');
    const uniqueHashes = new Set(timelineScrubs.map((e) => e.data.snapshotHash)).size;

    const comparisons = this.getEventsByType('state_compare');
    const symmetricComparisons = comparisons.filter(
      (e) => e.data.isSymmetric
    ).length;

    return {
      eventsByType: byType,
      totalEvents: this.events.length,
      tooltipAccesses: byType['tooltip_access'] ?? 0,
      layerToggles: byType['layer_toggle'] ?? 0,
      idempotentLayerToggles: idempotentToggles,
      timelineScrubs: byType['timeline_scrub'] ?? 0,
      uniqueTimelineSnapshots: uniqueHashes,
      stateComparisons: byType['state_compare'] ?? 0,
      symmetricComparisons,
    };
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /**
   * Generate a unique session ID.
   */
  private generateSessionId(): string {
    return `vc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// =============================================================================
// Export Types
// =============================================================================

/**
 * Full diagnostic log export.
 */
export interface DiagnosticLog {
  readonly sessionId: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly duration: number;
  readonly eventCount: number;
  readonly events: readonly DiagnosticEvent[];
  readonly summary: DiagnosticSummary;
}

/**
 * Summary statistics.
 */
export interface DiagnosticSummary {
  readonly eventsByType: Record<string, number>;
  readonly totalEvents: number;
  readonly tooltipAccesses: number;
  readonly layerToggles: number;
  readonly idempotentLayerToggles: number;
  readonly timelineScrubs: number;
  readonly uniqueTimelineSnapshots: number;
  readonly stateComparisons: number;
  readonly symmetricComparisons: number;
}

// =============================================================================
// Singleton Export
// =============================================================================

/**
 * Default diagnostic logger instance.
 */
export const defaultDiagnostics = new DiagnosticLogger();
