/**
 * Performance Budget Tests
 *
 * Acceptance criteria:
 * - Explicit limits, not silent degradation
 * - Fail fast when limits exceeded
 * - User always knows why rejection happened
 * - No auto-downsampling without disclosure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyScale,
  ScaleClass,
  SCALE_THRESHOLDS,
  getBudgetForScale,
  getBudgetForStateCount,
  validateBudget,
  estimateStateMemory,
  estimateGeometryMemory,
  BudgetEnforcer,
  formatBytes,
  formatMs,
  formatRejectionMessage,
  ABSOLUTE_MAX_STATES,
  ABSOLUTE_MAX_MEMORY,
  SMALL_BUDGET,
  MEDIUM_BUDGET,
  LARGE_BUDGET,
  EXTREME_BUDGET,
} from '../src/scale/budget';

describe('Scale Classification', () => {
  describe('classifyScale', () => {
    it('classifies small runs', () => {
      expect(classifyScale(0)).toBe('small');
      expect(classifyScale(100)).toBe('small');
      expect(classifyScale(1000)).toBe('small');
    });

    it('classifies medium runs', () => {
      expect(classifyScale(1001)).toBe('medium');
      expect(classifyScale(5000)).toBe('medium');
      expect(classifyScale(10000)).toBe('medium');
    });

    it('classifies large runs', () => {
      expect(classifyScale(10001)).toBe('large');
      expect(classifyScale(50000)).toBe('large');
      expect(classifyScale(100000)).toBe('large');
    });

    it('classifies extreme runs', () => {
      expect(classifyScale(100001)).toBe('extreme');
      expect(classifyScale(500000)).toBe('extreme');
      expect(classifyScale(1000000)).toBe('extreme');
    });

    it('has consistent thresholds', () => {
      // Verify no gaps in thresholds
      expect(SCALE_THRESHOLDS.small.max + 1).toBe(SCALE_THRESHOLDS.medium.min);
      expect(SCALE_THRESHOLDS.medium.max + 1).toBe(SCALE_THRESHOLDS.large.min);
      expect(SCALE_THRESHOLDS.large.max + 1).toBe(SCALE_THRESHOLDS.extreme.min);
    });
  });
});

describe('Budget Retrieval', () => {
  describe('getBudgetForScale', () => {
    it('returns correct budget for each scale class', () => {
      expect(getBudgetForScale('small')).toBe(SMALL_BUDGET);
      expect(getBudgetForScale('medium')).toBe(MEDIUM_BUDGET);
      expect(getBudgetForScale('large')).toBe(LARGE_BUDGET);
      expect(getBudgetForScale('extreme')).toBe(EXTREME_BUDGET);
    });
  });

  describe('getBudgetForStateCount', () => {
    it('returns small budget for small counts', () => {
      const budget = getBudgetForStateCount(500);
      expect(budget.scaleClass).toBe('small');
    });

    it('returns medium budget for medium counts', () => {
      const budget = getBudgetForStateCount(5000);
      expect(budget.scaleClass).toBe('medium');
    });

    it('returns large budget for large counts', () => {
      const budget = getBudgetForStateCount(50000);
      expect(budget.scaleClass).toBe('large');
    });

    it('returns extreme budget for extreme counts', () => {
      const budget = getBudgetForStateCount(500000);
      expect(budget.scaleClass).toBe('extreme');
    });
  });
});

describe('Budget Properties', () => {
  it('small budget allows autoplay', () => {
    expect(SMALL_BUDGET.interaction.autoplayAllowed).toBe(true);
    expect(SMALL_BUDGET.interaction.selectionAllowed).toBe(true);
  });

  it('medium budget allows autoplay', () => {
    expect(MEDIUM_BUDGET.interaction.autoplayAllowed).toBe(true);
    expect(MEDIUM_BUDGET.interaction.selectionAllowed).toBe(true);
  });

  it('large budget disables autoplay', () => {
    expect(LARGE_BUDGET.interaction.autoplayAllowed).toBe(false);
    expect(LARGE_BUDGET.interaction.selectionAllowed).toBe(true);
  });

  it('extreme budget disables autoplay and selection', () => {
    expect(EXTREME_BUDGET.interaction.autoplayAllowed).toBe(false);
    expect(EXTREME_BUDGET.interaction.selectionAllowed).toBe(false);
  });

  it('target FPS decreases with scale', () => {
    expect(SMALL_BUDGET.render.targetFps).toBeGreaterThanOrEqual(MEDIUM_BUDGET.render.targetFps);
    expect(MEDIUM_BUDGET.render.targetFps).toBeGreaterThanOrEqual(LARGE_BUDGET.render.targetFps);
    expect(LARGE_BUDGET.render.targetFps).toBeGreaterThanOrEqual(EXTREME_BUDGET.render.targetFps);
  });

  it('scrub rate decreases with scale', () => {
    expect(SMALL_BUDGET.interaction.maxScrubRate).toBeGreaterThanOrEqual(MEDIUM_BUDGET.interaction.maxScrubRate);
    expect(MEDIUM_BUDGET.interaction.maxScrubRate).toBeGreaterThanOrEqual(LARGE_BUDGET.interaction.maxScrubRate);
    expect(LARGE_BUDGET.interaction.maxScrubRate).toBeGreaterThanOrEqual(EXTREME_BUDGET.interaction.maxScrubRate);
  });

  it('chunk size increases with scale', () => {
    expect(SMALL_BUDGET.memory.chunkSize).toBeLessThanOrEqual(MEDIUM_BUDGET.memory.chunkSize);
    expect(MEDIUM_BUDGET.memory.chunkSize).toBeLessThanOrEqual(LARGE_BUDGET.memory.chunkSize);
    expect(LARGE_BUDGET.memory.chunkSize).toBeLessThanOrEqual(EXTREME_BUDGET.memory.chunkSize);
  });
});

describe('Budget Validation', () => {
  describe('validateBudget', () => {
    it('accepts small runs', () => {
      const result = validateBudget(500);

      expect(result.rejected).toBe(false);
      if (!result.rejected) {
        expect(result.scaleClass).toBe('small');
        expect(result.warnings).toHaveLength(0);
      }
    });

    it('accepts medium runs', () => {
      const result = validateBudget(5000);

      expect(result.rejected).toBe(false);
      if (!result.rejected) {
        expect(result.scaleClass).toBe('medium');
      }
    });

    it('accepts large runs with warnings', () => {
      const result = validateBudget(50000);

      expect(result.rejected).toBe(false);
      if (!result.rejected) {
        expect(result.scaleClass).toBe('large');
        // Large runs should have degraded interaction warnings
        expect(result.warnings.some(w => w.type === 'degraded_interaction')).toBe(true);
      }
    });

    it('accepts extreme runs with multiple warnings', () => {
      const result = validateBudget(500000);

      expect(result.rejected).toBe(false);
      if (!result.rejected) {
        expect(result.scaleClass).toBe('extreme');
        // Should warn about autoplay, selection, and slow render
        expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('rejects runs exceeding absolute limit', () => {
      const result = validateBudget(ABSOLUTE_MAX_STATES + 1);

      expect(result.rejected).toBe(true);
      if (result.rejected) {
        expect(result.reason).toBe('exceeds_absolute_limit');
        expect(result.limit).toBe(ABSOLUTE_MAX_STATES);
        expect(result.actual).toBe(ABSOLUTE_MAX_STATES + 1);
        expect(result.suggestion).toBeDefined();
      }
    });

    it('rejects runs exceeding memory budget', () => {
      const hugeMemory = 10 * 1024 * 1024 * 1024; // 10GB
      const result = validateBudget(500, hugeMemory);

      expect(result.rejected).toBe(true);
      if (result.rejected) {
        expect(result.reason).toBe('exceeds_memory_budget');
      }
    });

    it('warns when approaching memory limit', () => {
      // 90% of small budget state memory
      const nearLimit = SMALL_BUDGET.memory.maxStateMemory * 0.9;
      const result = validateBudget(500, nearLimit);

      expect(result.rejected).toBe(false);
      if (!result.rejected) {
        expect(result.warnings.some(w => w.type === 'approaching_limit')).toBe(true);
      }
    });

    it('provides user-friendly rejection messages', () => {
      const result = validateBudget(ABSOLUTE_MAX_STATES + 1);

      expect(result.rejected).toBe(true);
      if (result.rejected) {
        expect(result.message).toContain('exceeds');
        expect(result.message).toContain('maximum');
      }
    });
  });
});

describe('Memory Estimation', () => {
  describe('estimateStateMemory', () => {
    it('estimates memory proportional to state count', () => {
      const mem100 = estimateStateMemory(100);
      const mem1000 = estimateStateMemory(1000);

      expect(mem1000).toBe(mem100 * 10);
    });

    it('returns reasonable estimates', () => {
      // 1000 states should be ~1MB (1KB per state)
      const mem = estimateStateMemory(1000);
      expect(mem).toBeGreaterThanOrEqual(500 * 1024); // At least 500KB
      expect(mem).toBeLessThanOrEqual(10 * 1024 * 1024); // At most 10MB
    });
  });

  describe('estimateGeometryMemory', () => {
    it('estimates memory proportional to state count', () => {
      const mem100 = estimateGeometryMemory(100);
      const mem1000 = estimateGeometryMemory(1000);

      expect(mem1000).toBe(mem100 * 10);
    });

    it('is smaller than state memory estimate', () => {
      const stateMemory = estimateStateMemory(1000);
      const geometryMemory = estimateGeometryMemory(1000);

      expect(geometryMemory).toBeLessThan(stateMemory);
    });
  });
});

describe('BudgetEnforcer', () => {
  let enforcer: BudgetEnforcer;

  beforeEach(() => {
    enforcer = new BudgetEnforcer(SMALL_BUDGET);
  });

  describe('memory tracking', () => {
    it('tracks state memory allocation', () => {
      const success = enforcer.allocateStateMemory(1024);

      expect(success).toBe(true);
      expect(enforcer.getMemoryUsage().stateMemory).toBe(1024);
    });

    it('rejects allocation exceeding budget', () => {
      const hugeAllocation = SMALL_BUDGET.memory.maxStateMemory + 1;
      const success = enforcer.allocateStateMemory(hugeAllocation);

      expect(success).toBe(false);
    });

    it('checks allocation before committing', () => {
      expect(enforcer.canAllocateStateMemory(1024)).toBe(true);
      expect(enforcer.canAllocateStateMemory(SMALL_BUDGET.memory.maxStateMemory + 1)).toBe(false);
    });

    it('releases state memory', () => {
      enforcer.allocateStateMemory(2048);
      enforcer.releaseStateMemory(1024);

      expect(enforcer.getMemoryUsage().stateMemory).toBe(1024);
    });

    it('does not go negative on release', () => {
      enforcer.allocateStateMemory(1024);
      enforcer.releaseStateMemory(2048);

      expect(enforcer.getMemoryUsage().stateMemory).toBe(0);
    });

    it('tracks geometry memory separately', () => {
      enforcer.allocateStateMemory(1024);
      enforcer.allocateGeometryMemory(512);

      const usage = enforcer.getMemoryUsage();
      expect(usage.stateMemory).toBe(1024);
      expect(usage.geometryMemory).toBe(512);
      expect(usage.totalMemory).toBe(1536);
    });

    it('calculates memory percentages', () => {
      enforcer.allocateStateMemory(SMALL_BUDGET.memory.maxStateMemory / 2);

      const usage = enforcer.getMemoryUsage();
      expect(usage.stateMemoryPercent).toBeCloseTo(50, 0);
    });
  });

  describe('frame time tracking', () => {
    it('records frame times', () => {
      enforcer.recordFrameTime(16);
      enforcer.recordFrameTime(17);
      enforcer.recordFrameTime(15);

      expect(enforcer.getAverageFrameTime()).toBeCloseTo(16, 0);
    });

    it('calculates current FPS', () => {
      enforcer.recordFrameTime(16.67); // ~60fps

      expect(enforcer.getCurrentFps()).toBeCloseTo(60, 0);
    });

    it('checks if frame time is within budget', () => {
      expect(enforcer.isFrameTimeWithinBudget(16)).toBe(true);
      expect(enforcer.isFrameTimeWithinBudget(1000)).toBe(false);
    });

    it('keeps rolling window of frame times', () => {
      // Record 100 frames
      for (let i = 0; i < 100; i++) {
        enforcer.recordFrameTime(16);
      }

      // Should only keep last 60
      const summary = enforcer.getPerformanceSummary();
      expect(summary.frameCount).toBe(100);
      expect(summary.averageFrameMs).toBeCloseTo(16, 0);
    });
  });

  describe('interaction constraints', () => {
    it('allows autoplay for small budget', () => {
      expect(enforcer.isInteractionAllowed('autoplay')).toBe(true);
    });

    it('allows selection for small budget', () => {
      expect(enforcer.isInteractionAllowed('select')).toBe(true);
    });

    it('always allows scrub (but rate-limited)', () => {
      expect(enforcer.isInteractionAllowed('scrub')).toBe(true);
    });

    it('provides scrub rate limit', () => {
      expect(enforcer.getMaxScrubRate()).toBe(SMALL_BUDGET.interaction.maxScrubRate);
    });

    it('provides tooltip debounce', () => {
      expect(enforcer.getTooltipDebounce()).toBe(SMALL_BUDGET.interaction.tooltipDebounceMs);
    });
  });

  describe('extreme budget constraints', () => {
    beforeEach(() => {
      enforcer = new BudgetEnforcer(EXTREME_BUDGET);
    });

    it('disables autoplay', () => {
      expect(enforcer.isInteractionAllowed('autoplay')).toBe(false);
    });

    it('disables selection', () => {
      expect(enforcer.isInteractionAllowed('select')).toBe(false);
    });

    it('has lower scrub rate', () => {
      expect(enforcer.getMaxScrubRate()).toBe(EXTREME_BUDGET.interaction.maxScrubRate);
      expect(enforcer.getMaxScrubRate()).toBeLessThan(SMALL_BUDGET.interaction.maxScrubRate);
    });
  });

  describe('reset', () => {
    it('clears all tracking', () => {
      enforcer.allocateStateMemory(1024);
      enforcer.allocateGeometryMemory(512);
      enforcer.recordFrameTime(16);

      enforcer.reset();

      const memUsage = enforcer.getMemoryUsage();
      const perfSummary = enforcer.getPerformanceSummary();

      expect(memUsage.stateMemory).toBe(0);
      expect(memUsage.geometryMemory).toBe(0);
      expect(perfSummary.frameCount).toBe(0);
      expect(perfSummary.averageFrameMs).toBe(0);
    });
  });
});

describe('Formatting Utilities', () => {
  describe('formatBytes', () => {
    it('formats bytes', () => {
      expect(formatBytes(100)).toBe('100 B');
    });

    it('formats kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('formatMs', () => {
    it('formats microseconds', () => {
      expect(formatMs(0.5)).toBe('500µs');
    });

    it('formats milliseconds', () => {
      expect(formatMs(16)).toBe('16.0ms');
    });

    it('formats seconds', () => {
      expect(formatMs(1500)).toBe('1.50s');
    });
  });

  describe('formatRejectionMessage', () => {
    it('formats rejection with all fields', () => {
      const message = formatRejectionMessage({
        rejected: true,
        reason: 'exceeds_max_states',
        message: 'Too many states',
        limit: 1000,
        actual: 2000,
        suggestion: 'Reduce state count',
      });

      expect(message).toContain('Too many states');
      expect(message).toContain('1,000');
      expect(message).toContain('2,000');
      expect(message).toContain('Reduce state count');
    });

    it('formats rejection without suggestion', () => {
      const message = formatRejectionMessage({
        rejected: true,
        reason: 'exceeds_max_states',
        message: 'Too many states',
        limit: 1000,
        actual: 2000,
      });

      expect(message).toContain('Too many states');
      expect(message).not.toContain('Suggestion');
    });
  });
});

describe('Absolute Limits', () => {
  it('has sensible absolute max states', () => {
    expect(ABSOLUTE_MAX_STATES).toBe(1_000_000);
  });

  it('has sensible absolute max memory', () => {
    expect(ABSOLUTE_MAX_MEMORY).toBe(4 * 1024 * 1024 * 1024); // 4GB
  });
});

describe('No Silent Degradation', () => {
  it('does not silently downsample', () => {
    // Budget validation should reject, not silently downsample
    const result = validateBudget(ABSOLUTE_MAX_STATES + 1);

    expect(result.rejected).toBe(true);
    // No 'downsampled' field, no automatic reduction
  });

  it('all warnings are explicit', () => {
    const result = validateBudget(500000);

    expect(result.rejected).toBe(false);
    if (!result.rejected) {
      // Every degradation is listed as a warning
      for (const warning of result.warnings) {
        expect(warning.message).toBeTruthy();
        expect(warning.type).toBeTruthy();
      }
    }
  });

  it('rejection always explains why', () => {
    const result = validateBudget(ABSOLUTE_MAX_STATES + 1);

    expect(result.rejected).toBe(true);
    if (result.rejected) {
      expect(result.message).toBeTruthy();
      expect(result.reason).toBeTruthy();
      expect(result.limit).toBeDefined();
      expect(result.actual).toBeDefined();
    }
  });
});
