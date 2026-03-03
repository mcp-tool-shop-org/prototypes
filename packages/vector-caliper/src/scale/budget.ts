/**
 * Performance Budgets & Scale Targets
 *
 * Core principles:
 * - Explicit limits, not silent degradation
 * - Fail fast when limits exceeded
 * - User always knows why rejection happened
 * - No auto-downsampling without disclosure
 */

// ============================================================================
// Scale Classes
// ============================================================================

/**
 * Scale classification for runs
 */
export type ScaleClass = 'small' | 'medium' | 'large' | 'extreme';

/**
 * Scale class thresholds (state counts)
 */
export const SCALE_THRESHOLDS: Record<ScaleClass, { min: number; max: number }> = {
  small: { min: 0, max: 1_000 },
  medium: { min: 1_001, max: 10_000 },
  large: { min: 10_001, max: 100_000 },
  extreme: { min: 100_001, max: 1_000_000 },
};

/**
 * Determine scale class from state count
 */
export function classifyScale(stateCount: number): ScaleClass {
  if (stateCount <= SCALE_THRESHOLDS.small.max) return 'small';
  if (stateCount <= SCALE_THRESHOLDS.medium.max) return 'medium';
  if (stateCount <= SCALE_THRESHOLDS.large.max) return 'large';
  return 'extreme';
}

// ============================================================================
// Performance Budget Types
// ============================================================================

/**
 * Memory budget specification
 */
export interface MemoryBudget {
  /** Maximum heap allocation for states (bytes) */
  readonly maxStateMemory: number;
  /** Maximum heap allocation for geometry (bytes) */
  readonly maxGeometryMemory: number;
  /** Maximum total heap allocation (bytes) */
  readonly maxTotalMemory: number;
  /** Chunk size for paged storage (states per chunk) */
  readonly chunkSize: number;
}

/**
 * Render budget specification
 */
export interface RenderBudget {
  /** Maximum time for initial render (ms) */
  readonly maxInitialRenderMs: number;
  /** Maximum time per frame during interaction (ms) */
  readonly maxFrameMs: number;
  /** Target frames per second */
  readonly targetFps: number;
  /** Maximum draw calls per frame */
  readonly maxDrawCalls: number;
}

/**
 * Interaction budget specification
 */
export interface InteractionBudget {
  /** Maximum scrub rate (steps per second) */
  readonly maxScrubRate: number;
  /** Whether autoplay is allowed */
  readonly autoplayAllowed: boolean;
  /** Debounce time for hover tooltips (ms) */
  readonly tooltipDebounceMs: number;
  /** Whether selection is allowed */
  readonly selectionAllowed: boolean;
}

/**
 * Complete performance budget
 */
export interface PerformanceBudget {
  /** Memory constraints */
  readonly memory: MemoryBudget;
  /** Render constraints */
  readonly render: RenderBudget;
  /** Interaction constraints */
  readonly interaction: InteractionBudget;
  /** Maximum supported states (hard limit) */
  readonly maxStates: number;
  /** Scale class this budget applies to */
  readonly scaleClass: ScaleClass;
}

// ============================================================================
// Default Budgets by Scale Class
// ============================================================================

const MB = 1024 * 1024;

/**
 * Budget for small runs (≤1,000 states)
 */
export const SMALL_BUDGET: PerformanceBudget = {
  memory: {
    maxStateMemory: 50 * MB,
    maxGeometryMemory: 20 * MB,
    maxTotalMemory: 100 * MB,
    chunkSize: 1_000, // All in one chunk
  },
  render: {
    maxInitialRenderMs: 100,
    maxFrameMs: 16, // 60fps
    targetFps: 60,
    maxDrawCalls: 10_000,
  },
  interaction: {
    maxScrubRate: 1000, // Unlimited for practical purposes
    autoplayAllowed: true,
    tooltipDebounceMs: 0,
    selectionAllowed: true,
  },
  maxStates: 1_000,
  scaleClass: 'small',
};

/**
 * Budget for medium runs (1,001-10,000 states)
 */
