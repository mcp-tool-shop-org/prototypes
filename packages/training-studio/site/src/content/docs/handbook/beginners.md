---
title: For Beginners
description: New to Training Studio? Start here for a gentle introduction.
sidebar:
  order: 99
---

This page is for people who have never trained a machine-learning model before. It explains the core ideas behind Training Studio using plain language, then walks you through a hands-on example.

## What is this tool?

Training Studio is a desktop and browser application that trains machine-learning models on your own computer. You give it a spreadsheet (CSV file) with labeled data, it learns the patterns, and then it can predict labels for new data.

Everything runs locally. Your data never leaves your device and no cloud account is required. Under the hood, Training Studio uses TensorFlow.js to build and train neural networks directly in your browser or in a native Windows desktop app.

Training Studio can do three things:

- **Classification** -- predict which category a sample belongs to (e.g. flower species, spam vs. not-spam)
- **Regression** -- predict a continuous number (e.g. house price, temperature)
- **Bundle export** -- package the trained model, metrics, and config into a portable bundle with cryptographic integrity checks

## Who is this for?

Training Studio is built for anyone who wants to train ML models without wrestling with Python environments, cloud services, or complex tooling:

- **Students and learners** exploring machine learning for the first time
- **Data analysts** who have spreadsheet data and want quick classification or regression models
- **Privacy-conscious users** who cannot upload data to cloud ML platforms
- **Educators** who need a simple, visual tool for teaching ML concepts in a classroom
- **Developers** who want to validate ML training bundles in CI pipelines using the CLI

No machine learning experience is required. If you can work with spreadsheets and follow step-by-step instructions, you can use Training Studio.

## Key concepts

Before you start, here are the terms you will encounter throughout the app.

### Dataset

A table of data stored as a CSV file. Each row is one sample, each column is a measurement or property. Training Studio needs at least one **label column** (the thing you want to predict) and one or more **feature columns** (the inputs the model learns from).

### Features and labels

- **Features** are the input columns the model uses to make predictions. For the Iris dataset these are petal length, petal width, sepal length, and sepal width.
- **Label** is the output column the model learns to predict. For the Iris dataset this is the species name.

### Model (MLP)

Training Studio builds MLP (multilayer perceptron) neural networks. An MLP is a stack of layers where each layer is a group of neurons. Data flows from input through hidden layers to the output, and each connection has a weight that the training process adjusts.

### Epoch

One complete pass through the entire training dataset. Training typically runs for many epochs until the model converges (stops improving).

### Loss and accuracy

- **Loss** measures how wrong the model's predictions are. Lower is better.
- **Accuracy** measures what fraction of predictions are correct. Higher is better (classification only).

### Validation split

Training Studio splits your data into a training set and a validation set (default 80/20). The model learns from the training set but is scored against the validation set to detect overfitting -- when the model memorizes training data instead of learning general patterns.

### Early stopping

A safety mechanism that automatically halts training when the validation loss stops improving for a configurable number of epochs (called **patience**). This prevents wasted computation and overfitting.

## Prerequisites

You need the following installed before starting:

