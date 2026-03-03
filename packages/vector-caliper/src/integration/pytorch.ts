/**
 * PyTorch Adapter
 *
 * Enable first-class PyTorch adoption.
 * Zero dependency on training loop structure.
 *
 * Rules:
 * - Adapter is opt-in
 * - No monkey-patching
 * - Hooks are explicit and removable
 *
 * Acceptance criteria:
 * - Same PyTorch run → same VectorCaliper state stream
 * - Adapter removable with zero training behavior change
 */

import {
  IntegrationPayload,
  ContractValidator,
  INTEGRATION_CONTRACT_VERSION,
} from './contract';

/**
 * PyTorch model interface (minimal requirements).
 * This is what VectorCaliper needs from a PyTorch model.
 * Users can implement this or use the provided helpers.
 */
export interface PyTorchModelInterface {
  /** Get all named parameters as [name, tensor] pairs */
  namedParameters(): Iterable<[string, { data: { norm(): number }; grad?: { norm(): number } }]>;
}

/**
 * PyTorch optimizer interface (minimal requirements).
 */
export interface PyTorchOptimizerInterface {
  /** Get parameter groups */
  paramGroups: Array<{ lr: number; [key: string]: unknown }>;
}

/**
 * Capture configuration for PyTorch adapter.
 */
export interface PyTorchCaptureConfig {
  /** Run identifier */
  runId: string;
  /** Run name for display */
  runName?: string;
  /** Whether to capture momentum alignment (requires optimizer state) */
  captureMomentumAlignment?: boolean;
  /** Custom metadata extractor */
  metadataExtractor?: () => Record<string, unknown>;
  /** Callback after each capture */
  onCapture?: (payload: IntegrationPayload) => void;
}

/**
 * Default capture configuration.
 */
export const DEFAULT_PYTORCH_CONFIG: Required<Omit<PyTorchCaptureConfig, 'runId' | 'runName' | 'metadataExtractor' | 'onCapture'>> = {
  captureMomentumAlignment: false,
};

/**
 * Captured state from PyTorch training.
 */
export interface CapturedState {
  /** Integration payload */
  payload: IntegrationPayload;
  /** Whether the capture is valid */
  valid: boolean;
  /** Validation errors (if any) */
  errors: string[];
}

/**
 * PyTorch Adapter
 *
 * Captures training state from PyTorch models.
 * Explicit hooks, no monkey-patching, fully removable.
 */
export class PyTorchAdapter {
  private readonly config: PyTorchCaptureConfig;
  private readonly validator = new ContractValidator();
  private readonly captures: IntegrationPayload[] = [];
  private previousParams: Map<string, number> = new Map();
  private currentStep = 0;
  private currentEpoch = 0;

  constructor(config: PyTorchCaptureConfig) {
    this.config = {
      ...DEFAULT_PYTORCH_CONFIG,
      ...config,
    };
  }

