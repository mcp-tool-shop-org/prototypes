/**
 * Chunked State Storage & Paging
 *
 * Core principles:
 * - Fixed-size chunks with deterministic boundaries
 * - Explicit page-in/page-out logic
 * - No state mutation across chunks
 * - No cross-chunk smoothing or interpolation
 * - Memory stays within declared budget
 */

import { PerformanceBudget, BudgetEnforcer, estimateStateMemory } from './budget';

// ============================================================================
// Types
// ============================================================================

/**
 * State item stored in chunks
 * Generic to support different state types
 */
export interface ChunkedState<T> {
  /** Unique state index (global, not per-chunk) */
  readonly index: number;
  /** The state data */
  readonly data: T;
  /** Byte size estimate for memory tracking */
  readonly sizeBytes: number;
}

/**
 * A single chunk of states
 */
export interface Chunk<T> {
  /** Chunk identifier (0-indexed) */
  readonly chunkId: number;
  /** Start index (inclusive) */
  readonly startIndex: number;
  /** End index (exclusive) */
  readonly endIndex: number;
  /** States in this chunk */
  readonly states: ReadonlyArray<ChunkedState<T>>;
  /** Total byte size of chunk */
  readonly sizeBytes: number;
  /** Whether chunk is currently loaded in memory */
  loaded: boolean;
}

/**
 * Chunk metadata (for tracking without loading)
 */
export interface ChunkMeta {
  readonly chunkId: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly stateCount: number;
  readonly sizeBytes: number;
  readonly loaded: boolean;
}

/**
 * Page request result
 */
export interface PageResult<T> {
  /** Whether the page operation succeeded */
  readonly success: boolean;
  /** Chunks that were loaded */
  readonly loaded: number[];
  /** Chunks that were unloaded to make room */
  readonly unloaded: number[];
  /** States now available in the requested range */
  readonly states: ReadonlyArray<ChunkedState<T>>;
  /** Error message if failed */
  readonly error?: string;
}

/**
 * Store statistics
 */
export interface StoreStats {
  readonly totalStates: number;
  readonly totalChunks: number;
  readonly loadedChunks: number;
  readonly unloadedChunks: number;
  readonly loadedStates: number;
  readonly memoryUsed: number;
  readonly memoryBudget: number;
  readonly memoryPercent: number;
}

// ============================================================================
// Chunk Boundary Calculation
// ============================================================================

/**
 * Calculate chunk boundaries for a given state count and chunk size
 * Boundaries are deterministic and index-based
 */
export function calculateChunkBoundaries(
  totalStates: number,
  chunkSize: number
): Array<{ chunkId: number; startIndex: number; endIndex: number }> {
  const boundaries: Array<{ chunkId: number; startIndex: number; endIndex: number }> = [];

  let chunkId = 0;
  let startIndex = 0;

  while (startIndex < totalStates) {
    const endIndex = Math.min(startIndex + chunkSize, totalStates);
    boundaries.push({ chunkId, startIndex, endIndex });
    chunkId++;
    startIndex = endIndex;
  }

  return boundaries;
}

/**
 * Get chunk ID for a given state index
 */
export function getChunkIdForIndex(index: number, chunkSize: number): number {
  return Math.floor(index / chunkSize);
}

/**
 * Get index range for a chunk
 */
export function getChunkIndexRange(
  chunkId: number,
  chunkSize: number,
  totalStates: number
): { startIndex: number; endIndex: number } {
  const startIndex = chunkId * chunkSize;
  const endIndex = Math.min(startIndex + chunkSize, totalStates);
  return { startIndex, endIndex };
}

// ============================================================================
// Chunked State Store
// ============================================================================

/**
 * Chunked state store with paging support
 *
 * Manages large state collections by dividing them into fixed-size chunks.
 * Only a subset of chunks is kept in memory at any time.
 */
export class ChunkedStateStore<T> {
  private readonly chunkSize: number;
  private readonly maxLoadedChunks: number;
  private readonly enforcer: BudgetEnforcer;

