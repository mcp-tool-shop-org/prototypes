/**
 * JAX Adapter
 *
 * Support functional / compiled training loops.
 * Pure-function hooks compatible with jit and pmap.
 *
 * Rules:
 * - Adapter must be referentially transparent
 * - State extraction must be explicit in the user code
 * - No hidden side effects
 *
 * Acceptance criteria:
 * - JAX compilation remains valid
 * - VectorCaliper capture does not break jit
 */

import {
  IntegrationPayload,
  ContractValidator,
  INTEGRATION_CONTRACT_VERSION,
} from './contract';

/**
 * JAX array-like interface (minimal requirements).
 * This is what VectorCaliper needs from a JAX array.
 */
export interface JAXArrayLike {
  /** Get the L2 norm of the array */
  norm?: () => number;
  /** Alternative: flat array access */
  flatten?: () => { tolist: () => number[] };
}

/**
 * JAX params tree interface.
 * Parameters are typically nested dicts/pytrees.
 */
export type JAXParamsTree = {
  [key: string]: JAXArrayLike | JAXParamsTree;
};

/**
 * JAX optimizer state interface (minimal).
 */
export interface JAXOptStateInterface {
  /** Current learning rate (may be in hyperparams or state) */
  hyperparams?: { learning_rate: number };
  /** Alternative: inner state with step count */
  inner_state?: { count: number };
}

/**
 * Training step result for JAX.
 * This is what a training step should return for capture.
 */
export interface JAXStepResult {
  /** Current loss value */
  loss: number;
  /** Current params tree */
  params: JAXParamsTree;
  /** Gradients tree (same structure as params) */
  grads: JAXParamsTree;
  /** Optimizer state */
  optState: JAXOptStateInterface;
  /** Optional: accuracy value */
  accuracy?: number;
  /** Optional: any additional metrics */
  metrics?: Record<string, number>;
}

/**
 * Capture configuration for JAX adapter.
 */
export interface JAXCaptureConfig {
  /** Run identifier */
  runId: string;
  /** Run name for display */
  runName?: string;
  /** Learning rate extractor (since JAX optimizers vary) */
  learningRateExtractor?: (optState: JAXOptStateInterface) => number;
  /** Custom metadata extractor */
  metadataExtractor?: () => Record<string, unknown>;
}

/**
 * Default capture configuration.
 */
export const DEFAULT_JAX_CONFIG: Required<Omit<JAXCaptureConfig, 'runId' | 'runName' | 'metadataExtractor'>> = {
  learningRateExtractor: (optState) => optState.hyperparams?.learning_rate ?? 0.001,
};

/**
 * Captured state from JAX training.
 */
