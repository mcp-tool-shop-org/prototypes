/**
 * Tests for Error Formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  VectorCaliperError,
  StateValidationError,
  BudgetExceededError,
  ScaleRestrictedError,
  RenderError,
  StreamError,
  formatError,
  MESSAGES,
  logInfo,
  logWarning,
  logError,
  logSuccess,
} from '../src/errors';

// ============================================================================
// Error Classes
// ============================================================================

describe('VectorCaliperError', () => {
  it('creates error with message and code', () => {
    const error = new VectorCaliperError('Something failed', 'TEST_ERROR');
    expect(error.message).toBe('Something failed');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('VectorCaliperError');
  });

  it('creates error with details', () => {
    const error = new VectorCaliperError('Failed', 'TEST', { foo: 'bar', num: 42 });
    expect(error.details).toEqual({ foo: 'bar', num: 42 });
  });

  it('is instanceof Error', () => {
    const error = new VectorCaliperError('Test', 'TEST');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(VectorCaliperError);
  });
});

describe('StateValidationError', () => {
  it('creates validation error with path and value', () => {
    const error = new StateValidationError('Invalid value', 'state.geometry.spread', -5);
    expect(error.message).toBe('Invalid value');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('StateValidationError');
    expect(error.details).toEqual({ path: 'state.geometry.spread', value: -5 });
  });
});

describe('BudgetExceededError', () => {
  it('creates budget error with resource details', () => {
    const error = new BudgetExceededError(
      'Too many states',
      'states',
      1000000,
      1500000
    );
    expect(error.message).toBe('Too many states');
    expect(error.code).toBe('BUDGET_EXCEEDED');
    expect(error.name).toBe('BudgetExceededError');
    expect(error.details).toEqual({
      resource: 'states',
      limit: 1000000,
      actual: 1500000,
    });
  });
});

describe('ScaleRestrictedError', () => {
  it('creates scale restriction error', () => {
    const error = new ScaleRestrictedError('autoplay', 'extreme');
    expect(error.message).toBe("Operation 'autoplay' is disabled for scale class 'extreme'");
    expect(error.code).toBe('SCALE_RESTRICTED');
    expect(error.details).toEqual({ operation: 'autoplay', scaleClass: 'extreme' });
  });
});

describe('RenderError', () => {
  it('creates render error with renderer name', () => {
    const error = new RenderError('Context lost', 'webgl', { contextId: 123 });
    expect(error.message).toBe('Context lost');
    expect(error.code).toBe('RENDER_ERROR');
    expect(error.details).toEqual({ renderer: 'webgl', contextId: 123 });
  });
});

describe('StreamError', () => {
  it('creates stream error with session ID', () => {
    const error = new StreamError('Connection closed', 'session-123');
    expect(error.message).toBe('Connection closed');
    expect(error.code).toBe('STREAM_ERROR');
    expect(error.details).toEqual({ sessionId: 'session-123' });
  });
});

// ============================================================================
// Error Formatting
// ============================================================================

describe('formatError', () => {
  it('formats VectorCaliperError with code', () => {
    const error = new VectorCaliperError('Test message', 'TEST_CODE');
    const formatted = formatError(error);
    expect(formatted).toContain('[TEST_CODE]');
    expect(formatted).toContain('Test message');
  });

  it('formats VectorCaliperError with details', () => {
    const error = new BudgetExceededError('Over limit', 'states', 1000, 1500);
    const formatted = formatError(error);
    expect(formatted).toContain('resource: states');
    expect(formatted).toContain('limit:');
    expect(formatted).toContain('actual:');
  });

  it('formats regular Error', () => {
    const error = new Error('Regular error');
    const formatted = formatError(error);
    expect(formatted).toBe('Error: Regular error');
  });

  it('formats non-Error objects', () => {
    const formatted = formatError('string error');
    expect(formatted).toBe('Unknown error: string error');
  });

  it('formats null', () => {
    const formatted = formatError(null);
    expect(formatted).toBe('Unknown error: null');
  });
});

// ============================================================================
// Messages
// ============================================================================

describe('MESSAGES', () => {
  it('generates budget exceeded states message', () => {
    const msg = MESSAGES.BUDGET_EXCEEDED_STATES(1500000, 1000000);
    expect(msg).toContain('1,500,000');
    expect(msg).toContain('1,000,000');
  });

  it('generates budget exceeded memory message', () => {
    const msg = MESSAGES.BUDGET_EXCEEDED_MEMORY('512MB', '256MB');
    expect(msg).toContain('512MB');
    expect(msg).toContain('256MB');
  });

  it('generates scale autoplay disabled message', () => {
    const msg = MESSAGES.SCALE_AUTOPLAY_DISABLED('large');
    expect(msg).toContain('Autoplay');
    expect(msg).toContain('large');
  });

  it('generates scale selection disabled message', () => {
    const msg = MESSAGES.SCALE_SELECTION_DISABLED('extreme');
    expect(msg).toContain('Selection');
    expect(msg).toContain('extreme');
  });

  it('generates validation NaN message', () => {
    const msg = MESSAGES.VALIDATION_NAN('state.loss');
    expect(msg).toContain('NaN');
    expect(msg).toContain('state.loss');
  });

  it('generates validation out of range message', () => {
    const msg = MESSAGES.VALIDATION_OUT_OF_RANGE('state.accuracy', 1.5, 0, 1);
    expect(msg).toContain('1.5');
    expect(msg).toContain('[0, 1]');
  });

  it('generates validation non-monotonic message', () => {
    const msg = MESSAGES.VALIDATION_NON_MONOTONIC('time', 10, 5);
    expect(msg).toContain('10');
    expect(msg).toContain('5');
  });

  it('generates validation duplicate ID message', () => {
    const msg = MESSAGES.VALIDATION_DUPLICATE_ID('state-001');
    expect(msg).toContain('state-001');
    expect(msg).toContain('unique');
  });

  it('generates progressive subset message', () => {
    const msg = MESSAGES.PROGRESSIVE_SUBSET(1000, 100000, 'uniform');
    expect(msg).toContain('1,000');
    expect(msg).toContain('100,000');
    expect(msg).toContain('uniform');
  });

  it('generates loading message', () => {
    const msg = MESSAGES.LOADING(75);
    expect(msg).toContain('75%');
  });
});

// ============================================================================
// Console Helpers
// ============================================================================

describe('Console Helpers', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  it('logInfo prefixes with [VectorCaliper]', () => {
    logInfo('Test message');
    expect(consoleSpy.log).toHaveBeenCalledWith('[VectorCaliper] Test message');
  });

  it('logWarning prefixes with warning symbol', () => {
    logWarning('Warning message');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[VectorCaliper] ⚠ Warning message');
  });

  it('logError formats and prefixes error', () => {
    const error = new VectorCaliperError('Test error', 'TEST');
    logError(error);
    expect(consoleSpy.error).toHaveBeenCalled();
    const call = consoleSpy.error.mock.calls[0]![0];
    expect(call).toContain('[VectorCaliper]');
    expect(call).toContain('TEST');
  });

  it('logSuccess prefixes with checkmark', () => {
    logSuccess('Done');
    expect(consoleSpy.log).toHaveBeenCalledWith('[VectorCaliper] ✓ Done');
  });
});

// ============================================================================
// Error Hierarchy
// ============================================================================

describe('Error Hierarchy', () => {
  it('all custom errors extend VectorCaliperError', () => {
    expect(new StateValidationError('', '', null)).toBeInstanceOf(VectorCaliperError);
    expect(new BudgetExceededError('', 'states', 0, 0)).toBeInstanceOf(VectorCaliperError);
    expect(new ScaleRestrictedError('', '')).toBeInstanceOf(VectorCaliperError);
    expect(new RenderError('', '')).toBeInstanceOf(VectorCaliperError);
    expect(new StreamError('')).toBeInstanceOf(VectorCaliperError);
  });

  it('all custom errors extend Error', () => {
    expect(new StateValidationError('', '', null)).toBeInstanceOf(Error);
    expect(new BudgetExceededError('', 'states', 0, 0)).toBeInstanceOf(Error);
    expect(new ScaleRestrictedError('', '')).toBeInstanceOf(Error);
    expect(new RenderError('', '')).toBeInstanceOf(Error);
    expect(new StreamError('')).toBeInstanceOf(Error);
  });

  it('errors have distinct names for try/catch discrimination', () => {
    const errors = [
      new VectorCaliperError('', ''),
      new StateValidationError('', '', null),
      new BudgetExceededError('', 'states', 0, 0),
      new ScaleRestrictedError('', ''),
      new RenderError('', ''),
      new StreamError(''),
    ];

    const names = errors.map(e => e.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(errors.length);
  });
});
