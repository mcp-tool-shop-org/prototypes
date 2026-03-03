/**
 * Scale Validation & Stress Tests
 *
 * Core principles:
 * - Performance claims are test-backed
 * - Stress tests verify behavior at scale boundaries
 * - Memory usage is measured and bounded
 * - Timing assertions validate budget compliance
 */

import {
  ScaleClass,
  PerformanceBudget,
  classifyScale,
  getBudgetForScale,
  SCALE_THRESHOLDS,
  ABSOLUTE_MAX_STATES,
  ABSOLUTE_MAX_MEMORY,
  validateBudget,
  estimateStateMemory,
} from './budget';

import { ChunkedStateStore } from './chunked-store';
import {
  selectSubset,
  SamplingStrategy,
  createProgressiveRenderer,
} from './progressive-render';
import { InteractionManager, createInteractionManager } from './interaction-constraints';

// ============================================================================
// Types
// ============================================================================

/**
 * Stress test configuration
 */
export interface StressTestConfig {
  /** Target state count */
  readonly stateCount: number;
  /** State size in bytes */
  readonly stateSize: number;
  /** Number of iterations */
  readonly iterations: number;
  /** Whether to measure memory */
  readonly measureMemory: boolean;
  /** Timeout in milliseconds */
  readonly timeoutMs: number;
}

/**
 * Stress test result
 */
export interface StressTestResult {
  readonly passed: boolean;
  readonly testName: string;
  readonly scaleClass: ScaleClass;
  readonly stateCount: number;
  readonly iterations: number;
  readonly timing: TimingResult;
  readonly memory?: MemoryResult;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * Timing measurements
 */
export interface TimingResult {
  readonly totalMs: number;
  readonly averageMs: number;
  readonly minMs: number;
  readonly maxMs: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
}

/**
 * Memory measurements
 */
export interface MemoryResult {
  readonly peakBytes: number;
  readonly averageBytes: number;
  readonly finalBytes: number;
  readonly budgetBytes: number;
  readonly withinBudget: boolean;
}

/**
 * Scale boundary test result
 */
export interface BoundaryTestResult {
  readonly scaleClass: ScaleClass;
  readonly boundaryType: 'lower' | 'upper';
  readonly stateCount: number;
  readonly passed: boolean;
  readonly message: string;
}

/**
 * Validation suite result
 */
export interface ValidationSuiteResult {
  readonly passed: boolean;
  readonly totalTests: number;
  readonly passedTests: number;
  readonly failedTests: number;
  readonly results: StressTestResult[];
  readonly boundaryResults: BoundaryTestResult[];
  readonly totalTimeMs: number;
}

// ============================================================================
// Stress Test Utilities
// ============================================================================

/**
 * Create a test state of specified size
 */
export function createTestState<T extends object>(
  index: number,
  sizeBytes: number
): T {
  // Create an object that approximates the target size
  // Each character in a string is ~2 bytes in JS
  const paddingLength = Math.max(0, Math.floor(sizeBytes / 2) - 100);
  return {
    index,
    timestamp: Date.now(),
    data: 'x'.repeat(paddingLength),
  } as T;
}

/**
 * Measure timing of a function
 */
export function measureTiming(fn: () => void, iterations: number): TimingResult {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  const total = times.reduce((sum, t) => sum + t, 0);
  const p95Index = Math.floor(times.length * 0.95);
  const p99Index = Math.floor(times.length * 0.99);

  return {
    totalMs: total,
    averageMs: total / iterations,
    minMs: times[0],
    maxMs: times[times.length - 1],
    p95Ms: times[p95Index] ?? times[times.length - 1],
    p99Ms: times[p99Index] ?? times[times.length - 1],
  };
}

/**
 * Measure memory usage (if available)
 */
export function measureMemory(): number {
  // Node.js
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }

  // Browser (non-standard)
  if (
    typeof performance !== 'undefined' &&
    // @ts-ignore
    performance.memory
  ) {
    // @ts-ignore
    return performance.memory.usedJSHeapSize;
  }

  return 0;
}

/**
 * Force garbage collection if available
 */
export function forceGC(): void {
  // Node.js with --expose-gc flag
  if (typeof global !== 'undefined' && typeof (global as any).gc === 'function') {
    (global as any).gc();
  }
}

