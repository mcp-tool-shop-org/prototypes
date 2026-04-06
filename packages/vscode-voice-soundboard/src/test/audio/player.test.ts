import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process.spawn
const mockSpawn = vi.fn();
vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

import { playAudio, stopAudio, isPlaying } from '../../audio/player.js';

function createMockProcess() {
  const proc = new EventEmitter() as EventEmitter & { kill: ReturnType<typeof vi.fn> };
  proc.kill = vi.fn();
  return proc;
}

describe('audio/player', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure clean state
    stopAudio();
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  describe('playAudio', () => {
    it('uses powershell on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('C:\\audio\\test.wav');
      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell',
        expect.arrayContaining(['-NoProfile', '-Command']),
        { stdio: 'ignore' },
      );
    });

    it('escapes single quotes in Windows path', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio("C:\\audio\\it's.wav");
      const psCommand = mockSpawn.mock.calls[0][1][2];
      expect(psCommand).toContain("it''s.wav");
    });

    it('uses afplay on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      expect(mockSpawn).toHaveBeenCalledWith('afplay', ['/tmp/test.wav'], { stdio: 'ignore' });
    });

    it('uses paplay on Linux', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      expect(mockSpawn).toHaveBeenCalledWith('paplay', ['/tmp/test.wav'], { stdio: 'ignore' });
    });

    it('falls back to aplay on Linux if paplay fails', () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      const proc1 = createMockProcess();
      const proc2 = createMockProcess();
      mockSpawn.mockReturnValueOnce(proc1).mockReturnValueOnce(proc2);

      playAudio('/tmp/test.wav');
      // Simulate paplay error
      proc1.emit('error', new Error('not found'));

      expect(mockSpawn).toHaveBeenCalledTimes(2);
      expect(mockSpawn).toHaveBeenLastCalledWith('aplay', ['/tmp/test.wav'], { stdio: 'ignore' });
    });

    it('does not fall back on non-Linux error', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      proc.emit('error', new Error('not found'));

      expect(mockSpawn).toHaveBeenCalledTimes(1);
    });

    it('stops previous audio before playing new', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc1 = createMockProcess();
      const proc2 = createMockProcess();
      mockSpawn.mockReturnValueOnce(proc1).mockReturnValueOnce(proc2);

      playAudio('/tmp/first.wav');
      playAudio('/tmp/second.wav');

      expect(proc1.kill).toHaveBeenCalled();
    });

    it('sets isPlaying to true during playback', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      expect(isPlaying()).toBe(true);
    });

    it('clears activeProcess on exit', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      expect(isPlaying()).toBe(true);

      proc.emit('exit', 0);
      expect(isPlaying()).toBe(false);
    });
  });

  describe('stopAudio', () => {
    it('kills the active process', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const proc = createMockProcess();
      mockSpawn.mockReturnValue(proc);

      playAudio('/tmp/test.wav');
      stopAudio();

      expect(proc.kill).toHaveBeenCalled();
      expect(isPlaying()).toBe(false);
    });

    it('is safe to call with no active process', () => {
      expect(() => stopAudio()).not.toThrow();
      expect(isPlaying()).toBe(false);
    });
  });

  describe('isPlaying', () => {
    it('returns false initially', () => {
      expect(isPlaying()).toBe(false);
    });
  });
});
