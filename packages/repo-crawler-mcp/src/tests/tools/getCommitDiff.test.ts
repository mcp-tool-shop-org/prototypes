import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const GetCommitDiffSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  ref: z.string().min(1),
  include_patch: z.boolean().default(true),
});

describe('GetCommitDiffSchema', () => {
  it('validates minimal input (ref only)', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      ref: 'abc123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include_patch).toBe(true);
    }
  });

  it('validates with include_patch false', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      ref: 'main',
      include_patch: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include_patch).toBe(false);
    }
  });

  it('accepts branch names as ref', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'org',
      repo: 'repo',
      ref: 'feature/my-branch',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full SHA as ref', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'org',
      repo: 'repo',
      ref: 'abc123def456789012345678901234567890abcd',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty ref', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      ref: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty owner', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: '',
      repo: 'react',
      ref: 'abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing ref', () => {
    const result = GetCommitDiffSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
    });
    expect(result.success).toBe(false);
  });
});
