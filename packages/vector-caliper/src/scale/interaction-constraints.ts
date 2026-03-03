/**
 * Large-Run Interaction Constraints
 *
 * Core principles:
 * - Interactions are throttled proportionally to scale
 * - Scrub rate limits prevent UI lockup
 * - Tooltip/hover debouncing avoids expensive lookups
 * - Selection constraints scale with state count
 * - All constraints are explicit and observable
 */

import {
  PerformanceBudget,
  ScaleClass,
  classifyScale,
  getBudgetForScale,
} from './budget';

// ============================================================================
// Types
// ============================================================================

/**
 * Scrub direction
 */
export type ScrubDirection = 'forward' | 'backward' | 'seek';

/**
 * Scrub request
 */
export interface ScrubRequest {
  readonly fromIndex: number;
  readonly toIndex: number;
  readonly timestamp: number;
  readonly direction: ScrubDirection;
}

/**
 * Scrub result
 */
export interface ScrubResult {
  readonly allowed: boolean;
  readonly actualIndex: number;
  readonly skippedStates: number;
  readonly throttled: boolean;
  readonly nextAllowedTime: number;
}

/**
 * Hover request
 */
export interface HoverRequest {
  readonly x: number;
  readonly y: number;
  readonly timestamp: number;
  readonly target?: string; // Element ID or type
}

/**
 * Hover result
 */
export interface HoverResult {
  readonly allowed: boolean;
  readonly debounced: boolean;
  readonly nextAllowedTime: number;
  readonly data?: HoverData;
}

/**
 * Hover data returned when allowed
 */
export interface HoverData {
  readonly stateIndex: number;
  readonly nodeId?: string;
  readonly values?: Record<string, number>;
}

/**
 * Selection request
 */
export interface SelectionRequest {
  readonly indices: readonly number[];
  readonly timestamp: number;
  readonly mode: 'single' | 'range' | 'multi';
}

/**
 * Selection result
 */
export interface SelectionResult {
  readonly allowed: boolean;
  readonly actualIndices: readonly number[];
  readonly truncated: boolean;
  readonly reason?: string;
}

/**
 * Autoplay request
 */
export interface AutoplayRequest {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly fps: number;
  readonly loop: boolean;
}

/**
 * Autoplay result
 */
export interface AutoplayResult {
  readonly allowed: boolean;
  readonly actualFps: number;
  readonly reason?: string;
}

/**
 * Interaction statistics
 */
export interface InteractionStats {
  readonly totalScrubRequests: number;
  readonly throttledScrubRequests: number;
  readonly totalHoverRequests: number;
  readonly debouncedHoverRequests: number;
  readonly totalSelectionRequests: number;
  readonly truncatedSelections: number;
  readonly averageScrubLatency: number;
}

// ============================================================================
// Scrub Rate Limiter
// ============================================================================

/**
 * Controls scrub rate to prevent UI lockup on large runs
 *
 * Invariants:
 * - Scrub rate is proportional to scale class
 * - Throttling is explicit (user sees skipped states)
 * - Forward/backward may have different rates
 * - Seek operations are always allowed (but rate limited)
 */
export class ScrubRateLimiter {
  private lastScrubTime: number = 0;
  private lastIndex: number = 0;
  private readonly budget: PerformanceBudget;
  private stats = {
    totalRequests: 0,
    throttledRequests: 0,
    totalLatency: 0,
  };

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Get minimum time between scrub operations (ms)
   */
  get minScrubInterval(): number {
    // Convert scrub rate (states/second) to interval (ms)
    return 1000 / this.budget.interaction.maxScrubRate;
  }

