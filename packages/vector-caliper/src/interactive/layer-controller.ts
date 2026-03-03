/**
 * VectorCaliper - Interactive Layer Controller
 *
 * Enhanced layer control for interactive HTML export.
 * Supports visibility toggling and focus mode.
 *
 * INVARIANT: Toggling visibility is idempotent (off→off = no-op)
 * INVARIANT: Coordinates remain frozen regardless of visibility/focus state
 * INVARIANT: Focus mode dims glyphs instead of hiding them
 */

import type { Scene, SceneNode } from '../scene';
import type { LayerManager, SemanticLayer } from '../layers/semantic-layers';

// =============================================================================
// Types
// =============================================================================

/**
 * Display mode for non-selected layers in focus mode.
 */
export type FocusDisplayMode = 'hide' | 'dim' | 'outline';

/**
 * Configuration for layer display.
 */
export interface LayerDisplayConfig {
  /** Whether the layer is visible */
  readonly visible: boolean;

  /** Opacity multiplier when dimmed (0-1) */
  readonly dimOpacity: number;

  /** Whether this layer is in focus */
  readonly focused: boolean;
}

/**
 * State of a node's display properties.
 */
export interface NodeDisplayState {
  /** Whether the node is visible */
  readonly visible: boolean;

  /** Opacity multiplier */
  readonly opacity: number;

  /** Whether the node is focused */
  readonly focused: boolean;

  /** Whether the node is dimmed (not focused, focus mode active) */
  readonly dimmed: boolean;
}

/**
 * Layer controller state for serialization.
 */
export interface LayerControllerState {
  readonly visibility: Record<string, boolean>;
  readonly focusMode: boolean;
  readonly focusedLayers: string[];
  readonly dimOpacity: number;
  readonly displayMode: FocusDisplayMode;
}

// =============================================================================
// Layer Controller
// =============================================================================

/**
 * Enhanced layer controller with focus mode support.
 *
 * Extends LayerManager functionality for interactive use.
 */
export class LayerController {
  private layerManager: LayerManager;
  private scene: Scene | null = null;

  // Focus mode state
  private focusModeEnabled: boolean = false;
  private focusedLayers: Set<string> = new Set();
  private displayMode: FocusDisplayMode = 'dim';
  private dimOpacity: number = 0.2;

  // Track original node states for restoration
  private originalOpacities: Map<string, number> = new Map();

  constructor(layerManager: LayerManager) {
    this.layerManager = layerManager;
  }

  // ---------------------------------------------------------------------------
  // Scene Attachment
  // ---------------------------------------------------------------------------

  /**
   * Attach a scene for layer control.
   */
  attachScene(scene: Scene): void {
    this.scene = scene;
    this.layerManager.attachScene(scene);
    this.captureOriginalStates();
    this.applyDisplayState();
  }

  /**
   * Detach the current scene.
   */
  detachScene(): void {
    this.scene = null;
    this.layerManager.detachScene();
    this.originalOpacities.clear();
  }

