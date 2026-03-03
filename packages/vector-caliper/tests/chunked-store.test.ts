/**
 * Chunked State Storage Tests
 *
 * Acceptance criteria:
 * - Deterministic chunk boundaries (index-based)
 * - Seamless scrubbing across chunk boundaries
 * - Memory stays within declared budget
 * - No state mutation across chunks
 * - No cross-chunk smoothing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateChunkBoundaries,
  getChunkIdForIndex,
  getChunkIndexRange,
  ChunkedStateStore,
  createChunkedStore,
  createAsyncChunkedStore,
  ChunkedState,
} from '../src/scale/chunked-store';
import { SMALL_BUDGET, MEDIUM_BUDGET, LARGE_BUDGET } from '../src/scale/budget';

// Test state type
interface TestState {
  value: number;
  name: string;
}

// Helper to create test states
function createTestStates(count: number): TestState[] {
  return Array.from({ length: count }, (_, i) => ({
    value: i,
    name: `state_${i}`,
  }));
}

describe('Chunk Boundary Calculation', () => {
  describe('calculateChunkBoundaries', () => {
    it('creates single chunk for small state count', () => {
      const boundaries = calculateChunkBoundaries(100, 1000);

      expect(boundaries).toHaveLength(1);
      expect(boundaries[0]).toEqual({ chunkId: 0, startIndex: 0, endIndex: 100 });
    });

    it('creates multiple chunks for larger state count', () => {
      const boundaries = calculateChunkBoundaries(2500, 1000);

      expect(boundaries).toHaveLength(3);
      expect(boundaries[0]).toEqual({ chunkId: 0, startIndex: 0, endIndex: 1000 });
      expect(boundaries[1]).toEqual({ chunkId: 1, startIndex: 1000, endIndex: 2000 });
      expect(boundaries[2]).toEqual({ chunkId: 2, startIndex: 2000, endIndex: 2500 });
    });

    it('handles exact chunk size multiples', () => {
      const boundaries = calculateChunkBoundaries(3000, 1000);

      expect(boundaries).toHaveLength(3);
      expect(boundaries[2]).toEqual({ chunkId: 2, startIndex: 2000, endIndex: 3000 });
    });

    it('handles edge cases', () => {
      expect(calculateChunkBoundaries(0, 1000)).toHaveLength(0);
      expect(calculateChunkBoundaries(1, 1000)).toHaveLength(1);
    });

    it('produces deterministic boundaries', () => {
      const b1 = calculateChunkBoundaries(5000, 1000);
      const b2 = calculateChunkBoundaries(5000, 1000);

      expect(b1).toEqual(b2);
    });
  });

  describe('getChunkIdForIndex', () => {
    it('returns correct chunk for index', () => {
      expect(getChunkIdForIndex(0, 1000)).toBe(0);
      expect(getChunkIdForIndex(999, 1000)).toBe(0);
      expect(getChunkIdForIndex(1000, 1000)).toBe(1);
      expect(getChunkIdForIndex(2500, 1000)).toBe(2);
    });

    it('is consistent with boundaries', () => {
      const boundaries = calculateChunkBoundaries(5000, 1000);

      for (const { chunkId, startIndex, endIndex } of boundaries) {
        expect(getChunkIdForIndex(startIndex, 1000)).toBe(chunkId);
        if (endIndex > startIndex) {
          expect(getChunkIdForIndex(endIndex - 1, 1000)).toBe(chunkId);
        }
      }
    });
  });

  describe('getChunkIndexRange', () => {
    it('returns correct range for chunk', () => {
      expect(getChunkIndexRange(0, 1000, 5000)).toEqual({ startIndex: 0, endIndex: 1000 });
      expect(getChunkIndexRange(1, 1000, 5000)).toEqual({ startIndex: 1000, endIndex: 2000 });
      expect(getChunkIndexRange(4, 1000, 5000)).toEqual({ startIndex: 4000, endIndex: 5000 });
    });

    it('handles partial last chunk', () => {
      expect(getChunkIndexRange(2, 1000, 2500)).toEqual({ startIndex: 2000, endIndex: 2500 });
    });
  });
});

describe('ChunkedStateStore', () => {
  let store: ChunkedStateStore<TestState>;

  describe('initialization', () => {
    it('initializes with correct chunk count', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.initialize(500);

      const stats = store.getStats();
      expect(stats.totalStates).toBe(500);
      expect(stats.totalChunks).toBe(5);
      expect(stats.loadedChunks).toBe(0);
    });

    it('creates chunk metadata', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.initialize(250);

      const metas = store.getAllChunkMetas();
      expect(metas).toHaveLength(3);
      expect(metas[0].startIndex).toBe(0);
      expect(metas[0].endIndex).toBe(100);
      expect(metas[2].startIndex).toBe(200);
      expect(metas[2].endIndex).toBe(250);
    });
  });

  describe('loadAll', () => {
    it('loads all states into chunks', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      const states = createTestStates(250);

      store.loadAll(states);

      const stats = store.getStats();
      expect(stats.loadedChunks).toBe(3);
      expect(stats.loadedStates).toBe(250);
    });

    it('marks all chunks as loaded', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(200));

      expect(store.isChunkLoaded(0)).toBe(true);
      expect(store.isChunkLoaded(1)).toBe(true);
    });
  });

  describe('requestRange', () => {
    beforeEach(() => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(500));
    });

    it('returns states in requested range', async () => {
      const result = await store.requestRange(50, 150);

      expect(result.success).toBe(true);
      expect(result.states).toHaveLength(100);
      expect(result.states[0].index).toBe(50);
      expect(result.states[99].index).toBe(149);
    });

    it('handles single-chunk requests', async () => {
      const result = await store.requestRange(10, 50);

      expect(result.success).toBe(true);
      expect(result.states).toHaveLength(40);
    });

    it('handles multi-chunk requests', async () => {
      const result = await store.requestRange(50, 250);

      expect(result.success).toBe(true);
      expect(result.states).toHaveLength(200);
    });

    it('rejects invalid ranges', async () => {
      const result1 = await store.requestRange(-1, 10);
      expect(result1.success).toBe(false);

      const result2 = await store.requestRange(0, 1000);
      expect(result2.success).toBe(false);

      const result3 = await store.requestRange(100, 50);
      expect(result3.success).toBe(false);
    });

    it('preserves state data correctly', async () => {
      const result = await store.requestRange(0, 10);

      expect(result.success).toBe(true);
      for (let i = 0; i < 10; i++) {
        expect(result.states[i].data.value).toBe(i);
        expect(result.states[i].data.name).toBe(`state_${i}`);
      }
    });
  });

  describe('getState', () => {
    beforeEach(() => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(500));
    });

    it('returns single state by index', async () => {
      const state = await store.getState(42);

      expect(state).not.toBeNull();
      expect(state!.index).toBe(42);
      expect(state!.data.value).toBe(42);
    });

    it('returns null for out of range', async () => {
      expect(await store.getState(-1)).toBeNull();
      expect(await store.getState(500)).toBeNull();
    });
  });

  describe('paging behavior', () => {
    it('unloads chunks when memory limit reached', async () => {
      // Create store with very limited chunks (100 states per chunk)
      const statesData = createTestStates(500);
      const asyncStore = new ChunkedStateStore<TestState>(SMALL_BUDGET, {
        chunkSize: 100,
        maxLoadedChunks: 2, // Only allow 2 chunks loaded at once
        stateLoader: async (start, end) => {
          return statesData.slice(start, end).map((data, i) => ({
            index: start + i,
            data,
            sizeBytes: 1024,
          }));
        },
      });
      asyncStore.initialize(500);

      // Request chunk 0 (indices 0-99)
      await asyncStore.requestRange(0, 100);
      expect(asyncStore.isChunkLoaded(0)).toBe(true);
      expect(asyncStore.getStats().loadedChunks).toBe(1);

      // Request chunk 1 (indices 100-199)
      await asyncStore.requestRange(100, 200);
      expect(asyncStore.isChunkLoaded(1)).toBe(true);
      expect(asyncStore.getStats().loadedChunks).toBe(2);

      // Request chunk 4 - should unload oldest (chunk 0)
      await asyncStore.requestRange(400, 500);
      expect(asyncStore.isChunkLoaded(4)).toBe(true);
      // Max is 2, so one must have been unloaded
      expect(asyncStore.getStats().loadedChunks).toBeLessThanOrEqual(2);
    });

    it('uses LRU for chunk eviction', async () => {
      const statesData = createTestStates(500);
      const asyncStore = new ChunkedStateStore<TestState>(SMALL_BUDGET, {
        chunkSize: 100,
        maxLoadedChunks: 3,
        stateLoader: async (start, end) => {
          return statesData.slice(start, end).map((data, i) => ({
            index: start + i,
            data,
            sizeBytes: 1024,
          }));
        },
      });
      asyncStore.initialize(500);

      // Load chunks 0, 1, 2
      await asyncStore.requestRange(0, 100);   // Load chunk 0
      await asyncStore.requestRange(100, 200); // Load chunk 1
      await asyncStore.requestRange(200, 300); // Load chunk 2

      expect(asyncStore.getStats().loadedChunks).toBe(3);

      // Touch chunk 0 (making it recently used)
      await asyncStore.requestRange(0, 100);

      // Load chunk 3 - should evict chunk 1 (oldest after 0 was touched)
      await asyncStore.requestRange(300, 400);

      // Chunk 0 should still be loaded (recently used)
      expect(asyncStore.isChunkLoaded(0)).toBe(true);
      // Chunk 3 should be loaded (just loaded)
      expect(asyncStore.isChunkLoaded(3)).toBe(true);
      // Total should be <= 3
      expect(asyncStore.getStats().loadedChunks).toBeLessThanOrEqual(3);
    });
  });

  describe('cross-chunk boundary access', () => {
    beforeEach(() => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(500));
    });

    it('seamlessly crosses chunk boundaries', async () => {
      // Request range crossing from chunk 0 to chunk 1
      const result = await store.requestRange(90, 110);

      expect(result.success).toBe(true);
      expect(result.states).toHaveLength(20);

      // Verify continuity
      for (let i = 0; i < 20; i++) {
        expect(result.states[i].index).toBe(90 + i);
        expect(result.states[i].data.value).toBe(90 + i);
      }
    });

    it('maintains correct indices across boundaries', async () => {
      const result = await store.requestRange(95, 205);

      expect(result.success).toBe(true);
      expect(result.states).toHaveLength(110);

      // Check boundary values
      expect(result.states[5].index).toBe(100); // First of chunk 1
      expect(result.states[105].index).toBe(200); // First of chunk 2
    });
  });

  describe('unloadAll', () => {
    it('unloads all chunks', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(300));

      expect(store.getStats().loadedChunks).toBe(3);

      store.unloadAll();

      expect(store.getStats().loadedChunks).toBe(0);
      expect(store.getStats().memoryUsed).toBe(0);
    });

    it('updates chunk metadata', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(200));

      store.unloadAll();

      const metas = store.getAllChunkMetas();
      expect(metas.every(m => !m.loaded)).toBe(true);
    });
  });

  describe('getLoadedStates', () => {
    it('returns only loaded states in order', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(300));

      const loaded = store.getLoadedStates();

      expect(loaded).toHaveLength(300);
      // Should be sorted by index
      for (let i = 0; i < loaded.length - 1; i++) {
        expect(loaded[i].index).toBeLessThan(loaded[i + 1].index);
      }
    });
  });

  describe('statistics', () => {
    it('tracks memory usage', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(200), () => 512);

      const stats = store.getStats();
      expect(stats.memoryUsed).toBe(200 * 512);
      expect(stats.memoryPercent).toBeGreaterThan(0);
    });

    it('updates after unload', () => {
      store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
      store.loadAll(createTestStates(200));

      const before = store.getStats().memoryUsed;
      store.unloadAll();
      const after = store.getStats().memoryUsed;

      expect(after).toBe(0);
      expect(after).toBeLessThan(before);
    });
  });
});

describe('Factory Functions', () => {
  describe('createChunkedStore', () => {
    it('creates and loads store', () => {
      const states = createTestStates(100);
      const store = createChunkedStore(states, SMALL_BUDGET);

      expect(store.getStats().totalStates).toBe(100);
      expect(store.getStats().loadedStates).toBe(100);
    });

    it('uses custom size estimator', () => {
      const states = createTestStates(100);
      const store = createChunkedStore(states, SMALL_BUDGET, () => 2048);

      expect(store.getStats().memoryUsed).toBe(100 * 2048);
    });
  });

  describe('createAsyncChunkedStore', () => {
    it('creates store with loader', async () => {
      const statesData = createTestStates(500);
      const loader = async (start: number, end: number): Promise<ChunkedState<TestState>[]> => {
        return statesData.slice(start, end).map((data, i) => ({
          index: start + i,
          data,
          sizeBytes: 1024,
        }));
      };

      const store = createAsyncChunkedStore(500, MEDIUM_BUDGET, loader);

      expect(store.getStats().totalStates).toBe(500);
      expect(store.getStats().loadedChunks).toBe(0);

      // Load on demand
      const result = await store.requestRange(0, 100);
      expect(result.success).toBe(true);
      expect(store.getStats().loadedChunks).toBeGreaterThan(0);
    });
  });
});

describe('No Cross-Chunk Smoothing', () => {
  it('does not modify state values', async () => {
    const store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });

    // Create states with specific values
    const states: TestState[] = [];
    for (let i = 0; i < 300; i++) {
      states.push({ value: i * 10, name: `s${i}` });
    }
    store.loadAll(states);

    // Request across boundary
    const result = await store.requestRange(95, 105);

    // Values should be exactly as provided, no smoothing
    expect(result.states[4].data.value).toBe(99 * 10); // Index 99
    expect(result.states[5].data.value).toBe(100 * 10); // Index 100 (chunk boundary)
    // No averaging or interpolation
  });

  it('preserves discontinuities across chunks', async () => {
    const store = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });

    // Create states with a jump at chunk boundary
    const states: TestState[] = [];
    for (let i = 0; i < 200; i++) {
      // Big jump at index 100
      states.push({ value: i < 100 ? 0 : 1000, name: `s${i}` });
    }
    store.loadAll(states);

    const result = await store.requestRange(98, 102);

    // Should preserve the discontinuity
    expect(result.states[0].data.value).toBe(0);   // Index 98
    expect(result.states[1].data.value).toBe(0);   // Index 99
    expect(result.states[2].data.value).toBe(1000); // Index 100 (jump!)
    expect(result.states[3].data.value).toBe(1000); // Index 101
  });
});

describe('Deterministic Chunk Boundaries', () => {
  it('same states produce same chunks', () => {
    const states = createTestStates(500);

    const store1 = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
    store1.loadAll(states);

    const store2 = new ChunkedStateStore<TestState>(SMALL_BUDGET, { chunkSize: 100 });
    store2.loadAll(states);

    const metas1 = store1.getAllChunkMetas();
    const metas2 = store2.getAllChunkMetas();

    expect(metas1.length).toBe(metas2.length);
    for (let i = 0; i < metas1.length; i++) {
      expect(metas1[i].startIndex).toBe(metas2[i].startIndex);
      expect(metas1[i].endIndex).toBe(metas2[i].endIndex);
      expect(metas1[i].stateCount).toBe(metas2[i].stateCount);
    }
  });

  it('chunk boundaries based on index not time', () => {
    // Chunks should divide by index, not by any time-based metric
    const boundaries = calculateChunkBoundaries(1000, 100);

    for (const b of boundaries) {
      expect(b.startIndex % 100).toBe(0);
      expect(b.endIndex).toBe(Math.min(b.startIndex + 100, 1000));
    }
  });
});
