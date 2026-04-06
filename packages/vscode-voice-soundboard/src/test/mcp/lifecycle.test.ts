import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({
    close: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { getClient, startServer, stopServer, isConnected } from '../../mcp/lifecycle.js';
import type { ExtensionConfig } from '../../config.js';

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

describe('lifecycle', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset module state by stopping any existing server
    await stopServer();
  });

  describe('getClient / isConnected', () => {
    it('returns null when no server started', () => {
      expect(getClient()).toBeNull();
      expect(isConnected()).toBe(false);
    });
  });

  describe('startServer', () => {
    it('creates transport with npx and backend arg', async () => {
      await startServer(makeConfig({ backend: 'python' }));
      expect(StdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'npx',
          args: ['@mcptoolshop/voice-soundboard-mcp', '--backend=python'],
        }),
      );
    });

    it('adds format arg when not wav', async () => {
      await startServer(makeConfig({ format: 'mp3' }));
      expect(StdioClientTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          args: ['@mcptoolshop/voice-soundboard-mcp', '--backend=python', '--format=mp3'],
        }),
      );
    });

    it('omits format arg for wav (default)', async () => {
      await startServer(makeConfig({ format: 'wav' }));
      const args = vi.mocked(StdioClientTransport).mock.calls[0][0].args;
      expect(args).not.toContain(expect.stringContaining('--format'));
    });

    it('passes OPENAI_API_KEY for http backend', async () => {
      await startServer(makeConfig({ backend: 'http', openaiApiKey: 'sk-test' }));
      const env = vi.mocked(StdioClientTransport).mock.calls[0][0].env;
      expect(env!.OPENAI_API_KEY).toBe('sk-test');
    });

    it('passes custom python path in env', async () => {
      await startServer(makeConfig({ pythonPath: '/opt/python3' }));
      const env = vi.mocked(StdioClientTransport).mock.calls[0][0].env;
      expect(env!.VOICE_SOUNDBOARD_PYTHON).toBe('/opt/python3');
    });

    it('always sets VOICE_SOUNDBOARD_ARTIFACT_MODE', async () => {
      await startServer(makeConfig());
      const env = vi.mocked(StdioClientTransport).mock.calls[0][0].env;
      expect(env!.VOICE_SOUNDBOARD_ARTIFACT_MODE).toBe('path');
    });

    it('creates client with correct name and version', async () => {
      await startServer(makeConfig());
      expect(Client).toHaveBeenCalledWith(
        { name: 'vscode-voice-soundboard', version: '0.3.0' },
        { capabilities: {} },
      );
    });

    it('connects client to transport', async () => {
      const client = await startServer(makeConfig());
      expect(client.connect).toHaveBeenCalled();
    });

    it('returns existing client on second call', async () => {
      const first = await startServer(makeConfig());
      const second = await startServer(makeConfig());
      expect(first).toBe(second);
      expect(Client).toHaveBeenCalledTimes(1);
    });

    it('sets isConnected to true after start', async () => {
      await startServer(makeConfig());
      expect(isConnected()).toBe(true);
      expect(getClient()).not.toBeNull();
    });
  });

  describe('stopServer', () => {
    it('closes client and transport', async () => {
      const client = await startServer(makeConfig());
      await stopServer();
      expect(client.close).toHaveBeenCalled();
      expect(isConnected()).toBe(false);
      expect(getClient()).toBeNull();
    });

    it('handles close errors gracefully', async () => {
      const client = await startServer(makeConfig());
      vi.mocked(client.close).mockRejectedValue(new Error('close fail'));
      await expect(stopServer()).resolves.toBeUndefined();
      expect(isConnected()).toBe(false);
    });

    it('is safe to call when not connected', async () => {
      await expect(stopServer()).resolves.toBeUndefined();
    });
  });
});