// ============================================================================
// Scale Boundary Tests
// ============================================================================

/**
 * Test scale classification at boundaries
 */
export function testScaleBoundaries(): BoundaryTestResult[] {
  const results: BoundaryTestResult[] = [];

  // Test each scale class boundary
  const scaleClasses: ScaleClass[] = ['small', 'medium', 'large', 'extreme'];

  for (const scaleClass of scaleClasses) {
    const thresholds = SCALE_THRESHOLDS[scaleClass];

    // Test lower boundary
    const lowerCount = thresholds.min;
    const classifiedLower = classifyScale(lowerCount);

    // For 'small', min is 0, but classifyScale(0) = 'small'
    // For others, min is one above previous max
    if (scaleClass === 'small') {
      results.push({
        scaleClass,
        boundaryType: 'lower',
        stateCount: lowerCount,
        passed: classifiedLower === scaleClass,
        message: classifiedLower === scaleClass
          ? `Lower boundary ${lowerCount} correctly classified as ${scaleClass}`
          : `Lower boundary ${lowerCount} incorrectly classified as ${classifiedLower}`,
      });
    } else {
      // For non-small, test at exactly the boundary
      results.push({
        scaleClass,
        boundaryType: 'lower',
        stateCount: lowerCount,
        passed: classifiedLower === scaleClass,
        message: classifiedLower === scaleClass
          ? `Lower boundary ${lowerCount} correctly classified as ${scaleClass}`
          : `Lower boundary ${lowerCount} incorrectly classified as ${classifiedLower}`,
      });
    }

    // Test upper boundary
    const upperCount = thresholds.max;
    const classifiedUpper = classifyScale(upperCount);
    results.push({
      scaleClass,
      boundaryType: 'upper',
      stateCount: upperCount,
      passed: classifiedUpper === scaleClass,
      message: classifiedUpper === scaleClass
        ? `Upper boundary ${upperCount} correctly classified as ${scaleClass}`
        : `Upper boundary ${upperCount} incorrectly classified as ${classifiedUpper}`,
    });
  }

  return results;
}

/**
 * Test budget validation at scale boundaries
 */
export function testBudgetValidationAtBoundaries(): BoundaryTestResult[] {
  const results: BoundaryTestResult[] = [];

  const scaleClasses: ScaleClass[] = ['small', 'medium', 'large', 'extreme'];

  for (const scaleClass of scaleClasses) {
    const thresholds = SCALE_THRESHOLDS[scaleClass];

    // Test that upper boundary is accepted
    const upperCount = thresholds.max;
    const upperValidation = validateBudget(upperCount);

    results.push({
      scaleClass,
      boundaryType: 'upper',
      stateCount: upperCount,
      passed: upperValidation.rejected === false,
      message: upperValidation.rejected === false
        ? `Upper boundary ${upperCount} accepted by budget validation`
        : `Upper boundary ${upperCount} rejected: ${(upperValidation as any).message}`,
    });
  }

  // Test beyond absolute max
  const beyondMax = ABSOLUTE_MAX_STATES + 1;
  const beyondValidation = validateBudget(beyondMax);

  results.push({
    scaleClass: 'extreme',
    boundaryType: 'upper',
    stateCount: beyondMax,
    passed: beyondValidation.rejected === true,
    message: beyondValidation.rejected === true
      ? `Beyond max ${beyondMax} correctly rejected`
      : `Beyond max ${beyondMax} should have been rejected`,
  });

  return results;
}

// ============================================================================
// Chunked Store Stress Tests
// ============================================================================

/**
 * Stress test chunked store access patterns
 */
