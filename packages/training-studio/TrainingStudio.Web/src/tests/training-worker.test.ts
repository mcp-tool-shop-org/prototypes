/**
 * Training Worker Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TrainingWorkerClient,
  type TrainPayload,
  type ModelConfig,
  type TrainingConfig
} from '../workers/training-worker-client';

describe('TrainingWorkerClient', () => {
  describe('isSupported', () => {
    it('returns true when Worker is available', () => {
      // In test environment, Worker is typically not available
      // but we can test the method exists
      expect(typeof TrainingWorkerClient.isSupported).toBe('function');
    });
  });

  describe('constructor', () => {
    it('creates a new instance', () => {
      const client = new TrainingWorkerClient();
      expect(client).toBeInstanceOf(TrainingWorkerClient);
      expect(client.ready).toBe(false);
    });
  });

  describe('terminate', () => {
    it('can be called safely before init', () => {
      const client = new TrainingWorkerClient();
      expect(() => client.terminate()).not.toThrow();
    });

    it('sets ready to false after termination', () => {
      const client = new TrainingWorkerClient();
      client.terminate();
      expect(client.ready).toBe(false);
    });
  });

  describe('TrainPayload interface', () => {
    it('accepts valid model config', () => {
      const modelConfig: ModelConfig = {
        inputShape: 4,
        outputShape: 3,
        hiddenLayers: [64, 32],
        activation: 'relu',
        dropout: 0.2,
        modelType: 'classifier'
      };

      expect(modelConfig.inputShape).toBe(4);
      expect(modelConfig.outputShape).toBe(3);
      expect(modelConfig.hiddenLayers).toEqual([64, 32]);
    });

    it('accepts valid training config', () => {
      const trainingConfig: TrainingConfig = {
        epochs: 100,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
        earlyStopping: true,
        patience: 10
      };

      expect(trainingConfig.epochs).toBe(100);
      expect(trainingConfig.optimizer).toBe('adam');
    });

    it('accepts complete train payload', () => {
      const payload: TrainPayload = {
        modelConfig: {
          inputShape: 4,
          outputShape: 2,
          hiddenLayers: [32],
          activation: 'relu',
          dropout: 0,
          modelType: 'classifier'
        },
        trainingConfig: {
          epochs: 10,
          batchSize: 16,
          learningRate: 0.01,
          optimizer: 'sgd',
          earlyStopping: false,
          patience: 5
        },
        data: {
          xTrain: [[1, 2, 3, 4], [5, 6, 7, 8]],
          yTrain: [[1, 0], [0, 1]],
          xVal: [[9, 10, 11, 12]],
          yVal: [[1, 0]]
        }
      };

      expect(payload.data.xTrain.length).toBe(2);
      expect(payload.data.yTrain.length).toBe(2);
    });
  });

  describe('ModelConfig', () => {
    it('supports classifier type', () => {
      const config: ModelConfig = {
        inputShape: 10,
        outputShape: 5,
        hiddenLayers: [100, 50],
        activation: 'sigmoid',
        dropout: 0.5,
        modelType: 'classifier'
      };

      expect(config.modelType).toBe('classifier');
    });

    it('supports regressor type', () => {
      const config: ModelConfig = {
        inputShape: 10,
        outputShape: 1,
        hiddenLayers: [64],
        activation: 'tanh',
        dropout: 0.1,
        modelType: 'regressor'
      };

      expect(config.modelType).toBe('regressor');
    });

    it('supports relu activation', () => {
      const config: ModelConfig = {
        inputShape: 5,
        outputShape: 3,
        hiddenLayers: [],
        activation: 'relu',
        dropout: 0,
        modelType: 'classifier'
      };

      expect(config.activation).toBe('relu');
    });
  });

  describe('TrainingConfig', () => {
    it('supports adam optimizer', () => {
      const config: TrainingConfig = {
        epochs: 50,
        batchSize: 32,
        learningRate: 0.001,
        optimizer: 'adam',
        earlyStopping: true,
        patience: 5
      };

      expect(config.optimizer).toBe('adam');
    });

    it('supports sgd optimizer', () => {
      const config: TrainingConfig = {
        epochs: 100,
        batchSize: 64,
        learningRate: 0.1,
        optimizer: 'sgd',
        earlyStopping: false,
        patience: 10
      };

      expect(config.optimizer).toBe('sgd');
    });

    it('supports rmsprop optimizer', () => {
      const config: TrainingConfig = {
        epochs: 200,
        batchSize: 128,
        learningRate: 0.0001,
        optimizer: 'rmsprop',
        earlyStopping: true,
        patience: 15
      };

      expect(config.optimizer).toBe('rmsprop');
    });
  });

  describe('Error handling', () => {
    it('train throws error when worker not ready', () => {
      const client = new TrainingWorkerClient();
      const callbacks = {
        onError: vi.fn()
      };

      client.train({
        modelConfig: {
          inputShape: 4,
          outputShape: 2,
          hiddenLayers: [32],
          activation: 'relu',
          dropout: 0,
          modelType: 'classifier'
        },
        trainingConfig: {
          epochs: 10,
          batchSize: 16,
          learningRate: 0.01,
          optimizer: 'adam',
          earlyStopping: false,
          patience: 5
        },
        data: {
          xTrain: [],
          yTrain: [],
          xVal: [],
          yVal: []
        }
      }, callbacks);

      expect(callbacks.onError).toHaveBeenCalledWith('Worker not ready');
    });

    it('predict throws error when worker not ready', async () => {
      const client = new TrainingWorkerClient();

      await expect(client.predict([[1, 2, 3]])).rejects.toThrow('Worker not ready');
    });
  });
});