export const MEDIUM_BUDGET: PerformanceBudget = {
  memory: {
    maxStateMemory: 200 * MB,
    maxGeometryMemory: 100 * MB,
    maxTotalMemory: 400 * MB,
    chunkSize: 5_000,
  },
  render: {
    maxInitialRenderMs: 500,
    maxFrameMs: 16,
    targetFps: 60,
    maxDrawCalls: 50_000,
  },
  interaction: {
    maxScrubRate: 500,
    autoplayAllowed: true,
    tooltipDebounceMs: 50,
    selectionAllowed: true,
  },
  maxStates: 10_000,
  scaleClass: 'medium',
};

/**
 * Budget for large runs (10,001-100,000 states)
 */
export const LARGE_BUDGET: PerformanceBudget = {
  memory: {
    maxStateMemory: 500 * MB,
    maxGeometryMemory: 200 * MB,
    maxTotalMemory: 800 * MB,
    chunkSize: 10_000,
  },
  render: {
    maxInitialRenderMs: 2_000,
    maxFrameMs: 33, // 30fps
    targetFps: 30,
    maxDrawCalls: 200_000,
  },
  interaction: {
    maxScrubRate: 100,
    autoplayAllowed: false, // Too many states for smooth autoplay
    tooltipDebounceMs: 100,
    selectionAllowed: true,
  },
  maxStates: 100_000,
  scaleClass: 'large',
};

/**
 * Budget for extreme runs (100,001-1,000,000 states)
 */
export const EXTREME_BUDGET: PerformanceBudget = {
  memory: {
    maxStateMemory: 1_000 * MB,
    maxGeometryMemory: 500 * MB,
    maxTotalMemory: 2_000 * MB,
    chunkSize: 50_000,
  },
  render: {
    maxInitialRenderMs: 10_000,
    maxFrameMs: 100, // 10fps minimum
    targetFps: 10,
    maxDrawCalls: 1_000_000,
  },
  interaction: {
    maxScrubRate: 20,
    autoplayAllowed: false,
    tooltipDebounceMs: 200,
    selectionAllowed: false, // Too slow
  },
  maxStates: 1_000_000,
  scaleClass: 'extreme',
};

/**
 * Get budget for a scale class
 */
export function getBudgetForScale(scaleClass: ScaleClass): PerformanceBudget {
  switch (scaleClass) {
    case 'small': return SMALL_BUDGET;
    case 'medium': return MEDIUM_BUDGET;
    case 'large': return LARGE_BUDGET;
    case 'extreme': return EXTREME_BUDGET;
  }
}

/**
 * Get budget for a state count
 */
export function getBudgetForStateCount(stateCount: number): PerformanceBudget {
  return getBudgetForScale(classifyScale(stateCount));
}

// ============================================================================
// Hard Limits (Absolute Rejection Thresholds)
// ============================================================================

/**
 * Absolute maximum states VectorCaliper will attempt to load
 */
export const ABSOLUTE_MAX_STATES = 1_000_000;

/**
 * Absolute maximum memory VectorCaliper will attempt to use (bytes)
 */
export const ABSOLUTE_MAX_MEMORY = 4 * 1024 * MB; // 4GB

/**
 * Absolute maximum initial render time before timeout (ms)
 */
export const ABSOLUTE_MAX_INITIAL_RENDER = 30_000; // 30 seconds

// ============================================================================
// Budget Validation
// ============================================================================

/**
 * Rejection reason when budget cannot be satisfied
 */
export interface BudgetRejection {
  readonly rejected: true;
  readonly reason: BudgetRejectionReason;
  readonly message: string;
  readonly limit: number;
  readonly actual: number;
  readonly suggestion?: string;
}

export type BudgetRejectionReason =
  | 'exceeds_max_states'
  | 'exceeds_memory_budget'
  | 'exceeds_render_budget'
  | 'exceeds_absolute_limit';

/**
 * Budget acceptance confirmation
 */
export interface BudgetAcceptance {
  readonly rejected: false;
  readonly budget: PerformanceBudget;
  readonly scaleClass: ScaleClass;
  readonly warnings: BudgetWarning[];
}

/**
 * Non-fatal budget warning
 */
export interface BudgetWarning {
  readonly type: 'approaching_limit' | 'degraded_interaction' | 'slow_render';
  readonly message: string;
}

export type BudgetValidationResult = BudgetRejection | BudgetAcceptance;

/**
 * Validate whether a run can be loaded within budgets
 */
