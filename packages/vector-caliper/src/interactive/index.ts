/**
 * VectorCaliper Interactive Exports
 */

// Tooltip content generation
export {
  generateTooltipContent,
  generateTooltipHTML,
  VARIABLE_METADATA,
  type TooltipContent,
  type TooltipVariable,
} from './tooltip-content';

// HTML renderer
export {
  HTMLRenderer,
  defaultHTMLRenderer,
  DEFAULT_HTML_CONFIG,
  type HTMLConfig,
} from './html-renderer';

// Layer controller
export {
  LayerController,
  LAYER_CONTROLS_CSS,
  type FocusDisplayMode,
  type LayerDisplayConfig,
  type NodeDisplayState,
  type LayerControllerState,
} from './layer-controller';

// Timeline scrubber
export {
  TimelineScrubber,
  TIMELINE_CONTROLS_CSS,
  DEFAULT_TIMELINE_CONFIG,
  testDeterminism,
  testHysteresis,
  type TimelineScrubberConfig,
  type ScrubberState,
  type SceneSnapshot,
} from './timeline-scrubber';

// State comparison
export {
  compareStates,
  invertComparison,
  verifySymmetry,
  formatDiffValue,
  formatDirection,
  directionSymbol,
  generateComparisonHTML,
  generateComparisonText,
  COMPARISON_CSS,
  type VariableDiff,
  type CategoryDiff,
  type StateComparison,
  type DiffDirection,
} from './state-comparison';

// Diagnostics
export {
  DiagnosticLogger,
  defaultDiagnostics,
  DEFAULT_DIAGNOSTIC_CONFIG,
  type DiagnosticEvent,
  type DiagnosticConfig,
  type DiagnosticLog,
  type DiagnosticSummary,
} from './diagnostics';
