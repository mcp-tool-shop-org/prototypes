import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workspace } from 'vscode';
import { getConfig } from '../config.js';

describe('getConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads configuration from voiceSoundboard section', () => {
    getConfig();
    expect(workspace.getConfiguration).toHaveBeenCalledWith('voiceSoundboard');
  });

  it('returns all config fields with defaults', () => {
    const config = getConfig();
    expect(config).toEqual({
      defaultVoice: 'bm_george',
      speed: 1.0,
      backend: 'python',
      autoStart: true,
      format: 'wav',
      openaiApiKey: '',
      pythonPath: '',
    });
  });

  it('returns custom values when configured', () => {
    const customValues: Record<string, unknown> = {
      defaultVoice: 'af_jessica',
      speed: 1.5,
      backend: 'http',
      autoStart: false,
      format: 'mp3',
      openaiApiKey: 'sk-test',
      pythonPath: '/usr/bin/python3',
    };

    vi.mocked(workspace.getConfiguration).mockReturnValue({
      get: vi.fn((key: string, defaultValue?: unknown) => customValues[key] ?? defaultValue),
      update: vi.fn(),
    } as never);

    const config = getConfig();
    expect(config.defaultVoice).toBe('af_jessica');
    expect(config.speed).toBe(1.5);
    expect(config.backend).toBe('http');
    expect(config.autoStart).toBe(false);
    expect(config.format).toBe('mp3');
    expect(config.openaiApiKey).toBe('sk-test');
    expect(config.pythonPath).toBe('/usr/bin/python3');
  });

  it('uses fallback defaults for missing keys', () => {
    vi.mocked(workspace.getConfiguration).mockReturnValue({
      get: vi.fn((_key: string, defaultValue?: unknown) => defaultValue),
      update: vi.fn(),
    } as never);

    const config = getConfig();
    expect(config.defaultVoice).toBe('bm_george');
    expect(config.speed).toBe(1.0);
    expect(config.backend).toBe('python');
  });
});
