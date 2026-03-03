/**
 * VectorCaliper - Semantic Layer System
 *
 * Provides progressive disclosure of variables through semantic layers.
 * Each layer is independently meaningful.
 *
 * INVARIANT: Hiding layers never breaks invariants.
 * INVARIANT: Each layer encodes a coherent semantic group.
 */

import type { SemanticVariable } from '../mapping/semantic-map';
import type { Scene, SceneNode } from '../scene';

// =============================================================================
// Semantic Layer Definitions
// =============================================================================

/**
 * A semantic layer groups related variables.
 */
export interface SemanticLayer {
  /** Unique layer identifier */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this layer shows */
  readonly description: string;

  /** Variables included in this layer */
  readonly variables: readonly SemanticVariable[];

  /** Scene layer IDs that render this semantic layer */
  readonly sceneLayerIds: readonly string[];

  /** Default visibility */
  readonly defaultVisible: boolean;

  /** Display order (lower = rendered first / bottom) */
  readonly order: number;

  /** Icon hint for UI */
  readonly icon?: string;
}

// =============================================================================
// Predefined Semantic Layers
// =============================================================================

export const GEOMETRY_LAYER: SemanticLayer = {
  id: 'geometry',
  name: 'Geometry',
  description: 'Representation structure: dimensionality, spread, shape',
  variables: [
    'geometry.effectiveDimension',
    'geometry.anisotropy',
    'geometry.spread',
    'geometry.density',
    'position.x',
    'position.y',
    'derived.magnitude',
  ],
  sceneLayerIds: ['states', 'geometry'],
  defaultVisible: true,
  order: 0,
  icon: 'cube',
};

export const UNCERTAINTY_LAYER: SemanticLayer = {
  id: 'uncertainty',
  name: 'Uncertainty',
  description: 'Confidence and calibration: entropy, margin, error bounds',
  variables: [
    'uncertainty.entropy',
    'uncertainty.margin',
    'uncertainty.calibration',
    'uncertainty.epistemic',
    'uncertainty.aleatoric',
  ],
  sceneLayerIds: ['uncertainty', 'confidence'],
  defaultVisible: true,
  order: 1,
  icon: 'help-circle',
};

export const PERFORMANCE_LAYER: SemanticLayer = {
  id: 'performance',
  name: 'Performance',
  description: 'Model quality: accuracy, loss, task scores',
  variables: [
    'performance.accuracy',
    'performance.loss',
    'performance.taskScore',
    'performance.cost',
  ],
  sceneLayerIds: ['performance', 'metrics'],
  defaultVisible: true,
  order: 2,
  icon: 'bar-chart',
};

export const DYNAMICS_LAYER: SemanticLayer = {
  id: 'dynamics',
  name: 'Dynamics',
  description: 'Temporal evolution: velocity, stability, phase',
  variables: [
    'dynamics.velocity',
    'dynamics.acceleration',
    'dynamics.stability',
    'dynamics.phase',
  ],
  sceneLayerIds: ['trajectories', 'dynamics'],
  defaultVisible: false,
  order: 3,
  icon: 'trending-up',
};

export const ANNOTATIONS_LAYER: SemanticLayer = {
  id: 'annotations',
  name: 'Annotations',
  description: 'Labels, axes, and reference markers',
  variables: [],
  sceneLayerIds: ['labels', 'axes', 'annotations'],
  defaultVisible: true,
  order: 10,
  icon: 'tag',
};

/**
 * All predefined layers.
 */
export const PREDEFINED_LAYERS: readonly SemanticLayer[] = [
  GEOMETRY_LAYER,
  UNCERTAINTY_LAYER,
  PERFORMANCE_LAYER,
  DYNAMICS_LAYER,
  ANNOTATIONS_LAYER,
];

// =============================================================================
// Layer Manager
// =============================================================================

/**
 * Manages semantic layers and their visibility.
 */
export class LayerManager {
  private layers: Map<string, SemanticLayer> = new Map();
  private visibility: Map<string, boolean> = new Map();
  private scene: Scene | null = null;

  constructor(layers: readonly SemanticLayer[] = PREDEFINED_LAYERS) {
    for (const layer of layers) {
      this.layers.set(layer.id, layer);
      this.visibility.set(layer.id, layer.defaultVisible);
    }
  }

  /**
   * Attach a scene to manage.
   */
  attachScene(scene: Scene): void {
    this.scene = scene;
    this.applyVisibility();
  }

  /**
   * Detach the current scene.
   */
  detachScene(): void {
    this.scene = null;
  }

  // ---------------------------------------------------------------------------
  // Layer Registration
  // ---------------------------------------------------------------------------

  /**
   * Add a custom layer.
   */
  addLayer(layer: SemanticLayer): void {
    if (this.layers.has(layer.id)) {
      throw new Error(`Layer '${layer.id}' already exists`);
    }
    this.layers.set(layer.id, layer);
    this.visibility.set(layer.id, layer.defaultVisible);
  }

  /**
   * Remove a layer.
   */
  removeLayer(layerId: string): boolean {
    this.visibility.delete(layerId);
    return this.layers.delete(layerId);
  }

