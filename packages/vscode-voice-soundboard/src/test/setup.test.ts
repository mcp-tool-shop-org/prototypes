import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, workspace, commands, env, Uri } from 'vscode';
import type { ExtensionConfig } from '../config.js';

// Mock child_process.exec
const mockExec = vi.fn();
vi.mock('child_process', () => ({
  exec: (...args: unknown[]) => mockExec(...args),
}));

import { ensureBackendReady } from '../setup.js';

function makeConfig(overrides: Partial<ExtensionConfig> = {}): ExtensionConfig {
  return {
    defaultVoice: 'bm_george',
    speed: 1.0,
    backend: 'python',
    autoStart: true,
    format: 'wav',
    openaiApiKey: '',
    pythonPath: '',
    ...overrides,
  };
}

function mockExecSuccess(stdout: string) {
  mockExec.mockImplementation((_cmd: string, _opts: unknown, cb: Function) => {
    cb(null, stdout, '');
  });
}

function mockExecFailure(err: Error = new Error('not found')) {
  mockExec.mockImplementation((_cmd: string, _opts: unknown, cb: Function) => {
    cb(err, '', '');
  });
}

describe('ensureBackendReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mock backend', () => {
    it('returns ready immediately', async () => {
      const result = await ensureBackendReady(makeConfig({ backend: 'mock' }));
      expect(result).toEqual({ backend: 'mock', ready: true });
    });
  });

  describe('http backend', () => {
    it('returns ready when API key is set', async () => {
      const result = await ensureBackendReady(makeConfig({ backend: 'http', openaiApiKey: 'sk-test' }));
      expect(result).toEqual({ backend: 'http', ready: true });
    });

    it('shows warning when API key is missing', async () => {
      vi.mocked(window.showWarningMessage).mockResolvedValue(undefined);
      const result = await ensureBackendReady(makeConfig({ backend: 'http' }));
      expect(window.showWarningMessage).toHaveBeenCalled();
      expect(result.ready).toBe(false);
    });

    it('opens settings when user clicks "Open Settings"', async () => {
      vi.mocked(window.showWarningMessage).mockResolvedValue('Open Settings' as never);
      const result = await ensureBackendReady(makeConfig({ backend: 'http' }));
      expect(commands.executeCommand).toHaveBeenCalledWith(
        'workbench.action.openSettings',
        'voiceSoundboard.openaiApiKey',
      );
      expect(result.ready).toBe(false);
    });

    it('switches to mock when user clicks "Use Mock"', async () => {
      vi.mocked(window.showWarningMessage).mockResolvedValue('Use Mock' as never);
      const result = await ensureBackendReady(makeConfig({ backend: 'http' }));
      expect(result).toEqual({ backend: 'mock', ready: true });
    });

    it('falls through to Python setup on "Use Python Instead"', async () => {
      vi.mocked(window.showWarningMessage).mockResolvedValue('Use Python Instead' as never);
      // Python detection will fail (no exec mock set up for success)
      mockExecFailure();
      vi.mocked(window.showWarningMessage)
        .mockResolvedValueOnce('Use Python Instead' as never)
        .mockResolvedValue(undefined);

      const result = await ensureBackendReady(makeConfig({ backend: 'http' }));
      // Should have fallen through to python path and shown Python-not-found warning
      expect(result.ready).toBe(false);
    });
  });

  describe('python backend', () => {
    it('returns ready when Python + Kokoro are installed', async () => {
      // First call: python3 --version
      // Second call: import kokoro_onnx
      mockExec
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'Python 3.11.0', '');
        })
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'ok', '');
        });

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(result).toEqual({ backend: 'python', ready: true });
    });

    it('uses custom pythonPath when configured', async () => {
      mockExec
        .mockImplementationOnce((cmd: string, _opts: unknown, cb: Function) => {
          // Should try custom path only
          expect(cmd).toContain('/custom/python');
          cb(null, 'Python 3.12.0', '');
        })
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'ok', '');
        });

      const result = await ensureBackendReady(makeConfig({ backend: 'python', pythonPath: '/custom/python' }));
      expect(result.ready).toBe(true);
    });

    it('shows warning when Python not found', async () => {
      mockExecFailure();
      vi.mocked(window.showWarningMessage).mockResolvedValue(undefined);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('Python 3 not found'),
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
      expect(result.ready).toBe(false);
    });

    it('opens python.org on "Install Python"', async () => {
      mockExecFailure();
      vi.mocked(window.showWarningMessage).mockResolvedValue('Install Python' as never);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(env.openExternal).toHaveBeenCalled();
      expect(result.ready).toBe(false);
    });

    it('switches to http on "Use API Key"', async () => {
      mockExecFailure();
      vi.mocked(window.showWarningMessage).mockResolvedValue('Use API Key' as never);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(result.backend).toBe('http');
      expect(result.ready).toBe(false);
    });

    it('switches to mock on "Use Mock"', async () => {
      mockExecFailure();
      vi.mocked(window.showWarningMessage).mockResolvedValue('Use Mock' as never);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(result).toEqual({ backend: 'mock', ready: true });
    });

    it('prompts to install Kokoro when Python found but Kokoro missing', async () => {
      mockExec
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'Python 3.11.0', '');
        })
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(new Error('no module'), '', '');
        });

      vi.mocked(window.showInformationMessage).mockResolvedValue(undefined);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining('Kokoro'),
        expect.any(String),
        expect.any(String),
      );
      expect(result.ready).toBe(false);
    });

    it('installs Kokoro in terminal on "Install Now"', async () => {
      mockExec
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'Python 3.11.0', '');
        })
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(new Error('no module'), '', '');
        });

      vi.mocked(window.showInformationMessage).mockResolvedValue('Install Now' as never);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(window.createTerminal).toHaveBeenCalledWith('Voice Soundboard Setup');
      expect(result.ready).toBe(false);
      expect(result.message).toContain('Installing');
    });

    it('switches to mock on "Skip (Use Mock)"', async () => {
      mockExec
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(null, 'Python 3.11.0', '');
        })
        .mockImplementationOnce((_cmd: string, _opts: unknown, cb: Function) => {
          cb(new Error('no module'), '', '');
        });

      vi.mocked(window.showInformationMessage).mockResolvedValue('Skip (Use Mock)' as never);

      const result = await ensureBackendReady(makeConfig({ backend: 'python' }));
      expect(result).toEqual({ backend: 'mock', ready: true });
    });
  });
});
