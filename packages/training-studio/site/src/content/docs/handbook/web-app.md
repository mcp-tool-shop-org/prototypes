---
title: Web App
description: Using the Training Studio browser-based training interface.
sidebar:
  order: 3
---

Training Studio's web app lets you train ML models directly in your browser using TensorFlow.js. No server, no cloud, no data upload. Everything runs on your device.

## Starting the dev server

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Open **http://localhost:5173** in a modern browser (Chrome, Edge, Firefox, or Safari).

## Training workflow

The web app follows a four-step workflow: load data, configure the model, train, and evaluate.

### 1. Load a dataset

Navigate to the **Dataset** tab and load a CSV file. Training Studio automatically detects columns and lets you select which are features and which is the label.

Supported preprocessing:

- **Normalization** — z-score (default) or min-max scaling
- **Missing value handling** — drop rows, fill with mean, median, or zero
- **One-hot encoding** — converts categorical columns automatically
- **Outlier detection** — flags values beyond a configurable standard-deviation threshold
- **Train/test split** — configurable validation percentage (default 20%)
- **Seeded shuffle** — deterministic splits via Mulberry32 PRNG for reproducibility

### 2. Configure the model

In the **Model** tab, pick a preset and customize the MLP (multilayer perceptron) architecture.

#### Model presets

| Preset | Hidden layers | Dropout | Best for |
|--------|--------------|---------|----------|
| MLP Classifier | 64, 32 | 0.2 | General classification |
| MLP Regressor | 64, 32 | 0.1 | Regression tasks |
| Wide Classifier | 256, 128 | 0.3 | Tabular data with many features |
| Deep Classifier | 128, 64, 32, 16 | 0.25 | Complex patterns |

You can override hidden layers, activation function (relu, sigmoid, tanh, elu, selu), and dropout rate after selecting a preset. The defaults work well for most tabular datasets.

### 3. Train

Switch to the **Train** tab and click **Start Training**. You will see:

- **Live loss chart** — training and validation loss per epoch
- **Live accuracy chart** — classification accuracy per epoch
- **Early stopping** — training halts automatically when the model converges

Training uses your device's GPU when available (WebGPU or WebGL), falling back to CPU if needed. Heavy computation runs in a Web Worker to keep the UI responsive.

### 4. Evaluate and predict

After training completes, the **Evaluate** tab shows:

- **Confusion matrix** — visual breakdown of correct vs. incorrect predictions
- **Per-class metrics** — precision, recall, and F1 score for each class
- **Single prediction** — test an individual sample by entering values
- **Batch inference** — load a CSV to run predictions on many samples at once
- **Export** — download predictions as CSV

## Training history

Training Studio persists every training run in IndexedDB so you can compare configurations and find the best model. Each run records hyperparameters, metrics, confusion matrix, and timing. You can tag runs, add notes, and use the built-in comparison view to see which configuration performed best by validation loss or accuracy.

## Building for production

To create a production build of the web app:

```bash
npm run build
```

The output lands in the `dist/` directory and can be served by any static file host.

## GPU acceleration

Training Studio uses the TensorFlow.js backend system:

| Backend | When used | Performance |
|---------|-----------|-------------|
| WebGPU | Modern browsers with GPU support | Fastest |
| WebGL 2.0 | Fallback when WebGPU is unavailable | Fast |
| CPU | When no GPU backend is detected | Slowest |

Backend selection is automatic. No driver installation is needed.

## Next steps

- Understand the output format in [Bundle Format](/training-studio/handbook/bundle-format/)
- Review the [Security](/training-studio/handbook/security/) guarantees that protect your data
