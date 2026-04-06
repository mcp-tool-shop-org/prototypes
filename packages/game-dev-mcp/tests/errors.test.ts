import { describe, it, expect } from 'vitest';
import { createError, errorResult, successResult } from '../src/utils/errors.js';

describe('createError', () => {
  it('creates error with code and message', () => {
    const err = createError('CONNECTION_FAILED', 'Cannot connect');
    expect(err.code).toBe('CONNECTION_FAILED');
    expect(err.message).toBe('Cannot connect');
    expect(err.details).toBeUndefined();
  });

  it('includes details when provided', () => {
    const err = createError('TIMEOUT', 'Timed out', { elapsed: 10000 });
    expect(err.details).toEqual({ elapsed: 10000 });
  });
});

describe('errorResult', () => {
  it('returns ToolError shape', () => {
    const result = errorResult('OBJECT_NOT_FOUND', 'Actor not found');
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });

  it('serializes error to JSON in content', () => {
    const result = errorResult('INVALID_PARAMS', 'Bad port');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.code).toBe('INVALID_PARAMS');
    expect(parsed.message).toBe('Bad port');
  });

  it('includes details in serialized error', () => {
    const result = errorResult('RC_API_ERROR', 'API failed', { status: 500 });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.details).toEqual({ status: 500 });
  });
});

describe('successResult', () => {
  it('returns ToolSuccess shape', () => {
    const result = successResult({ actors: ['a', 'b'] });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });

  it('serializes objects to JSON', () => {
    const data = { count: 5, items: [1, 2, 3] };
    const result = successResult(data);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual(data);
  });

  it('passes strings through directly', () => {
    const result = successResult('plain text response');
    expect(result.content[0].text).toBe('plain text response');
  });

  it('handles null and undefined', () => {
    const result = successResult(null);
    expect(result.content[0].text).toBe('null');
  });
});
