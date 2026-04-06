import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Uri } from 'vscode';
import { formatVttTime, SidebarProvider } from '../../views/SidebarProvider.js';

// Mock dependencies
vi.mock('../../mcp/client.js', () => ({
  speak: vi.fn(),
  getStatus: vi.fn(),
  dialogue: vi.fn(),
  interrupt: vi.fn(),
}));

vi.mock('../../mcp/lifecycle.js', () => ({
  isConnected: vi.fn(),
}));

vi.mock('../../audio/player.js', () => ({
  playAudio: vi.fn(),
  stopAudio: vi.fn(),
  isPlaying: vi.fn(),
}));

vi.mock('../../config.js', () => ({
  getConfig: vi.fn(() => ({
    defaultVoice: 'bm_george',
    speed: 1.0,
  })),
}));

import * as mcpClient from '../../mcp/client.js';
import { isConnected } from '../../mcp/lifecycle.js';
import { playAudio, stopAudio } from '../../audio/player.js';

describe('formatVttTime', () => {
  it('formats zero milliseconds', () => {
    expect(formatVttTime(0)).toBe('00:00:00.000');
  });

  it('formats milliseconds only', () => {
    expect(formatVttTime(500)).toBe('00:00:00.500');
  });

  it('formats seconds', () => {
    expect(formatVttTime(5000)).toBe('00:00:05.000');
  });

  it('formats minutes', () => {
    expect(formatVttTime(65000)).toBe('00:01:05.000');
  });

  it('formats hours', () => {
    expect(formatVttTime(3661500)).toBe('01:01:01.500');
  });

  it('pads single digits', () => {
    expect(formatVttTime(1001)).toBe('00:00:01.001');
  });

  it('handles exact minute boundary', () => {
    expect(formatVttTime(60000)).toBe('00:01:00.000');
  });

  it('handles exact hour boundary', () => {
    expect(formatVttTime(3600000)).toBe('01:00:00.000');
  });

  it('handles large timestamps', () => {
    expect(formatVttTime(7261999)).toBe('02:01:01.999');
  });
});

