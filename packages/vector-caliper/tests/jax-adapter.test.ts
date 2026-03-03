/**
 * JAX Adapter Tests
 *
 * Acceptance criteria:
 * - JAX compilation remains valid
 * - VectorCaliper capture does not break jit
 * - Adapter is referentially transparent
 * - No hidden side effects
 */

import { describe, it, expect } from 'vitest';
import {
  JAXAdapter,
  captureJAXStep,
  MockJAXArray,
  createMockParamsTree,
  createMockOptState,
  verifyReferentialTransparency,
  JAX_INTEGRATION_TEMPLATE,
  JAXStepResult,
  JAXCaptureConfig,
} from '../src/integration/jax';
import { INTEGRATION_CONTRACT_VERSION } from '../src/integration/contract';

// Helper to create a mock step result
function createMockStepResult(overrides: Partial<JAXStepResult> = {}): JAXStepResult {
  return {
    loss: 1.5,
    params: createMockParamsTree({
      'layer1.weight': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      'layer1.bias': [0.1, 0.2, 0.3],
    }),
    grads: createMockParamsTree({
      'layer1.weight': [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      'layer1.bias': [0.01, 0.01, 0.01],
    }),
    optState: createMockOptState(0.001),
    ...overrides,
  };
}

describe('captureJAXStep (Pure Function)', () => {
  describe('Basic Capture', () => {
    it('captures training state', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      const { captured } = captureJAXStep(result, 0, 0, config);

      expect(captured.valid).toBe(true);
      expect(captured.payload.step).toBe(0);
      expect(captured.payload.epoch).toBe(0);
      expect(captured.payload.loss).toBe(1.5);
      expect(captured.payload.source).toBe('jax');
    });

    it('includes contract version', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      const { captured } = captureJAXStep(result, 0, 0, config);

      expect(captured.payload.contractVersion).toBe(INTEGRATION_CONTRACT_VERSION);
    });

    it('includes timestamp', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      const before = new Date().toISOString();
      const { captured } = captureJAXStep(result, 0, 0, config);
      const after = new Date().toISOString();

      expect(captured.payload.timestamp).toBeDefined();
      expect(captured.payload.timestamp! >= before).toBe(true);
      expect(captured.payload.timestamp! <= after).toBe(true);
    });
  });

  describe('Norm Computation', () => {
    it('computes parameter norm correctly', () => {
      const params = createMockParamsTree({
        'w1': [3, 4], // norm = 5
      });
      const grads = createMockParamsTree({
        'w1': [0, 0],
      });
      const result: JAXStepResult = {
        loss: 1.0,
        params,
        grads,
        optState: createMockOptState(),
      };

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.payload.parameterNorm).toBeCloseTo(5, 10);
    });

    it('computes gradient norm correctly', () => {
      const params = createMockParamsTree({
        'w1': [1, 1],
      });
      const grads = createMockParamsTree({
        'w1': [3, 4], // norm = 5
      });
      const result: JAXStepResult = {
        loss: 1.0,
        params,
        grads,
        optState: createMockOptState(),
      };

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.payload.gradientNorm).toBeCloseTo(5, 10);
    });

    it('computes update norm from previous params', () => {
      const params1 = createMockParamsTree({ 'w': [10] });
      const params2 = createMockParamsTree({ 'w': [11] }); // Changed by 1
      const grads = createMockParamsTree({ 'w': [0.1] });
      const config: JAXCaptureConfig = { runId: 'test' };

      // First capture
      const { paramNorms: prevNorms } = captureJAXStep(
        { loss: 1.0, params: params1, grads, optState: createMockOptState() },
        0, 0, config
      );

      // Second capture with previous norms
      const { captured } = captureJAXStep(
        { loss: 0.9, params: params2, grads, optState: createMockOptState() },
        1, 0, config, prevNorms
      );

      // Update norm should be 1 (|11 - 10| = 1)
      expect(captured.payload.updateNorm).toBeCloseTo(1, 10);
    });

    it('returns zero update norm without previous params', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      const { captured } = captureJAXStep(result, 0, 0, config);

      expect(captured.payload.updateNorm).toBe(0);
    });
  });

  describe('Learning Rate', () => {
    it('extracts learning rate from opt state', () => {
      const result = createMockStepResult({
        optState: createMockOptState(0.01),
      });

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.payload.learningRate).toBe(0.01);
    });

    it('uses custom learning rate extractor', () => {
      const result = createMockStepResult({
        optState: { inner_state: { count: 100 } } as any,
      });
      const config: JAXCaptureConfig = {
        runId: 'test',
        learningRateExtractor: () => 0.005,
      };

      const { captured } = captureJAXStep(result, 0, 0, config);

      expect(captured.payload.learningRate).toBe(0.005);
    });
  });

  describe('Optional Fields', () => {
    it('includes accuracy when provided', () => {
      const result = createMockStepResult({ accuracy: 0.85 });

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.payload.accuracy).toBe(0.85);
    });

    it('includes metrics in metadata', () => {
      const result = createMockStepResult({
        metrics: { perplexity: 42.5, top5_acc: 0.95 },
      });

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.payload.metadata?.perplexity).toBe(42.5);
      expect(captured.payload.metadata?.top5_acc).toBe(0.95);
    });

    it('includes custom metadata', () => {
      const config: JAXCaptureConfig = {
        runId: 'test',
        metadataExtractor: () => ({ batch_size: 32, seed: 42 }),
      };

      const { captured } = captureJAXStep(createMockStepResult(), 0, 0, config);

      expect(captured.payload.metadata?.batch_size).toBe(32);
      expect(captured.payload.metadata?.seed).toBe(42);
    });
  });

  describe('Validation', () => {
    it('validates payloads', () => {
      const result = createMockStepResult({ loss: -1 }); // Invalid

      const { captured } = captureJAXStep(result, 0, 0, { runId: 'test' });

      expect(captured.valid).toBe(false);
      expect(captured.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Referential Transparency', () => {
    it('is referentially transparent', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      expect(verifyReferentialTransparency(result, 0, 0, config, 5)).toBe(true);
    });

    it('produces identical outputs for identical inputs (excluding timestamp)', () => {
      const result = createMockStepResult();
      const config: JAXCaptureConfig = { runId: 'test' };

      const { captured: c1 } = captureJAXStep(result, 5, 2, config);
      const { captured: c2 } = captureJAXStep(result, 5, 2, config);

      // Compare everything except timestamp
      const { timestamp: t1, ...rest1 } = c1.payload;
      const { timestamp: t2, ...rest2 } = c2.payload;

      expect(JSON.stringify(rest1)).toBe(JSON.stringify(rest2));
    });
  });
});

