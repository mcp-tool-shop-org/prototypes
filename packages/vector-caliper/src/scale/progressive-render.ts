/**
 * Progressive Rendering (Truthful Degradation)
 *
 * Core principles:
 * - Render something correct immediately, refine later
 * - Coarse views are subsets, not approximations
 * - Users can see when rendering is incomplete
 * - Early render never contradicts final render
 */

import { PerformanceBudget } from './budget';

// ============================================================================
// Types
// ============================================================================

/**
 * Render pass level
 */
export type RenderPassLevel = 'coarse' | 'medium' | 'fine' | 'complete';

/**
 * Render pass configuration
 */
export interface RenderPass {
  /** Pass level */
  readonly level: RenderPassLevel;
  /** State indices to render in this pass */
  readonly indices: readonly number[];
  /** Whether this is the final pass */
  readonly isFinal: boolean;
  /** Pass number (0-indexed) */
  readonly passNumber: number;
  /** Total passes planned */
  readonly totalPasses: number;
}

/**
 * Progressive render state
 */
export interface ProgressiveRenderState {
  /** Current pass level */
  readonly currentLevel: RenderPassLevel;
  /** Passes completed */
  readonly passesCompleted: number;
  /** Total passes */
  readonly totalPasses: number;
  /** States rendered so far */
  readonly statesRendered: number;
  /** Total states */
  readonly totalStates: number;
  /** Whether rendering is complete */
  readonly isComplete: boolean;
  /** Render progress (0-1) */
  readonly progress: number;
}

/**
 * Visual completeness indicator
 */
export interface CompletenessIndicator {
  /** Visual indicator text */
  readonly badge: string | null;
  /** Whether to show loading indicator */
  readonly showLoading: boolean;
  /** Opacity multiplier for rendered content */
  readonly opacity: number;
  /** Whether user can interact */
  readonly interactive: boolean;
  /** Message for status bar */
  readonly statusMessage: string;
}

/**
 * Render plan for progressive rendering
 */
export interface RenderPlan {
  /** All passes in the plan */
  readonly passes: readonly RenderPass[];
  /** Total states to render */
  readonly totalStates: number;
  /** Estimated total render time (ms) */
  readonly estimatedTime: number;
}

// ============================================================================
// Subset Selection (Exact, Not Approximate)
// ============================================================================

/**
 * Sampling strategy for coarse passes
 * CRITICAL: These are exact subsets, not interpolations
 */
export type SamplingStrategy = 'uniform' | 'endpoints' | 'keyframes';

/**
 * Select a uniform subset of indices
 * Returns exact indices, no interpolation
 */
export function selectUniformSubset(
  totalStates: number,
  targetCount: number
): number[] {
  if (targetCount >= totalStates) {
    return Array.from({ length: totalStates }, (_, i) => i);
  }

  if (targetCount <= 0) {
    return [];
  }

  const indices: number[] = [];
  const step = (totalStates - 1) / (targetCount - 1);

  for (let i = 0; i < targetCount; i++) {
    const index = Math.round(i * step);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }

  return indices.sort((a, b) => a - b);
}

/**
 * Select endpoints + uniform fill
 * Always includes first and last
 */
export function selectEndpointsSubset(
  totalStates: number,
  targetCount: number
): number[] {
  if (totalStates <= 2 || targetCount <= 2) {
    if (totalStates === 0) return [];
    if (totalStates === 1) return [0];
    return [0, totalStates - 1];
  }

  if (targetCount >= totalStates) {
    return Array.from({ length: totalStates }, (_, i) => i);
  }

  // Always include endpoints
  const indices: number[] = [0, totalStates - 1];

  // Fill in the middle uniformly
  const middleCount = targetCount - 2;
  const middleStep = (totalStates - 2) / (middleCount + 1);

  for (let i = 1; i <= middleCount; i++) {
    const index = Math.round(i * middleStep);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }

  return indices.sort((a, b) => a - b);
}

/**
 * Select keyframe indices based on provided markers
 * Falls back to uniform if no keyframes specified
 */
