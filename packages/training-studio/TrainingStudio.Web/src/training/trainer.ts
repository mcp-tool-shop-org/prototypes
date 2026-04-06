import * as tf from '@tensorflow/tfjs';
import { HyperParams } from './model-factory';
import { LoadedDataset } from './data-loader';
import { EpochMetric } from '../types/bundle';

export interface TrainingState {
  isTraining: boolean;
  isPaused: boolean;
  currentEpoch: number;
  totalEpochs: number;
  currentBatch: number;
  totalBatches: number;
  metrics: TrainingMetrics;
  startTime: number | null;
  elapsedMs: number;
}

export interface TrainingMetrics {
  epochs: number[];
  loss: number[];
  accuracy: number[];
  valLoss: number[];
  valAccuracy: number[];
}

export interface EpochResult {
  epoch: number;
  loss: number;
  accuracy?: number;
  valLoss?: number;
  valAccuracy?: number;
}

export interface TrainingResult {
  metrics: TrainingMetrics;
  epochMetrics: EpochMetric[];
  earlyStopped: boolean;
  durationMs: number;
}

export type TrainingCallback = (state: TrainingState) => void;
export type EpochCallback = (result: EpochResult) => void;

export class Trainer {
  private model: tf.Sequential | null = null;
  private state: TrainingState;
  private abortController: AbortController | null = null;
  private onStateChange: TrainingCallback | null = null;
  private onEpochEndCb: EpochCallback | null = null;