export async function stressTestChunkedStore(
  config: StressTestConfig
): Promise<StressTestResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scaleClass = classifyScale(config.stateCount);
  const budget = getBudgetForScale(scaleClass);

  // Create test data
  interface TestState {
    index: number;
    value: number;
    padding: string;
  }

  const allStates: TestState[] = [];
  for (let i = 0; i < config.stateCount; i++) {
    allStates.push({
      index: i,
      value: i * 2,
      padding: 'x'.repeat(Math.max(0, config.stateSize - 50)),
    });
  }

  // Create store
  const store = new ChunkedStateStore<TestState>(budget, {
    chunkSize: budget.memory.chunkSize,
  });

  // Load initial states
  const loadStart = performance.now();
  store.loadAll(allStates);
  const loadTime = performance.now() - loadStart;

  if (loadTime > config.timeoutMs) {
    errors.push(`Initial load took ${loadTime.toFixed(2)}ms, exceeding timeout of ${config.timeoutMs}ms`);
  }

  // Stress test: random access pattern (async)
  const accessTimes: number[] = [];
  for (let i = 0; i < config.iterations; i++) {
    const randomIndex = Math.floor(Math.random() * config.stateCount);
    const start = performance.now();
    const result = await store.getState(randomIndex);
    accessTimes.push(performance.now() - start);

    // ChunkedState has { index, data, sizeBytes }
    if (result && result.index !== randomIndex) {
      errors.push(`State ${randomIndex} returned incorrect index: ${result.index}`);
    }
  }

  // Stress test: sequential scan (async)
  const scanTimes: number[] = [];
  for (let iter = 0; iter < Math.min(config.iterations, 5); iter++) {
    const start = performance.now();
    for (let i = 0; i < Math.min(config.stateCount, 100); i++) {
      await store.getState(i);
    }
    scanTimes.push(performance.now() - start);
  }

  // Stress test: range access (async)
  const rangeTimes: number[] = [];
  const rangeSize = Math.min(100, config.stateCount);
  for (let i = 0; i < Math.min(config.iterations, 20); i++) {
    const startIdx = Math.floor(Math.random() * Math.max(1, config.stateCount - rangeSize));
    const start = performance.now();
    await store.requestRange(startIdx, startIdx + rangeSize);
    rangeTimes.push(performance.now() - start);
  }

  // Calculate timing stats
  const allTimes = [...accessTimes, ...scanTimes, ...rangeTimes];
  if (allTimes.length === 0) {
    allTimes.push(0);
  }
  allTimes.sort((a, b) => a - b);

  const timing: TimingResult = {
    totalMs: allTimes.reduce((sum, t) => sum + t, 0),
    averageMs: allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length,
    minMs: allTimes[0],
    maxMs: allTimes[allTimes.length - 1],
    p95Ms: allTimes[Math.floor(allTimes.length * 0.95)] ?? allTimes[allTimes.length - 1],
    p99Ms: allTimes[Math.floor(allTimes.length * 0.99)] ?? allTimes[allTimes.length - 1],
  };

  // Memory measurement
  let memory: MemoryResult | undefined;
  if (config.measureMemory) {
    forceGC();
    const peakBytes = measureMemory();
    memory = {
      peakBytes,
      averageBytes: peakBytes,
      finalBytes: measureMemory(),
      budgetBytes: budget.memory.maxTotalMemory,
      withinBudget: peakBytes <= budget.memory.maxTotalMemory,
    };

    if (!memory.withinBudget) {
      warnings.push(
        `Memory usage ${(peakBytes / 1024 / 1024).toFixed(2)}MB exceeds budget of ${(budget.memory.maxTotalMemory / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }

  return {
    passed: errors.length === 0,
    testName: 'ChunkedStore Stress Test',
    scaleClass,
    stateCount: config.stateCount,
    iterations: config.iterations,
    timing,
    memory,
    errors,
    warnings,
  };
}

// ============================================================================
// Progressive Rendering Stress Tests
// ============================================================================

/**
 * Stress test progressive rendering
 */
export function stressTestProgressiveRendering(
  config: StressTestConfig
): StressTestResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scaleClass = classifyScale(config.stateCount);
  const budget = getBudgetForScale(scaleClass);

  // Test subset selection strategies
  const strategies: SamplingStrategy[] = ['uniform', 'endpoints', 'keyframes'];
  const subsetTimes: number[] = [];

  for (const strategy of strategies) {
    for (let iter = 0; iter < config.iterations; iter++) {
      const targetCount = Math.min(1000, config.stateCount);
      const start = performance.now();
      const subset = selectSubset(config.stateCount, targetCount, strategy);
      subsetTimes.push(performance.now() - start);

      // Verify subset properties
      if (subset.length !== targetCount && config.stateCount >= targetCount) {
        errors.push(`Subset size ${subset.length} doesn't match target ${targetCount}`);
      }

      // Verify all subset indices are valid
      for (const idx of subset) {
        if (idx < 0 || idx >= config.stateCount) {
          errors.push(`Subset contains invalid index ${idx} (stateCount=${config.stateCount})`);
          break;
        }
      }
    }
  }

  // Test progressive renderer
  const renderTimes: number[] = [];
  for (let iter = 0; iter < Math.min(config.iterations, 10); iter++) {
    const start = performance.now();

    // Create render plan using default pass configs
    const renderer = createProgressiveRenderer(config.stateCount, budget);

    // Execute passes
    while (!renderer.isComplete()) {
      const pass = renderer.getNextPass();
      if (!pass) break;
      // Simulate render work on pass indices
      let sum = 0;
      for (const idx of pass.indices) {
        sum += idx;
      }
      renderer.completePass();
    }

    renderTimes.push(performance.now() - start);
  }

  // Calculate timing
  const allTimes = [...subsetTimes, ...renderTimes];
  allTimes.sort((a, b) => a - b);

  const timing: TimingResult = {
    totalMs: allTimes.reduce((sum, t) => sum + t, 0),
    averageMs: allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length,
    minMs: allTimes[0] ?? 0,
    maxMs: allTimes[allTimes.length - 1] ?? 0,
    p95Ms: allTimes[Math.floor(allTimes.length * 0.95)] ?? 0,
    p99Ms: allTimes[Math.floor(allTimes.length * 0.99)] ?? 0,
  };

  return {
    passed: errors.length === 0,
    testName: 'Progressive Rendering Stress Test',
    scaleClass,
    stateCount: config.stateCount,
    iterations: config.iterations,
    timing,
    errors,
    warnings,
  };
}