  /**
   * Process a scrub request
   */
  process(request: ScrubRequest): ScrubResult {
    this.stats.totalRequests++;
    const startTime = performance.now();

    const timeSinceLastScrub = request.timestamp - this.lastScrubTime;
    const minInterval = this.minScrubInterval;

    // Check if we're within the throttle window
    if (timeSinceLastScrub < minInterval) {
      this.stats.throttledRequests++;

      // Calculate how far we can actually move
      const maxSteps = Math.floor(timeSinceLastScrub / minInterval * this.budget.interaction.maxScrubRate);
      const requestedSteps = Math.abs(request.toIndex - request.fromIndex);
      const actualSteps = Math.min(maxSteps, requestedSteps);

      // Calculate actual target index
      const direction = request.toIndex > request.fromIndex ? 1 : -1;
      const actualIndex = request.fromIndex + (direction * actualSteps);

      this.stats.totalLatency += performance.now() - startTime;

      return {
        allowed: actualSteps > 0,
        actualIndex,
        skippedStates: requestedSteps - actualSteps,
        throttled: true,
        nextAllowedTime: this.lastScrubTime + minInterval,
      };
    }

    // Not throttled - allow full scrub
    this.lastScrubTime = request.timestamp;
    this.lastIndex = request.toIndex;

    this.stats.totalLatency += performance.now() - startTime;

    return {
      allowed: true,
      actualIndex: request.toIndex,
      skippedStates: 0,
      throttled: false,
      nextAllowedTime: request.timestamp + minInterval,
    };
  }

  /**
   * Reset limiter state
   */
  reset(): void {
    this.lastScrubTime = 0;
    this.lastIndex = 0;
  }

  /**
   * Get current statistics
   */
  getStats(): { totalRequests: number; throttledRequests: number; averageLatency: number } {
    return {
      totalRequests: this.stats.totalRequests,
      throttledRequests: this.stats.throttledRequests,
      averageLatency:
        this.stats.totalRequests > 0
          ? this.stats.totalLatency / this.stats.totalRequests
          : 0,
    };
  }
}

// ============================================================================
// Hover Debouncer
// ============================================================================

/**
 * Debounces hover/tooltip requests to avoid expensive lookups
 *
 * Invariants:
 * - Debounce time is proportional to scale class
 * - Rapid movements don't trigger lookups
 * - Final position always triggers (after debounce)
 * - Debug mode can bypass debouncing
 */
export class HoverDebouncer {
  private lastHoverTime: number = 0;
  private lastHoverPosition: { x: number; y: number } | null = null;
  private pendingHover: HoverRequest | null = null;
  private readonly budget: PerformanceBudget;
  private stats = {
    totalRequests: 0,
    debouncedRequests: 0,
  };

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Get debounce interval (ms)
   */
  get debounceInterval(): number {
    return this.budget.interaction.tooltipDebounceMs;
  }

  /**
   * Process a hover request
   */
  process(request: HoverRequest): HoverResult {
    this.stats.totalRequests++;

    const timeSinceLastHover = request.timestamp - this.lastHoverTime;

    // Check if position has changed significantly (threshold: 5 pixels)
    const positionChanged = this.lastHoverPosition === null ||
      Math.abs(request.x - this.lastHoverPosition.x) > 5 ||
      Math.abs(request.y - this.lastHoverPosition.y) > 5;

    // If position changed recently, debounce
    if (positionChanged && timeSinceLastHover < this.debounceInterval) {
      this.stats.debouncedRequests++;
      this.pendingHover = request;
      this.lastHoverPosition = { x: request.x, y: request.y };

      return {
        allowed: false,
        debounced: true,
        nextAllowedTime: this.lastHoverTime + this.debounceInterval,
      };
    }

    // Allow hover
    this.lastHoverTime = request.timestamp;
    this.lastHoverPosition = { x: request.x, y: request.y };
    this.pendingHover = null;

    return {
      allowed: true,
      debounced: false,
      nextAllowedTime: request.timestamp + this.debounceInterval,
    };
  }

  /**
   * Check if there's a pending hover that should now be processed
   */
  checkPending(currentTime: number): HoverRequest | null {
    if (
      this.pendingHover &&
      currentTime - this.lastHoverTime >= this.debounceInterval
    ) {
      const pending = this.pendingHover;
      this.pendingHover = null;
      return pending;
    }
    return null;
  }

  /**
   * Cancel any pending hover
   */
  cancel(): void {
    this.pendingHover = null;
  }

  /**
   * Reset debouncer state
   */
  reset(): void {
    this.lastHoverTime = 0;
    this.lastHoverPosition = null;
    this.pendingHover = null;
  }

