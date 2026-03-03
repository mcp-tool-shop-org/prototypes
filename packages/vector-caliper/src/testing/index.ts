/**
 * VectorCaliper Testing Exports
 */

// Golden states
export {
  GOLDEN_STATES,
  GOLDEN_STATE_HIGH_CONFIDENCE,
  GOLDEN_STATE_HIGH_UNCERTAINTY,
  GOLDEN_STATE_COLLAPSED,
  GOLDEN_STATE_TRAINING,
  GOLDEN_STATE_MINIMAL,
  getGoldenState,
  getGoldenStateIds,
  type GoldenState,
} from './golden-states';

// Visual assertions
export {
  runVisualTest,
  runAllVisualTests,
  runComparativeTests,
  generateTestReport,
  extractVisuals,
  type AssertionResult,
  type VisualTestResult,
  type ExtractedVisuals,
  type VisualTestConfig,
} from './visual-assertions';
