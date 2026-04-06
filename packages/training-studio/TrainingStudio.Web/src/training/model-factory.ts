import * as tf from '@tensorflow/tfjs';

export type ModelPreset = 'mlp-classifier' | 'mlp-regressor' | 'wide-classifier' | 'deep-classifier';

export interface ModelConfig {
  preset: ModelPreset;
  inputShape: number;
  outputShape: number;
  hiddenLayers?: number[];
  dropout?: number;
  activation?: string;
  learningRate?: number;
}

export interface HyperParams {
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'adam' | 'sgd' | 'rmsprop';
  earlyStopping: boolean;
  patience: number;
}

export const DEFAULT_HYPERPARAMS: HyperParams = {
  epochs: 50,
  batchSize: 32,
  learningRate: 0.001,
  optimizer: 'adam',
  earlyStopping: true,
  patience: 5
};

export const MODEL_PRESETS: Record<ModelPreset, {
  name: string;
  description: string;
  defaultHiddenLayers: number[];
  defaultDropout: number;
}> = {
  'mlp-classifier': {
    name: 'MLP Classifier',
    description: 'Simple multi-layer perceptron for classification',
    defaultHiddenLayers: [64, 32],
    defaultDropout: 0.2
  },
  'mlp-regressor': {
    name: 'MLP Regressor',
    description: 'Multi-layer perceptron for regression tasks',
    defaultHiddenLayers: [64, 32],
    defaultDropout: 0.1
  },
  'wide-classifier': {
    name: 'Wide Classifier',
    description: 'Wider layers, good for tabular data with many features',
    defaultHiddenLayers: [256, 128],
    defaultDropout: 0.3
  },
  'deep-classifier': {
    name: 'Deep Classifier',
    description: 'More layers for complex patterns',
    defaultHiddenLayers: [128, 64, 32, 16],
    defaultDropout: 0.25
  }
};

type ActivationType = 'relu' | 'sigmoid' | 'softmax' | 'tanh' | 'linear' | 'elu' | 'selu';

export function createModel(config: ModelConfig): tf.Sequential {
  const preset = MODEL_PRESETS[config.preset];
  const hiddenLayers = config.hiddenLayers ?? preset.defaultHiddenLayers;
  const dropout = config.dropout ?? preset.defaultDropout;
  const activation: ActivationType = (config.activation as ActivationType) ?? 'relu';
  const isClassification = config.preset !== 'mlp-regressor';

  const model = tf.sequential();

  // Input layer
  model.add(tf.layers.dense({
    inputShape: [config.inputShape],
    units: hiddenLayers[0],
    activation,
    kernelInitializer: 'heNormal'
  }));

  if (dropout > 0) {
    model.add(tf.layers.dropout({ rate: dropout }));
  }

  // Hidden layers
  for (let i = 1; i < hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: hiddenLayers[i],
      activation,
      kernelInitializer: 'heNormal'
    }));

    if (dropout > 0) {
      model.add(tf.layers.dropout({ rate: dropout }));
    }
  }

  // Output layer
  if (isClassification) {
    model.add(tf.layers.dense({
      units: config.outputShape,
      activation: config.outputShape === 1 ? 'sigmoid' : 'softmax'
    }));
  } else {
    model.add(tf.layers.dense({
      units: config.outputShape,
      activation: 'linear'
    }));
  }

  return model;
}

export function compileModel(
  model: tf.Sequential,
  config: ModelConfig,
  hyperparams: HyperParams
): void {
  const isClassification = config.preset !== 'mlp-regressor';
  const learningRate = hyperparams.learningRate;

  let optimizer: tf.Optimizer;
  switch (hyperparams.optimizer) {
    case 'sgd':
      optimizer = tf.train.sgd(learningRate);
      break;
    case 'rmsprop':
      optimizer = tf.train.rmsprop(learningRate);
      break;
    case 'adam':
    default:
      optimizer = tf.train.adam(learningRate);
  }

  const loss = isClassification
    ? (config.outputShape === 1 ? 'binaryCrossentropy' : 'categoricalCrossentropy')
    : 'meanSquaredError';

  const metrics = isClassification ? ['accuracy'] : ['mse', 'mae'];

  model.compile({ optimizer, loss, metrics });
}

export function getModelSummary(model: tf.Sequential): string[] {
  const lines: string[] = [];

  lines.push('Model Summary');
  lines.push('='.repeat(60));

  let totalParams = 0;
  let trainableParams = 0;

  model.layers.forEach((layer, i) => {
    const config = layer.getConfig();
    const outputShape = layer.outputShape;
    const params = layer.countParams();

    totalParams += params;
    if (layer.trainable) {
      trainableParams += params;
    }

    lines.push(`Layer ${i + 1}: ${layer.name}`);
    lines.push(`  Type: ${layer.getClassName()}`);
    lines.push(`  Output Shape: ${JSON.stringify(outputShape)}`);
    lines.push(`  Params: ${params.toLocaleString()}`);

    if ('units' in config) {
      lines.push(`  Units: ${config.units}`);
    }
    if ('activation' in config) {
      lines.push(`  Activation: ${config.activation}`);
    }
    if ('rate' in config) {
      lines.push(`  Dropout Rate: ${config.rate}`);
    }

    lines.push('');
  });

  lines.push('='.repeat(60));
  lines.push(`Total params: ${totalParams.toLocaleString()}`);
  lines.push(`Trainable params: ${trainableParams.toLocaleString()}`);
  lines.push(`Non-trainable params: ${(totalParams - trainableParams).toLocaleString()}`);

  return lines;
}