  /**
   * Get current statistics
   */
  getStats(): { totalRequests: number; debouncedRequests: number } {
    return {
      totalRequests: this.stats.totalRequests,
      debouncedRequests: this.stats.debouncedRequests,
    };
  }
}

// ============================================================================
// Selection Constraint
// ============================================================================

/**
 * Maximum selection sizes by scale class
 */
export const MAX_SELECTION_SIZE: Record<ScaleClass, number> = {
  small: 1000,     // Select all for small runs
  medium: 500,     // Half for medium
  large: 100,      // Limited for large
  extreme: 10,     // Very limited for extreme
};

/**
 * Constrains selection operations based on scale
 *
 * Invariants:
 * - Selection size is bounded by scale class
 * - Multi-select may be disabled for large runs
 * - Truncation is explicit (user sees how many excluded)
 * - Range selection respects contiguous constraint
 */
export class SelectionConstraint {
  private readonly budget: PerformanceBudget;
  private currentSelection: readonly number[] = [];
  private stats = {
    totalRequests: 0,
    truncatedRequests: 0,
  };

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Get maximum selection size
   */
  get maxSelectionSize(): number {
    return MAX_SELECTION_SIZE[this.budget.scaleClass];
  }

  /**
   * Check if selection is allowed
   */
  get selectionAllowed(): boolean {
    return this.budget.interaction.selectionAllowed;
  }

  /**
   * Process a selection request
   */
  process(request: SelectionRequest): SelectionResult {
    this.stats.totalRequests++;

    // Check if selection is allowed at all
    if (!this.selectionAllowed) {
      return {
        allowed: false,
        actualIndices: [],
        truncated: false,
        reason: `Selection disabled for ${this.budget.scaleClass} scale runs`,
      };
    }

    // Check selection mode constraints
    if (request.mode === 'multi' && this.budget.scaleClass === 'extreme') {
      return {
        allowed: false,
        actualIndices: [],
        truncated: false,
        reason: 'Multi-select disabled for extreme scale runs',
      };
    }

    // Check selection size
    const maxSize = this.maxSelectionSize;
    if (request.indices.length <= maxSize) {
      this.currentSelection = request.indices;
      return {
        allowed: true,
        actualIndices: request.indices,
        truncated: false,
      };
    }

    // Truncate selection
    this.stats.truncatedRequests++;
    const truncatedIndices = request.indices.slice(0, maxSize);
    this.currentSelection = truncatedIndices;

    return {
      allowed: true,
      actualIndices: truncatedIndices,
      truncated: true,
      reason: `Selection truncated from ${request.indices.length} to ${maxSize} states (${this.budget.scaleClass} scale limit)`,
    };
  }

  /**
   * Get current selection
   */
  getCurrentSelection(): readonly number[] {
    return this.currentSelection;
  }

  /**
   * Clear current selection
   */
  clearSelection(): void {
    this.currentSelection = [];
  }

  /**
   * Get current statistics
   */
  getStats(): { totalRequests: number; truncatedRequests: number } {
    return {
      totalRequests: this.stats.totalRequests,
      truncatedRequests: this.stats.truncatedRequests,
    };
  }
}

// ============================================================================
// Autoplay Controller
// ============================================================================

/**
 * Maximum autoplay FPS by scale class
 */
export const MAX_AUTOPLAY_FPS: Record<ScaleClass, number> = {
  small: 60,      // Full 60fps for small
  medium: 30,     // Half rate for medium
  large: 15,      // Quarter rate for large
  extreme: 5,     // Very slow for extreme
};

/**
 * Controls autoplay behavior based on scale
 *
 * Invariants:
 * - Autoplay may be disabled for large runs
 * - FPS is capped proportionally to scale
 * - Loop behavior respects memory constraints
 * - User can always stop autoplay
 */
export class AutoplayController {
  private readonly budget: PerformanceBudget;
  private isPlaying: boolean = false;
  private currentIndex: number = 0;
  private endIndex: number = 0;
  private actualFps: number = 0;
  private looping: boolean = false;

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Get maximum autoplay FPS
   */
  get maxFps(): number {
    return MAX_AUTOPLAY_FPS[this.budget.scaleClass];
  }