  private chunks: Map<number, Chunk<T>> = new Map();
  private chunkMetas: ChunkMeta[] = [];
  private loadOrder: number[] = []; // LRU tracking
  private totalStates: number = 0;
  private stateLoader?: (startIndex: number, endIndex: number) => Promise<ChunkedState<T>[]>;

  constructor(
    budget: PerformanceBudget,
    options: {
      /** Custom chunk size (overrides budget) */
      chunkSize?: number;
      /** Maximum chunks to keep loaded */
      maxLoadedChunks?: number;
      /** Async state loader for paging */
      stateLoader?: (startIndex: number, endIndex: number) => Promise<ChunkedState<T>[]>;
    } = {}
  ) {
    this.chunkSize = options.chunkSize ?? budget.memory.chunkSize;
    this.maxLoadedChunks = options.maxLoadedChunks ??
      Math.max(3, Math.floor(budget.memory.maxStateMemory / (this.chunkSize * 1024)));
    this.enforcer = new BudgetEnforcer(budget);
    this.stateLoader = options.stateLoader;
  }

  /**
   * Initialize store with total state count
   * Creates chunk metadata without loading data
   */
  initialize(totalStates: number): void {
    this.totalStates = totalStates;
    this.chunks.clear();
    this.chunkMetas = [];
    this.loadOrder = [];
    this.enforcer.reset();

    const boundaries = calculateChunkBoundaries(totalStates, this.chunkSize);

    for (const { chunkId, startIndex, endIndex } of boundaries) {
      const stateCount = endIndex - startIndex;
      const estimatedSize = estimateStateMemory(stateCount);

      this.chunkMetas.push({
        chunkId,
        startIndex,
        endIndex,
        stateCount,
        sizeBytes: estimatedSize,
        loaded: false,
      });
    }
  }

  /**
   * Load states directly (for small datasets or testing)
   */
  loadAll(states: T[], sizeEstimator?: (state: T) => number): void {
    const estimator = sizeEstimator ?? (() => 1024);

    const chunkedStates: ChunkedState<T>[] = states.map((data, index) => ({
      index,
      data,
      sizeBytes: estimator(data),
    }));

    this.initialize(states.length);

    // Create and load all chunks
    for (const meta of this.chunkMetas) {
      const chunkStates = chunkedStates.slice(meta.startIndex, meta.endIndex);
      const sizeBytes = chunkStates.reduce((sum, s) => sum + s.sizeBytes, 0);

      const chunk: Chunk<T> = {
        chunkId: meta.chunkId,
        startIndex: meta.startIndex,
        endIndex: meta.endIndex,
        states: chunkStates,
        sizeBytes,
        loaded: true,
      };

      this.chunks.set(meta.chunkId, chunk);
      this.chunkMetas[meta.chunkId] = { ...meta, sizeBytes, loaded: true };
      this.loadOrder.push(meta.chunkId);
      this.enforcer.allocateStateMemory(sizeBytes);
    }
  }

  /**
   * Request states in a given index range
   * Pages in required chunks, pages out old chunks if needed
   */
  async requestRange(
    startIndex: number,
    endIndex: number
  ): Promise<PageResult<T>> {
    // Validate range
    if (startIndex < 0 || endIndex > this.totalStates || startIndex >= endIndex) {
      return {
        success: false,
        loaded: [],
        unloaded: [],
        states: [],
        error: `Invalid range: [${startIndex}, ${endIndex}) for ${this.totalStates} states`,
      };
    }

    // Determine required chunks
    const startChunk = getChunkIdForIndex(startIndex, this.chunkSize);
    const endChunk = getChunkIdForIndex(endIndex - 1, this.chunkSize);

    const requiredChunks: number[] = [];
    for (let i = startChunk; i <= endChunk; i++) {
      requiredChunks.push(i);
    }

    // Page in required chunks
    const loadedChunks: number[] = [];
    const unloadedChunks: number[] = [];

    for (const chunkId of requiredChunks) {
      if (!this.isChunkLoaded(chunkId)) {
        // Need to load this chunk
        const unloaded = await this.ensureSpace(this.chunkMetas[chunkId].sizeBytes);
        unloadedChunks.push(...unloaded);

        const loadResult = await this.loadChunk(chunkId);
        if (!loadResult.success) {
          return {
            success: false,
            loaded: loadedChunks,
            unloaded: unloadedChunks,
            states: [],
            error: loadResult.error,
          };
        }
        loadedChunks.push(chunkId);
      } else {
        // Update LRU order
        this.touchChunk(chunkId);
      }
    }

    // Collect states from the range
    const states: ChunkedState<T>[] = [];
    for (const chunkId of requiredChunks) {
      const chunk = this.chunks.get(chunkId);
      if (chunk) {
        for (const state of chunk.states) {
          if (state.index >= startIndex && state.index < endIndex) {
            states.push(state);
          }
        }
      }
    }

    return {
      success: true,
      loaded: loadedChunks,
      unloaded: unloadedChunks,
      states,
    };
  }

