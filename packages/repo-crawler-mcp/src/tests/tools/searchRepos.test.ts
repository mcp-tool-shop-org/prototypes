import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the tool's schema for validation testing
const SearchReposSchema = z.object({
  query: z.string().min(1),
  language: z.string().optional(),
  topic: z.string().optional(),
  min_stars: z.number().min(0).optional(),
  max_stars: z.number().min(0).optional(),
  sort: z.enum(['stars', 'forks', 'updated', 'best-match']).default('best-match'),
  order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(30),
});

describe('SearchReposSchema', () => {
  it('validates minimal input (query only)', () => {
    const result = SearchReposSchema.safeParse({ query: 'mcp server' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort).toBe('best-match');
      expect(result.data.order).toBe('desc');
      expect(result.data.limit).toBe(30);
    }
  });

  it('validates full input with all filters', () => {
    const result = SearchReposSchema.safeParse({
      query: 'mcp',
      language: 'typescript',
      topic: 'model-context-protocol',
      min_stars: 10,
      max_stars: 1000,
      sort: 'stars',
      order: 'desc',
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty query', () => {
    const result = SearchReposSchema.safeParse({ query: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = SearchReposSchema.safeParse({ query: 'test', sort: 'relevance' });
    expect(result.success).toBe(false);
  });

  it('rejects limit over 100', () => {
    const result = SearchReposSchema.safeParse({ query: 'test', limit: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects limit under 1', () => {
    const result = SearchReposSchema.safeParse({ query: 'test', limit: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative min_stars', () => {
    const result = SearchReposSchema.safeParse({ query: 'test', min_stars: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts all sort options', () => {
    for (const sort of ['stars', 'forks', 'updated', 'best-match']) {
      const result = SearchReposSchema.safeParse({ query: 'test', sort });
      expect(result.success).toBe(true);
    }
  });
});