export interface JAXCapturedState {
  /** Integration payload */
  payload: IntegrationPayload;
  /** Whether the capture is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors: string[];
}

/**
 * Pure capture function for JAX.
 *
 * This is a pure function that takes step result and returns capture data.
 * It has no side effects and is safe to use inside jit-compiled functions
 * (though the actual I/O should happen outside jit).
 *
 * @param result - Training step result
 * @param step - Current step number
 * @param epoch - Current epoch number
 * @param config - Capture configuration
 * @param previousParamNorms - Previous parameter norms for update computation
 * @returns Captured state and new param norms
 */
export function captureJAXStep(
  result: JAXStepResult,
  step: number,
  epoch: number,
  config: JAXCaptureConfig,
  previousParamNorms?: Map<string, number>
): {
  captured: JAXCapturedState;
  paramNorms: Map<string, number>;
} {
  const mergedConfig = { ...DEFAULT_JAX_CONFIG, ...config };
  const validator = new ContractValidator();

  // Compute norms
  const { parameterNorm, gradientNorm, paramNorms } = computeTreeNorms(result.params, result.grads);

  // Compute update norm from previous params
  let updateNorm = 0;
  if (previousParamNorms && previousParamNorms.size > 0) {
    let updateNormSq = 0;
    for (const [key, newNorm] of paramNorms) {
      const prevNorm = previousParamNorms.get(key);
      if (prevNorm !== undefined) {
        const diff = newNorm - prevNorm;
        updateNormSq += diff * diff;
      }
    }
    updateNorm = Math.sqrt(updateNormSq);
  }

  // Get learning rate
  const learningRate = mergedConfig.learningRateExtractor(result.optState);

  // Build payload
  const payload: IntegrationPayload = {
    step,
    epoch,
    learningRate,
    loss: result.loss,
    gradientNorm,
    updateNorm,
    parameterNorm,
    accuracy: result.accuracy,
    timestamp: new Date().toISOString(),
    source: 'jax',
    contractVersion: INTEGRATION_CONTRACT_VERSION,
    metadata: {
      ...config.metadataExtractor?.(),
      ...result.metrics,
    },
  };

  // Validate
  const validationResult = validator.validate(payload);

  return {
    captured: {
      payload,
      valid: validationResult.valid,
      errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
    },
    paramNorms,
  };
}

/**
 * Compute norms from a JAX params/grads tree.
 */
function computeTreeNorms(
  params: JAXParamsTree,
  grads: JAXParamsTree,
  prefix: string = ''
): {
  parameterNorm: number;
  gradientNorm: number;
  paramNorms: Map<string, number>;
} {
  let paramNormSq = 0;
  let gradNormSq = 0;
  const paramNorms = new Map<string, number>();

  function traverse(
    p: JAXParamsTree | JAXArrayLike,
    g: JAXParamsTree | JAXArrayLike,
    path: string
  ): void {
    // Check if it's a leaf (array-like)
    if (isArrayLike(p)) {
      const pNorm = getArrayNorm(p);
      const gNorm = isArrayLike(g) ? getArrayNorm(g) : 0;

      paramNormSq += pNorm * pNorm;
      gradNormSq += gNorm * gNorm;
      paramNorms.set(path, pNorm);
    } else {
      // It's a nested tree
      for (const key of Object.keys(p)) {
        const newPath = path ? `${path}.${key}` : key;
        traverse(
          p[key] as JAXParamsTree | JAXArrayLike,
          (g as JAXParamsTree)?.[key] as JAXParamsTree | JAXArrayLike ?? {},
          newPath
        );
      }
    }
  }

  traverse(params, grads, prefix);

  return {
    parameterNorm: Math.sqrt(paramNormSq),
    gradientNorm: Math.sqrt(gradNormSq),
    paramNorms,
  };
}

/**
 * Check if an object is array-like (has norm or flatten method).
 */
function isArrayLike(obj: unknown): obj is JAXArrayLike {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.norm === 'function' || typeof o.flatten === 'function';
}

/**
 * Get norm from an array-like object.
 */
function getArrayNorm(arr: JAXArrayLike): number {
  if (arr.norm) {
    return arr.norm();
  }
  if (arr.flatten) {
    const flat = arr.flatten().tolist();
    return Math.sqrt(flat.reduce((sum, v) => sum + v * v, 0));
  }
  return 0;
}

/**
 * JAX Adapter (stateful wrapper)
 *
 * For users who prefer stateful API similar to PyTorch adapter.
 * Wraps the pure functions with state management.
 */
export class JAXAdapter {
  private readonly config: JAXCaptureConfig;
  private readonly validator = new ContractValidator();
  private readonly captures: IntegrationPayload[] = [];
  private previousParamNorms: Map<string, number> = new Map();
  private currentStep = 0;
  private currentEpoch = 0;

  constructor(config: JAXCaptureConfig) {
    this.config = {
      ...DEFAULT_JAX_CONFIG,
      ...config,
    };
  }

  /**
   * Capture training state after a step.
   *
   * @param result - Training step result
   */
  capture(result: JAXStepResult): JAXCapturedState {
    const { captured, paramNorms } = captureJAXStep(
      result,
      this.currentStep,
      this.currentEpoch,
      this.config,
      this.previousParamNorms
    );

    if (captured.valid) {
      this.captures.push(captured.payload);
    }

    this.previousParamNorms = paramNorms;
    this.currentStep++;

    return captured;
  }

  /**
   * Mark the start of a new epoch.
   */
  newEpoch(): void {
    this.currentEpoch++;
  }

  /**
   * Set the current epoch explicitly.
   */
  setEpoch(epoch: number): void {
    this.currentEpoch = epoch;
  }

  /**
   * Set the current step explicitly.
   */
  setStep(step: number): void {
    this.currentStep = step;
  }

  /**
   * Get all captured payloads.
   */
  getCaptures(): ReadonlyArray<IntegrationPayload> {
    return [...this.captures];
  }

  /**
   * Export captures as JSON string.
   */
  exportJSON(): string {
    return JSON.stringify(this.captures, null, 2);
  }

  /**
   * Clear all captures.
   */
  clear(): void {
    this.captures.length = 0;
    this.previousParamNorms.clear();
    this.currentStep = 0;
    this.currentEpoch = 0;
  }

