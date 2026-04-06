/**
 * Training History Module
 *
 * Stores training runs in IndexedDB for persistence and comparison.
 */

import { TrainingMetrics } from '../bridge/native-bridge';
import { ConfusionMatrixData } from './confusion-matrix';

const DB_NAME = 'TrainingStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'training_runs';

export interface TrainingRun {
  id: string;
  timestamp: number;
  name: string;
  tags: string[];
  notes: string;
  datasetName: string;
  modelType: string;
  hyperparams: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    optimizer: string;
    earlyStopping: boolean;
    patience: number;
  };
  metrics: TrainingMetrics;
  finalMetrics: {
    trainLoss: number;
    valLoss: number;
    trainAccuracy?: number;
    valAccuracy?: number;
  };
  confusionMatrix?: ConfusionMatrixData;
  durationMs: number;
  earlyStopped: boolean;
}

export interface TrainingRunSummary {
  id: string;
  timestamp: number;
  name: string;
  tags: string[];
  datasetName: string;
  modelType: string;
  finalMetrics: TrainingRun['finalMetrics'];
  durationMs: number;
}

class TrainingHistoryDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store with auto-incrementing key
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('datasetName', 'datasetName', { unique: false });
          store.createIndex('modelType', 'modelType', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  async saveRun(run: TrainingRun): Promise<string> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.put(run);
      request.onsuccess = () => resolve(run.id);
      request.onerror = () => reject(new Error('Failed to save training run'));
    });
  }

  async getRun(id: string): Promise<TrainingRun | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('Failed to get training run'));
    });
  }

  async getAllRuns(): Promise<TrainingRun[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore();
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // Most recent first
      const runs: TrainingRun[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          runs.push(cursor.value);
          cursor.continue();
        } else {
          resolve(runs);
        }
      };
      request.onerror = () => reject(new Error('Failed to get training runs'));
    });
  }

  async getRunSummaries(): Promise<TrainingRunSummary[]> {
    const runs = await this.getAllRuns();
    return runs.map(run => ({
      id: run.id,
      timestamp: run.timestamp,
      name: run.name,
      tags: run.tags,
      datasetName: run.datasetName,
      modelType: run.modelType,
      finalMetrics: run.finalMetrics,
      durationMs: run.durationMs
    }));
  }

  async deleteRun(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete training run'));
    });
  }

  async updateRunMetadata(id: string, updates: Partial<Pick<TrainingRun, 'name' | 'tags' | 'notes'>>): Promise<void> {
    await this.init();
    const run = await this.getRun(id);
    if (!run) throw new Error('Training run not found');

    const updatedRun = {
      ...run,
      ...updates
    };

    await this.saveRun(updatedRun);
  }

  async getBestRun(metric: 'valLoss' | 'valAccuracy' = 'valLoss'): Promise<TrainingRun | null> {
    const runs = await this.getAllRuns();
    if (runs.length === 0) return null;

    if (metric === 'valLoss') {
      // Lower is better
      return runs.reduce((best, run) =>
        (run.finalMetrics.valLoss ?? Infinity) < (best.finalMetrics.valLoss ?? Infinity) ? run : best
      );
    } else {
      // Higher is better
      return runs.reduce((best, run) =>
        (run.finalMetrics.valAccuracy ?? 0) > (best.finalMetrics.valAccuracy ?? 0) ? run : best
      );
    }
  }

  async clearAllRuns(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.getStore('readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear training runs'));
    });
  }
}

// Export singleton instance
export const trainingHistory = new TrainingHistoryDB();

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format duration in ms to human readable string
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Compare two training runs
 */
export function compareRuns(run1: TrainingRun, run2: TrainingRun): {
  run1Better: boolean;
  metricComparison: {
    metric: string;
    run1Value: number;
    run2Value: number;
    better: 'run1' | 'run2' | 'tie';
  }[];
} {
  const comparisons: {
    metric: string;
    run1Value: number;
    run2Value: number;
    better: 'run1' | 'run2' | 'tie';
  }[] = [];

  // Compare val_loss (lower is better)
  if (run1.finalMetrics.valLoss !== undefined && run2.finalMetrics.valLoss !== undefined) {
    comparisons.push({
      metric: 'Validation Loss',
      run1Value: run1.finalMetrics.valLoss,
      run2Value: run2.finalMetrics.valLoss,
      better: run1.finalMetrics.valLoss < run2.finalMetrics.valLoss ? 'run1' :
              run1.finalMetrics.valLoss > run2.finalMetrics.valLoss ? 'run2' : 'tie'
    });
  }

  // Compare val_accuracy (higher is better)
  if (run1.finalMetrics.valAccuracy !== undefined && run2.finalMetrics.valAccuracy !== undefined) {
    comparisons.push({
      metric: 'Validation Accuracy',
      run1Value: run1.finalMetrics.valAccuracy,
      run2Value: run2.finalMetrics.valAccuracy,
      better: run1.finalMetrics.valAccuracy > run2.finalMetrics.valAccuracy ? 'run1' :
              run1.finalMetrics.valAccuracy < run2.finalMetrics.valAccuracy ? 'run2' : 'tie'
    });
  }

  // Compare train_loss (lower is better)
  comparisons.push({
    metric: 'Training Loss',
    run1Value: run1.finalMetrics.trainLoss,
    run2Value: run2.finalMetrics.trainLoss,
    better: run1.finalMetrics.trainLoss < run2.finalMetrics.trainLoss ? 'run1' :
            run1.finalMetrics.trainLoss > run2.finalMetrics.trainLoss ? 'run2' : 'tie'
  });

  // Determine overall winner based on val_loss (primary) or train_loss (fallback)
  const primaryComparison = comparisons.find(c => c.metric === 'Validation Loss') ||
                           comparisons.find(c => c.metric === 'Training Loss');

  return {
    run1Better: primaryComparison?.better === 'run1',
    metricComparison: comparisons
  };
}
