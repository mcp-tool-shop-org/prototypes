# VectorCaliper Training Dynamics API

This document describes the training dynamics module for visualizing ML model training as trajectories through state space.

## Core Concept

**Training is not loss curves. Training is trajectory through state space under an optimizer-induced vector field.**

VectorCaliper visualizes:
- How internal state moves
- When it stabilizes, oscillates, or collapses
- How updates change geometry, not just performance

---

## Module Overview

```
src/training/
├── types.ts              # Core types: RawTrainingLog, TrainingState, UpdateVector
├── adapter.ts            # TrainingStateAdapter: logs → canonical state
├── time-axis.ts          # TimeAxis: dual time semantics (step/epoch)
├── update-visualization.ts # UpdateVectorVisualizer: geometry + encoding
├── regime-detection.ts   # RegimeDetector: qualitative classifications
├── comparison.ts         # TrainingComparator: side-by-side analysis
└── index.ts              # Module exports
```

---

## Quick Start

### 1. Adapt Training Logs

```typescript
import { TrainingStateAdapter, RawTrainingLog } from 'vectorcaliper/training';

// Your training logs
const logs: RawTrainingLog[] = [
  {
    step: 0,
    epoch: 0,
    learningRate: 0.001,
    loss: 2.5,
    gradientNorm: 1.2,
    updateNorm: 0.05,
    parameterNorm: 150,
    accuracy: 0.45,  // optional
  },
  // ... more logs
];

// Create trajectory
const adapter = new TrainingStateAdapter();
const trajectory = adapter.adaptLogs(logs, 'experiment_1', 'Adam lr=1e-3');

console.log(`Trajectory: ${trajectory.totalSteps} steps, ${trajectory.totalEpochs} epochs`);
console.log(`Updates: ${trajectory.updates.length}`);
```

### 2. Navigate Time

```typescript
import { TimeAxis, createEpochMarkers } from 'vectorcaliper/training';

const timeAxis = new TimeAxis(trajectory);

// Get state at specific step
const state = timeAxis.getStateForStep(100);

// Get time coordinate
const coord = timeAxis.getTimeCoordinate(50);
console.log(`Step ${coord.step}, Epoch ${coord.epoch}, Progress: ${coord.epochProgress.toFixed(2)}`);

// Get epoch boundaries
const boundaries = timeAxis.getEpochBoundaries();
boundaries.forEach(b => {
  console.log(`Epoch ${b.epoch} starts at step ${b.startStep}`);
});

// Create epoch markers for visualization
const markers = createEpochMarkers(trajectory);
```

### 3. Visualize Update Vectors

```typescript
import { UpdateVectorVisualizer, generateUpdateVectorSVG } from 'vectorcaliper/training';

// Projected positions (from your projection module)
const positions = new Map<string, { x: number; y: number }>();
trajectory.states.forEach((state, i) => {
  positions.set(state.id, { x: projectedX[i], y: projectedY[i] });
});

// Create visualizer
const visualizer = new UpdateVectorVisualizer(trajectory, positions, {
  showGhosts: true,
  ghostCount: 5,
});

// Generate glyphs for all updates
const glyphs = visualizer.generateAllGlyphs();

// Generate SVG
const svg = generateUpdateVectorSVG(glyphs, visualizer, 800, 600);

// Classify updates
glyphs.forEach(glyph => {
  const classification = visualizer.classifyUpdate(glyph);
  console.log(`${classification.description}`);
});
```

### 4. Detect Training Regimes

```typescript
import { RegimeDetector, generateRegimeAnnotations } from 'vectorcaliper/training';

const detector = new RegimeDetector(trajectory);

// Detect regime at specific state
const indicator = detector.detectRegimeAt(100);
console.log(`Regime: ${indicator.regime} (confidence: ${indicator.confidence.toFixed(2)})`);
console.log(`Evidence: ${indicator.description}`);

// Detect all regimes
const indicators = detector.detectAllRegimes();

// Find regime transitions
const transitions = detector.getRegimeTransitions();
transitions.forEach(t => {
  console.log(`Step ${t.fromIndex} → ${t.toIndex}: ${t.fromRegime} → ${t.toRegime}`);
});

// Generate annotations for visualization
const annotations = generateRegimeAnnotations(indicators);
```

### 5. Compare Training Runs

```typescript
import { TrainingComparator, generateComparisonReport } from 'vectorcaliper/training';

// Two trajectories to compare
const adamTrajectory = adapter.adaptLogs(adamLogs, 'adam', 'Adam lr=1e-3');
const sgdTrajectory = adapter.adaptLogs(sgdLogs, 'sgd', 'SGD lr=1e-2');

// Compare
const comparator = new TrainingComparator(adamTrajectory, sgdTrajectory, {
  alignmentMode: 'epoch_progress',
  convergenceLossThreshold: 0.1,
});
const comparison = comparator.compare();

// Access comparison data
console.log('Convergence:', comparison.summary.convergenceSpeed.description);
console.log('Stability:', comparison.summary.stability.description);
console.log('Final Performance:', comparison.summary.finalPerformance.description);

// Generate report
const report = generateComparisonReport(comparison);
console.log(report);
```

---

## API Reference

### Types

#### RawTrainingLog

Input format for training logs.

```typescript
interface RawTrainingLog {
  step: number;           // Training step (0-indexed)
  epoch: number;          // Epoch number (0-indexed)
  learningRate: number;   // Current learning rate (> 0)
  loss: number;           // Loss value (>= 0)
  gradientNorm: number;   // L2 norm of gradients (>= 0)
  updateNorm: number;     // L2 norm of parameter update (>= 0)
  parameterNorm: number;  // L2 norm of all parameters (>= 0)
  accuracy?: number;      // Optional: accuracy [0, 1]
  momentumAlignment?: number;  // Optional: gradient-momentum alignment [-1, 1]
  batchEntropy?: number;  // Optional: batch entropy [0, 1]
}
```