  // Detailed epoch metrics for export
  private epochMetrics: EpochMetric[] = [];
  private earlyStopped: boolean = false;
  private epochStartTime: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): TrainingState {
    return {
      isTraining: false,
      isPaused: false,
      currentEpoch: 0,
      totalEpochs: 0,
      currentBatch: 0,
      totalBatches: 0,
      metrics: {
        epochs: [],
        loss: [],
        accuracy: [],
        valLoss: [],
        valAccuracy: []
      },
      startTime: null,
      elapsedMs: 0
    };
  }

  setCallbacks(onStateChange: TrainingCallback, onEpochEnd: EpochCallback): void {
    this.onStateChange = onStateChange;
    this.onEpochEndCb = onEpochEnd;
  }

  private updateState(partial: Partial<TrainingState>): void {
    this.state = { ...this.state, ...partial };
    if (this.state.startTime) {
      this.state.elapsedMs = Date.now() - this.state.startTime;
    }
    this.onStateChange?.(this.state);
  }

  private addMetrics(result: EpochResult): void {
    this.state.metrics.epochs.push(result.epoch);
    this.state.metrics.loss.push(result.loss);
    if (result.accuracy !== undefined) {
      this.state.metrics.accuracy.push(result.accuracy);
    }
    if (result.valLoss !== undefined) {
      this.state.metrics.valLoss.push(result.valLoss);
    }
    if (result.valAccuracy !== undefined) {
      this.state.metrics.valAccuracy.push(result.valAccuracy);
    }
  }

  async train(
    model: tf.Sequential,
    dataset: LoadedDataset,
    hyperparams: HyperParams
  ): Promise<TrainingResult> {
    this.model = model;
    this.abortController = new AbortController();
    this.epochMetrics = [];
    this.earlyStopped = false;

    const trainingStartTime = Date.now();

    this.updateState({
      ...this.createInitialState(),
      isTraining: true,
      totalEpochs: hyperparams.epochs,
      startTime: trainingStartTime
    });

    const self = this;
    const totalBatches = Math.ceil(dataset.stats.trainSamples / hyperparams.batchSize);
    let batchTimes: number[] = [];
    let batchStartTime = 0;

    const callbacks: tf.CustomCallbackArgs = {
      onEpochBegin: async (epoch: number) => {
        self.epochStartTime = Date.now();
        batchTimes = [];
        self.updateState({ currentEpoch: epoch + 1 });
      },
      onEpochEnd: async (epoch: number, logs?: tf.Logs) => {
        const epochEndTime = Date.now();
        const result: EpochResult = {
          epoch: epoch + 1,
          loss: logs?.loss ?? 0,
          accuracy: logs?.acc,
          valLoss: logs?.val_loss,
          valAccuracy: logs?.val_acc
        };

        // Store detailed epoch metric
        const epochMetric: EpochMetric = {
          epoch: epoch + 1,
          timestamp_ms: epochEndTime,
          loss: logs?.loss ?? 0,
          accuracy: logs?.acc,
          val_loss: logs?.val_loss,
          val_accuracy: logs?.val_acc,
          batch_time_avg_ms: batchTimes.length > 0
            ? batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length
            : undefined
        };
        self.epochMetrics.push(epochMetric);

        self.addMetrics(result);
        self.onEpochEndCb?.(result);
        self.updateState({ currentEpoch: epoch + 1 });

        // Early stopping check
        if (hyperparams.earlyStopping && logs?.val_loss !== undefined) {
          const valLosses = self.state.metrics.valLoss;
          if (valLosses.length > hyperparams.patience) {
            const recentLosses = valLosses.slice(-hyperparams.patience);
            const minRecent = Math.min(...recentLosses);
            const beforePatience = valLosses[valLosses.length - hyperparams.patience - 1];
            if (minRecent >= beforePatience) {
              console.log(`Early stopping at epoch ${epoch + 1}`);
              self.earlyStopped = true;
              model.stopTraining = true;
            }
          }
        }
      },
      onBatchBegin: async (batch: number) => {
        batchStartTime = Date.now();
        self.updateState({ currentBatch: batch + 1 });
      },
      onBatchEnd: async (batch: number) => {
        batchTimes.push(Date.now() - batchStartTime);
        self.updateState({
          currentBatch: batch + 1,
          totalBatches
        });
      }
    };

    try {
      await model.fit(dataset.trainX, dataset.trainY, {
        epochs: hyperparams.epochs,
        batchSize: hyperparams.batchSize,
        validationData: dataset.valX && dataset.valY
          ? [dataset.valX, dataset.valY]
          : undefined,
        shuffle: true,
        callbacks: [callbacks]
      });
    } catch (error) {
      if ((error as Error).message?.includes('abort')) {
        console.log('Training aborted');
      } else {
        throw error;
      }
    } finally {
      this.updateState({ isTraining: false });
    }

    const trainingDuration = Date.now() - trainingStartTime;

    return {
      metrics: this.state.metrics,
      epochMetrics: this.epochMetrics,
      earlyStopped: this.earlyStopped,
      durationMs: trainingDuration
    };
  }

  stop(): void {
    if (this.model) {
      this.model.stopTraining = true;
    }
    this.abortController?.abort();
    this.updateState({ isTraining: false });
  }

  getState(): TrainingState {
    return this.state;
  }

  getMetrics(): TrainingMetrics {
    return this.state.metrics;
  }

  getEpochMetrics(): EpochMetric[] {
    return this.epochMetrics;
  }

  wasEarlyStopped(): boolean {
    return this.earlyStopped;
  }

  getModel(): tf.Sequential | null {
    return this.model;
  }

  async saveModel(): Promise<{ modelJson: string; weightsBase64: string }> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    // Use a promise to capture the artifacts
    const artifacts = await new Promise<tf.io.ModelArtifacts>((resolve, reject) => {
      this.model!.save(tf.io.withSaveHandler(async (arts) => {
        resolve(arts);
        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: 'JSON' as const
          }
        };
      })).catch(reject);
    });

    const modelJson = JSON.stringify({
      modelTopology: artifacts.modelTopology,
      weightsManifest: [{
        paths: ['weights.bin'],
        weights: artifacts.weightSpecs
      }]
    });

    let weightsBase64 = '';
    if (artifacts.weightData) {
      // Handle both ArrayBuffer and ArrayBuffer[] cases
      const weightData = artifacts.weightData;
      let buffer: ArrayBuffer;

      if (Array.isArray(weightData)) {
        // Concatenate multiple buffers
        const totalLength = weightData.reduce((sum, buf) => sum + buf.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of weightData) {
          combined.set(new Uint8Array(buf), offset);
          offset += buf.byteLength;
        }
        buffer = combined.buffer;
      } else {
        buffer = weightData;
      }

      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      weightsBase64 = btoa(binary);
    }

    return { modelJson, weightsBase64 };
  }
}

export const trainer = new Trainer();