  /**
   * Get summary statistics.
   */
  getSummary(): {
    captureCount: number;
    stepRange: [number, number] | null;
    epochRange: [number, number] | null;
    lossRange: [number, number] | null;
  } {
    if (this.captures.length === 0) {
      return {
        captureCount: 0,
        stepRange: null,
        epochRange: null,
        lossRange: null,
      };
    }

    const steps = this.captures.map((c) => c.step);
    const epochs = this.captures.map((c) => c.epoch);
    const losses = this.captures.map((c) => c.loss);

    return {
      captureCount: this.captures.length,
      stepRange: [Math.min(...steps), Math.max(...steps)],
      epochRange: [Math.min(...epochs), Math.max(...epochs)],
      lossRange: [Math.min(...losses), Math.max(...losses)],
    };
  }
}

/**
 * Mock JAX array for testing.
 */
export class MockJAXArray implements JAXArrayLike {
  constructor(private values: number[]) {}

  norm(): number {
    return Math.sqrt(this.values.reduce((sum, v) => sum + v * v, 0));
  }

  flatten(): { tolist: () => number[] } {
    return { tolist: () => this.values };
  }
}

/**
 * Create a mock JAX params tree for testing.
 */
export function createMockParamsTree(spec: Record<string, number[]>): JAXParamsTree {
  const tree: JAXParamsTree = {};
  for (const [key, values] of Object.entries(spec)) {
    tree[key] = new MockJAXArray(values);
  }
  return tree;
}

/**
 * Create a mock JAX optimizer state for testing.
 */
export function createMockOptState(lr: number = 0.001): JAXOptStateInterface {
  return {
    hyperparams: { learning_rate: lr },
  };
}

/**
 * Verify referential transparency of the capture function.
 * Same inputs should always produce same outputs (excluding timestamp).
 */
export function verifyReferentialTransparency(
  result: JAXStepResult,
  step: number,
  epoch: number,
  config: JAXCaptureConfig,
  iterations: number = 3
): boolean {
  const results: string[] = [];

  for (let i = 0; i < iterations; i++) {
    const { captured } = captureJAXStep(result, step, epoch, config);
    // Exclude timestamp for comparison
    const { timestamp, ...rest } = captured.payload;
    results.push(JSON.stringify(rest));
  }

  return results.every((r) => r === results[0]);
}

/**
 * Python code template for JAX integration.
 * Users can copy this into their training script.
 */
export const JAX_INTEGRATION_TEMPLATE = `
# VectorCaliper JAX Integration Template
# Copy this into your training script

import json
import jax
import jax.numpy as jnp
from typing import Dict, Any, NamedTuple

class CaptureState(NamedTuple):
    step: int
    epoch: int
    previous_param_norms: Dict[str, float]
    captures: list

def tree_norm(tree):
    """Compute L2 norm of a pytree."""
    leaves = jax.tree_util.tree_leaves(tree)
    return jnp.sqrt(sum(jnp.sum(x ** 2) for x in leaves))

def tree_param_norms(tree, prefix="") -> Dict[str, float]:
    """Get per-parameter norms for update tracking."""
    norms = {}
    for key, value in tree.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            norms.update(tree_param_norms(value, path))
        else:
            norms[path] = float(jnp.linalg.norm(value))
    return norms

def capture_step(
    params,
    grads,
    opt_state,
    loss: float,
    state: CaptureState,
    learning_rate: float,
    accuracy: float = None
) -> CaptureState:
    """Capture training state. Call after optimizer.update()"""

    param_norm = float(tree_norm(params))
    grad_norm = float(tree_norm(grads))
    param_norms = tree_param_norms(params)

    # Compute update norm
    update_norm = 0.0
    if state.previous_param_norms:
        update_norm_sq = 0.0
        for key, new_norm in param_norms.items():
            prev_norm = state.previous_param_norms.get(key, new_norm)
            update_norm_sq += (new_norm - prev_norm) ** 2
        update_norm = update_norm_sq ** 0.5

    payload = {
        "step": state.step,
        "epoch": state.epoch,
        "learningRate": learning_rate,
        "loss": loss,
        "gradientNorm": grad_norm,
        "updateNorm": update_norm,
        "parameterNorm": param_norm,
        "accuracy": accuracy,
        "source": "jax",
        "contractVersion": "v1"
    }

    return CaptureState(
        step=state.step + 1,
        epoch=state.epoch,
        previous_param_norms=param_norms,
        captures=state.captures + [payload]
    )

def new_epoch(state: CaptureState) -> CaptureState:
    return state._replace(epoch=state.epoch + 1)

def export_json(state: CaptureState, path: str):
    with open(path, "w") as f:
        json.dump(state.captures, f, indent=2)

# Usage in training loop (outside jit):
# state = CaptureState(0, 0, {}, [])
# for epoch in range(num_epochs):
#     for batch in dataloader:
#         params, opt_state, loss, grads = train_step(params, opt_state, batch)
#         state = capture_step(params, grads, opt_state, loss, state, lr)
#     state = new_epoch(state)
# export_json(state, "captures.json")
`;
