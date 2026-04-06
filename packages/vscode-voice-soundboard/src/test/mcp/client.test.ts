import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseToolResult, getStatus, speak, dialogue, interrupt } from '../../mcp/client.js';

// Mock lifecycle to control getClient()
vi.mock('../../mcp/lifecycle.js', () => ({
  getClient: vi.fn(),
}));

import { getClient } from '../../mcp/lifecycle.js';

const mockCallTool = vi.fn();

function setClient(connected: boolean) {
  vi.mocked(getClient).mockReturnValue(
    connected ? { callTool: mockCallTool } as never : null,
  );
}

describe('parseToolResult', () => {
  it('parses text content from MCP response', () => {
    const result = parseToolResult({
      content: [{ type: 'text', text: '{"key": "value"}' }],
    });
    expect(result).toEqual({ key: 'value' });
  });

  it('throws on empty content array', () => {
    expect(() => parseToolResult({ content: [] })).toThrow('Empty response');
  });

  it('throws when no text content found', () => {
    expect(() => parseToolResult({
      content: [{ type: 'image' }],
    })).toThrow('Empty response');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseToolResult({
      content: [{ type: 'text', text: 'not json' }],
    })).toThrow();
  });

  it('parses arrays', () => {
    const result = parseToolResult({
      content: [{ type: 'text', text: '[1, 2, 3]' }],
    });
    expect(result).toEqual([1, 2, 3]);
  });

  it('finds text among mixed content types', () => {
    const result = parseToolResult({
      content: [
        { type: 'image' },
        { type: 'text', text: '{"found": true}' },
      ],
    });
    expect(result).toEqual({ found: true });
  });
});

describe('getStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when not connected', async () => {
    setClient(false);
    await expect(getStatus()).rejects.toThrow('not connected');
  });

  it('calls voice_status tool', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"voices": [], "presets": []}' }],
    });

    const result = await getStatus();
    expect(mockCallTool).toHaveBeenCalledWith({ name: 'voice_status', arguments: {} });
    expect(result).toEqual({ voices: [], presets: [] });
  });
});

describe('speak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when not connected', async () => {
    setClient(false);
    await expect(speak('hello')).rejects.toThrow('not connected');
  });

  it('calls voice_speak with text and artifactMode', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"audioPath": "/tmp/out.wav"}' }],
    });

    await speak('hello');
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'voice_speak',
      arguments: { text: 'hello', artifactMode: 'path' },
    });
  });

  it('includes voice and speed when provided', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"audioPath": "/tmp/out.wav"}' }],
    });

    await speak('test', 'af_jessica', 1.5);
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'voice_speak',
      arguments: { text: 'test', artifactMode: 'path', voice: 'af_jessica', speed: 1.5 },
    });
  });

  it('omits voice and speed when undefined', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{}' }],
    });

    await speak('text', undefined, undefined);
    const callArgs = mockCallTool.mock.calls[0][0].arguments;
    expect(callArgs).not.toHaveProperty('voice');
    expect(callArgs).not.toHaveProperty('speed');
  });
});

describe('dialogue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when not connected', async () => {
    setClient(false);
    await expect(dialogue('Alice: hi')).rejects.toThrow('not connected');
  });

  it('calls voice_dialogue with script', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"lineCount": 1, "artifacts": []}' }],
    });

    await dialogue('Alice: hello');
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'voice_dialogue',
      arguments: { script: 'Alice: hello', artifactMode: 'path' },
    });
  });

  it('includes cast and speed when provided', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"lineCount": 1}' }],
    });

    const cast = { Alice: 'af_jessica' };
    await dialogue('Alice: hi', cast, 0.8);
    const callArgs = mockCallTool.mock.calls[0][0].arguments;
    expect(callArgs.cast).toEqual(cast);
    expect(callArgs.speed).toBe(0.8);
  });
});

describe('interrupt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when not connected', async () => {
    setClient(false);
    await expect(interrupt()).rejects.toThrow('not connected');
  });

  it('calls voice_interrupt with manual reason', async () => {
    setClient(true);
    mockCallTool.mockResolvedValue({
      content: [{ type: 'text', text: '{"interrupted": true}' }],
    });

    const result = await interrupt();
    expect(mockCallTool).toHaveBeenCalledWith({
      name: 'voice_interrupt',
      arguments: { reason: 'manual' },
    });
    expect(result.interrupted).toBe(true);
  });
});
