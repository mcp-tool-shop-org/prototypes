/**
 * VectorCaliper - Visual Assertions
 *
 * Test utilities for verifying visual invariants.
 * These are semantic tests, not pixel-perfect comparisons.
 *
 * RULE: Changes that alter meaning are caught.
 * RULE: Aesthetic-only changes pass.
 */

import type { GoldenState } from './golden-states';
import type { PointNode } from '../scene/node';
import type { VisualChannel } from '../mapping/channels';
import type { SemanticMapper } from '../mapping/semantic-map';
import type { ProjectionEngine } from '../projection/engine';
import { validator } from '../validation/validator';
import { SceneBuilder } from '../scene/graph';

// =============================================================================
// Assertion Results
// =============================================================================

export interface AssertionResult {
  readonly passed: boolean;
  readonly name: string;
  readonly message: string;
  readonly expected?: unknown;
  readonly actual?: unknown;
}

export interface VisualTestResult {
  readonly goldenStateId: string;
  readonly passed: boolean;
  readonly assertions: readonly AssertionResult[];
  readonly warnings: readonly string[];
}

// =============================================================================
// Visual Property Extractors
// =============================================================================

/**
 * Extract visual properties from a point node.
 */
export interface ExtractedVisuals {
  readonly hue: number;
  readonly saturation: number;
  readonly lightness: number;
  readonly opacity: number;
  readonly radius: number;
  readonly hasJitter: boolean;
  readonly jitterAmplitude: number;
}

export function extractVisuals(node: PointNode): ExtractedVisuals {
  return {
    hue: node.fill.h,
    saturation: node.fill.s,
    lightness: node.fill.l,
    opacity: node.fill.a,
    radius: node.radius,
    hasJitter: node.jitter !== undefined && node.jitter.amplitude > 1.0,
    jitterAmplitude: node.jitter?.amplitude ?? 0,
  };
}

// =============================================================================
// Assertion Functions
// =============================================================================

function assertInRange(
  name: string,
  value: number,
  min: number,
  max: number
): AssertionResult {
  const passed = value >= min && value <= max;
  return {
    passed,
    name,
    message: passed
      ? `${name}: ${value.toFixed(2)} is in range [${min}, ${max}]`
      : `${name}: ${value.toFixed(2)} is NOT in range [${min}, ${max}]`,
    expected: `[${min}, ${max}]`,
    actual: value,
  };
}

function assertBoolean(
  name: string,
  actual: boolean,
  expected: boolean
): AssertionResult {
  const passed = actual === expected;
  return {
    passed,
    name,
    message: passed
      ? `${name}: ${actual} matches expected`
      : `${name}: expected ${expected}, got ${actual}`,
    expected,
    actual,
  };
}

function assertRadiusLevel(
  actual: number,
  expected: 'high' | 'medium' | 'low',
  config: { min: number; max: number }
): AssertionResult {
  const range = config.max - config.min;
  const normalized = (actual - config.min) / range;

  let actualLevel: 'high' | 'medium' | 'low';
  if (normalized < 0.33) actualLevel = 'low';
  else if (normalized < 0.67) actualLevel = 'medium';
  else actualLevel = 'high';

  const passed = actualLevel === expected;

  return {
    passed,
    name: 'Radius Level',
    message: passed
      ? `Radius level: ${actualLevel} matches expected`
      : `Radius level: expected ${expected}, got ${actualLevel} (normalized: ${normalized.toFixed(2)})`,
    expected,
    actual: actualLevel,
  };
}

// =============================================================================
// Visual Test Runner
// =============================================================================

/**
 * Configuration for visual testing.
 */
export interface VisualTestConfig {
  readonly radiusRange: { min: number; max: number };
}

const DEFAULT_TEST_CONFIG: VisualTestConfig = {
  radiusRange: { min: 5, max: 50 },
};

/**
 * Run visual assertions against a golden state.
 */