export function selectKeyframeSubset(
  totalStates: number,
  targetCount: number,
  keyframeIndices: number[] = []
): number[] {
  if (keyframeIndices.length === 0) {
    return selectUniformSubset(totalStates, targetCount);
  }

  // Validate keyframes
  const validKeyframes = keyframeIndices
    .filter(i => i >= 0 && i < totalStates)
    .sort((a, b) => a - b);

  if (validKeyframes.length >= targetCount) {
    // Take first targetCount keyframes
    return validKeyframes.slice(0, targetCount);
  }

  // Include all keyframes + fill with uniform
  const indices = new Set(validKeyframes);
  const remaining = targetCount - indices.size;

  if (remaining > 0) {
    const uniformFill = selectUniformSubset(totalStates, remaining * 2);
    for (const idx of uniformFill) {
      if (indices.size >= targetCount) break;
      indices.add(idx);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Select subset based on strategy
 */
export function selectSubset(
  totalStates: number,
  targetCount: number,
  strategy: SamplingStrategy,
  keyframeIndices?: number[]
): number[] {
  switch (strategy) {
    case 'uniform':
      return selectUniformSubset(totalStates, targetCount);
    case 'endpoints':
      return selectEndpointsSubset(totalStates, targetCount);
    case 'keyframes':
      return selectKeyframeSubset(totalStates, targetCount, keyframeIndices);
  }
}

// ============================================================================
// Render Pass Planning
// ============================================================================

/**
 * Pass configuration for different levels
 */
export interface PassConfig {
  readonly level: RenderPassLevel;
  /** Target state count for this pass */
  readonly targetStates: number;
  /** Sampling strategy */
  readonly strategy: SamplingStrategy;
}

/**
 * Default pass configurations by scale
 */
export function getDefaultPassConfigs(
  totalStates: number,
  budget: PerformanceBudget
): PassConfig[] {
  // For small counts, single complete pass
  if (totalStates <= 1000) {
    return [
      { level: 'complete', targetStates: totalStates, strategy: 'uniform' },
    ];
  }

  // For medium counts, two passes
  if (totalStates <= 10000) {
    return [
      { level: 'coarse', targetStates: 500, strategy: 'endpoints' },
      { level: 'complete', targetStates: totalStates, strategy: 'uniform' },
    ];
  }

  // For large counts, three passes
  if (totalStates <= 100000) {
    return [
      { level: 'coarse', targetStates: 200, strategy: 'endpoints' },
      { level: 'medium', targetStates: 2000, strategy: 'uniform' },
      { level: 'complete', targetStates: totalStates, strategy: 'uniform' },
    ];
  }

  // For extreme counts, four passes
  return [
    { level: 'coarse', targetStates: 100, strategy: 'endpoints' },
    { level: 'medium', targetStates: 1000, strategy: 'uniform' },
    { level: 'fine', targetStates: 10000, strategy: 'uniform' },
    { level: 'complete', targetStates: totalStates, strategy: 'uniform' },
  ];
}

/**
 * Create render plan from pass configs
 */
export function createRenderPlan(
  totalStates: number,
  passConfigs: PassConfig[],
  keyframeIndices?: number[]
): RenderPlan {
  const passes: RenderPass[] = [];
  const seenIndices = new Set<number>();

  for (let i = 0; i < passConfigs.length; i++) {
    const config = passConfigs[i];
    const allIndices = selectSubset(
      totalStates,
      config.targetStates,
      config.strategy,
      keyframeIndices
    );

    // Only include indices not already rendered
    const newIndices = allIndices.filter(idx => !seenIndices.has(idx));
    newIndices.forEach(idx => seenIndices.add(idx));

    passes.push({
      level: config.level,
      indices: newIndices,
      isFinal: i === passConfigs.length - 1,
      passNumber: i,
      totalPasses: passConfigs.length,
    });
  }

  // Estimate time based on state count
  const msPerState = 0.1; // 100µs per state
  const estimatedTime = totalStates * msPerState;

  return {
    passes,
    totalStates,
    estimatedTime,
  };
}

/**
 * Create render plan with default configs
 */
export function createDefaultRenderPlan(
  totalStates: number,
  budget: PerformanceBudget,
  keyframeIndices?: number[]
): RenderPlan {
  const configs = getDefaultPassConfigs(totalStates, budget);
  return createRenderPlan(totalStates, configs, keyframeIndices);
}

// ============================================================================
// Progressive Renderer
// ============================================================================

/**
 * Progressive renderer that manages multi-pass rendering
 */
export class ProgressiveRenderer {
  private readonly plan: RenderPlan;
  private currentPassIndex: number = 0;
  private renderedIndices: Set<number> = new Set();
  private isAborted: boolean = false;

  constructor(plan: RenderPlan) {
    this.plan = plan;
  }

  /**
   * Get current render state
   */
  getState(): ProgressiveRenderState {
    const currentPass = this.plan.passes[this.currentPassIndex];
    const statesRendered = this.renderedIndices.size;

    return {
      currentLevel: currentPass?.level ?? 'complete',
      passesCompleted: this.currentPassIndex,
      totalPasses: this.plan.passes.length,
      statesRendered,
      totalStates: this.plan.totalStates,
      isComplete: this.isComplete(),
      progress: this.plan.totalStates > 0
        ? statesRendered / this.plan.totalStates
        : 1,
    };
  }

  /**
   * Check if rendering is complete
   */
  isComplete(): boolean {
    return this.currentPassIndex >= this.plan.passes.length || this.isAborted;
  }

  /**
   * Get next pass to render
   */
  getNextPass(): RenderPass | null {
    if (this.isComplete()) {
      return null;
    }
    return this.plan.passes[this.currentPassIndex];
  }

  /**
   * Mark pass as complete
   */
  completePass(): void {
    const pass = this.plan.passes[this.currentPassIndex];
    if (pass) {
      pass.indices.forEach(idx => this.renderedIndices.add(idx));
      this.currentPassIndex++;
    }
  }

  /**
   * Abort rendering
   */
  abort(): void {
    this.isAborted = true;
  }

  /**
   * Reset renderer
   */
  reset(): void {
    this.currentPassIndex = 0;
    this.renderedIndices.clear();
    this.isAborted = false;
  }

  /**
   * Get visual indicator for current state
   */
  getCompletenessIndicator(): CompletenessIndicator {
    const state = this.getState();

    if (state.isComplete) {
      return {
        badge: null,
        showLoading: false,
        opacity: 1.0,
        interactive: true,
        statusMessage: `Rendered ${state.totalStates.toLocaleString()} states`,
      };
    }

    const percentComplete = Math.round(state.progress * 100);

    switch (state.currentLevel) {
      case 'coarse':
        return {
          badge: 'coarse',
          showLoading: true,
          opacity: 0.7,
          interactive: true, // Can interact with coarse view
          statusMessage: `Coarse view (${percentComplete}%)`,
        };

      case 'medium':
        return {
          badge: 'loading',
          showLoading: true,
          opacity: 0.85,
          interactive: true,
          statusMessage: `Refining (${percentComplete}%)`,
        };

      case 'fine':
        return {
          badge: 'loading',
          showLoading: true,
          opacity: 0.95,
          interactive: true,
          statusMessage: `Fine pass (${percentComplete}%)`,
        };

      default:
        return {
          badge: null,
          showLoading: false,
          opacity: 1.0,
          interactive: true,
          statusMessage: `Rendered ${state.statesRendered.toLocaleString()} / ${state.totalStates.toLocaleString()}`,
        };
    }
  }

  /**
   * Get all rendered indices so far
   */
  getRenderedIndices(): readonly number[] {
    return Array.from(this.renderedIndices).sort((a, b) => a - b);
  }
}

// ============================================================================
// Truthful Degradation Helpers
// ============================================================================

/**
 * Verify that coarse indices are a subset of complete indices
 * Returns true if the coarse view is truthful
 */
export function verifySubsetTruth(
  coarseIndices: readonly number[],
  completeIndices: readonly number[]
): { truthful: boolean; violations: number[] } {
  const completeSet = new Set(completeIndices);
  const violations: number[] = [];

  for (const idx of coarseIndices) {
    if (!completeSet.has(idx)) {
      violations.push(idx);
    }
  }

  return {
    truthful: violations.length === 0,
    violations,
  };
}

/**
 * Check if a render plan is truthful
 * All passes must be strict subsets of the final pass
 */
export function verifyPlanTruth(plan: RenderPlan): {
  truthful: boolean;
  violations: Array<{ passNumber: number; violations: number[] }>;
} {
  const finalPass = plan.passes[plan.passes.length - 1];
  if (!finalPass) {
    return { truthful: true, violations: [] };
  }

  const finalIndices = finalPass.indices;
  const violations: Array<{ passNumber: number; violations: number[] }> = [];

  // All complete indices (union of all passes)
  const completeIndices = new Set<number>();
  for (const pass of plan.passes) {
    pass.indices.forEach(idx => completeIndices.add(idx));
  }

  // Each pass should only contain indices that are in the complete set
  for (const pass of plan.passes) {
    if (pass.isFinal) continue;

    const passViolations: number[] = [];
    for (const idx of pass.indices) {
      if (!completeIndices.has(idx)) {
        passViolations.push(idx);
      }
    }

    if (passViolations.length > 0) {
      violations.push({ passNumber: pass.passNumber, violations: passViolations });
    }
  }

  return {
    truthful: violations.length === 0,
    violations,
  };
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a progressive renderer with default plan
 */
export function createProgressiveRenderer(
  totalStates: number,
  budget: PerformanceBudget,
  keyframeIndices?: number[]
): ProgressiveRenderer {
  const plan = createDefaultRenderPlan(totalStates, budget, keyframeIndices);
  return new ProgressiveRenderer(plan);
}

/**
 * Create a progressive renderer with custom pass configs
 */
export function createCustomProgressiveRenderer(
  totalStates: number,
  passConfigs: PassConfig[],
  keyframeIndices?: number[]
): ProgressiveRenderer {
  const plan = createRenderPlan(totalStates, passConfigs, keyframeIndices);
  return new ProgressiveRenderer(plan);
}
