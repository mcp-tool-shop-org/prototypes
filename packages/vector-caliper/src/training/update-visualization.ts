/**
 * Update Vector Visualization
 *
 * Shows how training moves the model.
 * Update vectors are data, not animation.
 *
 * Guarantees:
 * - Update vectors are computed from data, not interpolated
 * - No averaging or smoothing unless explicitly configured
 * - Users can visually distinguish small corrective vs large destabilizing updates
 */

import { UpdateVector, TrainingTrajectory, TrainingState } from './types';

/**
 * Visual representation of an update vector.
 * All fields are derived directly from UpdateVector — no heuristics.
 */
export interface UpdateVectorGlyph {
  /** Source update vector */
  update: UpdateVector;

  /** Start position in projected space */
  startPosition: { x: number; y: number };

  /** End position in projected space */
  endPosition: { x: number; y: number };

  /** Arrow direction (radians, 0 = right, π/2 = up) */
  angle: number;

  /** Arrow length in visual units (proportional to magnitude) */
  length: number;

  /** Normalized magnitude [0, 1] relative to max in trajectory */
  normalizedMagnitude: number;

  /** Color encoding based on alignment */
  alignmentEncoding: {
    /** Alignment value [-1, 1] */
    value: number;
    /** Hue encoding: 0 = red (negative), 120 = green (positive), 60 = yellow (neutral) */
    hue: number;
  };

  /** Whether this update crosses an epoch boundary */
  crossesEpoch: boolean;

  /** Optional: ghosting opacity [0, 1] for historical updates */
  ghostOpacity?: number;
}

/**
 * Configuration for update vector visualization.
 */
export interface UpdateVisualizationConfig {
  /** Minimum arrow length in pixels */
  minLength: number;
  /** Maximum arrow length in pixels */
  maxLength: number;
  /** Whether to show ghosted previous updates */
  showGhosts: boolean;
  /** Number of ghost updates to show (if showGhosts is true) */
  ghostCount: number;
  /** Opacity decay for ghosts (multiplied for each older update) */
  ghostDecay: number;
  /** Arrowhead size in pixels */
  arrowheadSize: number;
  /** Stroke width in pixels */
  strokeWidth: number;
  /** Whether to highlight epoch-crossing updates */
  highlightEpochCrossings: boolean;
}

/**
 * Default visualization configuration.
 */
export const DEFAULT_UPDATE_VIS_CONFIG: UpdateVisualizationConfig = {
  minLength: 5,
  maxLength: 50,
  showGhosts: true,
  ghostCount: 5,
  ghostDecay: 0.7,
  arrowheadSize: 8,
  strokeWidth: 2,
  highlightEpochCrossings: true,
};

/**
 * Update Vector Visualizer
 *
 * Converts update vectors to visual glyphs.
 * No smoothing, no averaging — direct mapping from data.
 */
export class UpdateVectorVisualizer {
  private readonly config: UpdateVisualizationConfig;
  private readonly maxMagnitude: number;

  constructor(
    private readonly trajectory: TrainingTrajectory,
    private readonly projectedPositions: Map<string, { x: number; y: number }>,
    config: Partial<UpdateVisualizationConfig> = {}
  ) {
    this.config = { ...DEFAULT_UPDATE_VIS_CONFIG, ...config };
    this.maxMagnitude = this.computeMaxMagnitude();
  }

  /**
   * Generate glyph for a single update vector.
   */
  generateGlyph(update: UpdateVector): UpdateVectorGlyph {
    const startPos = this.projectedPositions.get(update.fromStateId);
    const endPos = this.projectedPositions.get(update.toStateId);

    if (!startPos || !endPos) {
      throw new Error(
        `Missing projected positions for update ${update.fromStateId} -> ${update.toStateId}`
      );
    }

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const visualLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    return {
      update,
      startPosition: { ...startPos },
      endPosition: { ...endPos },
      angle,
      length: visualLength,
      normalizedMagnitude: this.maxMagnitude > 0 ? update.magnitude / this.maxMagnitude : 0,
      alignmentEncoding: this.encodeAlignment(update.alignment),
      crossesEpoch: update.crossesEpoch,
    };
  }

  /**
   * Generate glyphs for all updates in trajectory.
   */
  generateAllGlyphs(): UpdateVectorGlyph[] {
    return this.trajectory.updates.map((u) => this.generateGlyph(u));
  }

  /**
   * Generate glyphs with ghosting for a specific update index.
   * Returns the main update plus ghost updates for historical context.
   */
  generateWithGhosts(updateIndex: number): UpdateVectorGlyph[] {
    if (!this.config.showGhosts) {
      return [this.generateGlyph(this.trajectory.updates[updateIndex])];
    }

    const glyphs: UpdateVectorGlyph[] = [];
    const startIndex = Math.max(0, updateIndex - this.config.ghostCount);

    for (let i = startIndex; i <= updateIndex; i++) {
      const glyph = this.generateGlyph(this.trajectory.updates[i]);
      const age = updateIndex - i;

      if (age > 0) {
        glyph.ghostOpacity = Math.pow(this.config.ghostDecay, age);
      }

      glyphs.push(glyph);
    }

    return glyphs;
  }

  /**
   * Generate SVG path for an update vector arrow.
   */
  generateArrowPath(glyph: UpdateVectorGlyph): string {
    const { startPosition, endPosition, angle } = glyph;
    const headSize = this.config.arrowheadSize;

    // Main line
    const linePath = `M ${startPosition.x} ${startPosition.y} L ${endPosition.x} ${endPosition.y}`;

    // Arrowhead
    const headAngle1 = angle + Math.PI * 0.85;
    const headAngle2 = angle - Math.PI * 0.85;

    const headX1 = endPosition.x + headSize * Math.cos(headAngle1);
    const headY1 = endPosition.y + headSize * Math.sin(headAngle1);
    const headX2 = endPosition.x + headSize * Math.cos(headAngle2);
    const headY2 = endPosition.y + headSize * Math.sin(headAngle2);

    const headPath = `M ${endPosition.x} ${endPosition.y} L ${headX1} ${headY1} M ${endPosition.x} ${endPosition.y} L ${headX2} ${headY2}`;

    return `${linePath} ${headPath}`;
  }