export function validateBudget(
  stateCount: number,
  estimatedStateMemory?: number,
  estimatedGeometryMemory?: number
): BudgetValidationResult {
  // Check absolute limit first
  if (stateCount > ABSOLUTE_MAX_STATES) {
    return {
      rejected: true,
      reason: 'exceeds_absolute_limit',
      message: `State count ${stateCount.toLocaleString()} exceeds absolute maximum of ${ABSOLUTE_MAX_STATES.toLocaleString()}`,
      limit: ABSOLUTE_MAX_STATES,
      actual: stateCount,
      suggestion: 'Reduce the number of captured states, or sample your data before loading.',
    };
  }

  const scaleClass = classifyScale(stateCount);
  const budget = getBudgetForScale(scaleClass);
  const warnings: BudgetWarning[] = [];

  // Check memory budget if estimates provided
  if (estimatedStateMemory !== undefined) {
    if (estimatedStateMemory > budget.memory.maxStateMemory) {
      return {
        rejected: true,
        reason: 'exceeds_memory_budget',
        message: `Estimated state memory ${formatBytes(estimatedStateMemory)} exceeds budget of ${formatBytes(budget.memory.maxStateMemory)}`,
        limit: budget.memory.maxStateMemory,
        actual: estimatedStateMemory,
        suggestion: 'Reduce state count or simplify captured data.',
      };
    }

    // Warn if approaching limit
    if (estimatedStateMemory > budget.memory.maxStateMemory * 0.8) {
      warnings.push({
        type: 'approaching_limit',
        message: `State memory usage at ${Math.round((estimatedStateMemory / budget.memory.maxStateMemory) * 100)}% of budget`,
      });
    }
  }

  if (estimatedGeometryMemory !== undefined) {
    if (estimatedGeometryMemory > budget.memory.maxGeometryMemory) {
      return {
        rejected: true,
        reason: 'exceeds_memory_budget',
        message: `Estimated geometry memory ${formatBytes(estimatedGeometryMemory)} exceeds budget of ${formatBytes(budget.memory.maxGeometryMemory)}`,
        limit: budget.memory.maxGeometryMemory,
        actual: estimatedGeometryMemory,
        suggestion: 'Reduce state count or simplify visualization complexity.',
      };
    }
  }

  // Add warnings for degraded functionality
  if (!budget.interaction.autoplayAllowed) {
    warnings.push({
      type: 'degraded_interaction',
      message: 'Autoplay disabled for this run size',
    });
  }

  if (!budget.interaction.selectionAllowed) {
    warnings.push({
      type: 'degraded_interaction',
      message: 'Selection disabled for this run size',
    });
  }

  if (budget.render.targetFps < 30) {
    warnings.push({
      type: 'slow_render',
      message: `Target framerate is ${budget.render.targetFps}fps for this run size`,
    });
  }

  return {
    rejected: false,
    budget,
    scaleClass,
    warnings,
  };
}

/**
 * Estimate state memory from state count
 * Conservative estimate: ~1KB per state average
 */
export function estimateStateMemory(stateCount: number): number {
  const BYTES_PER_STATE = 1024; // 1KB average
  return stateCount * BYTES_PER_STATE;
}

/**
 * Estimate geometry memory from state count
 * Conservative estimate: ~200 bytes per state for geometry
 */
export function estimateGeometryMemory(stateCount: number): number {
  const BYTES_PER_STATE_GEOMETRY = 200;
  return stateCount * BYTES_PER_STATE_GEOMETRY;
}

// ============================================================================
// Budget Enforcement
// ============================================================================

/**
 * Budget enforcer that tracks usage and reports violations
 */
export class BudgetEnforcer {
  private readonly budget: PerformanceBudget;
  private currentStateMemory: number = 0;
  private currentGeometryMemory: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private frameTimes: number[] = [];

  constructor(budget: PerformanceBudget) {
    this.budget = budget;
  }

  /**
   * Get the active budget
   */
  getBudget(): PerformanceBudget {
    return this.budget;
  }

  /**
   * Check if memory allocation is allowed
   */
  canAllocateStateMemory(bytes: number): boolean {
    return (this.currentStateMemory + bytes) <= this.budget.memory.maxStateMemory;
  }