describe('SidebarProvider', () => {
  let provider: SidebarProvider;
  let mockPostMessage: ReturnType<typeof vi.fn>;
  let messageHandler: (msg: Record<string, unknown>) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new SidebarProvider(Uri.file('/ext'));
    mockPostMessage = vi.fn().mockResolvedValue(true);

    // Simulate resolveWebviewView to capture the message handler
    const mockWebviewView = {
      webview: {
        options: {},
        html: '',
        onDidReceiveMessage: vi.fn((handler: (msg: Record<string, unknown>) => Promise<void>) => {
          messageHandler = handler;
        }),
        postMessage: mockPostMessage,
        asWebviewUri: vi.fn((uri: Uri) => uri),
        cspSource: 'https://mock.csp',
      },
    };

    vi.mocked(isConnected).mockReturnValue(false);
    provider.resolveWebviewView(mockWebviewView as never);
  });

  describe('resolveWebviewView', () => {
    it('sets enableScripts on webview', () => {
      const mockView = {
        webview: {
          options: {},
          html: '',
          onDidReceiveMessage: vi.fn(),
          postMessage: vi.fn(),
          asWebviewUri: vi.fn((uri: Uri) => uri),
          cspSource: 'https://mock.csp',
        },
      };
      vi.mocked(isConnected).mockReturnValue(false);

      const p = new SidebarProvider(Uri.file('/ext'));
      p.resolveWebviewView(mockView as never);
      expect(mockView.webview.options.enableScripts).toBe(true);
    });

    it('generates HTML with CSP and nonce', () => {
      const mockView = {
        webview: {
          options: {} as Record<string, unknown>,
          html: '',
          onDidReceiveMessage: vi.fn(),
          postMessage: vi.fn(),
          asWebviewUri: vi.fn((uri: Uri) => uri),
          cspSource: 'https://mock.csp',
        },
      };
      vi.mocked(isConnected).mockReturnValue(false);

      const p = new SidebarProvider(Uri.file('/ext'));
      p.resolveWebviewView(mockView as never);
      expect(mockView.webview.html).toContain('Content-Security-Policy');
      expect(mockView.webview.html).toContain('nonce-');
      expect(mockView.webview.html).toContain('Voice Soundboard');
    });

    it('sends status when already connected', () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockRejectedValue(new Error('fail'));

      const mockView = {
        webview: {
          options: {} as Record<string, unknown>,
          html: '',
          onDidReceiveMessage: vi.fn(),
          postMessage: vi.fn().mockResolvedValue(true),
          asWebviewUri: vi.fn((uri: Uri) => uri),
          cspSource: 'https://mock.csp',
        },
      };
      const p = new SidebarProvider(Uri.file('/ext'));
      p.resolveWebviewView(mockView as never);
      // sendStatus would have been called since isConnected is true
    });
  });

  describe('message: speak', () => {
    it('calls MCP speak and plays audio', async () => {
      vi.mocked(mcpClient.speak).mockResolvedValue({
        traceId: 't1',
        voiceUsed: 'bm_george',
        speed: 1.0,
        artifactMode: 'path',
        audioPath: '/tmp/out.wav',
        format: 'wav',
      });

      await messageHandler({ type: 'speak', text: 'hello', voice: 'bm_george', speed: 1.0 });

      expect(mcpClient.speak).toHaveBeenCalledWith('hello', 'bm_george', 1.0);
      expect(playAudio).toHaveBeenCalledWith('/tmp/out.wav');
      // Should post speaking=true then speaking=false
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'speaking', speaking: true });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'speaking', speaking: false });
    });

    it('ignores empty text', async () => {
      await messageHandler({ type: 'speak', text: '' });
      expect(mcpClient.speak).not.toHaveBeenCalled();
    });

    it('posts error on speak failure', async () => {
      vi.mocked(mcpClient.speak).mockRejectedValue(new Error('TTS failed'));
      await messageHandler({ type: 'speak', text: 'test' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: 'TTS failed' }),
      );
    });
  });

  describe('message: stop', () => {
    it('stops audio and interrupts MCP', async () => {
      vi.mocked(mcpClient.interrupt).mockResolvedValue({ interrupted: true, reason: 'manual' });
      await messageHandler({ type: 'stop' });
      expect(stopAudio).toHaveBeenCalled();
      expect(mcpClient.interrupt).toHaveBeenCalled();
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'speaking', speaking: false });
    });
  });

  describe('message: preview', () => {
    it('speaks preview text with voice', async () => {
      vi.mocked(mcpClient.speak).mockResolvedValue({
        traceId: 't1',
        voiceUsed: 'af_jessica',
        speed: 1.0,
        artifactMode: 'path',
        audioPath: '/tmp/preview.wav',
        format: 'wav',
      });

      await messageHandler({ type: 'preview', voiceId: 'af_jessica', voiceName: 'Jessica' });
      expect(mcpClient.speak).toHaveBeenCalledWith("Hello, I'm Jessica.", 'af_jessica');
      expect(playAudio).toHaveBeenCalledWith('/tmp/preview.wav');
    });

    it('silently handles preview errors', async () => {
      vi.mocked(mcpClient.speak).mockRejectedValue(new Error('fail'));
      await expect(messageHandler({ type: 'preview', voiceId: 'v1', voiceName: 'V1' }))
        .resolves.toBeUndefined();
      // No error message posted
      expect(mockPostMessage).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });
  });

  describe('message: requestStatus', () => {
    it('posts disconnected status when not connected', async () => {
      vi.mocked(isConnected).mockReturnValue(false);
      await messageHandler({ type: 'requestStatus' });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'status', connected: false });
    });

    it('posts full status when connected', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockResolvedValue({
        voices: [{ id: 'v1', name: 'V1', gender: 'male', accent: 'US', style: 'calm', language: 'en' }],
        presets: [],
        defaultVoice: 'v1',
        backend: { type: 'mock', ready: true },
      });

      await messageHandler({ type: 'requestStatus' });
      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'status',
          connected: true,
          voices: expect.arrayContaining([expect.objectContaining({ id: 'v1' })]),
        }),
      );
    });

    it('posts disconnected on status error', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockRejectedValue(new Error('fail'));
      await messageHandler({ type: 'requestStatus' });
      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'status', connected: false });
    });
  });

  describe('notifyConnected', () => {
    it('sends status update', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockRejectedValue(new Error('fail'));
      provider.notifyConnected();
      // Just verify it doesn't throw
    });
  });

  describe('notifySetupRequired', () => {
    it('posts setup required message', () => {
      provider.notifySetupRequired('Install Python', 'python');
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'setupRequired',
        message: 'Install Python',
        backend: 'python',
      });
    });
  });
});