// ============================================================================
// Interaction Constraints Stress Tests
// ============================================================================

/**
 * Stress test interaction constraints
 */
export function stressTestInteractionConstraints(
  config: StressTestConfig
): StressTestResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scaleClass = classifyScale(config.stateCount);

  const manager = createInteractionManager(config.stateCount);

  // Stress test: rapid scrubbing
  const scrubTimes: number[] = [];
  let throttledCount = 0;

  for (let i = 0; i < config.iterations; i++) {
    const fromIdx = Math.floor(Math.random() * config.stateCount);
    const toIdx = Math.floor(Math.random() * config.stateCount);

    const start = performance.now();
    const result = manager.scrub(fromIdx, toIdx);
    scrubTimes.push(performance.now() - start);

    if (result.throttled) {
      throttledCount++;
    }
  }

  // Verify throttling is happening for rapid scrubs
  if (throttledCount === 0 && config.iterations > 100) {
    warnings.push('No scrubs were throttled despite rapid iteration');
  }

  // Stress test: rapid hover
  const hoverTimes: number[] = [];
  let debouncedCount = 0;

  for (let i = 0; i < config.iterations; i++) {
    const x = Math.random() * 1000;
    const y = Math.random() * 1000;

    const start = performance.now();
    const result = manager.hover(x, y);
    hoverTimes.push(performance.now() - start);

    if (result.debounced) {
      debouncedCount++;
    }
  }

  // Verify debouncing is happening
  if (debouncedCount === 0 && config.iterations > 100) {
    warnings.push('No hovers were debounced despite rapid iteration');
  }

  // Stress test: selection
  const selectionTimes: number[] = [];
  const summary = manager.getConstraintSummary();

  if (summary.selectionAllowed) {
    for (let i = 0; i < Math.min(config.iterations, 100); i++) {
      const count = Math.floor(Math.random() * summary.maxSelectionSize) + 1;
      const indices = Array.from({ length: count }, (_, j) =>
        Math.floor(Math.random() * config.stateCount)
      );

      const start = performance.now();
      manager.select(indices, 'multi');
      selectionTimes.push(performance.now() - start);
    }
  }

  // Calculate timing
  const allTimes = [...scrubTimes, ...hoverTimes, ...selectionTimes];
  allTimes.sort((a, b) => a - b);

  const timing: TimingResult = {
    totalMs: allTimes.reduce((sum, t) => sum + t, 0),
    averageMs: allTimes.reduce((sum, t) => sum + t, 0) / allTimes.length,
    minMs: allTimes[0] ?? 0,
    maxMs: allTimes[allTimes.length - 1] ?? 0,
    p95Ms: allTimes[Math.floor(allTimes.length * 0.95)] ?? 0,
    p99Ms: allTimes[Math.floor(allTimes.length * 0.99)] ?? 0,
  };

  // Get stats
  const stats = manager.getStats();

  return {
    passed: errors.length === 0,
    testName: 'Interaction Constraints Stress Test',
    scaleClass,
    stateCount: config.stateCount,
    iterations: config.iterations,
    timing,
    errors,
    warnings: [
      ...warnings,
      `Throttled scrubs: ${stats.throttledScrubRequests}/${stats.totalScrubRequests}`,
      `Debounced hovers: ${stats.debouncedHoverRequests}/${stats.totalHoverRequests}`,
    ],
  };
}