  /**
   * Check if autoplay is allowed
   */
  get autoplayAllowed(): boolean {
    return this.budget.interaction.autoplayAllowed;
  }

  /**
   * Request to start autoplay
   */
  requestStart(request: AutoplayRequest): AutoplayResult {
    if (!this.autoplayAllowed) {
      return {
        allowed: false,
        actualFps: 0,
        reason: `Autoplay disabled for ${this.budget.scaleClass} scale runs`,
      };
    }

    // Cap FPS
    const maxFps = this.maxFps;
    const actualFps = Math.min(request.fps, maxFps);

    // Check if looping is allowed (not for extreme scale)
    const looping = request.loop && this.budget.scaleClass !== 'extreme';

    this.isPlaying = true;
    this.currentIndex = request.startIndex;
    this.endIndex = request.endIndex;
    this.actualFps = actualFps;
    this.looping = looping;

    return {
      allowed: true,
      actualFps,
      reason:
        actualFps < request.fps
          ? `FPS capped from ${request.fps} to ${actualFps} for ${this.budget.scaleClass} scale`
          : undefined,
    };
  }

  /**
   * Stop autoplay
   */
  stop(): void {
    this.isPlaying = false;
  }

  /**
   * Get next frame index
   */
  nextFrame(): { index: number; done: boolean } {
    if (!this.isPlaying) {
      return { index: this.currentIndex, done: true };
    }

    this.currentIndex++;

    if (this.currentIndex > this.endIndex) {
      if (this.looping) {
        this.currentIndex = 0;
        return { index: this.currentIndex, done: false };
      }
      this.isPlaying = false;
      return { index: this.endIndex, done: true };
    }

    return { index: this.currentIndex, done: false };
  }

  /**
   * Get frame interval in ms
   */
  getFrameInterval(): number {
    return 1000 / this.actualFps;
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current playback state
   */
  getState(): {
    isPlaying: boolean;
    currentIndex: number;
    endIndex: number;
    fps: number;
    looping: boolean;
  } {
    return {
      isPlaying: this.isPlaying,
      currentIndex: this.currentIndex,
      endIndex: this.endIndex,
      fps: this.actualFps,
      looping: this.looping,
    };
  }
}

// ============================================================================
// Interaction Manager
// ============================================================================

/**
 * Central manager for all interaction constraints
 *
 * Coordinates scrub, hover, selection, and autoplay constraints
 * based on the current scale class and performance budget.
 */
export class InteractionManager {
  private readonly budget: PerformanceBudget;
  private readonly scrubLimiter: ScrubRateLimiter;
  private readonly hoverDebouncer: HoverDebouncer;
  private readonly selectionConstraint: SelectionConstraint;
  private readonly autoplayController: AutoplayController;

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
    this.scrubLimiter = new ScrubRateLimiter(budget);
    this.hoverDebouncer = new HoverDebouncer(budget);
    this.selectionConstraint = new SelectionConstraint(budget);
    this.autoplayController = new AutoplayController(budget);
  }

  /**
   * Get scale class
   */
  get scaleClass(): ScaleClass {
    return this.budget.scaleClass;
  }

  /**
   * Process scrub request
   */
  scrub(fromIndex: number, toIndex: number): ScrubResult {
    return this.scrubLimiter.process({
      fromIndex,
      toIndex,
      timestamp: performance.now(),
      direction: toIndex > fromIndex ? 'forward' : 'backward',
    });
  }

  /**
   * Process hover request
   */
  hover(x: number, y: number, target?: string): HoverResult {
    return this.hoverDebouncer.process({
      x,
      y,
      timestamp: performance.now(),
      target,
    });
  }

  /**
   * Check for pending hover
   */
  checkPendingHover(): HoverRequest | null {
    return this.hoverDebouncer.checkPending(performance.now());
  }

  /**
   * Process selection request
   */
  select(indices: number[], mode: 'single' | 'range' | 'multi' = 'single'): SelectionResult {
    return this.selectionConstraint.process({
      indices,
      timestamp: performance.now(),
      mode,
    });
  }

  /**
   * Get current selection
   */
  getSelection(): readonly number[] {
    return this.selectionConstraint.getCurrentSelection();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectionConstraint.clearSelection();
  }