export function runVisualTest(
  golden: GoldenState,
  mapper: SemanticMapper,
  projector: ProjectionEngine,
  config: VisualTestConfig = DEFAULT_TEST_CONFIG
): VisualTestResult {
  const assertions: AssertionResult[] = [];
  const warnings: string[] = [];

  // Validate the state first
  const validationResult = validator.validate(golden.state);
  if (!validationResult.valid) {
    return {
      goldenStateId: golden.id,
      passed: false,
      assertions: [
        {
          passed: false,
          name: 'State Validation',
          message: 'State failed validation',
        },
      ],
      warnings: [],
    };
  }

  // Collect validation warnings
  for (const warning of validationResult.warnings) {
    warnings.push(`${warning.path}: ${warning.message}`);
  }

  // Project the state
  projector.fit([golden.state]);
  const projected = projector.project(golden.state);

  // Build scene node
  const builder = new SceneBuilder(mapper);
  const node = builder.addState(golden.state, projected);

  // Extract visuals
  const visuals = extractVisuals(node);

  // Run assertions
  assertions.push(
    assertInRange(
      'Hue',
      visuals.hue,
      golden.expected.hueRange[0],
      golden.expected.hueRange[1]
    )
  );

  assertions.push(
    assertInRange(
      'Saturation',
      visuals.saturation,
      golden.expected.saturationRange[0],
      golden.expected.saturationRange[1]
    )
  );

  assertions.push(
    assertInRange(
      'Lightness',
      visuals.lightness,
      golden.expected.lightnessRange[0],
      golden.expected.lightnessRange[1]
    )
  );

  assertions.push(
    assertInRange(
      'Opacity',
      visuals.opacity,
      golden.expected.opacityRange[0],
      golden.expected.opacityRange[1]
    )
  );

  assertions.push(
    assertRadiusLevel(visuals.radius, golden.expected.radiusLevel, config.radiusRange)
  );

  assertions.push(
    assertBoolean('Has Jitter', visuals.hasJitter, golden.expected.hasJitter)
  );

  // Overall pass/fail
  const passed = assertions.every((a) => a.passed);

  return {
    goldenStateId: golden.id,
    passed,
    assertions,
    warnings,
  };
}

/**
 * Run visual tests against all golden states.
 */
export function runAllVisualTests(
  goldenStates: readonly GoldenState[],
  mapper: SemanticMapper,
  projector: ProjectionEngine,
  config?: VisualTestConfig
): readonly VisualTestResult[] {
  return goldenStates.map((golden) =>
    runVisualTest(golden, mapper, projector, config)
  );
}

// =============================================================================
// Comparative Assertions
// =============================================================================

/**
 * Assert that one state has higher X than another.
 */
export function assertHigherThan(
  name: string,
  state1Visuals: ExtractedVisuals,
  state2Visuals: ExtractedVisuals,
  property: keyof ExtractedVisuals
): AssertionResult {
  const val1 = state1Visuals[property];
  const val2 = state2Visuals[property];

  if (typeof val1 !== 'number' || typeof val2 !== 'number') {
    return {
      passed: false,
      name,
      message: `Cannot compare non-numeric property: ${property}`,
    };
  }

  const passed = val1 > val2;

  return {
    passed,
    name,
    message: passed
      ? `${name}: ${val1.toFixed(2)} > ${val2.toFixed(2)}`
      : `${name}: expected ${val1.toFixed(2)} > ${val2.toFixed(2)}`,
    expected: `> ${val2}`,
    actual: val1,
  };
}

/**
 * Run comparative tests between golden states.
 */
export function runComparativeTests(
  goldenStates: readonly GoldenState[],
  mapper: SemanticMapper,
  projector: ProjectionEngine
): readonly AssertionResult[] {
  const assertions: AssertionResult[] = [];

  // Build visuals for all states
  const visualsMap = new Map<string, ExtractedVisuals>();

  for (const golden of goldenStates) {
    projector.reset();
    projector.fit([golden.state]);
    const projected = projector.project(golden.state);

    const builder = new SceneBuilder(mapper);
    const node = builder.addState(golden.state, projected);

    visualsMap.set(golden.id, extractVisuals(node));
  }

  // High confidence should be more saturated than high uncertainty
  const highConfidence = visualsMap.get('high-confidence');
  const highUncertainty = visualsMap.get('high-uncertainty');

  if (highConfidence && highUncertainty) {
    assertions.push(
      assertHigherThan(
        'Confident more saturated than uncertain',
        highConfidence,
        highUncertainty,
        'saturation'
      )
    );

    assertions.push(
      assertHigherThan(
        'Confident brighter than uncertain',
        highConfidence,
        highUncertainty,
        'lightness'
      )
    );

    assertions.push(
      assertHigherThan(
        'Confident more opaque than uncertain',
        highConfidence,
        highUncertainty,
        'opacity'
      )
    );
  }

  return assertions;
}

// =============================================================================
// Test Report Generation
// =============================================================================

/**
 * Generate a human-readable test report.
 */
export function generateTestReport(results: readonly VisualTestResult[]): string {
  const lines: string[] = [];

  lines.push('═'.repeat(60));
  lines.push('VectorCaliper Visual Regression Report');
  lines.push('═'.repeat(60));
  lines.push('');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    lines.push(`${status}: ${result.goldenStateId}`);

    if (!result.passed) {
      for (const assertion of result.assertions) {
        if (!assertion.passed) {
          lines.push(`  - ${assertion.message}`);
        }
      }
    }

    if (result.warnings.length > 0) {
      lines.push('  Warnings:');
      for (const warning of result.warnings) {
        lines.push(`    ⚠ ${warning}`);
      }
    }

    if (result.passed) totalPassed++;
    else totalFailed++;

    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  lines.push('═'.repeat(60));

  return lines.join('\n');
}