  /**
   * Get a single state by index
   */
  async getState(index: number): Promise<ChunkedState<T> | null> {
    if (index < 0 || index >= this.totalStates) {
      return null;
    }

    const result = await this.requestRange(index, index + 1);
    return result.success && result.states.length > 0 ? result.states[0] : null;
  }

  /**
   * Check if a chunk is loaded
   */
  isChunkLoaded(chunkId: number): boolean {
    return this.chunks.has(chunkId) && this.chunks.get(chunkId)!.loaded;
  }

  /**
   * Get chunk metadata
   */
  getChunkMeta(chunkId: number): ChunkMeta | undefined {
    return this.chunkMetas[chunkId];
  }

  /**
   * Get all chunk metadata
   */
  getAllChunkMetas(): ReadonlyArray<ChunkMeta> {
    return this.chunkMetas;
  }

  /**
   * Get store statistics
   */
  getStats(): StoreStats {
    const loadedChunks = this.chunkMetas.filter(m => m.loaded).length;
    const loadedStates = this.chunkMetas
      .filter(m => m.loaded)
      .reduce((sum, m) => sum + m.stateCount, 0);
    const memoryUsed = this.enforcer.getMemoryUsage().stateMemory;
    const memoryBudget = this.enforcer.getBudget().memory.maxStateMemory;

    return {
      totalStates: this.totalStates,
      totalChunks: this.chunkMetas.length,
      loadedChunks,
      unloadedChunks: this.chunkMetas.length - loadedChunks,
      loadedStates,
      memoryUsed,
      memoryBudget,
      memoryPercent: (memoryUsed / memoryBudget) * 100,
    };
  }