  /**
   * Get a layer by ID.
   */
  getLayer(layerId: string): SemanticLayer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get all layers sorted by order.
   */
  getLayers(): readonly SemanticLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  // ---------------------------------------------------------------------------
  // Visibility Control
  // ---------------------------------------------------------------------------

  /**
   * Check if a layer is visible.
   */
  isVisible(layerId: string): boolean {
    return this.visibility.get(layerId) ?? false;
  }

  /**
   * Set layer visibility.
   */
  setVisible(layerId: string, visible: boolean): void {
    if (!this.layers.has(layerId)) {
      throw new Error(`Unknown layer: ${layerId}`);
    }
    this.visibility.set(layerId, visible);
    this.applyLayerVisibility(layerId);
  }

  /**
   * Toggle layer visibility.
   */
  toggle(layerId: string): boolean {
    const current = this.isVisible(layerId);
    this.setVisible(layerId, !current);
    return !current;
  }

  /**
   * Show all layers.
   */
  showAll(): void {
    for (const layerId of this.layers.keys()) {
      this.visibility.set(layerId, true);
    }
    this.applyVisibility();
  }

  /**
   * Hide all layers.
   */
  hideAll(): void {
    for (const layerId of this.layers.keys()) {
      this.visibility.set(layerId, false);
    }
    this.applyVisibility();
  }

  /**
   * Reset to default visibility.
   */
  resetToDefaults(): void {
    for (const layer of this.layers.values()) {
      this.visibility.set(layer.id, layer.defaultVisible);
    }
    this.applyVisibility();
  }

  /**
   * Get current visibility state (for serialization).
   */
  getVisibilityState(): Record<string, boolean> {
    const state: Record<string, boolean> = {};
    for (const [id, visible] of this.visibility) {
      state[id] = visible;
    }
    return state;
  }

  /**
   * Restore visibility state (from serialization).
   */
  setVisibilityState(state: Record<string, boolean>): void {
    for (const [id, visible] of Object.entries(state)) {
      if (this.layers.has(id)) {
        this.visibility.set(id, visible);
      }
    }
    this.applyVisibility();
  }

  // ---------------------------------------------------------------------------
  // Scene Integration
  // ---------------------------------------------------------------------------

  /**
   * Apply visibility to attached scene.
   */
  private applyVisibility(): void {
    if (!this.scene) return;

    for (const layerId of this.layers.keys()) {
      this.applyLayerVisibility(layerId);
    }
  }

  /**
   * Apply visibility for a single semantic layer.
   */
  private applyLayerVisibility(layerId: string): void {
    if (!this.scene) return;

    const layer = this.layers.get(layerId);
    if (!layer) return;

    const visible = this.visibility.get(layerId) ?? false;

    // Apply to all associated scene layers
    for (const sceneLayerId of layer.sceneLayerIds) {
      this.scene.setLayerVisibility(sceneLayerId, visible);
    }
  }

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------

  /**
   * Get the semantic layer that contains a variable.
   */
  getLayerForVariable(variable: SemanticVariable): SemanticLayer | undefined {
    for (const layer of this.layers.values()) {
      if (layer.variables.includes(variable)) {
        return layer;
      }
    }
    return undefined;
  }

  /**
   * Get all visible variables.
   */
  getVisibleVariables(): SemanticVariable[] {
    const variables: SemanticVariable[] = [];

    for (const layer of this.layers.values()) {
      if (this.visibility.get(layer.id)) {
        variables.push(...layer.variables);
      }
    }

    return variables;
  }

  /**
   * Check if a variable is currently visible.
   */
  isVariableVisible(variable: SemanticVariable): boolean {
    const layer = this.getLayerForVariable(variable);
    if (!layer) return true; // Unassigned variables are visible by default
    return this.visibility.get(layer.id) ?? false;
  }
}

// =============================================================================
// Presets
// =============================================================================

/**
 * Visibility presets for common use cases.
 */
export const VISIBILITY_PRESETS = {
  /** Show everything */
  all: {
    geometry: true,
    uncertainty: true,
    performance: true,
    dynamics: true,
    annotations: true,
  },

  /** Minimal view - just geometry */
  minimal: {
    geometry: true,
    uncertainty: false,
    performance: false,
    dynamics: false,
    annotations: false,
  },

  /** Focus on confidence */
  confidence: {
    geometry: true,
    uncertainty: true,
    performance: false,
    dynamics: false,
    annotations: true,
  },

  /** Focus on performance */
  performance: {
    geometry: true,
    uncertainty: false,
    performance: true,
    dynamics: false,
    annotations: true,
  },

  /** Temporal analysis */
  temporal: {
    geometry: true,
    uncertainty: false,
    performance: false,
    dynamics: true,
    annotations: true,
  },

  /** Full analysis (no annotations) */
  analysis: {
    geometry: true,
    uncertainty: true,
    performance: true,
    dynamics: true,
    annotations: false,
  },
} as const;

export type VisibilityPreset = keyof typeof VISIBILITY_PRESETS;

// =============================================================================
// Singleton Export
// =============================================================================

export const defaultLayerManager = new LayerManager();