  /**
   * Start autoplay
   */
  startAutoplay(startIndex: number, endIndex: number, fps: number, loop: boolean): AutoplayResult {
    return this.autoplayController.requestStart({
      startIndex,
      endIndex,
      fps,
      loop,
    });
  }

  /**
   * Stop autoplay
   */
  stopAutoplay(): void {
    this.autoplayController.stop();
  }

  /**
   * Get autoplay state
   */
  getAutoplayState(): ReturnType<AutoplayController['getState']> {
    return this.autoplayController.getState();
  }

  /**
   * Get next autoplay frame
   */
  nextAutoplayFrame(): { index: number; done: boolean } {
    return this.autoplayController.nextFrame();
  }

  /**
   * Get interaction statistics
   */
  getStats(): InteractionStats {
    const scrubStats = this.scrubLimiter.getStats();
    const hoverStats = this.hoverDebouncer.getStats();
    const selectionStats = this.selectionConstraint.getStats();

    return {
      totalScrubRequests: scrubStats.totalRequests,
      throttledScrubRequests: scrubStats.throttledRequests,
      totalHoverRequests: hoverStats.totalRequests,
      debouncedHoverRequests: hoverStats.debouncedRequests,
      totalSelectionRequests: selectionStats.totalRequests,
      truncatedSelections: selectionStats.truncatedRequests,
      averageScrubLatency: scrubStats.averageLatency,
    };
  }

  /**
   * Reset all interaction state
   */
  reset(): void {
    this.scrubLimiter.reset();
    this.hoverDebouncer.reset();
    this.selectionConstraint.clearSelection();
    this.autoplayController.stop();
  }

  /**
   * Get constraint summary for display
   */
  getConstraintSummary(): {
    scaleClass: ScaleClass;
    maxScrubRate: number;
    tooltipDebounceMs: number;
    maxSelectionSize: number;
    selectionAllowed: boolean;
    autoplayAllowed: boolean;
    maxAutoplayFps: number;
  } {
    return {
      scaleClass: this.budget.scaleClass,
      maxScrubRate: this.budget.interaction.maxScrubRate,
      tooltipDebounceMs: this.budget.interaction.tooltipDebounceMs,
      maxSelectionSize: MAX_SELECTION_SIZE[this.budget.scaleClass],
      selectionAllowed: this.budget.interaction.selectionAllowed,
      autoplayAllowed: this.budget.interaction.autoplayAllowed,
      maxAutoplayFps: MAX_AUTOPLAY_FPS[this.budget.scaleClass],
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create interaction manager for a state count
 */
export function createInteractionManager(stateCount: number): InteractionManager {
  const scaleClass = classifyScale(stateCount);
  const budget = getBudgetForScale(scaleClass);
  return new InteractionManager(budget);
}

/**
 * Create interaction manager for a scale class
 */
export function createInteractionManagerForScale(scaleClass: ScaleClass): InteractionManager {
  const budget = getBudgetForScale(scaleClass);
  return new InteractionManager(budget);
}

// ============================================================================
// Constraint Display Helpers
// ============================================================================

/**
 * Format constraint for display
 */
export function formatConstraint(
  name: string,
  value: number | boolean,
  unit?: string
): string {
  if (typeof value === 'boolean') {
    return `${name}: ${value ? 'enabled' : 'disabled'}`;
  }
  return `${name}: ${value}${unit ? ' ' + unit : ''}`;
}

/**
 * Get human-readable constraint description
 */
export function describeConstraints(manager: InteractionManager): string[] {
  const summary = manager.getConstraintSummary();
  return [
    `Scale class: ${summary.scaleClass}`,
    formatConstraint('Scrub rate', summary.maxScrubRate, 'states/sec'),
    formatConstraint('Tooltip debounce', summary.tooltipDebounceMs, 'ms'),
    formatConstraint('Max selection', summary.maxSelectionSize, 'states'),
    formatConstraint('Selection', summary.selectionAllowed),
    formatConstraint('Autoplay', summary.autoplayAllowed),
    summary.autoplayAllowed
      ? formatConstraint('Max autoplay FPS', summary.maxAutoplayFps)
      : '',
  ].filter(Boolean);
}
