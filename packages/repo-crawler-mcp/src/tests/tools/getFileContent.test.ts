import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the tool's schema for validation testing
const GetFileContentSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  ref: z.string().optional(),
});

describe('GetFileContentSchema', () => {
  it('validates minimal input', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      path: 'package.json',
    });
    expect(result.success).toBe(true);
  });

  it('validates with ref (branch)', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      path: 'src/index.ts',
      ref: 'develop',
    });
    expect(result.success).toBe(true);
  });

  it('validates with ref (commit SHA)', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      path: 'README.md',
      ref: 'abc123def456',
    });
    expect(result.success).toBe(true);
  });

  it('validates nested file paths', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'org',
      repo: 'repo',
      path: 'src/adapters/github.ts',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty owner', () => {
    const result = GetFileContentSchema.safeParse({
      owner: '',
      repo: 'react',
      path: 'package.json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty repo', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: '',
      path: 'package.json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty path', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
      path: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing path', () => {
    const result = GetFileContentSchema.safeParse({
      owner: 'facebook',
      repo: 'react',
    });
    expect(result.success).toBe(false);
  });
});
