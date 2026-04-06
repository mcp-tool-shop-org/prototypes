/**
 * Training WebWorker
 *
 * Runs TensorFlow.js training in a separate thread to keep UI responsive.
 * Communicates with main thread via postMessage for progress updates.
 */

import * as tf from '@tensorflow/tfjs';

export interface WorkerMessage {
  type: 'init' | 'train' | 'stop' | 'predict';
  payload?: unknown;
}

export interface TrainPayload {
  modelConfig: ModelConfig;
  trainingConfig: TrainingConfig;
  data: {
    xTrain: number[][];
    yTrain: number[][];
    xVal: number[][];
    yVal: number[][];
  };
}

export interface ModelConfig {
  inputShape: number;
  outputShape: number;
  hiddenLayers: number[];
  activation: 'relu' | 'sigmoid' | 'tanh';
  dropout: number;
  modelType: 'classifier' | 'regressor';
}

export interface TrainingConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
  earlyStopping: boolean;
  patience: number;
}

export interface WorkerResponse {
  type: 'ready' | 'epoch' | 'complete' | 'error' | 'stopped' | 'prediction';
  payload?: unknown;
}

export interface EpochPayload {
  epoch: number;
  totalEpochs: number;
  loss: number;
  accuracy?: number;
  valLoss: number;
  valAccuracy?: number;
}

export interface CompletePayload {
  finalMetrics: {
    trainLoss: number;
    valLoss: number;
    trainAccuracy?: number;
    valAccuracy?: number;
  };
  earlyStopped: boolean;
  epochsRun: number;
  modelWeights: ArrayBuffer[];
  modelTopology: unknown;
}

let model: tf.LayersModel | null = null;
let shouldStop = false;
let isTraining = false;

/**
 * Initialize TensorFlow.js backend
 */
async function initBackend(): Promise<string> {
  // Try backends in order of preference
  const backends = ['webgl', 'cpu'];

  for (const backend of backends) {
    try {
      await tf.setBackend(backend);
      await tf.ready();
      return tf.getBackend();
    } catch {
      continue;
    }
  }

  throw new Error('No TensorFlow.js backend available');
}

/**
 * Build model from configuration
 */
function buildModel(config: ModelConfig): tf.LayersModel {
  const model = tf.sequential();

  // Input layer (first hidden layer with input shape)
  if (config.hiddenLayers.length > 0) {
    model.add(tf.layers.dense({
      units: config.hiddenLayers[0],
      activation: config.activation,
      inputShape: [config.inputShape]
    }));

    if (config.dropout > 0) {
      model.add(tf.layers.dropout({ rate: config.dropout }));
    }

    // Additional hidden layers
    for (let i = 1; i < config.hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: config.hiddenLayers[i],
        activation: config.activation
      }));

      if (config.dropout > 0) {
        model.add(tf.layers.dropout({ rate: config.dropout }));
      }
    }
  }

  // Output layer
  if (config.modelType === 'classifier') {
    model.add(tf.layers.dense({
      units: config.outputShape,
      activation: config.outputShape > 1 ? 'softmax' : 'sigmoid',
      inputShape: config.hiddenLayers.length === 0 ? [config.inputShape] : undefined
    }));
  } else {
    model.add(tf.layers.dense({
      units: config.outputShape,
      activation: 'linear',
      inputShape: config.hiddenLayers.length === 0 ? [config.inputShape] : undefined
    }));
  }

  return model;
}

/**
 * Get optimizer from config
 */
function getOptimizer(config: TrainingConfig): tf.Optimizer {
  switch (config.optimizer) {
    case 'sgd':
      return tf.train.sgd(config.learningRate);
    case 'rmsprop':
      return tf.train.rmsprop(config.learningRate);
    case 'adam':
    default:
      return tf.train.adam(config.learningRate);
  }
}

/**
 * Train the model
 */
