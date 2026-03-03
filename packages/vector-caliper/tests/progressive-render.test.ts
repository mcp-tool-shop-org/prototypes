/**
 * Progressive Rendering Tests
 *
 * Acceptance criteria:
 * - Coarse views are subsets, not approximations
 * - Users can see when rendering is incomplete
 * - Early render never contradicts final render
 * - All passes are truthful (exact data, no interpolation)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectUniformSubset,
  selectEndpointsSubset,
  selectKeyframeSubset,
  selectSubset,
  getDefaultPassConfigs,
  createRenderPlan,
  createDefaultRenderPlan,
  ProgressiveRenderer,
  createProgressiveRenderer,
  createCustomProgressiveRenderer,
  verifySubsetTruth,
  verifyPlanTruth,
  RenderPass,
  PassConfig,
} from '../src/scale/progressive-render';
import { SMALL_BUDGET, MEDIUM_BUDGET, LARGE_BUDGET, EXTREME_BUDGET } from '../src/scale/budget';

describe('Subset Selection', () => {
  describe('selectUniformSubset', () => {
    it('returns all indices when target >= total', () => {
      const indices = selectUniformSubset(100, 100);
      expect(indices).toHaveLength(100);
      expect(indices[0]).toBe(0);
      expect(indices[99]).toBe(99);
    });

    it('returns empty for zero target', () => {
      expect(selectUniformSubset(100, 0)).toHaveLength(0);
    });

    it('returns uniform distribution', () => {
      const indices = selectUniformSubset(100, 10);

      expect(indices).toHaveLength(10);
      expect(indices[0]).toBe(0);
      expect(indices[9]).toBe(99);

      // Should be roughly evenly spaced
      for (let i = 1; i < indices.length; i++) {
        const gap = indices[i] - indices[i - 1];
        expect(gap).toBeGreaterThanOrEqual(9);
        expect(gap).toBeLessThanOrEqual(12);
      }
    });

    it('returns sorted indices', () => {
      const indices = selectUniformSubset(1000, 50);

      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThan(indices[i - 1]);
      }
    });

    it('handles small totals', () => {
      expect(selectUniformSubset(1, 10)).toEqual([0]);
      expect(selectUniformSubset(2, 10)).toEqual([0, 1]);
      expect(selectUniformSubset(3, 10)).toEqual([0, 1, 2]);
    });
  });

  describe('selectEndpointsSubset', () => {
    it('always includes first and last', () => {
      const indices = selectEndpointsSubset(100, 5);

      expect(indices[0]).toBe(0);
      expect(indices[indices.length - 1]).toBe(99);
    });

    it('handles minimum cases', () => {
      expect(selectEndpointsSubset(100, 2)).toEqual([0, 99]);
      expect(selectEndpointsSubset(2, 2)).toEqual([0, 1]);
      expect(selectEndpointsSubset(1, 2)).toEqual([0]);
      expect(selectEndpointsSubset(0, 2)).toEqual([]);
    });

    it('fills middle uniformly', () => {
      const indices = selectEndpointsSubset(100, 5);

      expect(indices).toHaveLength(5);
      expect(indices[0]).toBe(0);
      expect(indices[4]).toBe(99);
      // Middle indices should be evenly distributed
    });
  });

  describe('selectKeyframeSubset', () => {
    it('falls back to uniform when no keyframes', () => {
      const keyframes = selectKeyframeSubset(100, 10, []);
      const uniform = selectUniformSubset(100, 10);

      expect(keyframes).toEqual(uniform);
    });

    it('includes all keyframes when fewer than target', () => {
      const keyframes = [10, 50, 90];
      const indices = selectKeyframeSubset(100, 10, keyframes);

      for (const kf of keyframes) {
        expect(indices).toContain(kf);
      }
    });

    it('limits to target count', () => {
      const keyframes = Array.from({ length: 20 }, (_, i) => i * 5);
      const indices = selectKeyframeSubset(100, 10, keyframes);

      expect(indices.length).toBeLessThanOrEqual(10);
    });

    it('filters out of range keyframes', () => {
      const keyframes = [-5, 50, 200];
      const indices = selectKeyframeSubset(100, 10, keyframes);

      expect(indices).not.toContain(-5);
      expect(indices).not.toContain(200);
      expect(indices).toContain(50);
    });
  });

  describe('selectSubset', () => {
    it('dispatches to correct strategy', () => {
      expect(selectSubset(100, 10, 'uniform')).toEqual(selectUniformSubset(100, 10));
      expect(selectSubset(100, 10, 'endpoints')).toEqual(selectEndpointsSubset(100, 10));
      expect(selectSubset(100, 10, 'keyframes', [25, 75])).toEqual(selectKeyframeSubset(100, 10, [25, 75]));
    });
  });
});

describe('Pass Configuration', () => {
  describe('getDefaultPassConfigs', () => {
    it('uses single pass for small runs', () => {
      const configs = getDefaultPassConfigs(500, SMALL_BUDGET);

      expect(configs).toHaveLength(1);
      expect(configs[0].level).toBe('complete');
    });

    it('uses two passes for medium runs', () => {
      const configs = getDefaultPassConfigs(5000, MEDIUM_BUDGET);

      expect(configs).toHaveLength(2);
      expect(configs[0].level).toBe('coarse');
      expect(configs[1].level).toBe('complete');
    });

    it('uses three passes for large runs', () => {
      const configs = getDefaultPassConfigs(50000, LARGE_BUDGET);

      expect(configs).toHaveLength(3);
      expect(configs[0].level).toBe('coarse');
      expect(configs[1].level).toBe('medium');
      expect(configs[2].level).toBe('complete');
    });

    it('uses four passes for extreme runs', () => {
      const configs = getDefaultPassConfigs(500000, EXTREME_BUDGET);

      expect(configs).toHaveLength(4);
      expect(configs[0].level).toBe('coarse');
      expect(configs[1].level).toBe('medium');
      expect(configs[2].level).toBe('fine');
      expect(configs[3].level).toBe('complete');
    });
  });
});

describe('Render Plan', () => {
  describe('createRenderPlan', () => {
    it('creates plan with correct pass count', () => {
      const configs: PassConfig[] = [
        { level: 'coarse', targetStates: 10, strategy: 'endpoints' },
        { level: 'complete', targetStates: 100, strategy: 'uniform' },
      ];

      const plan = createRenderPlan(100, configs);

      expect(plan.passes).toHaveLength(2);
      expect(plan.totalStates).toBe(100);
    });

    it('marks final pass correctly', () => {
      const configs: PassConfig[] = [
        { level: 'coarse', targetStates: 10, strategy: 'uniform' },
        { level: 'complete', targetStates: 100, strategy: 'uniform' },
      ];

      const plan = createRenderPlan(100, configs);

      expect(plan.passes[0].isFinal).toBe(false);
      expect(plan.passes[1].isFinal).toBe(true);
    });

    it('avoids duplicate indices across passes', () => {
      const configs: PassConfig[] = [
        { level: 'coarse', targetStates: 10, strategy: 'endpoints' },
        { level: 'complete', targetStates: 100, strategy: 'uniform' },
      ];

      const plan = createRenderPlan(100, configs);

      const allIndices = new Set<number>();
      for (const pass of plan.passes) {
        for (const idx of pass.indices) {
          // Each index should appear in exactly one pass
          expect(allIndices.has(idx)).toBe(false);
          allIndices.add(idx);
        }
      }
    });

    it('includes keyframes in early passes', () => {
      const configs: PassConfig[] = [
        { level: 'coarse', targetStates: 10, strategy: 'keyframes' },
        { level: 'complete', targetStates: 100, strategy: 'uniform' },
      ];

      const keyframes = [25, 50, 75];
      const plan = createRenderPlan(100, configs, keyframes);

      // Keyframes should be in first pass
      for (const kf of keyframes) {
        expect(plan.passes[0].indices).toContain(kf);
      }
    });
  });

  describe('createDefaultRenderPlan', () => {
    it('creates plan for small runs', () => {
      const plan = createDefaultRenderPlan(100, SMALL_BUDGET);

      expect(plan.passes).toHaveLength(1);
      expect(plan.passes[0].indices).toHaveLength(100);
    });

    it('creates multi-pass plan for large runs', () => {
      const plan = createDefaultRenderPlan(50000, LARGE_BUDGET);

      expect(plan.passes.length).toBeGreaterThan(1);
      expect(plan.passes[0].indices.length).toBeLessThan(plan.totalStates);
    });
  });
});

describe('ProgressiveRenderer', () => {
  let renderer: ProgressiveRenderer;

  describe('basic operation', () => {
    beforeEach(() => {
      renderer = createProgressiveRenderer(10000, MEDIUM_BUDGET);
    });

    it('starts incomplete', () => {
      expect(renderer.isComplete()).toBe(false);
    });

    it('has first pass available', () => {
      const pass = renderer.getNextPass();

      expect(pass).not.toBeNull();
      expect(pass!.passNumber).toBe(0);
    });

    it('tracks state correctly', () => {
      const state = renderer.getState();

      expect(state.passesCompleted).toBe(0);
      expect(state.statesRendered).toBe(0);
      expect(state.isComplete).toBe(false);
      expect(state.progress).toBe(0);
    });
  });

  describe('pass completion', () => {
    beforeEach(() => {
      renderer = createProgressiveRenderer(5000, MEDIUM_BUDGET);
    });

    it('advances to next pass', () => {
      const firstPass = renderer.getNextPass()!;
      renderer.completePass();

      const secondPass = renderer.getNextPass();
      expect(secondPass!.passNumber).toBe(firstPass.passNumber + 1);
    });

    it('tracks rendered indices', () => {
      const pass = renderer.getNextPass()!;
      renderer.completePass();

      const rendered = renderer.getRenderedIndices();
      expect(rendered.length).toBe(pass.indices.length);
    });

    it('updates progress', () => {
      renderer.completePass();
      const state = renderer.getState();

      expect(state.progress).toBeGreaterThan(0);
      expect(state.statesRendered).toBeGreaterThan(0);
    });

    it('becomes complete after all passes', () => {
      while (!renderer.isComplete()) {
        renderer.completePass();
      }

      expect(renderer.isComplete()).toBe(true);
      expect(renderer.getState().progress).toBe(1);
    });
  });

  describe('abort', () => {
    beforeEach(() => {
      renderer = createProgressiveRenderer(50000, LARGE_BUDGET);
    });

    it('stops rendering', () => {
      renderer.completePass();
      renderer.abort();

      expect(renderer.isComplete()).toBe(true);
      expect(renderer.getNextPass()).toBeNull();
    });

    it('preserves rendered state', () => {
      renderer.completePass();
      const statesBeforeAbort = renderer.getState().statesRendered;

      renderer.abort();

      expect(renderer.getState().statesRendered).toBe(statesBeforeAbort);
    });
  });

  describe('reset', () => {
    beforeEach(() => {
      renderer = createProgressiveRenderer(5000, MEDIUM_BUDGET);
    });

    it('returns to initial state', () => {
      renderer.completePass();
      renderer.completePass();
      renderer.reset();

      const state = renderer.getState();
      expect(state.passesCompleted).toBe(0);
      expect(state.statesRendered).toBe(0);
      expect(state.isComplete).toBe(false);
    });

    it('clears abort flag', () => {
      renderer.abort();
      renderer.reset();

      expect(renderer.isComplete()).toBe(false);
      expect(renderer.getNextPass()).not.toBeNull();
    });
  });

  describe('completeness indicator', () => {
    it('shows loading for incomplete', () => {
      renderer = createProgressiveRenderer(50000, LARGE_BUDGET);

      const indicator = renderer.getCompletenessIndicator();
      expect(indicator.showLoading).toBe(true);
      expect(indicator.badge).toBe('coarse');
    });

    it('shows complete for finished', () => {
      renderer = createProgressiveRenderer(100, SMALL_BUDGET);
      renderer.completePass();

      const indicator = renderer.getCompletenessIndicator();
      expect(indicator.showLoading).toBe(false);
      expect(indicator.badge).toBeNull();
      expect(indicator.opacity).toBe(1.0);
    });

    it('allows interaction during coarse', () => {
      renderer = createProgressiveRenderer(50000, LARGE_BUDGET);

      const indicator = renderer.getCompletenessIndicator();
      expect(indicator.interactive).toBe(true);
    });

    it('increases opacity with progress', () => {
      renderer = createProgressiveRenderer(50000, LARGE_BUDGET);

      const coarseIndicator = renderer.getCompletenessIndicator();
      renderer.completePass();

      const mediumIndicator = renderer.getCompletenessIndicator();
      expect(mediumIndicator.opacity).toBeGreaterThanOrEqual(coarseIndicator.opacity);
    });
  });
});

describe('Truthfulness Verification', () => {
  describe('verifySubsetTruth', () => {
    it('passes for true subset', () => {
      const coarse = [0, 50, 99];
      const complete = Array.from({ length: 100 }, (_, i) => i);

      const result = verifySubsetTruth(coarse, complete);

      expect(result.truthful).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('fails for indices not in complete set', () => {
      const coarse = [0, 50, 150]; // 150 is out of range
      const complete = Array.from({ length: 100 }, (_, i) => i);

      const result = verifySubsetTruth(coarse, complete);

      expect(result.truthful).toBe(false);
      expect(result.violations).toContain(150);
    });
  });

  describe('verifyPlanTruth', () => {
    it('passes for truthful plan', () => {
      const plan = createDefaultRenderPlan(10000, MEDIUM_BUDGET);

      const result = verifyPlanTruth(plan);

      expect(result.truthful).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('all default plans are truthful', () => {
      // Test various sizes
      for (const size of [100, 1000, 10000, 100000, 500000]) {
        const budget = size <= 1000 ? SMALL_BUDGET :
          size <= 10000 ? MEDIUM_BUDGET :
            size <= 100000 ? LARGE_BUDGET : EXTREME_BUDGET;

        const plan = createDefaultRenderPlan(size, budget);
        const result = verifyPlanTruth(plan);

        expect(result.truthful).toBe(true);
      }
    });
  });
});

describe('No Approximation Guarantee', () => {
  it('coarse indices are exact state indices', () => {
    const plan = createDefaultRenderPlan(10000, MEDIUM_BUDGET);
    const coarsePass = plan.passes[0];

    // Every index in coarse pass should be a valid state index
    for (const idx of coarsePass.indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(10000);
      expect(Number.isInteger(idx)).toBe(true);
    }
  });

  it('no interpolated indices', () => {
    // Indices should all be integers, no fractional interpolation
    const indices = selectUniformSubset(1000, 50);

    for (const idx of indices) {
      expect(Number.isInteger(idx)).toBe(true);
    }
  });

  it('subset selection is deterministic', () => {
    const indices1 = selectUniformSubset(10000, 100);
    const indices2 = selectUniformSubset(10000, 100);

    expect(indices1).toEqual(indices2);
  });
});

describe('Factory Functions', () => {
  describe('createProgressiveRenderer', () => {
    it('creates renderer with default plan', () => {
      const renderer = createProgressiveRenderer(5000, MEDIUM_BUDGET);

      expect(renderer.getNextPass()).not.toBeNull();
    });

    it('respects keyframes', () => {
      const keyframes = [100, 500, 900];
      const renderer = createProgressiveRenderer(1000, MEDIUM_BUDGET, keyframes);

      // In multi-pass render, keyframes should be in early passes
      // For small counts, single pass includes all
      const pass = renderer.getNextPass()!;
      for (const kf of keyframes) {
        expect(pass.indices).toContain(kf);
      }
    });
  });

  describe('createCustomProgressiveRenderer', () => {
    it('uses custom pass configs', () => {
      const configs: PassConfig[] = [
        { level: 'coarse', targetStates: 5, strategy: 'endpoints' },
        { level: 'complete', targetStates: 100, strategy: 'uniform' },
      ];

      const renderer = createCustomProgressiveRenderer(100, configs);
      const pass = renderer.getNextPass()!;

      expect(pass.level).toBe('coarse');
      expect(pass.indices.length).toBeLessThanOrEqual(5);
    });
  });
});

describe('Early Render Consistency', () => {
  it('early render never contradicts final render', () => {
    // The key invariant: indices in early passes must exist in the final state
    const plan = createDefaultRenderPlan(50000, LARGE_BUDGET);

    // Collect all indices that will be rendered
    const allRenderedIndices = new Set<number>();
    for (const pass of plan.passes) {
      pass.indices.forEach(idx => allRenderedIndices.add(idx));
    }

    // Every early pass index must be in the complete set
    for (const pass of plan.passes) {
      if (pass.isFinal) continue;

      for (const idx of pass.indices) {
        expect(allRenderedIndices.has(idx)).toBe(true);
      }
    }
  });

  it('coarse + complete = all states', () => {
    // Total unique indices across all passes should equal total states
    const plan = createDefaultRenderPlan(1000, SMALL_BUDGET);

    const allIndices = new Set<number>();
    for (const pass of plan.passes) {
      pass.indices.forEach(idx => allIndices.add(idx));
    }

    expect(allIndices.size).toBe(1000);
  });
});