- **Node.js 20+** (LTS recommended) -- download from [nodejs.org](https://nodejs.org/)
- **npm 9+** (ships with Node.js)
- **A modern browser** -- Chrome, Edge, Firefox, or Safari
- **Basic terminal skills** -- you should be comfortable running commands like `cd` and `npm install`

No Python, no cloud accounts, no GPU drivers required. Everything runs in JavaScript.

## Your First 5 Minutes

### Install

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
```

### Launch

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. You should see the Training Studio interface.

### Train a model

This walkthrough uses the Iris dataset (150 flower measurements across three species) that ships with Training Studio.

**Step 1 -- Load the dataset**

1. Open the app and click the **Dataset** tab.
2. Load `sample_data/iris.csv`.
3. Select features: `sepal_length`, `sepal_width`, `petal_length`, `petal_width`.
4. Select label: `species`.

Training Studio will show a data preview and automatically detect that this is a three-class classification task.

**Step 2 -- Configure the model**

1. Switch to the **Model** tab.
2. Keep the default preset: **MLP Classifier** (two hidden layers of 64 and 32 neurons).
3. Leave dropout at 0.2 and activation at relu.

These defaults work well for small tabular datasets like Iris.

**Step 3 -- Train**

1. Go to the **Train** tab.
2. Click **Start Training**.
3. Watch the loss and accuracy charts update in real time as the model learns.

Training runs in a Web Worker so the interface stays responsive. With early stopping enabled (the default), the model will stop automatically once it converges -- usually within 20-30 epochs for Iris.

**Step 4 -- Evaluate**

After training finishes:

1. Check the **confusion matrix** to see which species the model gets right and where it makes mistakes.
2. Review **per-class metrics** (precision, recall, F1 score) for each species.
3. Try a **single prediction** by entering measurements manually.
4. Run **batch inference** on a CSV file to predict labels for many samples at once.

## Understanding the output

### Training charts

The live charts show two lines each for loss and accuracy:

- **Training** (solid) -- performance on the data the model is learning from
- **Validation** (dashed) -- performance on held-out data the model has never seen

If training loss keeps dropping but validation loss starts rising, the model is overfitting. Early stopping catches this automatically.

### Confusion matrix

A grid where rows are the true labels and columns are the predicted labels. Diagonal cells are correct predictions. Off-diagonal cells are mistakes. For example, if the cell at row "versicolor" and column "virginica" shows 2, the model confused two versicolor samples as virginica.

### Per-class metrics

For each class (species), Training Studio reports:

| Metric | What it means |
|--------|---------------|
| **Precision** | Of all samples predicted as this class, how many actually are? |
| **Recall** | Of all actual samples of this class, how many did the model find? |
| **F1 Score** | Harmonic mean of precision and recall -- a single balanced number |
| **Support** | Number of true samples in this class |

### Bundle export

When you export a training run, Training Studio creates a **bundle** -- a directory containing the model files, metrics, hyperparameters, and a cryptographic manifest (`bundle.json`). Every file is content-addressed with SHA-256 hashes so you can verify nothing was tampered with.

## Common Mistakes

### The model accuracy stays at 0 or near random

- Check that you selected the correct label column. If the label column contains numeric IDs that look like features, the model may treat classification as regression.
- Make sure you have enough samples. Very small datasets (under 20 rows) may not have enough signal to learn from.

### Training is very slow

- Check which TensorFlow.js backend is active (shown in the status bar). WebGPU is fastest, WebGL is fast, CPU is slowest.
- Reduce the number of epochs or batch size.
- Use a simpler model preset (MLP Classifier instead of Deep Classifier).

### The validation loss is much higher than training loss

This is overfitting. Try:

- Increasing dropout (e.g. 0.3 or 0.4)
- Using fewer hidden layers or smaller layer sizes
- Reducing the number of epochs
- Adding more training data

### Bundle validation fails

Run the validator to see specific error codes:

```bash
npm run validate -- --json ./path/to/bundle
```

Common causes: files were moved or renamed after export, or the bundle was partially copied. Each error code (like `E_HASH_MISMATCH` or `E_ARTIFACT_MISSING`) points to the exact problem.

## Next Steps

Now that you have trained your first model, here are paths to go deeper:

- **Try different datasets** -- load `sample_data/binary_classification.csv` for a two-class problem, or bring your own CSV
- **Experiment with presets** -- the Wide Classifier (256, 128) handles datasets with many features; the Deep Classifier (128, 64, 32, 16) captures complex patterns
- **Compare runs** -- Training Studio saves every run in your browser. Use the history view to compare hyperparameter configurations side by side
- **[Getting Started](/training-studio/handbook/getting-started/)** -- more detail on installation and desktop app setup
- **[Bundle Format](/training-studio/handbook/bundle-format/)** -- understand the export structure and cryptographic integrity
- **[Reference](/training-studio/handbook/reference/)** -- CLI flags, error codes, and JSON output schema

## Glossary

| Term | Definition |
|------|------------|
| **Accuracy** | The fraction of predictions that are correct. Only applies to classification tasks. Higher is better. |
| **Batch size** | The number of samples processed together in one forward/backward pass during training. Default is 32. |
| **Bundle** | A self-contained directory exported by Training Studio containing the trained model, metrics, config, and a cryptographic manifest. |
| **Classification** | A task where the model predicts which category a sample belongs to (e.g. species, spam vs. not-spam). |
| **Confusion matrix** | A grid showing true labels vs. predicted labels. Diagonal cells are correct; off-diagonal cells are errors. |
| **CSV** | Comma-Separated Values. A plain-text spreadsheet format where columns are separated by commas. |
| **Dropout** | A regularization technique that randomly disables a percentage of neurons during training to reduce overfitting. |
| **Early stopping** | Automatically halts training when validation loss stops improving for a set number of epochs (patience). |
| **Epoch** | One complete pass through the entire training dataset. |
| **F1 Score** | The harmonic mean of precision and recall -- a single number that balances both. |
| **Feature** | An input column the model uses to make predictions. |
| **Label** | The output column the model learns to predict. |
| **Loss** | A number measuring how wrong the model's predictions are. Lower is better. |
| **MLP** | Multilayer Perceptron. A neural network with one or more hidden layers of neurons between input and output. |
| **Normalization** | Scaling feature values to a common range so no single feature dominates. Z-score (default) and min-max are supported. |
| **Overfitting** | When a model memorizes training data instead of learning general patterns. Detected when validation loss rises while training loss drops. |
| **Patience** | The number of epochs without improvement before early stopping kicks in. Default is 5. |
| **Precision** | Of all samples the model predicted as a given class, the fraction that actually belong to that class. |
| **Recall** | Of all actual samples of a given class, the fraction the model correctly identified. |
| **Regression** | A task where the model predicts a continuous number (e.g. price, temperature). |
| **Validation split** | The percentage of data held out for evaluation (default 20%). The model never trains on this portion. |
| **WebGPU / WebGL** | Browser APIs for GPU-accelerated computation. Training Studio uses these for faster training when available. |
