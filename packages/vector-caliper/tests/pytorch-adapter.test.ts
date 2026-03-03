/**
 * PyTorch Adapter Tests
 *
 * Acceptance criteria:
 * - Same PyTorch run → same VectorCaliper state stream
 * - Adapter removable with zero training behavior change
 * - No monkey-patching
 * - Hooks are explicit and removable
 */

import { describe, it, expect } from 'vitest';
import {
  PyTorchAdapter,
  MockPyTorchModel,
  MockPyTorchOptimizer,
  createCaptureHook,
  verifyModelInterface,
  verifyOptimizerInterface,
  PYTORCH_INTEGRATION_TEMPLATE,
  PyTorchCaptureConfig,
} from '../src/integration/pytorch';
import { INTEGRATION_CONTRACT_VERSION } from '../src/integration/contract';

describe('PyTorchAdapter', () => {
  describe('Basic Capture', () => {
    it('captures training state', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'layer1.weight', norm: 10, gradNorm: 1 },
        { name: 'layer1.bias', norm: 1, gradNorm: 0.1 },
      ]);
      const optimizer = new MockPyTorchOptimizer(0.001);

      const result = adapter.capture(model, optimizer, 1.5, 0.85);

      expect(result.valid).toBe(true);
      expect(result.payload.step).toBe(0);
      expect(result.payload.epoch).toBe(0);
      expect(result.payload.loss).toBe(1.5);
      expect(result.payload.accuracy).toBe(0.85);
      expect(result.payload.learningRate).toBe(0.001);
      expect(result.payload.source).toBe('pytorch');
    });

    it('increments step on each capture', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.capture(model, optimizer, 1.4);
      adapter.capture(model, optimizer, 1.3);

      const captures = adapter.getCaptures();
      expect(captures[0].step).toBe(0);
      expect(captures[1].step).toBe(1);
      expect(captures[2].step).toBe(2);
    });

    it('tracks epoch correctly', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.newEpoch();
      adapter.capture(model, optimizer, 1.4);
      adapter.newEpoch();
      adapter.capture(model, optimizer, 1.3);

      const captures = adapter.getCaptures();
      expect(captures[0].epoch).toBe(0);
      expect(captures[1].epoch).toBe(1);
      expect(captures[2].epoch).toBe(2);
    });

    it('allows setting epoch explicitly', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.setEpoch(5);
      adapter.capture(model, optimizer, 1.5);

      const captures = adapter.getCaptures();
      expect(captures[0].epoch).toBe(5);
    });

    it('allows setting step explicitly', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.setStep(100);
      adapter.capture(model, optimizer, 1.5);

      const captures = adapter.getCaptures();
      expect(captures[0].step).toBe(100);
    });
  });

  describe('Norm Computation', () => {
    it('computes parameter norm correctly', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'w1', norm: 3, gradNorm: 0 },
        { name: 'w2', norm: 4, gradNorm: 0 },
      ]); // 3^2 + 4^2 = 25, sqrt = 5
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.payload.parameterNorm).toBeCloseTo(5, 10);
    });

    it('computes gradient norm correctly', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'w1', norm: 10, gradNorm: 3 },
        { name: 'w2', norm: 10, gradNorm: 4 },
      ]); // 3^2 + 4^2 = 25, sqrt = 5
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.payload.gradientNorm).toBeCloseTo(5, 10);
    });

    it('handles missing gradients', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'w1', norm: 10 }, // No gradient
        { name: 'w2', norm: 10 }, // No gradient
      ]);
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.valid).toBe(true);
      expect(result.payload.gradientNorm).toBe(0);
    });

    it('computes update norm from parameter changes', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'w1', norm: 10, gradNorm: 1 },
      ]);
      const optimizer = new MockPyTorchOptimizer();

      // First capture (no previous params)
      adapter.capture(model, optimizer, 1.0);
      expect(adapter.getCaptures()[0].updateNorm).toBe(0);

      // Update model and capture again
      model.updateParam('w1', 11, 1);
      adapter.capture(model, optimizer, 0.9);

      // Update norm should reflect the change (11 - 10 = 1)
      expect(adapter.getCaptures()[1].updateNorm).toBeCloseTo(1, 10);
    });
  });

  describe('Learning Rate', () => {
    it('reads learning rate from optimizer', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer(0.01);

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.payload.learningRate).toBe(0.01);
    });

    it('tracks learning rate changes', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer(0.01);

      adapter.capture(model, optimizer, 1.0);

      optimizer.setLearningRate(0.001);
      adapter.capture(model, optimizer, 0.9);

      const captures = adapter.getCaptures();
      expect(captures[0].learningRate).toBe(0.01);
      expect(captures[1].learningRate).toBe(0.001);
    });
  });

  describe('Configuration', () => {
    it('includes contract version', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.payload.contractVersion).toBe(INTEGRATION_CONTRACT_VERSION);
    });

    it('includes timestamp', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      const before = new Date().toISOString();
      const result = adapter.capture(model, optimizer, 1.0);
      const after = new Date().toISOString();

      expect(result.payload.timestamp).toBeDefined();
      expect(result.payload.timestamp! >= before).toBe(true);
      expect(result.payload.timestamp! <= after).toBe(true);
    });

    it('calls onCapture callback', () => {
      const captured: any[] = [];
      const adapter = new PyTorchAdapter({
        runId: 'test',
        onCapture: (payload) => captured.push(payload),
      });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.0);
      adapter.capture(model, optimizer, 0.9);

      expect(captured).toHaveLength(2);
    });

    it('includes custom metadata', () => {
      const adapter = new PyTorchAdapter({
        runId: 'test',
        metadataExtractor: () => ({ experiment: 'test', batch_size: 32 }),
      });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, 1.0);

      expect(result.payload.metadata).toEqual({ experiment: 'test', batch_size: 32 });
    });
  });

  describe('Export', () => {
    it('exports captures as JSON', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.capture(model, optimizer, 1.4);

      const json = adapter.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].loss).toBe(1.5);
      expect(parsed[1].loss).toBe(1.4);
    });

    it('provides summary statistics', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.newEpoch();
      adapter.capture(model, optimizer, 1.0);
      adapter.capture(model, optimizer, 0.5);

      const summary = adapter.getSummary();

      expect(summary.captureCount).toBe(3);
      expect(summary.stepRange).toEqual([0, 2]);
      expect(summary.epochRange).toEqual([0, 1]);
      expect(summary.lossRange).toEqual([0.5, 1.5]);
    });

    it('handles empty captures in summary', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });

      const summary = adapter.getSummary();

      expect(summary.captureCount).toBe(0);
      expect(summary.stepRange).toBeNull();
      expect(summary.epochRange).toBeNull();
      expect(summary.lossRange).toBeNull();
    });
  });

  describe('Clear', () => {
    it('clears all captures', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.capture(model, optimizer, 1.4);
      adapter.clear();

      expect(adapter.getCaptures()).toHaveLength(0);
    });

    it('resets step and epoch on clear', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, 1.5);
      adapter.newEpoch();
      adapter.capture(model, optimizer, 1.4);
      adapter.clear();
      adapter.capture(model, optimizer, 1.3);

      expect(adapter.getCaptures()[0].step).toBe(0);
      expect(adapter.getCaptures()[0].epoch).toBe(0);
    });
  });

  describe('Validation', () => {
    it('rejects invalid loss', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      const result = adapter.capture(model, optimizer, -1); // Invalid

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('does not store invalid captures', () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
      const optimizer = new MockPyTorchOptimizer();

      adapter.capture(model, optimizer, -1); // Invalid

      expect(adapter.getCaptures()).toHaveLength(0);
    });
  });
});