async function train(payload: TrainPayload): Promise<void> {
  if (isTraining) {
    throw new Error('Training already in progress');
  }

  isTraining = true;
  shouldStop = false;

  try {
    // Build model
    model = buildModel(payload.modelConfig);

    // Compile
    const optimizer = getOptimizer(payload.trainingConfig);
    const loss = payload.modelConfig.modelType === 'classifier'
      ? (payload.modelConfig.outputShape > 1 ? 'categoricalCrossentropy' : 'binaryCrossentropy')
      : 'meanSquaredError';

    const metrics = payload.modelConfig.modelType === 'classifier' ? ['accuracy'] : ['mse'];

    model.compile({
      optimizer,
      loss,
      metrics
    });

    // Convert data to tensors
    const xTrain = tf.tensor2d(payload.data.xTrain);
    const yTrain = tf.tensor2d(payload.data.yTrain);
    const xVal = tf.tensor2d(payload.data.xVal);
    const yVal = tf.tensor2d(payload.data.yVal);

    // Early stopping state
    let bestValLoss = Infinity;
    let patienceCounter = 0;
    let earlyStopped = false;
    let epochsRun = 0;

    // Track metrics
    const epochMetrics: EpochPayload[] = [];

    // Train
    await model.fit(xTrain, yTrain, {
      epochs: payload.trainingConfig.epochs,
      batchSize: payload.trainingConfig.batchSize,
      validationData: [xVal, yVal],
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (shouldStop) {
            if (model) model.stopTraining = true;
            return;
          }

          epochsRun = epoch + 1;

          const epochPayload: EpochPayload = {
            epoch: epoch + 1,
            totalEpochs: payload.trainingConfig.epochs,
            loss: logs?.loss ?? 0,
            accuracy: logs?.acc ?? logs?.accuracy,
            valLoss: logs?.val_loss ?? 0,
            valAccuracy: logs?.val_acc ?? logs?.val_accuracy
          };

          epochMetrics.push(epochPayload);

          // Post progress
          postMessage({ type: 'epoch', payload: epochPayload } as WorkerResponse);

          // Early stopping check
          if (payload.trainingConfig.earlyStopping) {
            if (epochPayload.valLoss < bestValLoss) {
              bestValLoss = epochPayload.valLoss;
              patienceCounter = 0;
            } else {
              patienceCounter++;
              if (patienceCounter >= payload.trainingConfig.patience) {
                model!.stopTraining = true;
                earlyStopped = true;
              }
            }
          }
        }
      }
    });

    // Check if stopped
    if (shouldStop) {
      postMessage({ type: 'stopped' } as WorkerResponse);
      return;
    }

    // Get final metrics
    const lastMetrics = epochMetrics[epochMetrics.length - 1];

    // Serialize model weights
    const weightsData = await model.getWeights().map(async (w) => {
      const data = await w.data();
      return new Float32Array(data).buffer;
    });
    const modelWeights = await Promise.all(weightsData);
    const modelTopology = model.toJSON();

    // Clean up tensors
    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();

    // Post completion
    const completePayload: CompletePayload = {
      finalMetrics: {
        trainLoss: lastMetrics.loss,
        valLoss: lastMetrics.valLoss,
        trainAccuracy: lastMetrics.accuracy,
        valAccuracy: lastMetrics.valAccuracy
      },
      earlyStopped,
      epochsRun,
      modelWeights,
      modelTopology
    };

    postMessage({ type: 'complete', payload: completePayload } as WorkerResponse);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown training error';
    postMessage({ type: 'error', payload: { message } } as WorkerResponse);
  } finally {
    isTraining = false;
  }
}

/**
 * Run prediction on input
 */
async function predict(input: number[][]): Promise<number[][]> {
  if (!model) {
    throw new Error('No model loaded');
  }

  const inputTensor = tf.tensor2d(input);
  const outputTensor = model.predict(inputTensor) as tf.Tensor;
  const output = await outputTensor.array() as number[][];

  inputTensor.dispose();
  outputTensor.dispose();

  return output;
}

/**
 * Handle incoming messages
 */
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      try {
        const backend = await initBackend();
        postMessage({ type: 'ready', payload: { backend } } as WorkerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Init failed';
        postMessage({ type: 'error', payload: { message } } as WorkerResponse);
      }
      break;

    case 'train':
      await train(payload as TrainPayload);
      break;

    case 'stop':
      shouldStop = true;
      break;

    case 'predict':
      try {
        const result = await predict(payload as number[][]);
        postMessage({ type: 'prediction', payload: result } as WorkerResponse);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Prediction failed';
        postMessage({ type: 'error', payload: { message } } as WorkerResponse);
      }
      break;
  }
};

// Signal that worker is loaded
postMessage({ type: 'ready', payload: { loaded: true } } as WorkerResponse);