  /**
   * Generate CSS color from alignment encoding.
   */
  getAlignmentColor(encoding: UpdateVectorGlyph['alignmentEncoding'], opacity: number = 1): string {
    return `hsla(${encoding.hue}, 70%, 50%, ${opacity})`;
  }

  /**
   * Classify update based on magnitude and alignment.
   * Returns human-readable classification for debugging/tooltips.
   */
  classifyUpdate(glyph: UpdateVectorGlyph): {
    magnitudeClass: 'small' | 'medium' | 'large';
    alignmentClass: 'corrective' | 'coherent' | 'opposing';
    description: string;
  } {
    // Magnitude classification (no heuristics, just thresholds)
    const magnitudeClass =
      glyph.normalizedMagnitude < 0.33 ? 'small' :
      glyph.normalizedMagnitude < 0.67 ? 'medium' : 'large';

    // Alignment classification
    const alignmentClass =
      glyph.alignmentEncoding.value > 0.5 ? 'coherent' :
      glyph.alignmentEncoding.value < -0.5 ? 'opposing' : 'corrective';

    // Neutral description (no "better" or "worse")
    const magDesc = magnitudeClass === 'small' ? 'Small' :
                    magnitudeClass === 'medium' ? 'Medium' : 'Large';

    const alignDesc = alignmentClass === 'coherent' ? 'consistent direction' :
                      alignmentClass === 'opposing' ? 'reversed direction' : 'direction change';

    return {
      magnitudeClass,
      alignmentClass,
      description: `${magDesc} update with ${alignDesc}`,
    };
  }

  /**
   * Compute statistics for update vectors (no smoothing).
   */
  computeStatistics(): UpdateStatistics {
    const updates = this.trajectory.updates;
    if (updates.length === 0) {
      return {
        count: 0,
        magnitudeRange: { min: 0, max: 0, mean: 0, stdDev: 0 },
        alignmentRange: { min: 0, max: 0, mean: 0, stdDev: 0 },
        epochCrossingCount: 0,
        coherentCount: 0,
        opposingCount: 0,
      };
    }

    const magnitudes = updates.map((u) => u.magnitude);
    const alignments = updates.map((u) => u.alignment);

    return {
      count: updates.length,
      magnitudeRange: this.computeRangeStats(magnitudes),
      alignmentRange: this.computeRangeStats(alignments),
      epochCrossingCount: updates.filter((u) => u.crossesEpoch).length,
      coherentCount: updates.filter((u) => u.alignment > 0.5).length,
      opposingCount: updates.filter((u) => u.alignment < -0.5).length,
    };
  }

  // Private helpers

  private computeMaxMagnitude(): number {
    if (this.trajectory.updates.length === 0) return 0;
    return Math.max(...this.trajectory.updates.map((u) => u.magnitude));
  }

  private encodeAlignment(alignment: number): UpdateVectorGlyph['alignmentEncoding'] {
    // Map alignment [-1, 1] to hue [0, 120]
    // -1 (opposing) -> 0 (red)
    //  0 (neutral)  -> 60 (yellow)
    // +1 (coherent) -> 120 (green)
    const hue = (alignment + 1) * 60;

    return {
      value: alignment,
      hue: Math.round(hue),
    };
  }

  private computeRangeStats(values: number[]): {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  } {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { min, max, mean, stdDev };
  }
}

/**
 * Statistics for update vectors.
 */
export interface UpdateStatistics {
  count: number;
  magnitudeRange: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
  alignmentRange: {
    min: number;
    max: number;
    mean: number;
    stdDev: number;
  };
  epochCrossingCount: number;
  coherentCount: number;
  opposingCount: number;
}

/**
 * Generate SVG for update vector visualization.
 */
export function generateUpdateVectorSVG(
  glyphs: UpdateVectorGlyph[],
  visualizer: UpdateVectorVisualizer,
  width: number,
  height: number
): string {
  const paths = glyphs.map((glyph) => {
    const path = visualizer.generateArrowPath(glyph);
    const color = visualizer.getAlignmentColor(
      glyph.alignmentEncoding,
      glyph.ghostOpacity ?? 1
    );
    const strokeWidth = glyph.ghostOpacity !== undefined
      ? DEFAULT_UPDATE_VIS_CONFIG.strokeWidth * glyph.ghostOpacity
      : DEFAULT_UPDATE_VIS_CONFIG.strokeWidth;

    const epochClass = glyph.crossesEpoch ? ' class="epoch-crossing"' : '';

    return `<path d="${path}" stroke="${color}" stroke-width="${strokeWidth}" fill="none"${epochClass}/>`;
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .epoch-crossing { stroke-dasharray: 4 2; }
  </style>
  <g class="update-vectors">
    ${paths.join('\n    ')}
  </g>
</svg>`;
}

/**
 * Verify update vector visualization determinism.
 */
export function verifyUpdateVisualizationDeterminism(
  trajectory: TrainingTrajectory,
  positions: Map<string, { x: number; y: number }>,
  iterations: number = 3
): boolean {
  const results: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const visualizer = new UpdateVectorVisualizer(trajectory, positions);
    const glyphs = visualizer.generateAllGlyphs();
    results.push(JSON.stringify(glyphs));
  }

  return results.every((r) => r === results[0]);
}