// ============================================================================
// Full Validation Suite
// ============================================================================

/**
 * Default stress test configuration by scale
 */
export const DEFAULT_STRESS_CONFIG: Record<ScaleClass, StressTestConfig> = {
  small: {
    stateCount: 1000,
    stateSize: 1024,
    iterations: 1000,
    measureMemory: true,
    timeoutMs: 5000,
  },
  medium: {
    stateCount: 10000,
    stateSize: 1024,
    iterations: 500,
    measureMemory: true,
    timeoutMs: 10000,
  },
  large: {
    stateCount: 100000,
    stateSize: 512,
    iterations: 100,
    measureMemory: true,
    timeoutMs: 30000,
  },
  extreme: {
    stateCount: 500000,
    stateSize: 256,
    iterations: 50,
    measureMemory: true,
    timeoutMs: 60000,
  },
};

/**
 * Run full validation suite for a scale class
 */
export async function runValidationSuite(
  scaleClass: ScaleClass,
  config?: Partial<StressTestConfig>
): Promise<ValidationSuiteResult> {
  const startTime = performance.now();

  const fullConfig: StressTestConfig = {
    ...DEFAULT_STRESS_CONFIG[scaleClass],
    ...config,
  };

  const results: StressTestResult[] = [];

  // Run boundary tests
  const boundaryResults = [
    ...testScaleBoundaries(),
    ...testBudgetValidationAtBoundaries(),
  ];

  // Run stress tests
  try {
    results.push(await stressTestChunkedStore(fullConfig));
  } catch (err) {
    results.push({
      passed: false,
      testName: 'ChunkedStore Stress Test',
      scaleClass,
      stateCount: fullConfig.stateCount,
      iterations: fullConfig.iterations,
      timing: { totalMs: 0, averageMs: 0, minMs: 0, maxMs: 0, p95Ms: 0, p99Ms: 0 },
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    });
  }

  try {
    results.push(stressTestProgressiveRendering(fullConfig));
  } catch (err) {
    results.push({
      passed: false,
      testName: 'Progressive Rendering Stress Test',
      scaleClass,
      stateCount: fullConfig.stateCount,
      iterations: fullConfig.iterations,
      timing: { totalMs: 0, averageMs: 0, minMs: 0, maxMs: 0, p95Ms: 0, p99Ms: 0 },
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    });
  }

  try {
    results.push(stressTestInteractionConstraints(fullConfig));
  } catch (err) {
    results.push({
      passed: false,
      testName: 'Interaction Constraints Stress Test',
      scaleClass,
      stateCount: fullConfig.stateCount,
      iterations: fullConfig.iterations,
      timing: { totalMs: 0, averageMs: 0, minMs: 0, maxMs: 0, p95Ms: 0, p99Ms: 0 },
      errors: [err instanceof Error ? err.message : String(err)],
      warnings: [],
    });
  }

  const totalTimeMs = performance.now() - startTime;

  const passedStressTests = results.filter((r) => r.passed).length;
  const passedBoundaryTests = boundaryResults.filter((r) => r.passed).length;

  return {
    passed:
      passedStressTests === results.length &&
      passedBoundaryTests === boundaryResults.length,
    totalTests: results.length + boundaryResults.length,
    passedTests: passedStressTests + passedBoundaryTests,
    failedTests:
      results.length -
      passedStressTests +
      boundaryResults.length -
      passedBoundaryTests,
    results,
    boundaryResults,
    totalTimeMs,
  };
}

/**
 * Run quick validation (fewer iterations, smaller data)
 */
