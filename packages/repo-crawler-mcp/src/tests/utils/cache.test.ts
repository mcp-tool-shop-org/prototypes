import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponseCache } from '../../utils/cache.js';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache(1000); // 1 second default TTL
  });

  it('stores and retrieves values', () => {
    cache.set('key1', { name: 'test' });
    expect(cache.get('key1')).toEqual({ name: 'test' });
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    cache.set('key1', 'value', 1); // 1ms TTL

    // Spin-wait for expiry
    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }

    expect(cache.get('key1')).toBeUndefined();
  });

  it('tracks hits and misses', () => {
    cache.set('key1', 'value');

    cache.get('key1'); // hit
    cache.get('key1'); // hit
    cache.get('missing'); // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe('67%');
  });

  it('clears all entries and resets stats', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.get('a');

    const cleared = cache.clear();
    expect(cleared).toBe(3);

    const stats = cache.getStats();
    expect(stats.size).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });

  it('prunes expired entries', () => {
    cache.set('short', 'value', 1); // 1ms TTL
    cache.set('long', 'value', 60000); // 60s TTL

    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }

    const pruned = cache.prune();
    expect(pruned).toBe(1);
    expect(cache.get('long')).toBe('value');
  });

  describe('static key()', () => {
    it('builds key from method, owner, repo', () => {
      expect(ResponseCache.key('metadata', 'owner', 'repo')).toBe('metadata:owner/repo');
    });

    it('appends extra discriminator', () => {
      expect(ResponseCache.key('fileContent', 'owner', 'repo', 'src/index.ts:main'))
        .toBe('fileContent:owner/repo:src/index.ts:main');
    });
  });

  it('reports 0% hitRate when no accesses', () => {
    const stats = cache.getStats();
    expect(stats.hitRate).toBe('0%');
  });

  it('uses custom TTL per entry', () => {
    cache.set('fast', 'val', 1); // 1ms
    cache.set('slow', 'val', 60000); // 60s

    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }

    expect(cache.get('fast')).toBeUndefined();
    expect(cache.get('slow')).toBe('val');
  });
});
