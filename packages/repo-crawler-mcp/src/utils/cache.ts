import { log } from './logger.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export interface CacheHit<T> {
  value: T;
  fromCache: true;
  cacheAgeMs: number;
}

export interface CacheMiss {
  value: undefined;
  fromCache: false;
  cacheAgeMs: 0;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: string;
}

/**
 * Simple in-memory TTL cache for GitHub API responses.
 * Keys are strings (e.g. "metadata:owner/repo"), values expire after ttlMs.
 */
export class ResponseCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  constructor(private defaultTtlMs: number = 5 * 60 * 1000) {}

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value as T;
  }

  /** Get value with cache metadata (fromCache, cacheAgeMs). */
  getWithMeta<T>(key: string): CacheHit<T> | CacheMiss {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return { value: undefined, fromCache: false, cacheAgeMs: 0 };
    }
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return { value: undefined, fromCache: false, cacheAgeMs: 0 };
    }
    this.hits++;
    return { value: entry.value as T, fromCache: true, cacheAgeMs: now - entry.storedAt };
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      storedAt: now,
      expiresAt: now + (ttlMs ?? this.defaultTtlMs),
    });
  }

  /** Build a cache key from method + owner/repo + optional extra discriminator. */
  static key(method: string, owner: string, repo: string, extra?: string): string {
    const base = `${method}:${owner}/${repo}`;
    return extra ? `${base}:${extra}` : base;
  }

  clear(): number {
    const size = this.store.size;
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    log.info(`Cache cleared (${size} entries removed)`);
    return size;
  }

  /** Remove expired entries without clearing valid ones. */
  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  getStats(): CacheStats {
    // Prune expired before reporting
    this.prune();
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? `${Math.round((this.hits / total) * 100)}%` : '0%',
    };
  }
}
