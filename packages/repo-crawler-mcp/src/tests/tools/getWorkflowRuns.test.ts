import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const GetWorkflowRunsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  limit: z.number().min(1).max(100).default(10),
});

describe('GetWorkflowRunsSchema', () => {
  it('validates minimal input with defaults', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it('validates with custom limit', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      limit: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('rejects limit over 100', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      limit: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects limit under 1', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      limit: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty owner', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: '',
      repo: 'react',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty repo', () => {
    const result = GetWorkflowRunsSchema.safeParse({
      owner: 'facebook',
      repo: '',
    });
    expect(result.success).toBe(false);
  });
});
