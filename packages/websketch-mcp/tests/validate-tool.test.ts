import { describe, it, expect } from 'vitest';
import {
  validateCapture,
  DEFAULT_LIMITS,
  type WebSketchLimits,
} from '@mcptoolshop/websketch-ir';

// =============================================================================
// Fixtures
// =============================================================================

const validCapture = {
  version: '0.1',
  url: 'https://example.com',
  timestamp_ms: 1700000000000,
  viewport: { w_px: 1920, h_px: 1080, aspect: 1920 / 1080 },
  compiler: { name: 'websketch-ir', version: '0.2.1', options_hash: 'test' },
  root: {
    id: '',
    role: 'PAGE',
    bbox: [0, 0, 1, 1],
    interactive: false,
    visible: true,
  },
};

/**
 * Simulate the validate tool's response logic.
 * This mirrors the websketch_validate handler in src/index.ts.
 */
function simulateValidateTool(
  capture: unknown,
  limits?: Partial<WebSketchLimits>,
): { ok: boolean; error?: { code: string; message: string; issues?: unknown[] } } {
  if (
    capture === undefined ||
    capture === null ||
    typeof capture !== 'object' ||
    Array.isArray(capture)
  ) {
    return {
      ok: false,
      error: {
        code: 'WS_INVALID_ARGS',
        message: "Missing or invalid 'capture' argument. Expected an object.",
      },
    };
  }

  const issues = validateCapture(capture, limits);

  if (issues.length === 0) {
    return { ok: true };
  }

  const limitIssue = issues.find(
    (i) =>
      i.path === 'nodeCount' ||
      i.path === 'depth' ||
      i.message.includes('exceeds')
  );

  if (limitIssue) {
    return {
      ok: false,
      error: {
        code: 'WS_LIMIT_EXCEEDED',
        message: limitIssue.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: 'WS_INVALID_CAPTURE',
      message: `Invalid capture: ${issues.length} validation issue${issues.length > 1 ? 's' : ''}`,
      issues,
    },
  };
}

// =============================================================================
// IR imports available
// =============================================================================

describe('validate tool: IR imports', () => {
  it('DEFAULT_LIMITS is available', () => {
    expect(DEFAULT_LIMITS).toBeDefined();
    expect(DEFAULT_LIMITS.maxNodes).toBe(10_000);
    expect(DEFAULT_LIMITS.maxDepth).toBe(50);
  });

  it('validateCapture is a function', () => {
    expect(typeof validateCapture).toBe('function');
  });
});

// =============================================================================
// validate tool response envelope
// =============================================================================

describe('validate tool: response envelope', () => {
  it('valid capture → { ok: true }', () => {
    const result = simulateValidateTool(validCapture);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('empty object → { ok: false, code: WS_INVALID_CAPTURE }', () => {
    const result = simulateValidateTool({});
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_CAPTURE');
    expect(result.error?.issues).toBeDefined();
    expect((result.error?.issues as unknown[]).length).toBeGreaterThan(0);
  });

  it('null → { ok: false, code: WS_INVALID_ARGS }', () => {
    const result = simulateValidateTool(null);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_ARGS');
  });

  it('string → { ok: false, code: WS_INVALID_ARGS }', () => {
    const result = simulateValidateTool('not an object' as unknown);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_ARGS');
  });

  it('array → { ok: false, code: WS_INVALID_ARGS }', () => {
    const result = simulateValidateTool([1, 2, 3]);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_ARGS');
  });

  it('undefined → { ok: false, code: WS_INVALID_ARGS }', () => {
    const result = simulateValidateTool(undefined);
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_ARGS');
  });

  it('invalid version → { ok: false, code: WS_INVALID_CAPTURE }', () => {
    const result = simulateValidateTool({ ...validCapture, version: '99.0' });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_INVALID_CAPTURE');
  });
});

// =============================================================================
// validate tool with custom limits
// =============================================================================

describe('validate tool: custom limits', () => {
  it('deep nesting + maxDepth:2 → WS_LIMIT_EXCEEDED', () => {
    const deepCapture = {
      ...validCapture,
      root: {
        id: '',
        role: 'PAGE',
        bbox: [0, 0, 1, 1],
        interactive: false,
        visible: true,
        children: [
          {
            id: 'l1',
            role: 'SECTION',
            bbox: [0, 0, 1, 0.5],
            interactive: false,
            visible: true,
            children: [
              {
                id: 'l2',
                role: 'SECTION',
                bbox: [0, 0, 1, 0.25],
                interactive: false,
                visible: true,
                children: [
                  {
                    id: 'l3',
                    role: 'BUTTON',
                    bbox: [0, 0, 0.5, 0.1],
                    interactive: true,
                    visible: true,
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const result = simulateValidateTool(deepCapture, { maxDepth: 2 });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_LIMIT_EXCEEDED');
  });

  it('many nodes + maxNodes:3 → WS_LIMIT_EXCEEDED', () => {
    const children = Array.from({ length: 10 }, (_, i) => ({
      id: `btn-${i}`,
      role: 'BUTTON',
      bbox: [i * 0.1, 0, 0.1, 0.1],
      interactive: true,
      visible: true,
    }));

    const largeCapture = {
      ...validCapture,
      root: {
        ...validCapture.root,
        children,
      },
    };

    const result = simulateValidateTool(largeCapture, { maxNodes: 3 });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('WS_LIMIT_EXCEEDED');
  });
});