  /**
   * Get loaded states (for iteration)
   * Only returns currently loaded states
   */
  getLoadedStates(): ReadonlyArray<ChunkedState<T>> {
    const states: ChunkedState<T>[] = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.loaded) {
        states.push(...chunk.states);
      }
    }
    return states.sort((a, b) => a.index - b.index);
  }

  /**
   * Unload all chunks
   */
  unloadAll(): void {
    for (const chunk of this.chunks.values()) {
      if (chunk.loaded) {
        this.enforcer.releaseStateMemory(chunk.sizeBytes);
      }
    }
    this.chunks.clear();
    this.loadOrder = [];

    // Update metas
    this.chunkMetas = this.chunkMetas.map(m => ({ ...m, loaded: false }));
  }

  /**
   * Preload chunks for a given index range
   * Useful for preparing data before user scrubs to a region
   */
  async preload(startIndex: number, endIndex: number): Promise<void> {
    await this.requestRange(startIndex, endIndex);
  }

  // ============================================================================
  // Private methods
  // ============================================================================

  /**
   * Ensure enough space for a new allocation
   * Returns IDs of unloaded chunks
   */
  private async ensureSpace(requiredBytes: number): Promise<number[]> {
    const unloaded: number[] = [];

    // Check if we have space
    while (!this.enforcer.canAllocateStateMemory(requiredBytes) && this.loadOrder.length > 0) {
      // Unload oldest chunk (LRU)
      const oldestChunkId = this.loadOrder.shift()!;
      await this.unloadChunk(oldestChunkId);
      unloaded.push(oldestChunkId);
    }

    // Also enforce max loaded chunks
    while (this.loadOrder.length >= this.maxLoadedChunks && this.loadOrder.length > 0) {
      const oldestChunkId = this.loadOrder.shift()!;
      await this.unloadChunk(oldestChunkId);
      unloaded.push(oldestChunkId);
    }

    return unloaded;
  }

  /**
   * Load a chunk from source
   */
  private async loadChunk(chunkId: number): Promise<{ success: boolean; error?: string }> {
    const meta = this.chunkMetas[chunkId];
    if (!meta) {
      return { success: false, error: `Chunk ${chunkId} does not exist` };
    }

    if (this.isChunkLoaded(chunkId)) {
      return { success: true };
    }

    // Load states
    let states: ChunkedState<T>[];
    if (this.stateLoader) {
      try {
        states = await this.stateLoader(meta.startIndex, meta.endIndex);
      } catch (err) {
        return {
          success: false,
          error: `Failed to load chunk ${chunkId}: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    } else {
      // No loader, chunk data should already be in chunks map
      const existing = this.chunks.get(chunkId);
      if (existing) {
        states = [...existing.states];
      } else {
        return { success: false, error: `No loader and chunk ${chunkId} not pre-loaded` };
      }
    }

    const sizeBytes = states.reduce((sum, s) => sum + s.sizeBytes, 0);

    // Check memory budget
    if (!this.enforcer.canAllocateStateMemory(sizeBytes)) {
      return {
        success: false,
        error: `Cannot allocate ${sizeBytes} bytes for chunk ${chunkId}`,
      };
    }

    // Create chunk
    const chunk: Chunk<T> = {
      chunkId,
      startIndex: meta.startIndex,
      endIndex: meta.endIndex,
      states,
      sizeBytes,
      loaded: true,
    };

    this.chunks.set(chunkId, chunk);
    this.enforcer.allocateStateMemory(sizeBytes);
    this.loadOrder.push(chunkId);

    // Update meta
    this.chunkMetas[chunkId] = { ...meta, sizeBytes, loaded: true };

    return { success: true };
  }

  /**
   * Unload a chunk from memory
   */
  private async unloadChunk(chunkId: number): Promise<void> {
    const chunk = this.chunks.get(chunkId);
    if (!chunk || !chunk.loaded) {
      return;
    }

    this.enforcer.releaseStateMemory(chunk.sizeBytes);

    // Keep metadata but mark as unloaded
    this.chunks.delete(chunkId);
    this.chunkMetas[chunkId] = { ...this.chunkMetas[chunkId], loaded: false };

    // Remove from load order
    const idx = this.loadOrder.indexOf(chunkId);
    if (idx !== -1) {
      this.loadOrder.splice(idx, 1);
    }
  }

  /**
   * Update LRU order for a chunk
   */
  private touchChunk(chunkId: number): void {
    const idx = this.loadOrder.indexOf(chunkId);
    if (idx !== -1) {
      this.loadOrder.splice(idx, 1);
      this.loadOrder.push(chunkId);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a chunked store from an array of states
 */
export function createChunkedStore<T>(
  states: T[],
  budget: PerformanceBudget,
  sizeEstimator?: (state: T) => number
): ChunkedStateStore<T> {
  const store = new ChunkedStateStore<T>(budget);
  store.loadAll(states, sizeEstimator);
  return store;
}

/**
 * Create an empty chunked store with async loader
 */
export function createAsyncChunkedStore<T>(
  totalStates: number,
  budget: PerformanceBudget,
  loader: (startIndex: number, endIndex: number) => Promise<ChunkedState<T>[]>
): ChunkedStateStore<T> {
  const store = new ChunkedStateStore<T>(budget, { stateLoader: loader });
  store.initialize(totalStates);
  return store;
}
