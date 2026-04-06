import { describe, it, expect, vi, beforeEach } from 'vitest';
import { window, commands as vsCommands } from 'vscode';

// Mock dependencies
vi.mock('../mcp/client.js', () => ({
  getStatus: vi.fn(),
  speak: vi.fn(),
  interrupt: vi.fn(),
}));

vi.mock('../mcp/lifecycle.js', () => ({
  isConnected: vi.fn(),
}));

vi.mock('../audio/player.js', () => ({
  playAudio: vi.fn(),
  stopAudio: vi.fn(),
}));

vi.mock('../config.js', () => ({
  getConfig: vi.fn(() => ({
    defaultVoice: 'bm_george',
    speed: 1.0,
    backend: 'python',
    autoStart: true,
    format: 'wav',
    openaiApiKey: '',
    pythonPath: '',
  })),
}));

import * as mcpClient from '../mcp/client.js';
import { isConnected } from '../mcp/lifecycle.js';
import { playAudio, stopAudio } from '../audio/player.js';
import {
  refreshVoiceCache,
  speakText,
  speakSelection,
  stopSpeaking,
  setVoice,
  togglePanel,
} from '../commands.js';

describe('commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('refreshVoiceCache', () => {
    it('does nothing when not connected', async () => {
      vi.mocked(isConnected).mockReturnValue(false);
      await refreshVoiceCache();
      expect(mcpClient.getStatus).not.toHaveBeenCalled();
    });

    it('fetches voices when connected', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockResolvedValue({
        voices: [{ id: 'v1', name: 'Voice 1', gender: 'male', accent: 'US', style: 'calm', language: 'en' }],
        presets: [],
        defaultVoice: 'v1',
        backend: { type: 'mock', ready: true },
      });

      await refreshVoiceCache();
      expect(mcpClient.getStatus).toHaveBeenCalled();
    });

    it('swallows errors silently', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockRejectedValue(new Error('fail'));
      await expect(refreshVoiceCache()).resolves.toBeUndefined();
    });
  });

  describe('speakText', () => {
    it('shows warning when not connected', async () => {
      vi.mocked(isConnected).mockReturnValue(false);
      await speakText();
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('not connected'),
      );
    });

    it('does nothing when user cancels input box', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(window.showInputBox).mockResolvedValue(undefined);
      await speakText();
      expect(mcpClient.speak).not.toHaveBeenCalled();
    });

    it('speaks text from input box', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(window.showInputBox).mockResolvedValue('Hello world');
      vi.mocked(mcpClient.speak).mockResolvedValue({
        traceId: 't1',
        voiceUsed: 'bm_george',
        speed: 1.0,
        artifactMode: 'path',
        audioPath: '/tmp/out.wav',
        format: 'wav',
      });

      await speakText();
      expect(mcpClient.speak).toHaveBeenCalledWith('Hello world', 'bm_george', 1.0);
      expect(playAudio).toHaveBeenCalledWith('/tmp/out.wav');
    });

    it('shows error on speak failure', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(window.showInputBox).mockResolvedValue('test');
      vi.mocked(mcpClient.speak).mockRejectedValue(new Error('TTS failed'));

      await speakText();
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('TTS failed'),
      );
    });

    it('does not play audio when no audioPath returned', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(window.showInputBox).mockResolvedValue('test');
      vi.mocked(mcpClient.speak).mockResolvedValue({
        traceId: 't1',
        voiceUsed: 'bm_george',
        speed: 1.0,
        artifactMode: 'base64',
        format: 'wav',
      });

      await speakText();
      expect(playAudio).not.toHaveBeenCalled();
    });
  });

  describe('speakSelection', () => {
    it('shows warning when not connected', async () => {
      vi.mocked(isConnected).mockReturnValue(false);
      await speakSelection();
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('not connected'),
      );
    });

    it('warns when no active editor', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      window.activeTextEditor = undefined;
      await speakSelection();
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('No active editor'),
      );
    });

    it('warns when no text selected', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      window.activeTextEditor = {
        document: { getText: vi.fn().mockReturnValue('') },
        selection: {},
      } as never;
      await speakSelection();
      expect(window.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('No text selected'),
      );
    });

    it('speaks selected text', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      window.activeTextEditor = {
        document: { getText: vi.fn().mockReturnValue('selected text') },
        selection: {},
      } as never;
      vi.mocked(mcpClient.speak).mockResolvedValue({
        traceId: 't1',
        voiceUsed: 'bm_george',
        speed: 1.0,
        artifactMode: 'path',
        audioPath: '/tmp/out.wav',
        format: 'wav',
      });

      await speakSelection();
      expect(mcpClient.speak).toHaveBeenCalledWith('selected text', 'bm_george', 1.0);
    });
  });

  describe('stopSpeaking', () => {
    it('stops audio and interrupts MCP', () => {
      vi.mocked(mcpClient.interrupt).mockResolvedValue({
        interrupted: true,
        reason: 'manual',
      });

      stopSpeaking();
      expect(stopAudio).toHaveBeenCalled();
      expect(mcpClient.interrupt).toHaveBeenCalled();
    });

    it('swallows interrupt errors', () => {
      vi.mocked(mcpClient.interrupt).mockRejectedValue(new Error('fail'));
      expect(() => stopSpeaking()).not.toThrow();
    });
  });

  describe('setVoice', () => {
    it('shows quick pick with voice options', async () => {
      // Ensure cache is populated (may already be from refreshVoiceCache tests)
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(mcpClient.getStatus).mockResolvedValue({
        voices: [{ id: 'v1', name: 'Voice 1', gender: 'male', accent: 'US', style: 'calm', language: 'en' }],
        presets: [],
        defaultVoice: 'v1',
        backend: { type: 'mock', ready: true },
      });
      // Pre-populate cache
      await refreshVoiceCache();
      vi.clearAllMocks();

      vi.mocked(window.showQuickPick).mockResolvedValue(undefined);
      await setVoice();
      expect(window.showQuickPick).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: 'Voice 1', detail: 'v1' }),
        ]),
        expect.objectContaining({ placeHolder: 'Select a voice' }),
      );
    });

    it('does nothing when user cancels picker', async () => {
      vi.mocked(isConnected).mockReturnValue(true);
      vi.mocked(window.showQuickPick).mockResolvedValue(undefined);
      await setVoice();
      // No config update or info message
      expect(window.showInformationMessage).not.toHaveBeenCalled();
    });
  });

  describe('togglePanel', () => {
    it('executes sidebar focus command', () => {
      togglePanel();
      expect(vsCommands.executeCommand).toHaveBeenCalledWith('voiceSoundboard.sidebar.focus');
    });
  });
});
