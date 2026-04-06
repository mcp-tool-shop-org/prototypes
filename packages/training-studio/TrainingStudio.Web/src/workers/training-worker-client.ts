/**
 * Training Worker Client
 *
 * Provides a clean async API for interacting with the training WebWorker.
 * Falls back to main thread training if workers are not available.
 */

import type {
  WorkerMessage,
  WorkerResponse,
  TrainPayload,
  EpochPayload,
  CompletePayload,
  ModelConfig,
  TrainingConfig
} from './training.worker';

export type { TrainPayload, EpochPayload, CompletePayload, ModelConfig, TrainingConfig };

export interface TrainingCallbacks {
  onEpoch?: (payload: EpochPayload) => void;
  onComplete?: (payload: CompletePayload) => void;
  onError?: (message: string) => void;
  onStopped?: () => void;
}

/**
 * Training Worker Client - manages WebWorker lifecycle
 */
export class TrainingWorkerClient {
  private worker: Worker | null = null;
  private isReady = false;
  private callbacks: TrainingCallbacks = {};
  private pendingResolve: ((backend: string) => void) | null = null;
  private pendingReject: ((error: Error) => void) | null = null;

  /**
   * Check if WebWorkers are supported
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  /**
   * Initialize the worker
   */
  async init(): Promise<string> {
    if (!TrainingWorkerClient.isSupported()) {
      throw new Error('WebWorkers not supported');
    }

    return new Promise((resolve, reject) => {
      this.pendingResolve = resolve;
      this.pendingReject = reject;

      try {
        // Create worker from URL
        this.worker = new Worker(
          new URL('./training.worker.ts', import.meta.url),
          { type: 'module' }
        );

        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = (error) => {
          this.pendingReject?.(new Error(error.message));
          this.callbacks.onError?.(error.message);
        };

        // Send init message
        this.postMessage({ type: 'init' });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isReady) {
            this.pendingReject?.(new Error('Worker initialization timeout'));
            this.terminate();
          }
        }, 10000);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to create worker'));
      }
    });
  }

  /**
   * Handle messages from worker
   */
  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'ready':
        if (payload && typeof payload === 'object' && 'backend' in payload) {
          this.isReady = true;
          this.pendingResolve?.(payload.backend as string);
          this.pendingResolve = null;
          this.pendingReject = null;
        }
        break;

      case 'epoch':
        this.callbacks.onEpoch?.(payload as EpochPayload);
        break;

      case 'complete':
        this.callbacks.onComplete?.(payload as CompletePayload);
        break;

      case 'error':
        const errorPayload = payload as { message: string };
        this.callbacks.onError?.(errorPayload.message);
        this.pendingReject?.(new Error(errorPayload.message));
        break;

      case 'stopped':
        this.callbacks.onStopped?.();
        break;
    }
  }

  /**
   * Post message to worker
   */
  private postMessage(message: WorkerMessage): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    this.worker.postMessage(message);
  }

  /**
   * Start training
   */
  train(payload: TrainPayload, callbacks: TrainingCallbacks): void {
    if (!this.isReady) {
      callbacks.onError?.('Worker not ready');
      return;
    }

    this.callbacks = callbacks;
    this.postMessage({ type: 'train', payload });
  }

  /**
   * Stop training
   */
  stop(): void {
    if (this.worker && this.isReady) {
      this.postMessage({ type: 'stop' });
    }
  }

  /**
   * Run prediction
   */
  async predict(input: number[][]): Promise<number[][]> {
    if (!this.isReady) {
      throw new Error('Worker not ready');
    }

    return new Promise((resolve, reject) => {
      const originalOnError = this.callbacks.onError;

      // Temporarily override callbacks for prediction
      this.callbacks.onError = (message) => {
        this.callbacks.onError = originalOnError;
        reject(new Error(message));
      };

      const handlePrediction = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'prediction') {
          this.worker?.removeEventListener('message', handlePrediction);
          resolve(event.data.payload as number[][]);
        }
      };

      this.worker?.addEventListener('message', handlePrediction);
      this.postMessage({ type: 'predict', payload: input });
    });
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }

  /**
   * Check if worker is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
}

/**
 * Singleton instance for easy access
 */
let defaultClient: TrainingWorkerClient | null = null;

/**
 * Get or create the default training worker client
 */
export async function getTrainingWorker(): Promise<TrainingWorkerClient> {
  if (!defaultClient || !defaultClient.ready) {
    defaultClient = new TrainingWorkerClient();
    await defaultClient.init();
  }
  return defaultClient;
}

/**
 * Terminate the default worker
 */
export function terminateTrainingWorker(): void {
  defaultClient?.terminate();
  defaultClient = null;
}