  /**
   * Record state memory allocation
   */
  allocateStateMemory(bytes: number): boolean {
    if (!this.canAllocateStateMemory(bytes)) {
      return false;
    }
    this.currentStateMemory += bytes;
    return true;
  }

  /**
   * Release state memory
   */
  releaseStateMemory(bytes: number): void {
    this.currentStateMemory = Math.max(0, this.currentStateMemory - bytes);
  }

  /**
   * Check if geometry allocation is allowed
   */
  canAllocateGeometryMemory(bytes: number): boolean {
    return (this.currentGeometryMemory + bytes) <= this.budget.memory.maxGeometryMemory;
  }

  /**
   * Record geometry memory allocation
   */
  allocateGeometryMemory(bytes: number): boolean {
    if (!this.canAllocateGeometryMemory(bytes)) {
      return false;
    }
    this.currentGeometryMemory += bytes;
    return true;
  }

  /**
   * Release geometry memory
   */
  releaseGeometryMemory(bytes: number): void {
    this.currentGeometryMemory = Math.max(0, this.currentGeometryMemory - bytes);
  }

  /**
   * Record frame render time
   */
  recordFrameTime(ms: number): void {
    this.frameTimes.push(ms);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    this.frameCount++;
    this.lastFrameTime = ms;
  }

  /**
   * Check if frame time is within budget
   */
  isFrameTimeWithinBudget(ms: number): boolean {
    return ms <= this.budget.render.maxFrameMs;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  /**
   * Get current FPS
   */
  getCurrentFps(): number {
    const avgMs = this.getAverageFrameTime();
    if (avgMs === 0) return 0;
    return 1000 / avgMs;
  }

  /**
   * Check if interaction is allowed by budget
   */
  isInteractionAllowed(type: 'scrub' | 'autoplay' | 'select'): boolean {
    switch (type) {
      case 'autoplay':
        return this.budget.interaction.autoplayAllowed;
      case 'select':
        return this.budget.interaction.selectionAllowed;
      case 'scrub':
        return true; // Always allowed, but rate-limited
    }
  }

  /**
   * Get maximum scrub rate
   */
  getMaxScrubRate(): number {
    return this.budget.interaction.maxScrubRate;
  }

  /**
   * Get tooltip debounce time
   */
  getTooltipDebounce(): number {
    return this.budget.interaction.tooltipDebounceMs;
  }

  /**
   * Get current memory usage summary
   */
  getMemoryUsage(): {
    stateMemory: number;
    geometryMemory: number;
    totalMemory: number;
    stateMemoryPercent: number;
    geometryMemoryPercent: number;
    totalMemoryPercent: number;
  } {
    const totalMemory = this.currentStateMemory + this.currentGeometryMemory;
    return {
      stateMemory: this.currentStateMemory,
      geometryMemory: this.currentGeometryMemory,
      totalMemory,
      stateMemoryPercent: (this.currentStateMemory / this.budget.memory.maxStateMemory) * 100,
      geometryMemoryPercent: (this.currentGeometryMemory / this.budget.memory.maxGeometryMemory) * 100,
      totalMemoryPercent: (totalMemory / this.budget.memory.maxTotalMemory) * 100,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    averageFrameMs: number;
    currentFps: number;
    targetFps: number;
    withinBudget: boolean;
    frameCount: number;
  } {
    const avgMs = this.getAverageFrameTime();
    const fps = this.getCurrentFps();
    return {
      averageFrameMs: avgMs,
      currentFps: fps,
      targetFps: this.budget.render.targetFps,
      withinBudget: avgMs <= this.budget.render.maxFrameMs,
      frameCount: this.frameCount,
    };
  }

  /**
   * Reset all tracking
   */
  reset(): void {
    this.currentStateMemory = 0;
    this.currentGeometryMemory = 0;
    this.frameTimes = [];
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format milliseconds as human-readable string
 */
export function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Create a rejection message for user display
 */
export function formatRejectionMessage(rejection: BudgetRejection): string {
  const lines = [
    `Cannot load run: ${rejection.message}`,
    '',
    `Limit: ${rejection.limit.toLocaleString()}`,
    `Actual: ${rejection.actual.toLocaleString()}`,
  ];

  if (rejection.suggestion) {
    lines.push('', `Suggestion: ${rejection.suggestion}`);
  }

  return lines.join('\n');
}