#### TrainingState

Canonical state for VectorCaliper.

```typescript
interface TrainingState {
  id: string;
  step: number;
  epoch: number;
  training: {
    learningRate: number;
    gradientNorm: number;
    updateNorm: number;
    momentumAlignment: number;
    batchEntropy: number;
  };
  model: {
    parameterNorm: number;
    effectiveDim: number;
    anisotropy: number;
    curvature: number;
  };
  performance: {
    loss: number;
    accuracy: number;
    calibration: number;
  };
}
```

#### UpdateVector

First-class object representing state transitions.

```typescript
interface UpdateVector {
  fromStateId: string;
  toStateId: string;
  fromStep: number;
  toStep: number;
  direction: number[];    // Unit vector in reduced space
  magnitude: number;      // L2 norm in original space
  alignment: number;      // Alignment with previous update [-1, 1]
  crossesEpoch: boolean;  // Whether this crosses an epoch boundary
}
```

#### TrainingRegime

Qualitative training classifications.

```typescript
type TrainingRegime =
  | 'stable_convergence'
  | 'oscillatory'
  | 'chaotic'
  | 'collapsed'
  | 'diverging'
  | 'plateau'
  | 'unknown';
```

---

## Guarantees

### Determinism

All operations are deterministic:
- Same logs → same trajectory
- Same step → same state
- Same time → same coordinate

### No Smoothing

Values are never averaged or smoothed:
- Spikes are preserved
- Oscillations are visible
- Every value traces to source data

### No Normalization

Comparisons use raw values:
- No rescaling between runs
- Incompatibility is explicit
- Warnings are generated, not hidden

### Neutral Language

All descriptions avoid evaluative language:
- "Higher/lower", not "better/worse"
- "Faster/slower", not "optimal/suboptimal"
- Evidence-based, not prescriptive

### Regime Independence

Regimes are annotations, not state:
- Removing regime logic doesn't change visualization
- Regimes explain, never drive
- Classifications are explicit thresholds, not heuristics

---

## Configuration Reference

### TrainingStateAdapter

```typescript
interface AdapterConfig {
  missingValueStrategy: 'default' | 'error';
  defaults: {
    momentumAlignment: number;  // Default: 0
    batchEntropy: number;       // Default: 0.5
    accuracy: number;           // Default: -1
    calibration: number;        // Default: -1
    effectiveDim: number;       // Default: 1
    anisotropy: number;         // Default: 0
    curvature: number;          // Default: 0
  };
  strictValidation: boolean;    // Default: true
}
```

### UpdateVectorVisualizer

```typescript
interface UpdateVisualizationConfig {
  minLength: number;            // Default: 5
  maxLength: number;            // Default: 50
  showGhosts: boolean;          // Default: true
  ghostCount: number;           // Default: 5
  ghostDecay: number;           // Default: 0.7
  arrowheadSize: number;        // Default: 8
  strokeWidth: number;          // Default: 2
  highlightEpochCrossings: boolean; // Default: true
}
```

### RegimeDetector

```typescript
interface RegimeDetectionConfig {
  windowSize: number;           // Default: 10
  stabilityThreshold: number;   // Default: 0.01
  highAlignmentThreshold: number; // Default: 0.7
  lowAlignmentThreshold: number;  // Default: 0.3
  oscillationThreshold: number; // Default: 0.1
  collapseThreshold: number;    // Default: 0.001
  divergenceThreshold: number;  // Default: 0.5
}
```

### TrainingComparator

```typescript
interface ComparisonConfig {
  alignmentMode: 'step' | 'epoch_progress'; // Default: 'epoch_progress'
  alignmentPoints: number;      // Default: 20
  convergenceLossThreshold: number; // Default: 0.1
  includeRegimeComparison: boolean; // Default: true
}
```

---

## Integration with Core VectorCaliper

The training module produces `TrainingState` objects that can be converted to core `ModelState` for visualization:

```typescript
import { StateSchema, Validator } from 'vectorcaliper/schema';
import { ChannelMapper } from 'vectorcaliper/mapping';

// Convert TrainingState to visualization
function toVisualizationState(trainingState: TrainingState): ModelState {
  return {
    id: trainingState.id,
    accuracy: trainingState.performance.accuracy >= 0
      ? trainingState.performance.accuracy
      : undefined,
    confidence: 1 - Math.min(1, trainingState.performance.loss / 2),
    loss: trainingState.performance.loss,
    calibration: trainingState.performance.calibration >= 0
      ? trainingState.performance.calibration
      : undefined,
    // Additional mappings...
  };
}
```

---

## Error Handling

### TrainingValidationError

Thrown when log validation fails:

```typescript
try {
  const state = adapter.adaptLog(invalidLog);
} catch (e) {
  if (e instanceof TrainingValidationError) {
    console.error(`Validation failed at step ${e.step}: ${e.field} - ${e.message}`);
    console.error(`Value: ${e.value}`);
  }
}
```

### Compatibility Issues

Comparison reports incompatibilities explicitly:

```typescript
const comparison = comparator.compare();
if (!comparison.compatibility.compatible) {
  console.error('Cannot compare:', comparison.compatibility.issues);
} else if (comparison.compatibility.warnings.length > 0) {
  console.warn('Comparison warnings:', comparison.compatibility.warnings);
}
```
