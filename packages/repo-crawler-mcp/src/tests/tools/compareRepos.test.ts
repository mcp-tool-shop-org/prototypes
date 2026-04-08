import { describe, it, expect } from 'vitest';
import { CompareReposInputSchema } from '../../types.js';

describe('CompareReposInputSchema', () => {
  it('validates minimal input (2 repos)', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [
        { owner: 'facebook', repo: 'react' },
        { owner: 'vuejs', repo: 'vue' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('validates full input with aspects', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [
        { owner: 'facebook', repo: 'react' },
        { owner: 'vuejs', repo: 'vue' },
        { owner: 'angular', repo: 'angular' },
      ],
      aspects: ['metadata', 'languages', 'activity'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects fewer than 2 repos', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [{ owner: 'facebook', repo: 'react' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 5 repos', () => {
    const repos = Array.from({ length: 6 }, (_, i) => ({ owner: `org${i}`, repo: `repo${i}` }));
    const result = CompareReposInputSchema.safeParse({ repos });
    expect(result.success).toBe(false);
  });

  it('rejects empty owner', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [
        { owner: '', repo: 'react' },
        { owner: 'vuejs', repo: 'vue' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid aspect', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [
        { owner: 'facebook', repo: 'react' },
        { owner: 'vuejs', repo: 'vue' },
      ],
      aspects: ['metadata', 'invalid_aspect'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid aspects', () => {
    const result = CompareReposInputSchema.safeParse({
      repos: [
        { owner: 'facebook', repo: 'react' },
        { owner: 'vuejs', repo: 'vue' },
      ],
      aspects: ['metadata', 'languages', 'activity', 'community', 'size'],
    });
    expect(result.success).toBe(true);
  });
});
