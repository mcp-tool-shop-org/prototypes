---
title: Getting Started
description: Install Training Studio and validate your first ML bundle.
sidebar:
  order: 1
---

Training Studio is a TensorFlow.js-powered ML training application that runs entirely on your device. This guide walks you through installation and your first validation.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm 9+**

No Python, no cloud accounts, no GPU drivers required. Everything runs in JavaScript.

## Install from source

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
```

## Validate your first bundle

Training Studio ships with a golden fixture you can use to verify the install works:

```bash
npm run validate ./src/tests/fixtures/golden-v1
```

You should see output confirming all six artifacts are verified with exit code `0`.

### JSON output for scripting

Pass `--json` to get machine-readable results you can pipe into CI or other tools:

```bash
npm run validate -- --json ./src/tests/fixtures/golden-v1
```

The JSON output includes the bundle ID, digest, artifact counts, and any errors or warnings.

## Run the web app

To launch the browser-based training interface:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. From there you can load a CSV dataset, configure a model, and start training with live charts.

## Try with sample data

Training Studio includes sample datasets to get started immediately:

1. Click the **Dataset** tab
2. Load `sample_data/iris.csv`
3. Select features: `sepal_length`, `sepal_width`, `petal_length`, `petal_width`
4. Select label: `species`
5. Go to the **Model** tab and use the defaults (64, 32 hidden layers)
6. Go to the **Train** tab and click **Start Training**
7. Watch loss and accuracy charts update in real-time

## Desktop app (Windows)

Training Studio also ships as a native Windows desktop application:

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

**Requirements:** Windows 10 1809+, 4 GB RAM (8 GB recommended), GPU with WebGL 2.0 or WebGPU (optional, CPU fallback available).

## Next steps

- Learn the [Bundle Format](/training-studio/handbook/bundle-format/) to understand what goes inside a training bundle
- Explore the [Web App](/training-studio/handbook/web-app/) guide for the full training workflow
- Review the [Security](/training-studio/handbook/security/) model to understand the privacy guarantees