  /**
   * Capture training state after a step.
   *
   * This is the main entry point. Call this after optimizer.step().
   *
   * @param model - PyTorch model (or object implementing PyTorchModelInterface)
   * @param optimizer - PyTorch optimizer (or object implementing PyTorchOptimizerInterface)
   * @param loss - Current loss value
   * @param accuracy - Optional accuracy value
   */
  capture(
    model: PyTorchModelInterface,
    optimizer: PyTorchOptimizerInterface,
    loss: number,
    accuracy?: number
  ): CapturedState {
    // Compute norms
    const { parameterNorm, gradientNorm, updateNorm } = this.computeNorms(model);

    // Get learning rate from optimizer
    const learningRate = this.getLearningRate(optimizer);

    // Compute momentum alignment if configured
    const momentumAlignment = this.config.captureMomentumAlignment
      ? this.computeMomentumAlignment(optimizer)
      : undefined;

    // Build payload
    const payload: IntegrationPayload = {
      step: this.currentStep,
      epoch: this.currentEpoch,
      learningRate,
      loss,
      gradientNorm,
      updateNorm,
      parameterNorm,
      accuracy,
      momentumAlignment,
      timestamp: new Date().toISOString(),
      source: 'pytorch',
      contractVersion: INTEGRATION_CONTRACT_VERSION,
      metadata: this.config.metadataExtractor?.(),
    };

    // Validate
    const result = this.validator.validate(payload);

    if (result.valid) {
      this.captures.push(payload);
      this.config.onCapture?.(payload);
    }

    // Update state for next capture
    this.updatePreviousParams(model);
    this.currentStep++;

    return {
      payload,
      valid: result.valid,
      errors: result.errors.map((e) => `${e.field}: ${e.message}`),
    };
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
   * Get captures as JSON string.
   */
  exportJSON(): string {
    return JSON.stringify(this.captures, null, 2);
  }

  /**
   * Clear all captures.
   */
  clear(): void {
    this.captures.length = 0;
    this.previousParams.clear();
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

  // Private helpers

  private computeNorms(model: PyTorchModelInterface): {
    parameterNorm: number;
    gradientNorm: number;
    updateNorm: number;
  } {
    let parameterNormSq = 0;
    let gradientNormSq = 0;
    let updateNormSq = 0;

    for (const [name, param] of model.namedParameters()) {
      // Parameter norm
      const paramNorm = param.data.norm();
      parameterNormSq += paramNorm * paramNorm;

      // Gradient norm
      if (param.grad) {
        const gradNorm = param.grad.norm();
        gradientNormSq += gradNorm * gradNorm;
      }

      // Update norm (change in parameters since last capture)
      const prevNorm = this.previousParams.get(name);
      if (prevNorm !== undefined) {
        const diff = paramNorm - prevNorm;
        updateNormSq += diff * diff;
      }
    }

    return {
      parameterNorm: Math.sqrt(parameterNormSq),
      gradientNorm: Math.sqrt(gradientNormSq),
      updateNorm: Math.sqrt(updateNormSq),
    };
  }

  private updatePreviousParams(model: PyTorchModelInterface): void {
    this.previousParams.clear();
    for (const [name, param] of model.namedParameters()) {
      this.previousParams.set(name, param.data.norm());
    }
  }

  private getLearningRate(optimizer: PyTorchOptimizerInterface): number {
    // Get LR from first param group
    if (optimizer.paramGroups.length > 0) {
      return optimizer.paramGroups[0].lr;
    }
    return 0.001; // Default fallback
  }

  private computeMomentumAlignment(_optimizer: PyTorchOptimizerInterface): number | undefined {
    // This would require access to optimizer state (momentum buffer)
    // Returning undefined for now as it requires PyTorch-specific implementation
    return undefined;
  }
}

/**
 * Create a PyTorch hook function for use with model.register_forward_hook.
 * This is a convenience wrapper for manual integration.
 */
export function createCaptureHook(
  adapter: PyTorchAdapter,
  optimizer: PyTorchOptimizerInterface,
  getLoss: () => number,
  getAccuracy?: () => number
): (model: PyTorchModelInterface) => CapturedState {
  return (model: PyTorchModelInterface) => {
    return adapter.capture(
      model,
      optimizer,
      getLoss(),
      getAccuracy?.()
    );
  };
}

/**
 * Verify that a model implements the required interface.
 */
export function verifyModelInterface(model: unknown): model is PyTorchModelInterface {
  if (typeof model !== 'object' || model === null) {
    return false;
  }

  const obj = model as Record<string, unknown>;
  return typeof obj.namedParameters === 'function';
}

/**
 * Verify that an optimizer implements the required interface.
 */
export function verifyOptimizerInterface(optimizer: unknown): optimizer is PyTorchOptimizerInterface {
  if (typeof optimizer !== 'object' || optimizer === null) {
    return false;
  }

  const obj = optimizer as Record<string, unknown>;
  return Array.isArray(obj.paramGroups);
}

/**
 * Mock model for testing.
 */
export class MockPyTorchModel implements PyTorchModelInterface {
  private params: Map<string, { data: { norm(): number }; grad?: { norm(): number } }>;

  constructor(paramSpecs: Array<{ name: string; norm: number; gradNorm?: number }>) {
    this.params = new Map();
    for (const spec of paramSpecs) {
      this.params.set(spec.name, {
        data: { norm: () => spec.norm },
        grad: spec.gradNorm !== undefined ? { norm: () => spec.gradNorm! } : undefined,
      });
    }
  }

  namedParameters(): Iterable<[string, { data: { norm(): number }; grad?: { norm(): number } }]> {
    return this.params.entries();
  }

  updateParam(name: string, norm: number, gradNorm?: number): void {
    this.params.set(name, {
      data: { norm: () => norm },
      grad: gradNorm !== undefined ? { norm: () => gradNorm } : undefined,
    });
  }
}

/**
 * Mock optimizer for testing.
 */
export class MockPyTorchOptimizer implements PyTorchOptimizerInterface {
  paramGroups: Array<{ lr: number }>;

  constructor(lr: number = 0.001) {
    this.paramGroups = [{ lr }];
  }

  setLearningRate(lr: number): void {
    this.paramGroups[0].lr = lr;
  }
}

/**
 * Python code template for PyTorch integration.
 * Users can copy this into their training script.
 */
export const PYTORCH_INTEGRATION_TEMPLATE = `
# VectorCaliper PyTorch Integration Template
# Copy this into your training script

import json

class VectorCaliperCapture:
    """Capture training state for VectorCaliper."""

    def __init__(self, run_id: str):
        self.run_id = run_id
        self.captures = []
        self.step = 0
        self.epoch = 0

    def capture(self, model, optimizer, loss: float, accuracy: float = None):
        """Call after optimizer.step()"""
        # Compute norms
        param_norm_sq = 0
        grad_norm_sq = 0

        for param in model.parameters():
            param_norm_sq += param.data.norm().item() ** 2
            if param.grad is not None:
                grad_norm_sq += param.grad.norm().item() ** 2

        payload = {
            "step": self.step,
            "epoch": self.epoch,
            "learningRate": optimizer.param_groups[0]["lr"],
            "loss": loss,
            "gradientNorm": grad_norm_sq ** 0.5,
            "updateNorm": 0,  # Would need to track previous params
            "parameterNorm": param_norm_sq ** 0.5,
            "accuracy": accuracy,
            "source": "pytorch",
            "contractVersion": "v1"
        }

        self.captures.append(payload)
        self.step += 1
        return payload

    def new_epoch(self):
        self.epoch += 1

    def export_json(self, path: str):
        with open(path, "w") as f:
            json.dump(self.captures, f, indent=2)

# Usage in training loop:
# capture = VectorCaliperCapture("my_run")
# for epoch in range(num_epochs):
#     for batch in dataloader:
#         optimizer.zero_grad()
#         loss = criterion(model(batch), targets)
#         loss.backward()
#         optimizer.step()
#         capture.capture(model, optimizer, loss.item())
#     capture.new_epoch()
# capture.export_json("captures.json")
`;