describe('Interface Verification', () => {
  it('verifies valid model interface', () => {
    const model = new MockPyTorchModel([]);
    expect(verifyModelInterface(model)).toBe(true);
  });

  it('rejects invalid model interface', () => {
    expect(verifyModelInterface(null)).toBe(false);
    expect(verifyModelInterface({})).toBe(false);
    expect(verifyModelInterface({ namedParameters: 'not a function' })).toBe(false);
  });

  it('verifies valid optimizer interface', () => {
    const optimizer = new MockPyTorchOptimizer();
    expect(verifyOptimizerInterface(optimizer)).toBe(true);
  });

  it('rejects invalid optimizer interface', () => {
    expect(verifyOptimizerInterface(null)).toBe(false);
    expect(verifyOptimizerInterface({})).toBe(false);
    expect(verifyOptimizerInterface({ paramGroups: 'not an array' })).toBe(false);
  });
});

describe('Capture Hook', () => {
  it('creates a reusable capture function', () => {
    const adapter = new PyTorchAdapter({ runId: 'test' });
    const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
    const optimizer = new MockPyTorchOptimizer();

    let currentLoss = 1.5;
    const hook = createCaptureHook(adapter, optimizer, () => currentLoss);

    hook(model);
    currentLoss = 1.4;
    hook(model);

    const captures = adapter.getCaptures();
    expect(captures).toHaveLength(2);
    expect(captures[0].loss).toBe(1.5);
    expect(captures[1].loss).toBe(1.4);
  });

  it('supports optional accuracy function', () => {
    const adapter = new PyTorchAdapter({ runId: 'test' });
    const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
    const optimizer = new MockPyTorchOptimizer();

    let accuracy = 0.8;
    const hook = createCaptureHook(
      adapter,
      optimizer,
      () => 1.0,
      () => accuracy
    );

    hook(model);
    accuracy = 0.9;
    hook(model);

    const captures = adapter.getCaptures();
    expect(captures[0].accuracy).toBe(0.8);
    expect(captures[1].accuracy).toBe(0.9);
  });
});

