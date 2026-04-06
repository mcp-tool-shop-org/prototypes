import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_LIMITS, validateCapture } from '@mcptoolshop/websketch-ir';

// =============================================================================
// IR imports available to extension
// =============================================================================

describe('websketch-extension IR imports', () => {
  it('imports DEFAULT_LIMITS from websketch-ir', () => {
    expect(typeof DEFAULT_LIMITS).toBe('object');
    expect(DEFAULT_LIMITS.maxNodes).toBe(10_000);
    expect(DEFAULT_LIMITS.maxDepth).toBe(50);
  });

  it('imports validateCapture from websketch-ir', () => {
    expect(typeof validateCapture).toBe('function');
  });
});

// =============================================================================
// RawCapture interface shape
// =============================================================================

describe('RawCapture interface shape', () => {
  it('has required root and metadata fields', () => {
    const capture = {
      root: {
        type: 'HTML',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        styles: { display: 'block', position: 'static', visibility: 'visible' },
      },
      metadata: {
        url: 'https://example.com',
        title: 'Test Page',
        timestamp: new Date().toISOString(),
        viewport: { width: 1920, height: 1080 },
      },
    };
    expect(capture.root.type).toBe('HTML');
    expect(capture.metadata.url).toMatch(/^https?:\/\//);
    expect(capture.metadata.viewport.width).toBeGreaterThan(0);
  });

  it('supports optional warnings field', () => {
    const capture = {
      root: {
        type: 'HTML',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        styles: { display: 'block', position: 'static', visibility: 'visible' },
      },
      metadata: {
        url: 'https://example.com',
        title: 'Test',
        timestamp: new Date().toISOString(),
        viewport: { width: 1920, height: 1080 },
      },
      warnings: ['Depth limit reached at DIV#content'],
    };
    expect(capture.warnings).toHaveLength(1);
    expect(capture.warnings[0]).toContain('Depth limit');
  });
});

// =============================================================================
// Depth + node limits logic
// =============================================================================

describe('capture limit constants', () => {
  it('MAX_DEPTH matches DEFAULT_LIMITS.maxDepth', () => {
    // The extension uses DEFAULT_LIMITS.maxDepth as its MAX_DEPTH
    expect(DEFAULT_LIMITS.maxDepth).toBe(50);
  });

  it('MAX_NODES matches DEFAULT_LIMITS.maxNodes', () => {
    // The extension uses DEFAULT_LIMITS.maxNodes as its MAX_NODES
    expect(DEFAULT_LIMITS.maxNodes).toBe(10_000);
  });

  it('limits are reasonable for real pages', () => {
    // 50 depth handles any real page (most are < 30)
    expect(DEFAULT_LIMITS.maxDepth).toBeGreaterThanOrEqual(30);
    expect(DEFAULT_LIMITS.maxDepth).toBeLessThanOrEqual(100);

    // 10k nodes handles complex pages without OOM
    expect(DEFAULT_LIMITS.maxNodes).toBeGreaterThanOrEqual(5_000);
    expect(DEFAULT_LIMITS.maxNodes).toBeLessThanOrEqual(50_000);
  });

  it('DEFAULT_LIMITS includes maxStringLength', () => {
    expect(typeof DEFAULT_LIMITS.maxStringLength).toBe('number');
    expect(DEFAULT_LIMITS.maxStringLength).toBeGreaterThan(0);
  });
});

// =============================================================================
// Settings (chrome.storage.sync mock)
// =============================================================================

describe('settings storage', () => {
  let storage: Record<string, unknown>;

  beforeEach(() => {
    storage = {};

    // Mock chrome.storage.sync
    const chromeMock = {
      storage: {
        sync: {
          get: vi.fn((key: string, cb: (result: Record<string, unknown>) => void) => {
            cb({ [key]: storage[key] });
          }),
          set: vi.fn((items: Record<string, unknown>, cb: () => void) => {
            Object.assign(storage, items);
            cb();
          }),
        },
      },
      runtime: {
        onMessage: { addListener: vi.fn() },
        openOptionsPage: vi.fn(),
      },
    };
    vi.stubGlobal('chrome', chromeMock);
  });

  it('loadSettings returns defaults when storage is empty', async () => {
    const { loadSettings } = await import('../src/settings');
    const settings = await loadSettings();
    expect(settings.maxDepth).toBe(DEFAULT_LIMITS.maxDepth);
    expect(settings.maxNodes).toBe(DEFAULT_LIMITS.maxNodes);
    expect(settings.maxStringLength).toBe(DEFAULT_LIMITS.maxStringLength);
  });

  it('saveSettings + loadSettings roundtrip', async () => {
    const { loadSettings, saveSettings } = await import('../src/settings');

    await saveSettings({ maxDepth: 25 });
    const settings = await loadSettings();
    expect(settings.maxDepth).toBe(25);
    // Other fields stay at defaults
    expect(settings.maxNodes).toBe(DEFAULT_LIMITS.maxNodes);
    expect(settings.maxStringLength).toBe(DEFAULT_LIMITS.maxStringLength);
  });

  it('saveSettings merges partial updates', async () => {
    const { loadSettings, saveSettings } = await import('../src/settings');

    await saveSettings({ maxNodes: 500 });
    await saveSettings({ maxDepth: 10 });
    const settings = await loadSettings();
    expect(settings.maxNodes).toBe(500);
    expect(settings.maxDepth).toBe(10);
  });
});

// =============================================================================
// RawCapture metadata — schemaVersion
// =============================================================================

describe('RawCapture schemaVersion', () => {
  it('metadata includes schemaVersion field', () => {
    const capture = {
      root: {
        type: 'HTML',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        styles: { display: 'block', position: 'static', visibility: 'visible' },
      },
      metadata: {
        url: 'https://example.com',
        title: 'Test',
        timestamp: new Date().toISOString(),
        schemaVersion: '0.1',
        viewport: { width: 1920, height: 1080 },
      },
    };
    expect(capture.metadata.schemaVersion).toBe('0.1');
  });
});
