import { describe, it, expect } from 'vitest';
import { CrawlOrgInputSchema } from '../../types.js';

describe('CrawlOrgInputSchema', () => {
  it('validates minimal input with defaults', () => {
    const result = CrawlOrgInputSchema.parse({ org: 'my-org' });
    expect(result.org).toBe('my-org');
    expect(result.tier).toBe('1');
    expect(result.min_stars).toBe(0);
    expect(result.include_forks).toBe(false);
    expect(result.include_archived).toBe(false);
    expect(result.repo_limit).toBe(30);
    expect(result.page).toBe(1);
  });

  it('validates full input with all filters', () => {
    const result = CrawlOrgInputSchema.parse({
      org: 'my-org',
      tier: '3',
      min_stars: 10,
      language: 'typescript',
      include_forks: true,
      include_archived: true,
      repo_limit: 50,
    });
    expect(result.tier).toBe('3');
    expect(result.min_stars).toBe(10);
    expect(result.language).toBe('typescript');
    expect(result.include_forks).toBe(true);
    expect(result.repo_limit).toBe(50);
  });

  it('rejects empty org', () => {
    expect(() => CrawlOrgInputSchema.parse({ org: '' })).toThrow();
  });

  it('rejects invalid tier', () => {
    expect(() => CrawlOrgInputSchema.parse({ org: 'my-org', tier: '4' })).toThrow();
  });

  it('rejects repo_limit over 100', () => {
    expect(() => CrawlOrgInputSchema.parse({ org: 'my-org', repo_limit: 101 })).toThrow();
  });

  it('rejects negative min_stars', () => {
    expect(() => CrawlOrgInputSchema.parse({ org: 'my-org', min_stars: -1 })).toThrow();
  });
});
