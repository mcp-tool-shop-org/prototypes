/**
 * Scale Validation & Stress Tests
 *
 * Verifies:
 * - Performance claims are test-backed
 * - Scale boundaries are correctly classified
 * - Stress tests pass at each scale class
 * - Memory and timing assertions work
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  StressTestConfig,
  StressTestResult,
  TimingResult,
  MemoryResult,
  BoundaryTestResult,
  ValidationSuiteResult,

  // Utilities
  createTestState,
  measureTiming,
  measureMemory,

  // Boundary tests
  testScaleBoundaries,
  testBudgetValidationAtBoundaries,

  // Stress tests
  stressTestChunkedStore,
  stressTestProgressiveRendering,
  stressTestInteractionConstraints,

  // Suite runners
  DEFAULT_STRESS_CONFIG,
  runValidationSuite,
  runQuickValidation,

  // Assertions
  assertTimingWithinBudget,
  assertMemoryWithinBudget,

  // Reporting
  generateReport,
} from '../src/scale/stress-test';

import {
  ScaleClass,
  getBudgetForScale,
  SCALE_THRESHOLDS,
  ABSOLUTE_MAX_STATES,
  classifyScale,
} from '../src/scale/budget';

// ============================================================================
// Test Utilities
// ============================================================================

describe('Test Utilities', () => {
  describe('createTestState', () => {
    it('should create state with correct index', () => {
      const state = createTestState<{ index: number }>(42, 100);
      expect(state.index).toBe(42);
    });

    it('should create state with approximate size', () => {
      const state = createTestState<{ data: string }>(0, 1024);
      // Check that data field exists and has substantial length
      expect(typeof state.data).toBe('string');
      expect(state.data.length).toBeGreaterThan(100);
    });

    it('should handle small size requests', () => {
      const state = createTestState<{ index: number }>(0, 10);
      expect(state.index).toBe(0);
    });
  });

  describe('measureTiming', () => {
    it('should measure timing of a function', () => {
      const timing = measureTiming(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
      }, 10);

      expect(timing.totalMs).toBeGreaterThanOrEqual(0);
      expect(timing.averageMs).toBeGreaterThanOrEqual(0);
      expect(timing.minMs).toBeLessThanOrEqual(timing.averageMs);
      expect(timing.maxMs).toBeGreaterThanOrEqual(timing.averageMs);
      expect(timing.p95Ms).toBeLessThanOrEqual(timing.maxMs);
      expect(timing.p99Ms).toBeLessThanOrEqual(timing.maxMs);
    });

    it('should run correct number of iterations', () => {
      let count = 0;
      measureTiming(() => {
        count++;
      }, 50);

      expect(count).toBe(50);
    });
  });

  describe('measureMemory', () => {
    it('should return a number', () => {
      const memory = measureMemory();
      expect(typeof memory).toBe('number');
      expect(memory).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Scale Boundary Tests
// ============================================================================

describe('Scale Boundary Tests', () => {
  describe('testScaleBoundaries', () => {
    it('should test all scale class boundaries', () => {
      const results = testScaleBoundaries();

      // Should have results for each scale class (lower and upper)
      const scaleClasses: ScaleClass[] = ['small', 'medium', 'large', 'extreme'];
      for (const sc of scaleClasses) {
        const scResults = results.filter((r) => r.scaleClass === sc);
        expect(scResults.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should pass all boundary classifications', () => {
      const results = testScaleBoundaries();

      for (const result of results) {
        expect(result.passed).toBe(true);
      }
    });

    it('should verify small scale upper boundary', () => {
      const results = testScaleBoundaries();
      const smallUpper = results.find(
        (r) => r.scaleClass === 'small' && r.boundaryType === 'upper'
      );

      expect(smallUpper).toBeDefined();
      expect(smallUpper?.stateCount).toBe(SCALE_THRESHOLDS.small.max);
      expect(smallUpper?.passed).toBe(true);
    });

    it('should verify extreme scale upper boundary', () => {
      const results = testScaleBoundaries();
      const extremeUpper = results.find(
        (r) => r.scaleClass === 'extreme' && r.boundaryType === 'upper'
      );

      expect(extremeUpper).toBeDefined();
      expect(extremeUpper?.stateCount).toBe(SCALE_THRESHOLDS.extreme.max);
      expect(extremeUpper?.passed).toBe(true);
    });
  });

  describe('testBudgetValidationAtBoundaries', () => {
    it('should accept valid state counts', () => {
      const results = testBudgetValidationAtBoundaries();

      // All scale class boundaries should be accepted
      const scaleClasses: ScaleClass[] = ['small', 'medium', 'large', 'extreme'];
      for (const sc of scaleClasses) {
        const scResult = results.find((r) => r.scaleClass === sc && r.stateCount <= ABSOLUTE_MAX_STATES);
        if (scResult) {
          expect(scResult.passed).toBe(true);
        }
      }
    });

    it('should reject beyond absolute max', () => {
      const results = testBudgetValidationAtBoundaries();

      const beyondMax = results.find((r) => r.stateCount > ABSOLUTE_MAX_STATES);
      expect(beyondMax).toBeDefined();
      expect(beyondMax?.passed).toBe(true); // Correctly rejected
    });
  });
});

// ============================================================================
// Chunked Store Stress Tests
// ============================================================================

describe('Chunked Store Stress Tests', () => {
  it('should pass for small scale', async () => {
    const result = await stressTestChunkedStore({
      stateCount: 100,
      stateSize: 256,
      iterations: 50,
      measureMemory: false,
      timeoutMs: 5000,
    });

    expect(result.testName).toBe('ChunkedStore Stress Test');
    expect(result.scaleClass).toBe('small');
    expect(result.passed).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should return correct state count', async () => {
    const stateCount = 500;
    const result = await stressTestChunkedStore({
      stateCount,
      stateSize: 256,
      iterations: 20,
      measureMemory: false,
      timeoutMs: 5000,
    });

    expect(result.stateCount).toBe(stateCount);
  });

  it('should include timing measurements', async () => {
    const result = await stressTestChunkedStore({
      stateCount: 100,
      stateSize: 256,
      iterations: 20,
      measureMemory: false,
      timeoutMs: 5000,
    });

    expect(result.timing.totalMs).toBeGreaterThanOrEqual(0);
    expect(result.timing.averageMs).toBeGreaterThanOrEqual(0);
    expect(result.timing.minMs).toBeLessThanOrEqual(result.timing.maxMs);
  });

  it('should handle medium scale', async () => {
    const result = await stressTestChunkedStore({
      stateCount: 2000,
      stateSize: 256,
      iterations: 20,
      measureMemory: false,
      timeoutMs: 10000,
    });

    expect(result.scaleClass).toBe('medium');
    expect(result.passed).toBe(true);
  });
});

// ============================================================================
// Progressive Rendering Stress Tests
// ============================================================================

describe('Progressive Rendering Stress Tests', () => {
  it('should pass for small scale', () => {
    const result = stressTestProgressiveRendering({
      stateCount: 100,
      stateSize: 256,
      iterations: 50,
      measureMemory: false,
      timeoutMs: 5000,
    });

    expect(result.testName).toBe('Progressive Rendering Stress Test');
    expect(result.scaleClass).toBe('small');
    expect(result.passed).toBe(true);
  });

  it('should test all subset strategies', () => {
    const result = stressTestProgressiveRendering({
      stateCount: 500,
      stateSize: 256,
      iterations: 10,
      measureMemory: false,
      timeoutMs: 5000,
    });

    // Should have run multiple iterations across strategies
    expect(result.timing.totalMs).toBeGreaterThan(0);
    expect(result.errors.length).toBe(0);
  });

  it('should handle medium scale', () => {
    const result = stressTestProgressiveRendering({
      stateCount: 5000,
      stateSize: 256,
      iterations: 10,
      measureMemory: false,
      timeoutMs: 10000,
    });

    expect(result.scaleClass).toBe('medium');
    expect(result.passed).toBe(true);
  });

  it('should handle large scale', () => {
    const result = stressTestProgressiveRendering({
      stateCount: 50000,
      stateSize: 128,
      iterations: 5,
      measureMemory: false,
      timeoutMs: 30000,
    });

    expect(result.scaleClass).toBe('large');
    expect(result.passed).toBe(true);
  });
});

// ============================================================================
// Interaction Constraints Stress Tests
// ============================================================================

describe('Interaction Constraints Stress Tests', () => {
  it('should pass for small scale', () => {
    const result = stressTestInteractionConstraints({
      stateCount: 100,
      stateSize: 256,
      iterations: 100,
      measureMemory: false,
      timeoutMs: 5000,
    });

    expect(result.testName).toBe('Interaction Constraints Stress Test');
    expect(result.scaleClass).toBe('small');
    expect(result.passed).toBe(true);
  });

  it('should report throttling statistics', () => {
    const result = stressTestInteractionConstraints({
      stateCount: 500,
      stateSize: 256,
      iterations: 100,
      measureMemory: false,
      timeoutMs: 5000,
    });

    // Warnings should include throttling stats
    expect(result.warnings.some((w) => w.includes('Throttled'))).toBe(true);
    expect(result.warnings.some((w) => w.includes('Debounced'))).toBe(true);
  });

  it('should handle medium scale', () => {
    const result = stressTestInteractionConstraints({
      stateCount: 5000,
      stateSize: 256,
      iterations: 50,
      measureMemory: false,
      timeoutMs: 10000,
    });

    expect(result.scaleClass).toBe('medium');
    expect(result.passed).toBe(true);
  });

  it('should handle large scale', () => {
    const result = stressTestInteractionConstraints({
      stateCount: 50000,
      stateSize: 128,
      iterations: 20,
      measureMemory: false,
      timeoutMs: 30000,
    });

    expect(result.scaleClass).toBe('large');
    expect(result.passed).toBe(true);
  });
});

// ============================================================================
// Default Configuration Tests
// ============================================================================

describe('Default Stress Configuration', () => {
  it('should have config for all scale classes', () => {
    const scaleClasses: ScaleClass[] = ['small', 'medium', 'large', 'extreme'];

    for (const sc of scaleClasses) {
      expect(DEFAULT_STRESS_CONFIG[sc]).toBeDefined();
      expect(DEFAULT_STRESS_CONFIG[sc].stateCount).toBeGreaterThan(0);
      expect(DEFAULT_STRESS_CONFIG[sc].iterations).toBeGreaterThan(0);
    }
  });

  it('should have increasing state counts', () => {
    expect(DEFAULT_STRESS_CONFIG.small.stateCount).toBeLessThan(
      DEFAULT_STRESS_CONFIG.medium.stateCount
    );
    expect(DEFAULT_STRESS_CONFIG.medium.stateCount).toBeLessThan(
      DEFAULT_STRESS_CONFIG.large.stateCount
    );
    expect(DEFAULT_STRESS_CONFIG.large.stateCount).toBeLessThan(
      DEFAULT_STRESS_CONFIG.extreme.stateCount
    );
  });

  it('should have decreasing iterations for larger scales', () => {
    expect(DEFAULT_STRESS_CONFIG.small.iterations).toBeGreaterThanOrEqual(
      DEFAULT_STRESS_CONFIG.medium.iterations
    );
    expect(DEFAULT_STRESS_CONFIG.medium.iterations).toBeGreaterThanOrEqual(
      DEFAULT_STRESS_CONFIG.large.iterations
    );
  });
});

// ============================================================================
// Validation Suite Tests
// ============================================================================

describe('Validation Suite', () => {
  describe('runQuickValidation', () => {
    it('should pass for small scale', async () => {
      const result = await runQuickValidation('small');

      expect(result.totalTests).toBeGreaterThan(0);
      expect(result.passedTests).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should include boundary results', async () => {
      const result = await runQuickValidation('small');

      expect(result.boundaryResults.length).toBeGreaterThan(0);
    });

    it('should complete within reasonable time', async () => {
      const result = await runQuickValidation('small');

      // Quick validation should be fast
      expect(result.totalTimeMs).toBeLessThan(30000);
    });
  });

  describe('runValidationSuite', () => {
    it('should accept custom config', async () => {
      const result = await runValidationSuite('small', {
        iterations: 5,
        measureMemory: false,
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].iterations).toBe(5);
    });

    it('should aggregate test results', async () => {
      const result = await runValidationSuite('small', {
        iterations: 5,
        measureMemory: false,
      });

      expect(result.totalTests).toBe(
        result.results.length + result.boundaryResults.length
      );
      expect(result.passedTests + result.failedTests).toBe(result.totalTests);
    });
  });
});

// ============================================================================
// Performance Assertions Tests
// ============================================================================

describe('Performance Assertions', () => {
  describe('assertTimingWithinBudget', () => {
    it('should pass when timing is within budget', () => {
      const budget = getBudgetForScale('small');
      const timing: TimingResult = {
        totalMs: 100,
        averageMs: 10,
        minMs: 5,
        maxMs: 20,
        p95Ms: budget.render.maxFrameMs - 1, // Just under budget
        p99Ms: budget.render.maxFrameMs - 1,
      };

      const result = assertTimingWithinBudget(timing, budget, 'render');

      expect(result.passed).toBe(true);
      expect(result.message).toContain('within budget');
    });

    it('should fail when timing exceeds budget', () => {
      const budget = getBudgetForScale('small');
      const timing: TimingResult = {
        totalMs: 1000,
        averageMs: 100,
        minMs: 50,
        maxMs: 200,
        p95Ms: budget.render.maxFrameMs + 100, // Over budget
        p99Ms: budget.render.maxFrameMs + 100,
      };

      const result = assertTimingWithinBudget(timing, budget, 'render');

      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceeds budget');
    });
  });

  describe('assertMemoryWithinBudget', () => {
    it('should pass when memory is within budget', () => {
      const budget = getBudgetForScale('small');
      const memory: MemoryResult = {
        peakBytes: 1024 * 1024, // 1MB
        averageBytes: 1024 * 1024,
        finalBytes: 1024 * 1024,
        budgetBytes: budget.memory.maxTotalMemory,
        withinBudget: true,
      };

      const result = assertMemoryWithinBudget(memory, budget);

      expect(result.passed).toBe(true);
      expect(result.message).toContain('within budget');
    });

    it('should fail when memory exceeds budget', () => {
      const budget = getBudgetForScale('small');
      const memory: MemoryResult = {
        peakBytes: budget.memory.maxTotalMemory + 1024 * 1024,
        averageBytes: budget.memory.maxTotalMemory,
        finalBytes: budget.memory.maxTotalMemory,
        budgetBytes: budget.memory.maxTotalMemory,
        withinBudget: false,
      };

      const result = assertMemoryWithinBudget(memory, budget);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceeds budget');
    });
  });
});

// ============================================================================
// Report Generation Tests
// ============================================================================

describe('Report Generation', () => {
  it('should generate report for passed suite', async () => {
    const result = await runQuickValidation('small');
    const report = generateReport(result);

    expect(report).toContain('VectorCaliper Scale Validation Report');
    expect(report).toContain('Status:');
    expect(report).toContain('Tests:');
    expect(report).toContain('Duration:');
  });

  it('should include timing information', async () => {
    const result = await runQuickValidation('small');
    const report = generateReport(result);

    expect(report).toContain('Timing:');
    expect(report).toContain('Average:');
    expect(report).toContain('P95:');
    expect(report).toContain('P99:');
  });

  it('should include boundary test results', async () => {
    const result = await runQuickValidation('small');
    const report = generateReport(result);

    expect(report).toContain('Scale Boundary Tests');
  });

  it('should include stress test results', async () => {
    const result = await runQuickValidation('small');
    const report = generateReport(result);

    expect(report).toContain('ChunkedStore Stress Test');
    expect(report).toContain('Progressive Rendering Stress Test');
    expect(report).toContain('Interaction Constraints Stress Test');
  });
});

// ============================================================================
// Scale Classification Verification
// ============================================================================

describe('Scale Classification Verification', () => {
  it('should classify zero as small', () => {
    expect(classifyScale(0)).toBe('small');
  });

  it('should classify 1000 as small', () => {
    expect(classifyScale(1000)).toBe('small');
  });

  it('should classify 1001 as medium', () => {
    expect(classifyScale(1001)).toBe('medium');
  });

  it('should classify 10000 as medium', () => {
    expect(classifyScale(10000)).toBe('medium');
  });

  it('should classify 10001 as large', () => {
    expect(classifyScale(10001)).toBe('large');
  });

  it('should classify 100000 as large', () => {
    expect(classifyScale(100000)).toBe('large');
  });

  it('should classify 100001 as extreme', () => {
    expect(classifyScale(100001)).toBe('extreme');
  });

  it('should classify 1000000 as extreme', () => {
    expect(classifyScale(1000000)).toBe('extreme');
  });

  it('should classify beyond 1M as extreme', () => {
    expect(classifyScale(2000000)).toBe('extreme');
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration Tests', () => {
  it('should run complete small scale validation', async () => {
    const result = await runValidationSuite('small', {
      stateCount: 500,
      stateSize: 256,
      iterations: 10,
      measureMemory: false,
      timeoutMs: 10000,
    });

    expect(result.passed).toBe(true);
    expect(result.results.every((r) => r.passed)).toBe(true);
    expect(result.boundaryResults.every((r) => r.passed)).toBe(true);
  });

  it('should run complete medium scale validation', async () => {
    const result = await runValidationSuite('medium', {
      stateCount: 2000,
      stateSize: 256,
      iterations: 10,
      measureMemory: false,
      timeoutMs: 20000,
    });

    expect(result.results.every((r) => r.scaleClass === 'medium')).toBe(true);
    expect(result.passed).toBe(true);
  });

  it('should validate across all stress test types', async () => {
    const result = await runQuickValidation('small');

    const testNames = result.results.map((r) => r.testName);

    expect(testNames).toContain('ChunkedStore Stress Test');
    expect(testNames).toContain('Progressive Rendering Stress Test');
    expect(testNames).toContain('Interaction Constraints Stress Test');
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  it('should handle errors gracefully in validation suite', async () => {
    // This should not throw even with edge case inputs
    const result = await runValidationSuite('small', {
      stateCount: 1,
      stateSize: 1,
      iterations: 1,
      measureMemory: false,
      timeoutMs: 1000,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
  });

  it('should report errors in test results', async () => {
    // Run with minimal config
    const result = await runValidationSuite('small', {
      stateCount: 10,
      iterations: 2,
      stateSize: 10,
      measureMemory: false,
      timeoutMs: 5000,
    });

    // Each result should have an errors array
    for (const r of result.results) {
      expect(Array.isArray(r.errors)).toBe(true);
    }
  });
});