describe('Python Template', () => {
  it('includes Python integration code', () => {
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('class VectorCaliperCapture');
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('def capture');
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('def new_epoch');
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('def export_json');
  });

  it('includes usage example', () => {
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('optimizer.step()');
    expect(PYTORCH_INTEGRATION_TEMPLATE).toContain('capture.capture');
  });
});

describe('Determinism', () => {
  it('produces identical captures for identical inputs', () => {
    const createCaptures = () => {
      const adapter = new PyTorchAdapter({ runId: 'test' });
      const model = new MockPyTorchModel([
        { name: 'w1', norm: 10, gradNorm: 1 },
        { name: 'w2', norm: 5, gradNorm: 0.5 },
      ]);
      const optimizer = new MockPyTorchOptimizer(0.001);

      adapter.capture(model, optimizer, 1.5, 0.8);
      model.updateParam('w1', 10.1, 0.9);
      adapter.capture(model, optimizer, 1.4, 0.85);

      return adapter.getCaptures().map((c) => ({
        step: c.step,
        epoch: c.epoch,
        loss: c.loss,
        accuracy: c.accuracy,
        parameterNorm: c.parameterNorm,
        gradientNorm: c.gradientNorm,
      }));
    };

    const result1 = createCaptures();
    const result2 = createCaptures();

    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});

describe('Removability', () => {
  it('does not modify model state', () => {
    const adapter = new PyTorchAdapter({ runId: 'test' });
    const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
    const optimizer = new MockPyTorchOptimizer();

    // Capture model state before
    const paramsBefore = Array.from(model.namedParameters()).map(([name, p]) => ({
      name,
      norm: p.data.norm(),
    }));

    // Run adapter
    adapter.capture(model, optimizer, 1.5);
    adapter.capture(model, optimizer, 1.4);
    adapter.capture(model, optimizer, 1.3);

    // Capture model state after
    const paramsAfter = Array.from(model.namedParameters()).map(([name, p]) => ({
      name,
      norm: p.data.norm(),
    }));

    // Model should be unchanged
    expect(JSON.stringify(paramsBefore)).toBe(JSON.stringify(paramsAfter));
  });

  it('does not modify optimizer state', () => {
    const adapter = new PyTorchAdapter({ runId: 'test' });
    const model = new MockPyTorchModel([{ name: 'w', norm: 10, gradNorm: 1 }]);
    const optimizer = new MockPyTorchOptimizer(0.001);

    // Capture optimizer state before
    const lrBefore = optimizer.paramGroups[0].lr;

    // Run adapter
    adapter.capture(model, optimizer, 1.5);
    adapter.capture(model, optimizer, 1.4);

    // Capture optimizer state after
    const lrAfter = optimizer.paramGroups[0].lr;

    // Optimizer should be unchanged
    expect(lrBefore).toBe(lrAfter);
  });
});