describe('JAXAdapter (Stateful)', () => {
  describe('Basic Capture', () => {
    it('captures training state', () => {
      const adapter = new JAXAdapter({ runId: 'test' });
      const result = createMockStepResult();

      const captured = adapter.capture(result);

      expect(captured.valid).toBe(true);
      expect(captured.payload.step).toBe(0);
    });

    it('increments step on each capture', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult({ loss: 1.5 }));
      adapter.capture(createMockStepResult({ loss: 1.4 }));
      adapter.capture(createMockStepResult({ loss: 1.3 }));

      const captures = adapter.getCaptures();
      expect(captures[0].step).toBe(0);
      expect(captures[1].step).toBe(1);
      expect(captures[2].step).toBe(2);
    });

    it('tracks epoch correctly', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult());
      adapter.newEpoch();
      adapter.capture(createMockStepResult());

      const captures = adapter.getCaptures();
      expect(captures[0].epoch).toBe(0);
      expect(captures[1].epoch).toBe(1);
    });

    it('allows setting epoch explicitly', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.setEpoch(3);
      adapter.capture(createMockStepResult());

      expect(adapter.getCaptures()[0].epoch).toBe(3);
    });

    it('allows setting step explicitly', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.setStep(100);
      adapter.capture(createMockStepResult());

      expect(adapter.getCaptures()[0].step).toBe(100);
    });
  });

  describe('Update Norm Tracking', () => {
    it('tracks update norm across captures', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      // First capture
      adapter.capture(createMockStepResult({
        params: createMockParamsTree({ 'w': [10] }),
        grads: createMockParamsTree({ 'w': [0.1] }),
      }));

      // Second capture with changed params
      adapter.capture(createMockStepResult({
        params: createMockParamsTree({ 'w': [11] }),
        grads: createMockParamsTree({ 'w': [0.1] }),
      }));

      const captures = adapter.getCaptures();
      expect(captures[0].updateNorm).toBe(0); // First has no previous
      expect(captures[1].updateNorm).toBeCloseTo(1, 10); // |11 - 10| = 1
    });
  });

  describe('Export', () => {
    it('exports captures as JSON', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult({ loss: 1.5 }));
      adapter.capture(createMockStepResult({ loss: 1.4 }));

      const json = adapter.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].loss).toBe(1.5);
      expect(parsed[1].loss).toBe(1.4);
    });

    it('provides summary statistics', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult({ loss: 1.5 }));
      adapter.newEpoch();
      adapter.capture(createMockStepResult({ loss: 1.0 }));
      adapter.capture(createMockStepResult({ loss: 0.5 }));

      const summary = adapter.getSummary();

      expect(summary.captureCount).toBe(3);
      expect(summary.stepRange).toEqual([0, 2]);
      expect(summary.epochRange).toEqual([0, 1]);
      expect(summary.lossRange).toEqual([0.5, 1.5]);
    });

    it('handles empty captures in summary', () => {
      const adapter = new JAXAdapter({ runId: 'test' });
      const summary = adapter.getSummary();

      expect(summary.captureCount).toBe(0);
      expect(summary.stepRange).toBeNull();
    });
  });

  describe('Clear', () => {
    it('clears all captures', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult());
      adapter.capture(createMockStepResult());
      adapter.clear();

      expect(adapter.getCaptures()).toHaveLength(0);
    });

    it('resets step and epoch on clear', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult());
      adapter.newEpoch();
      adapter.clear();
      adapter.capture(createMockStepResult());

      expect(adapter.getCaptures()[0].step).toBe(0);
      expect(adapter.getCaptures()[0].epoch).toBe(0);
    });
  });

  describe('Validation', () => {
    it('does not store invalid captures', () => {
      const adapter = new JAXAdapter({ runId: 'test' });

      adapter.capture(createMockStepResult({ loss: -1 })); // Invalid

      expect(adapter.getCaptures()).toHaveLength(0);
    });
  });
});

