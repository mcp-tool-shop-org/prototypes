/**
 * VectorCaliper
 *
 * A scientific instrument for faithful model-state visualization.
 * Turns vector graphics into calibrated representations.
 *
 * Core principle: Every pixel must be traceable to a variable.
 *
 * @packageDocumentation
 */

// Schema and types
export * from './schema';
export * from './types/state';

// Validation
export * from './validation';

// Semantic-to-visual mapping
export * from './mapping';

// Projection engine
export * from './projection';

// Scene graph
export * from './scene';

// Rendering
export * from './render';

// Time & Trajectories
export * from './time';

// Semantic Layers
export * from './layers';

// Testing utilities
export * from './testing';

// Interactive HTML
export * from './interactive';

// Errors and messaging
export * from './errors';

// Scale and performance (explicit exports to avoid collisions with scene)
export {
  // Budget
  type ScaleClass,
  type MemoryBudget,
  type RenderBudget,
  type InteractionBudget,
  type PerformanceBudget,
  type BudgetRejection,
  type BudgetAcceptance,
  type BudgetWarning,
  type BudgetValidationResult,
  SCALE_THRESHOLDS,
  SMALL_BUDGET,
  MEDIUM_BUDGET,
  LARGE_BUDGET,
  EXTREME_BUDGET,
  ABSOLUTE_MAX_STATES,
  ABSOLUTE_MAX_MEMORY,
  ABSOLUTE_MAX_INITIAL_RENDER,
  classifyScale,
  getBudgetForScale,
  getBudgetForStateCount,
  validateBudget,
  estimateStateMemory,
  estimateGeometryMemory,
  formatBytes,
  formatMs,
  formatRejectionMessage,
  BudgetEnforcer,
  // Chunked store
  type ChunkedState,
  type ChunkMeta,
  type Chunk,
  type PageResult,
  type StoreStats,
  ChunkedStateStore,
  createChunkedStore,
  createAsyncChunkedStore,
  calculateChunkBoundaries,
  getChunkIdForIndex,
  getChunkIndexRange,
  // Progressive render
  type SamplingStrategy,
  type RenderPass,
  type PassConfig,
  type RenderPassLevel,
  type ProgressiveRenderState,
  type CompletenessIndicator,
  type RenderPlan,
  selectSubset,
  selectUniformSubset,
  selectEndpointsSubset,
  selectKeyframeSubset,
  getDefaultPassConfigs,
  createRenderPlan,
  createDefaultRenderPlan,
  verifySubsetTruth,
  verifyPlanTruth,
  ProgressiveRenderer,
  createProgressiveRenderer,
  createCustomProgressiveRenderer,
  // Interaction constraints
  type ScrubResult,
  type HoverResult,
  type SelectionResult,
  ScrubRateLimiter,
  HoverDebouncer,
  SelectionConstraint,
  AutoplayController,
  InteractionManager,
  createInteractionManager,
  // Stress test
  type StressTestConfig,
  type StressTestResult,
  type TimingResult,
  type MemoryResult,
  type BoundaryTestResult,
  type ValidationSuiteResult,
  createTestState,
  measureTiming,
  measureMemory,
  forceGC,
  stressTestProgressiveRendering,
  stressTestInteractionConstraints,
  testScaleBoundaries,
  testBudgetValidationAtBoundaries,
  assertTimingWithinBudget,
  assertMemoryWithinBudget,
  generateReport,
  DEFAULT_STRESS_CONFIG,
} from './scale';