  /**
   * Capture original opacity values for restoration.
   */
  private captureOriginalStates(): void {
    if (!this.scene) return;

    this.originalOpacities.clear();
    for (const node of this.scene.getNodes()) {
      if (node.type === 'point') {
        this.originalOpacities.set(node.id.value, node.fill.a);
      } else if (node.type === 'path') {
        this.originalOpacities.set(node.id.value, node.stroke.color.a);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Basic Visibility Control (delegates to LayerManager)
  // ---------------------------------------------------------------------------

  /**
   * Check if a layer is visible.
   */
  isVisible(layerId: string): boolean {
    return this.layerManager.isVisible(layerId);
  }

  /**
   * Set layer visibility.
   * INVARIANT: Toggling off→off is a no-op.
   */
  setVisible(layerId: string, visible: boolean): void {
    // Idempotency check
    if (this.layerManager.isVisible(layerId) === visible) {
      return; // No-op: already in desired state
    }

    this.layerManager.setVisible(layerId, visible);
    this.applyDisplayState();
  }

  /**
   * Toggle layer visibility.
   * Returns new visibility state.
   */
  toggle(layerId: string): boolean {
    const newState = this.layerManager.toggle(layerId);
    this.applyDisplayState();
    return newState;
  }

  /**
   * Get all layers.
   */
  getLayers(): readonly SemanticLayer[] {
    return this.layerManager.getLayers();
  }

  // ---------------------------------------------------------------------------
  // Focus Mode
  // ---------------------------------------------------------------------------

  /**
   * Enable focus mode.
   * In focus mode, unfocused layers are dimmed instead of hidden.
   */
  enableFocusMode(options?: { displayMode?: FocusDisplayMode; dimOpacity?: number }): void {
    this.focusModeEnabled = true;
    if (options?.displayMode) {
      this.displayMode = options.displayMode;
    }
    if (options?.dimOpacity !== undefined) {
      this.dimOpacity = Math.max(0, Math.min(1, options.dimOpacity));
    }
    this.applyDisplayState();
  }

  /**
   * Disable focus mode.
   * Restores normal visibility behavior.
   */
  disableFocusMode(): void {
    this.focusModeEnabled = false;
    this.focusedLayers.clear();
    this.applyDisplayState();
  }

  /**
   * Check if focus mode is enabled.
   */
  isFocusModeEnabled(): boolean {
    return this.focusModeEnabled;
  }

  /**
   * Focus on a specific layer.
   * Unfocused layers will be dimmed.
   */
  focusLayer(layerId: string): void {
    if (!this.focusModeEnabled) {
      this.enableFocusMode();
    }
    this.focusedLayers.add(layerId);
    this.applyDisplayState();
  }

  /**
   * Remove focus from a layer.
   */
  unfocusLayer(layerId: string): void {
    this.focusedLayers.delete(layerId);
    this.applyDisplayState();
  }

  /**
   * Toggle focus on a layer.
   */
  toggleFocus(layerId: string): boolean {
    if (this.focusedLayers.has(layerId)) {
      this.unfocusLayer(layerId);
      return false;
    } else {
      this.focusLayer(layerId);
      return true;
    }
  }

  /**
   * Check if a layer is focused.
   */
  isLayerFocused(layerId: string): boolean {
    return this.focusedLayers.has(layerId);
  }

  /**
   * Focus exclusively on a single layer.
   * Clears all other focus.
   */
  focusExclusively(layerId: string): void {
    this.focusedLayers.clear();
    this.focusLayer(layerId);
  }

  /**
   * Clear all focus.
   */
  clearFocus(): void {
    this.focusedLayers.clear();
    this.applyDisplayState();
  }

  /**
   * Set dim opacity for unfocused layers.
   */
  setDimOpacity(opacity: number): void {
    this.dimOpacity = Math.max(0, Math.min(1, opacity));
    this.applyDisplayState();
  }

  /**
   * Set display mode for unfocused layers.
   */
  setDisplayMode(mode: FocusDisplayMode): void {
    this.displayMode = mode;
    this.applyDisplayState();
  }

  // ---------------------------------------------------------------------------
  // Display State Application
  // ---------------------------------------------------------------------------

  /**
   * Apply current display state to scene.
   * INVARIANT: Only changes visibility/opacity, never coordinates.
   */
  private applyDisplayState(): void {
    if (!this.scene) return;

    const layers = this.layerManager.getLayers();

    for (const layer of layers) {
      const displayConfig = this.getLayerDisplayConfig(layer.id);

      for (const sceneLayerId of layer.sceneLayerIds) {
        this.applyLayerDisplay(sceneLayerId, displayConfig);
      }
    }
  }

  /**
   * Get display configuration for a layer.
   */
  private getLayerDisplayConfig(layerId: string): LayerDisplayConfig {
    const visible = this.layerManager.isVisible(layerId);

    if (!this.focusModeEnabled || this.focusedLayers.size === 0) {
      // Normal mode or no focused layers
      return {
        visible,
        dimOpacity: 1.0,
        focused: false,
      };
    }

    // Focus mode with active focus
    const isFocused = this.focusedLayers.has(layerId);

    if (isFocused) {
      return {
        visible,
        dimOpacity: 1.0,
        focused: true,
      };
    } else {
      // Unfocused layer in focus mode
      return {
        visible: this.displayMode !== 'hide' && visible,
        dimOpacity: this.dimOpacity,
        focused: false,
      };
    }
  }

  /**
   * Apply display configuration to a scene layer.
   */
  private applyLayerDisplay(sceneLayerId: string, config: LayerDisplayConfig): void {
    if (!this.scene) return;

    const nodeIds = this.scene.getNodesInLayer(sceneLayerId);

    for (const node of nodeIds) {
      this.applyNodeDisplay(node, config);
    }
  }

  /**
   * Apply display configuration to a single node.
   * INVARIANT: Only modifies visible/opacity, not x/y coordinates.
   */
  private applyNodeDisplay(node: SceneNode, config: LayerDisplayConfig): void {
    if (!this.scene) return;

    const nodeId = node.id.value;
    const originalOpacity = this.originalOpacities.get(nodeId) ?? 1.0;

    // Calculate effective opacity
    const effectiveOpacity = config.visible ? originalOpacity * config.dimOpacity : 0;

    // Create updated node preserving coordinates
    if (node.type === 'point') {
      const updatedNode = {
        ...node,
        visible: config.visible,
        fill: {
          ...node.fill,
          a: effectiveOpacity,
        },
      };
      this.scene.updateNode(nodeId, updatedNode);
    } else if (node.type === 'path') {
      const updatedNode = {
        ...node,
        visible: config.visible,
        stroke: {
          ...node.stroke,
          color: {
            ...node.stroke.color,
            a: effectiveOpacity,
          },
        },
      };
      this.scene.updateNode(nodeId, updatedNode);
    } else {
      // For other node types, just update visibility
      this.scene.updateNode(nodeId, { ...node, visible: config.visible });
    }
  }

  // ---------------------------------------------------------------------------
  // Node Display State Query
  // ---------------------------------------------------------------------------

  /**
   * Get display state for a specific node.
   */
  getNodeDisplayState(nodeId: string): NodeDisplayState | undefined {
    if (!this.scene) return undefined;

    const node = this.scene.getNode(nodeId);
    if (!node) return undefined;

    const layer = this.getLayerForNode(node);
    const config = layer ? this.getLayerDisplayConfig(layer.id) : {
      visible: true,
      dimOpacity: 1.0,
      focused: false,
    };

    return {
      visible: config.visible,
      opacity: config.dimOpacity,
      focused: config.focused,
      dimmed: this.focusModeEnabled && this.focusedLayers.size > 0 && !config.focused,
    };
  }

  /**
   * Find the semantic layer containing a node.
   */
  private getLayerForNode(node: SceneNode): SemanticLayer | undefined {
    const layers = this.layerManager.getLayers();

    for (const layer of layers) {
      if (layer.sceneLayerIds.includes(node.layer)) {
        return layer;
      }
    }

    return undefined;
  }

  // ---------------------------------------------------------------------------
  // Presets
  // ---------------------------------------------------------------------------

  /**
   * Show all layers at full opacity.
   */
  showAll(): void {
    this.layerManager.showAll();
    this.disableFocusMode();
  }

  /**
   * Reset to default state.
   */
  reset(): void {
    this.layerManager.resetToDefaults();
    this.disableFocusMode();
  }

  // ---------------------------------------------------------------------------
  // State Serialization
  // ---------------------------------------------------------------------------

  /**
   * Get current state for serialization.
   */
  getState(): LayerControllerState {
    return {
      visibility: this.layerManager.getVisibilityState(),
      focusMode: this.focusModeEnabled,
      focusedLayers: Array.from(this.focusedLayers),
      dimOpacity: this.dimOpacity,
      displayMode: this.displayMode,
    };
  }

  /**
   * Restore state from serialization.
   */
  setState(state: LayerControllerState): void {
    this.layerManager.setVisibilityState(state.visibility);
    this.focusModeEnabled = state.focusMode;
    this.focusedLayers = new Set(state.focusedLayers);
    this.dimOpacity = state.dimOpacity;
    this.displayMode = state.displayMode;
    this.applyDisplayState();
  }

  // ---------------------------------------------------------------------------
  // HTML Integration
  // ---------------------------------------------------------------------------

  /**
   * Generate JavaScript for interactive layer controls.
   */
  generateControlScript(): string {
    const layers = this.layerManager.getLayers();
    const state = this.getState();

    return `
// VectorCaliper Layer Controller
(function() {
  const VC_LAYER_STATE = ${JSON.stringify(state)};
  const VC_LAYERS = ${JSON.stringify(layers)};

  // Layer visibility toggle
  window.vcToggleLayer = function(layerId) {
    const current = VC_LAYER_STATE.visibility[layerId];
    VC_LAYER_STATE.visibility[layerId] = !current;
    applyLayerVisibility(layerId, !current);
    return !current;
  };

  // Focus mode toggle
  window.vcEnableFocusMode = function(dimOpacity = 0.2) {
    VC_LAYER_STATE.focusMode = true;
    VC_LAYER_STATE.dimOpacity = dimOpacity;
    applyAllLayers();
  };

  window.vcDisableFocusMode = function() {
    VC_LAYER_STATE.focusMode = false;
    VC_LAYER_STATE.focusedLayers = [];
    applyAllLayers();
  };

  window.vcFocusLayer = function(layerId) {
    if (!VC_LAYER_STATE.focusMode) {
      window.vcEnableFocusMode();
    }
    if (!VC_LAYER_STATE.focusedLayers.includes(layerId)) {
      VC_LAYER_STATE.focusedLayers.push(layerId);
    }
    applyAllLayers();
  };

  window.vcClearFocus = function() {
    VC_LAYER_STATE.focusedLayers = [];
    applyAllLayers();
  };

  // Apply visibility to a layer
  function applyLayerVisibility(layerId, visible) {
    const layer = VC_LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    for (const sceneLayerId of layer.sceneLayerIds) {
      const elements = document.querySelectorAll('[data-vc-layer="' + sceneLayerId + '"]');
      elements.forEach(el => {
        if (VC_LAYER_STATE.focusMode && VC_LAYER_STATE.focusedLayers.length > 0) {
          const isFocused = VC_LAYER_STATE.focusedLayers.includes(layerId);
          if (!visible) {
            el.style.display = 'none';
          } else if (isFocused) {
            el.style.display = '';
            el.style.opacity = '';
          } else {
            el.style.display = '';
            el.style.opacity = VC_LAYER_STATE.dimOpacity;
          }
        } else {
          el.style.display = visible ? '' : 'none';
          el.style.opacity = '';
        }
      });
    }
  }

  // Apply all layers
  function applyAllLayers() {
    for (const layer of VC_LAYERS) {
      applyLayerVisibility(layer.id, VC_LAYER_STATE.visibility[layer.id] !== false);
    }
  }

  // Get current state
  window.vcGetLayerState = function() {
    return JSON.parse(JSON.stringify(VC_LAYER_STATE));
  };

  // Initialize on load
  document.addEventListener('DOMContentLoaded', applyAllLayers);
})();
`;
  }

  /**
   * Generate HTML controls for layer visibility.
   */
  generateControlsHTML(): string {
    const layers = this.layerManager.getLayers();

    let html = '<div class="vc-layer-controls">\n';
    html += '  <div class="vc-layer-controls-header">Layers</div>\n';

    for (const layer of layers) {
      const checked = this.layerManager.isVisible(layer.id) ? 'checked' : '';
      html += `  <label class="vc-layer-toggle">
    <input type="checkbox" ${checked} onchange="vcToggleLayer('${layer.id}')">
    <span>${escapeHtml(layer.name)}</span>
  </label>\n`;
    }

    html += '  <div class="vc-layer-controls-actions">\n';
    html += '    <button onclick="vcEnableFocusMode()">Focus Mode</button>\n';
    html += '    <button onclick="vcDisableFocusMode()">Normal Mode</button>\n';
    html += '  </div>\n';
    html += '</div>';

    return html;
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// CSS for Layer Controls
// =============================================================================

export const LAYER_CONTROLS_CSS = `
.vc-layer-controls {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
}

.vc-layer-controls-header {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.vc-layer-toggle {
  display: block;
  padding: 4px 0;
  cursor: pointer;
}

.vc-layer-toggle input {
  margin-right: 8px;
}

.vc-layer-controls-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 4px;
}

.vc-layer-controls-actions button {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 11px;
}

.vc-layer-controls-actions button:hover {
  background: #eee;
}
`;