describe('MockJAXArray', () => {
  it('computes norm correctly', () => {
    const arr = new MockJAXArray([3, 4]);
    expect(arr.norm()).toBeCloseTo(5, 10);
  });

  it('flattens correctly', () => {
    const arr = new MockJAXArray([1, 2, 3]);
    expect(arr.flatten().tolist()).toEqual([1, 2, 3]);
  });
});

describe('Python Template', () => {
  it('includes Python integration code', () => {
    expect(JAX_INTEGRATION_TEMPLATE).toContain('def capture_step');
    expect(JAX_INTEGRATION_TEMPLATE).toContain('def new_epoch');
    expect(JAX_INTEGRATION_TEMPLATE).toContain('def export_json');
    expect(JAX_INTEGRATION_TEMPLATE).toContain('CaptureState');
  });

  it('includes tree norm computation', () => {
    expect(JAX_INTEGRATION_TEMPLATE).toContain('tree_norm');
    expect(JAX_INTEGRATION_TEMPLATE).toContain('tree_param_norms');
  });

  it('includes usage example', () => {
    expect(JAX_INTEGRATION_TEMPLATE).toContain('train_step');
    expect(JAX_INTEGRATION_TEMPLATE).toContain('capture_step');
  });
});

describe('No Side Effects', () => {
  it('pure function does not modify input', () => {
    const result = createMockStepResult();
    const config: JAXCaptureConfig = { runId: 'test' };

    // Serialize before
    const before = JSON.stringify(result);

    // Capture
    captureJAXStep(result, 0, 0, config);

    // Serialize after
    const after = JSON.stringify(result);

    expect(before).toBe(after);
  });

  it('stateful adapter does not modify step results', () => {
    const adapter = new JAXAdapter({ runId: 'test' });
    const result = createMockStepResult();

    // Serialize before
    const before = JSON.stringify(result);

    // Capture multiple times
    adapter.capture(result);
    adapter.capture(result);
    adapter.capture(result);

    // Serialize after
    const after = JSON.stringify(result);

    expect(before).toBe(after);
  });
});