export async function runQuickValidation(
  scaleClass: ScaleClass
): Promise<ValidationSuiteResult> {
  return runValidationSuite(scaleClass, {
    iterations: 10,
    measureMemory: false,
  });
}

// ============================================================================
// Performance Assertions
// ============================================================================

/**
 * Assert timing is within budget
 */
export function assertTimingWithinBudget(
  timing: TimingResult,
  budget: PerformanceBudget,
  operationType: 'render' | 'interaction'
): { passed: boolean; message: string } {
  const maxMs =
    operationType === 'render'
      ? budget.render.maxFrameMs
      : 1000 / budget.interaction.maxScrubRate;

  if (timing.p95Ms > maxMs) {
    return {
      passed: false,
      message: `P95 timing ${timing.p95Ms.toFixed(2)}ms exceeds budget of ${maxMs}ms`,
    };
  }

  return {
    passed: true,
    message: `P95 timing ${timing.p95Ms.toFixed(2)}ms within budget of ${maxMs}ms`,
  };
}

/**
 * Assert memory is within budget
 */
export function assertMemoryWithinBudget(
  memory: MemoryResult,
  budget: PerformanceBudget
): { passed: boolean; message: string } {
  if (!memory.withinBudget) {
    return {
      passed: false,
      message: `Peak memory ${(memory.peakBytes / 1024 / 1024).toFixed(2)}MB exceeds budget of ${(budget.memory.maxTotalMemory / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return {
    passed: true,
    message: `Memory ${(memory.peakBytes / 1024 / 1024).toFixed(2)}MB within budget of ${(budget.memory.maxTotalMemory / 1024 / 1024).toFixed(2)}MB`,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate human-readable report
 */
export function generateReport(result: ValidationSuiteResult): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('VectorCaliper Scale Validation Report');
  lines.push('='.repeat(60));
  lines.push('');

  // Summary
  lines.push(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`);
  lines.push(`Tests: ${result.passedTests}/${result.totalTests} passed`);
  lines.push(`Duration: ${result.totalTimeMs.toFixed(2)}ms`);
  lines.push('');

  // Boundary tests
  lines.push('-'.repeat(40));
  lines.push('Scale Boundary Tests');
  lines.push('-'.repeat(40));
  for (const bt of result.boundaryResults) {
    const status = bt.passed ? '✓' : '✗';
    lines.push(`${status} ${bt.message}`);
  }
  lines.push('');

  // Stress tests
  for (const sr of result.results) {
    lines.push('-'.repeat(40));
    lines.push(`${sr.testName}`);
    lines.push('-'.repeat(40));
    lines.push(`Scale: ${sr.scaleClass}`);
    lines.push(`States: ${sr.stateCount.toLocaleString()}`);
    lines.push(`Iterations: ${sr.iterations}`);
    lines.push(`Status: ${sr.passed ? 'PASSED' : 'FAILED'}`);
    lines.push('');

    lines.push('Timing:');
    lines.push(`  Average: ${sr.timing.averageMs.toFixed(2)}ms`);
    lines.push(`  Min: ${sr.timing.minMs.toFixed(2)}ms`);
    lines.push(`  Max: ${sr.timing.maxMs.toFixed(2)}ms`);
    lines.push(`  P95: ${sr.timing.p95Ms.toFixed(2)}ms`);
    lines.push(`  P99: ${sr.timing.p99Ms.toFixed(2)}ms`);

    if (sr.memory) {
      lines.push('');
      lines.push('Memory:');
      lines.push(`  Peak: ${(sr.memory.peakBytes / 1024 / 1024).toFixed(2)}MB`);
      lines.push(`  Budget: ${(sr.memory.budgetBytes / 1024 / 1024).toFixed(2)}MB`);
      lines.push(`  Within Budget: ${sr.memory.withinBudget ? 'Yes' : 'No'}`);
    }

    if (sr.errors.length > 0) {
      lines.push('');
      lines.push('Errors:');
      for (const err of sr.errors) {
        lines.push(`  - ${err}`);
      }
    }

    if (sr.warnings.length > 0) {
      lines.push('');
      lines.push('Warnings:');
      for (const warn of sr.warnings) {
        lines.push(`  - ${warn}`);
      }
    }

    lines.push('');
  }

  lines.push('='.repeat(60));
  return lines.join('\n');
}
