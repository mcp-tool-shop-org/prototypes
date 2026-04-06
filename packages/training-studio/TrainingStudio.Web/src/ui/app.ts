import * as tf from '@tensorflow/tfjs';
import { openFile, saveModel, exportBundle, DatasetPreview } from '../bridge/native-bridge';
import { loadDataset, LoadedDataset, disposeDataset } from '../training/data-loader';
import {
  createModel,
  compileModel,
  getModelSummary,
  ModelPreset,
  MODEL_PRESETS,
  HyperParams,
  DEFAULT_HYPERPARAMS
} from '../training/model-factory';
import { trainer, TrainingState, EpochResult } from '../training/trainer';
import { TrainingCharts } from './charts';
import {
  computeModelConfusionMatrix,
  ConfusionMatrixData,
  formatConfusionMatrixJSON
} from '../training/confusion-matrix';

type TabId = 'dataset' | 'model' | 'train' | 'export' | 'predict' | 'help';

interface AppState {
  currentTab: TabId;
  datasetContent: string | null;
  datasetPreview: DatasetPreview | null;
  fileName: string | null;
  selectedFeatures: string[];
  selectedLabel: string | null;
  modelPreset: ModelPreset;
  hyperparams: HyperParams;
  model: tf.Sequential | null;
  dataset: LoadedDataset | null;
  trainingState: TrainingState | null;
  lastTrainingMetrics: { modelJson: string; weightsBase64: string } | null;
  confusionMatrix: ConfusionMatrixData | null;
}

class TrainingStudioApp {
  private state: AppState = {
    currentTab: 'dataset',
    datasetContent: null,
    datasetPreview: null,
    fileName: null,
    selectedFeatures: [],
    selectedLabel: null,
    modelPreset: 'mlp-classifier',
    hyperparams: { ...DEFAULT_HYPERPARAMS },
    model: null,
    dataset: null,
    trainingState: null,
    lastTrainingMetrics: null,
    confusionMatrix: null
  };

  private charts: TrainingCharts | null = null;

  constructor() {
    this.initUI();
    this.setupEventListeners();
    this.initTensorFlow();
  }

  private async initTensorFlow(): Promise<void> {
    const backendInfo = document.getElementById('backendInfo');
    const updateBackendInfo = (msg: string, isError = false) => {
      if (backendInfo) {
        backendInfo.textContent = msg;
        backendInfo.classList.toggle('error', isError);
      }
    };

    try {
      // Try backends in order of performance: WebGPU > WebGL > CPU
      const backends = ['webgpu', 'webgl', 'cpu'];
      let initialized = false;

      for (const backend of backends) {
        try {
          if (backend === 'webgpu' && !('gpu' in navigator)) {
            continue; // Skip WebGPU if not available
          }

          await tf.setBackend(backend);
          await tf.ready();

          const activeBackend = tf.getBackend();
          this.log(`TensorFlow.js initialized with ${activeBackend} backend`);
          updateBackendInfo(`TF.js: ${activeBackend}`);
          initialized = true;
          break;
        } catch (err) {
          this.log(`Failed to initialize ${backend} backend: ${(err as Error).message}`);
          continue;
        }
      }

      if (!initialized) {
        throw new Error('No compatible TensorFlow.js backend available');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log(`TensorFlow.js initialization failed: ${errMsg}`);
      updateBackendInfo('TF.js: Failed to initialize', true);
      this.showError('Failed to initialize ML backend. Training features are unavailable.');
    }
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-banner';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.innerHTML = `
      <span class="error-icon" aria-hidden="true">⚠</span>
      <span>${message}</span>
      <button class="error-dismiss" aria-label="Dismiss error">&times;</button>
    `;
    errorDiv.querySelector('.error-dismiss')?.addEventListener('click', () => {
      errorDiv.remove();
    });
    document.querySelector('.header')?.after(errorDiv);
  }

  private initUI(): void {
    const app = document.getElementById('app')!;
    app.innerHTML = `
      <div class="app-container" role="application" aria-label="Training Studio ML Application">
        <header class="header" role="banner">
          <h1>Training Studio</h1>
          <div class="backend-info" id="backendInfo" aria-live="polite">Loading TF.js...</div>
        </header>

        <nav class="tabs" role="tablist" aria-label="Training workflow steps">
          <button class="tab active" data-tab="dataset" role="tab" aria-selected="true" aria-controls="tab-dataset" id="tab-btn-dataset">
            <span class="tab-step">1</span>
            <span class="tab-label">Dataset</span>
          </button>
          <button class="tab" data-tab="model" role="tab" aria-selected="false" aria-controls="tab-model" id="tab-btn-model">
            <span class="tab-step">2</span>
            <span class="tab-label">Model</span>
          </button>
          <button class="tab" data-tab="train" role="tab" aria-selected="false" aria-controls="tab-train" id="tab-btn-train">
            <span class="tab-step">3</span>
            <span class="tab-label">Train</span>
          </button>
          <button class="tab" data-tab="export" role="tab" aria-selected="false" aria-controls="tab-export" id="tab-btn-export">
            <span class="tab-step">4</span>
            <span class="tab-label">Export</span>
          </button>
          <button class="tab" data-tab="predict" role="tab" aria-selected="false" aria-controls="tab-predict" id="tab-btn-predict">
            <span class="tab-step">5</span>
            <span class="tab-label">Predict</span>
          </button>
          <button class="tab tab-help" data-tab="help" role="tab" aria-selected="false" aria-controls="tab-help" id="tab-btn-help">
            <span class="tab-step">?</span>
            <span class="tab-label">Help</span>
          </button>
        </nav>

        <main class="content" role="main">
          <!-- Dataset Tab -->
          <section id="tab-dataset" class="tab-content active" role="tabpanel" aria-labelledby="tab-btn-dataset">
            <div class="card welcome-card" id="welcomeCard">
              <h2>Welcome to Training Studio</h2>
              <p class="welcome-text">Train machine learning models directly in your browser. Your data never leaves your device.</p>
              <div class="workflow-overview">
                <div class="workflow-step">
                  <span class="workflow-number">1</span>
                  <span class="workflow-text"><strong>Load</strong> your CSV dataset</span>
                </div>
                <div class="workflow-arrow">→</div>
                <div class="workflow-step">
                  <span class="workflow-number">2</span>
                  <span class="workflow-text"><strong>Configure</strong> your model</span>
                </div>
                <div class="workflow-arrow">→</div>
                <div class="workflow-step">
                  <span class="workflow-number">3</span>
                  <span class="workflow-text"><strong>Train</strong> and evaluate</span>
                </div>
                <div class="workflow-arrow">→</div>
                <div class="workflow-step">
                  <span class="workflow-number">4</span>
                  <span class="workflow-text"><strong>Export</strong> or predict</span>
                </div>
              </div>
            </div>

            <div class="card">
              <h2>📁 Load Dataset</h2>
              <p class="section-description">Start by loading a CSV file containing your training data. The file should have column headers in the first row.</p>
              <button id="btnLoadDataset" class="btn btn-primary" aria-label="Open CSV file from your computer">
                <span class="btn-icon">📂</span>
                Open CSV File
              </button>
              <div id="datasetInfo" class="dataset-info hidden" aria-live="polite">
                <p><strong>File:</strong> <span id="fileName"></span></p>
                <p><strong>Rows:</strong> <span id="rowCount"></span></p>
              </div>
            </div>

            <div id="dataPreview" class="card hidden">
              <h2>Data Preview</h2>
              <div class="table-container" role="region" aria-label="Dataset preview table">
                <table id="previewTable" aria-label="First rows of loaded dataset"></table>
              </div>
            </div>

            <div id="columnSelection" class="card hidden">
              <h2>Column Selection</h2>
              <p class="section-description">Choose which columns to use for training. Features are the input variables the model learns from. The label is what the model will predict.</p>
              <div class="column-grid">
                <div class="column-section" role="group" aria-labelledby="features-heading">
                  <h3 id="features-heading">
                    <span class="section-icon">📊</span>
                    Features (Model Inputs)
                  </h3>
                  <p class="section-hint">Select one or more columns that contain the data you want the model to learn from.</p>
                  <div id="featureCheckboxes" role="group" aria-label="Select feature columns"></div>
                </div>
                <div class="column-section" role="group" aria-labelledby="label-heading">
                  <h3 id="label-heading">
                    <span class="section-icon">🎯</span>
                    Label (Prediction Target)
                  </h3>
                  <p class="section-hint">Select the column you want the model to predict.</p>
                  <div id="labelRadios" role="radiogroup" aria-label="Select label column"></div>
                </div>
              </div>
              <div class="selection-summary" id="selectionSummary"></div>
              <button id="btnConfirmColumns" class="btn btn-primary" disabled aria-label="Confirm column selection and proceed to model configuration">
                Confirm Selection
              </button>
            </div>
          </section>

          <!-- Model Tab -->
          <section id="tab-model" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-model">
            <div class="card" role="group" aria-labelledby="model-config-heading">
              <h2 id="model-config-heading">Model Configuration</h2>
              <div class="form-group">
                <label for="modelPreset">Model Preset</label>
                <select id="modelPreset" aria-describedby="model-preset-help">
                  ${Object.entries(MODEL_PRESETS).map(([key, val]) =>
                    `<option value="${key}">${val.name} - ${val.description}</option>`
                  ).join('')}
                </select>
                <span id="model-preset-help" class="sr-only">Choose a pre-configured neural network architecture</span>
              </div>
            </div>

            <div class="card" role="group" aria-labelledby="hyperparams-heading">
              <h2 id="hyperparams-heading">Hyperparameters</h2>
              <div class="form-grid" role="group" aria-label="Training hyperparameter controls">
                <div class="form-group">
                  <label for="epochs">Epochs</label>
                  <input type="number" id="epochs" value="${DEFAULT_HYPERPARAMS.epochs}" min="1" max="1000" aria-describedby="epochs-help">
                  <span id="epochs-help" class="sr-only">Number of complete passes through the training data</span>
                </div>
                <div class="form-group">
                  <label for="batchSize">Batch Size</label>
                  <input type="number" id="batchSize" value="${DEFAULT_HYPERPARAMS.batchSize}" min="1" max="512" aria-describedby="batch-help">
                  <span id="batch-help" class="sr-only">Number of samples per gradient update</span>
                </div>
                <div class="form-group">
                  <label for="learningRate">Learning Rate</label>
                  <input type="number" id="learningRate" value="${DEFAULT_HYPERPARAMS.learningRate}" step="0.0001" min="0.00001" max="1" aria-describedby="lr-help">
                  <span id="lr-help" class="sr-only">Step size for weight updates during training</span>
                </div>
                <div class="form-group">
                  <label for="optimizer">Optimizer</label>
                  <select id="optimizer" aria-describedby="optimizer-help">
                    <option value="adam">Adam</option>
                    <option value="sgd">SGD</option>
                    <option value="rmsprop">RMSprop</option>
                  </select>
                  <span id="optimizer-help" class="sr-only">Algorithm used to update model weights</span>
                </div>
                <div class="form-group checkbox-group">
                  <input type="checkbox" id="earlyStopping" checked aria-describedby="early-stop-help">
                  <label for="earlyStopping">Early Stopping</label>
                  <span id="early-stop-help" class="sr-only">Stop training when validation loss stops improving</span>
                </div>
                <div class="form-group">
                  <label for="patience">Patience</label>
                  <input type="number" id="patience" value="${DEFAULT_HYPERPARAMS.patience}" min="1" max="50" aria-describedby="patience-help">
                  <span id="patience-help" class="sr-only">Epochs to wait before stopping when no improvement</span>
                </div>
              </div>
            </div>

            <div class="card" role="region" aria-labelledby="model-summary-heading">
              <h2 id="model-summary-heading">Model Summary</h2>
              <pre id="modelSummary" class="model-summary" aria-live="polite" aria-label="Neural network layer summary">Select a dataset and configure model to see summary</pre>
            </div>
          </section>

          <!-- Train Tab -->
          <section id="tab-train" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-train">
            <div class="card" role="group" aria-labelledby="training-controls-heading">
              <h2 id="training-controls-heading">Training Controls</h2>
              <div class="training-controls" role="group" aria-label="Training start and stop controls">
                <button id="btnStartTraining" class="btn btn-primary" disabled aria-label="Begin model training with current configuration">Start Training</button>
                <button id="btnStopTraining" class="btn btn-danger hidden" aria-label="Stop training early">Stop Training</button>
              </div>
              <div id="trainingStatus" class="training-status hidden" role="status" aria-live="polite">
                <div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Training progress">
                  <div id="progressFill" class="progress-fill"></div>
                </div>
                <p id="statusText">Ready</p>
              </div>
            </div>

            <div class="card charts-container" role="region" aria-labelledby="training-progress-heading">
              <h2 id="training-progress-heading">Training Progress</h2>
              <div class="chart-grid" role="group" aria-label="Training metrics charts">
                <div class="chart-wrapper">
                  <canvas id="lossChart" aria-label="Loss over epochs chart"></canvas>
                </div>
                <div class="chart-wrapper">
                  <canvas id="accuracyChart" aria-label="Accuracy over epochs chart"></canvas>
                </div>
              </div>
            </div>

            <div class="card hidden" id="confusionMatrixCard" role="region" aria-labelledby="confusion-matrix-heading">
              <h2 id="confusion-matrix-heading">Confusion Matrix</h2>
              <div class="confusion-grid">
                <div class="chart-wrapper confusion-chart">
                  <canvas id="confusionChart" aria-label="Confusion matrix visualization"></canvas>
                </div>
                <div id="classMetrics" class="class-metrics" aria-label="Per-class precision, recall, and F1 scores"></div>
              </div>
            </div>

            <div class="card" role="log" aria-labelledby="training-log-heading">
              <h2 id="training-log-heading">Training Log</h2>
              <div id="trainingLog" class="training-log" aria-live="polite" aria-label="Training epoch results"></div>
            </div>
          </section>

          <!-- Export Tab -->
          <section id="tab-export" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-export">
            <div class="card" role="group" aria-labelledby="export-model-heading">
              <h2 id="export-model-heading">Export Model</h2>
              <p id="exportStatus" role="status" aria-live="polite">Train a model first to enable export.</p>
              <div class="export-buttons" role="group" aria-label="Export options">
                <button id="btnSaveModel" class="btn btn-secondary" disabled aria-label="Save model topology and weights as separate files">Save Model Files</button>
                <button id="btnExportBundle" class="btn btn-primary" disabled aria-label="Export complete training bundle as ZIP archive">Export Full Bundle (ZIP)</button>
              </div>
            </div>

            <div id="lastExport" class="card hidden" role="status" aria-live="polite">
              <h2>Last Export</h2>
              <p id="lastExportPath" aria-label="Path to last exported file"></p>
            </div>
          </section>

          <!-- Predict Tab -->
          <section id="tab-predict" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-predict">
            <div class="card" role="group" aria-labelledby="single-predict-heading">
              <h2 id="single-predict-heading">Single Prediction</h2>
              <p id="predictStatus" role="status">Train a model first to enable predictions.</p>
              <div id="predictInputs" class="predict-inputs hidden" role="group" aria-label="Feature input fields">
                <!-- Feature inputs will be generated dynamically -->
              </div>
              <div class="predict-actions hidden" id="predictActions">
                <button id="btnPredict" class="btn btn-primary" aria-label="Run prediction with entered values">Predict</button>
                <button id="btnClearInputs" class="btn btn-secondary" aria-label="Clear all input fields">Clear</button>
              </div>
            </div>

            <div id="predictionResult" class="card hidden" role="region" aria-labelledby="prediction-result-heading" aria-live="polite">
              <h2 id="prediction-result-heading">Prediction Result</h2>
              <div id="predictionOutput" class="prediction-output"></div>
            </div>

            <div class="card" role="group" aria-labelledby="batch-predict-heading">
              <h2 id="batch-predict-heading">Batch Prediction</h2>
              <p>Upload a CSV file with feature columns to predict labels for multiple samples.</p>
              <div class="batch-actions">
                <button id="btnLoadBatchFile" class="btn btn-secondary" disabled aria-label="Load CSV file for batch predictions">Load CSV for Prediction</button>
                <button id="btnExportPredictions" class="btn btn-primary hidden" aria-label="Export predictions to CSV">Export Predictions</button>
              </div>
              <div id="batchProgress" class="batch-progress hidden" role="status" aria-live="polite">
                <p id="batchStatusText">Processing...</p>
              </div>
            </div>

            <div id="batchResults" class="card hidden" role="region" aria-labelledby="batch-results-heading">
              <h2 id="batch-results-heading">Batch Results</h2>
              <div class="table-container" role="region" aria-label="Batch prediction results">
                <table id="batchResultsTable" aria-label="Predictions for uploaded samples"></table>
              </div>
            </div>
          </section>

          <!-- Help Tab -->
          <section id="tab-help" class="tab-content" role="tabpanel" aria-labelledby="tab-btn-help">
            <div class="card help-intro">
              <h2>📚 Getting Started Guide</h2>
              <p class="help-tagline">New to machine learning? No problem. This guide explains everything in plain English.</p>
            </div>

            <div class="help-grid">
              <div class="card help-card">
                <h3>🤔 What is Machine Learning?</h3>
                <p>Machine learning is teaching a computer to recognize patterns in data. Instead of writing rules manually, you show the computer examples and it learns the patterns itself.</p>
                <div class="help-example">
                  <strong>Real-world example:</strong> Show a computer thousands of flower measurements labeled by species. It learns which measurements correspond to which flowers, then can identify new flowers it's never seen.
                </div>
              </div>

              <div class="card help-card">
                <h3>📊 What is a Dataset?</h3>
                <p>A dataset is a collection of examples that the model learns from. It's typically stored as a spreadsheet (CSV file) where:</p>
                <ul class="help-list">
                  <li><strong>Each row</strong> is one example (like one flower)</li>
                  <li><strong>Each column</strong> is a characteristic (like petal length)</li>
                  <li><strong>One column</strong> is what you want to predict (like species)</li>
                </ul>
              </div>

              <div class="card help-card">
                <h3>🎯 Features vs Labels</h3>
                <div class="help-comparison">
                  <div class="help-compare-item">
                    <h4>Features (Inputs)</h4>
                    <p>The information you give the model to make predictions. These are the columns you <em>know</em> when making predictions.</p>
                    <p class="help-example-small">Example: height, weight, age</p>
                  </div>
                  <div class="help-compare-item">
                    <h4>Label (Output)</h4>
                    <p>What you want the model to predict. This is the answer you're looking for.</p>
                    <p class="help-example-small">Example: disease risk, price, category</p>
                  </div>
                </div>
              </div>

              <div class="card help-card">
                <h3>🧠 What is a Model?</h3>
                <p>A model is like a recipe that transforms inputs into predictions. Training Studio uses <strong>neural networks</strong> — models inspired by how the brain works.</p>
                <p>Don't worry about the technical details. The default settings work well for most problems. You can always experiment later.</p>
              </div>

              <div class="card help-card">
                <h3>🏋️ What is Training?</h3>
                <p>Training is the learning process. The model:</p>
                <ol class="help-list">
                  <li>Makes a guess based on the features</li>
                  <li>Compares its guess to the correct answer</li>
                  <li>Adjusts itself to be more accurate</li>
                  <li>Repeats thousands of times until it's good</li>
                </ol>
                <p class="help-note">Each complete pass through your data is called an <strong>epoch</strong>. More epochs = more practice.</p>
              </div>

              <div class="card help-card">
                <h3>📈 Understanding the Charts</h3>
                <div class="help-charts-explain">
                  <div>
                    <h4>Loss</h4>
                    <p>How wrong the model is. <strong>Lower is better.</strong> You want this going down.</p>
                  </div>
                  <div>
                    <h4>Accuracy</h4>
                    <p>Percentage of correct predictions. <strong>Higher is better.</strong> You want this going up.</p>
                  </div>
                </div>
                <p class="help-note">The "val" (validation) lines show how well the model works on data it hasn't seen. If training accuracy is high but validation accuracy is low, the model is "overfitting" — memorizing instead of learning.</p>
              </div>
            </div>

            <div class="card help-card">
              <h3>🚀 Quick Start Checklist</h3>
              <div class="help-checklist">
                <div class="checklist-item">
                  <span class="checklist-number">1</span>
                  <div>
                    <strong>Prepare your CSV file</strong>
                    <p>Make sure it has headers in the first row. Each row should be one example.</p>
                  </div>
                </div>
                <div class="checklist-item">
                  <span class="checklist-number">2</span>
                  <div>
                    <strong>Load and select columns</strong>
                    <p>Choose which columns are features (inputs) and which is the label (what to predict).</p>
                  </div>
                </div>
                <div class="checklist-item">
                  <span class="checklist-number">3</span>
                  <div>
                    <strong>Use default model settings</strong>
                    <p>The defaults work well for most problems. Experiment later once you see results.</p>
                  </div>
                </div>
                <div class="checklist-item">
                  <span class="checklist-number">4</span>
                  <div>
                    <strong>Train and watch the charts</strong>
                    <p>Click Start Training. If accuracy plateaus or loss stops decreasing, training is done.</p>
                  </div>
                </div>
                <div class="checklist-item">
                  <span class="checklist-number">5</span>
                  <div>
                    <strong>Test your model</strong>
                    <p>Go to the Predict tab and enter values to see what your model predicts.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card help-card">
              <h3>❓ Common Questions</h3>
              <div class="help-faq">
                <details class="faq-item">
                  <summary>How much data do I need?</summary>
                  <p>More is generally better, but you can start with as few as 50-100 examples. For complex problems, aim for 1,000+ examples per category.</p>
                </details>
                <details class="faq-item">
                  <summary>Why is my accuracy stuck at 50%?</summary>
                  <p>This usually means the model is just guessing randomly. Try: more data, different features, more training epochs, or check that your data doesn't have errors.</p>
                </details>
                <details class="faq-item">
                  <summary>What if training is too slow?</summary>
                  <p>Try reducing the batch size, using fewer epochs, or simplifying the model (fewer layers). Training Studio uses your GPU when available for faster training.</p>
                </details>
                <details class="faq-item">
                  <summary>Is my data private?</summary>
                  <p>Yes! Training Studio runs 100% in your browser. Your data never leaves your device. There are no servers, no uploads, no tracking.</p>
                </details>
                <details class="faq-item">
                  <summary>Can I use this for images or text?</summary>
                  <p>Training Studio is designed for <strong>tabular data</strong> (spreadsheets with numbers and categories). For images or text, you'd need specialized tools.</p>
                </details>
              </div>
            </div>

            <div class="card help-card help-glossary">
              <h3>📖 Glossary</h3>
              <dl class="glossary-list">
                <div class="glossary-item">
                  <dt>Epoch</dt>
                  <dd>One complete pass through all training data</dd>
                </div>
                <div class="glossary-item">
                  <dt>Batch Size</dt>
                  <dd>Number of examples processed together before updating the model</dd>
                </div>
                <div class="glossary-item">
                  <dt>Learning Rate</dt>
                  <dd>How big of adjustments the model makes. Too high = unstable, too low = slow</dd>
                </div>
                <div class="glossary-item">
                  <dt>Overfitting</dt>
                  <dd>When a model memorizes training data but fails on new data</dd>
                </div>
                <div class="glossary-item">
                  <dt>Validation Split</dt>
                  <dd>Portion of data held back to test model performance</dd>
                </div>
                <div class="glossary-item">
                  <dt>Early Stopping</dt>
                  <dd>Automatically stops training when the model stops improving</dd>
                </div>
              </dl>
            </div>
          </section>
        </main>

        <footer class="footer" role="contentinfo" aria-label="TensorFlow.js runtime statistics">
          <span id="memoryUsage" aria-label="GPU memory usage">Memory: --</span>
          <span id="tensorCount" aria-label="Active tensor count">Tensors: --</span>
        </footer>
      </div>
    `;

    // Initialize charts
    const lossCanvas = document.getElementById('lossChart') as HTMLCanvasElement;
    const accuracyCanvas = document.getElementById('accuracyChart') as HTMLCanvasElement;
    this.charts = new TrainingCharts(lossCanvas, accuracyCanvas);

    // Start memory monitoring
    this.startMemoryMonitor();
  }

  private setupEventListeners(): void {
    // Tab navigation
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = (e.target as HTMLElement).dataset.tab as TabId;
        this.switchTab(tabId);
      });
    });

    // Dataset tab
    document.getElementById('btnLoadDataset')!.addEventListener('click', () => this.loadDataset());
    document.getElementById('btnConfirmColumns')!.addEventListener('click', () => this.confirmColumnSelection());

    // Model tab
    document.getElementById('modelPreset')!.addEventListener('change', (e) => {
      this.state.modelPreset = (e.target as HTMLSelectElement).value as ModelPreset;
      this.updateModelSummary();
    });

    // Hyperparameter inputs
    ['epochs', 'batchSize', 'learningRate', 'optimizer', 'earlyStopping', 'patience'].forEach(id => {
      document.getElementById(id)!.addEventListener('change', () => this.updateHyperparams());
    });

    // Train tab
    document.getElementById('btnStartTraining')!.addEventListener('click', () => this.startTraining());
    document.getElementById('btnStopTraining')!.addEventListener('click', () => this.stopTraining());

    // Export tab
    document.getElementById('btnSaveModel')!.addEventListener('click', () => this.handleSaveModel());
    document.getElementById('btnExportBundle')!.addEventListener('click', () => this.handleExportBundle());

    // Predict tab
    document.getElementById('btnPredict')!.addEventListener('click', () => this.handleSinglePrediction());
    document.getElementById('btnClearInputs')!.addEventListener('click', () => this.clearPredictionInputs());
    document.getElementById('btnLoadBatchFile')!.addEventListener('click', () => this.handleBatchPrediction());
  }

  private switchTab(tabId: TabId): void {
    this.state.currentTab = tabId;

    document.querySelectorAll('.tab').forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      const isActive = content.id === `tab-${tabId}`;
      content.classList.toggle('active', isActive);
      content.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  private async loadDataset(): Promise<void> {
    try {
      const result = await openFile('csv');
      this.state.datasetContent = result.content;
      this.state.datasetPreview = result.preview;
      this.state.fileName = result.fileName;

      // Update UI
      document.getElementById('datasetInfo')!.classList.remove('hidden');
      document.getElementById('fileName')!.textContent = result.fileName;
      document.getElementById('rowCount')!.textContent = result.preview.totalRows.toString();

      // Show preview table
      this.renderPreviewTable(result.preview);

      // Show column selection
      this.renderColumnSelection(result.preview);

      this.log(`Loaded dataset: ${result.fileName} (${result.preview.totalRows} rows)`);
    } catch (error) {
      this.log(`Failed to load dataset: ${(error as Error).message}`, 'error');
    }
  }

  private renderPreviewTable(preview: DatasetPreview): void {
    const container = document.getElementById('dataPreview')!;
    const table = document.getElementById('previewTable')!;

    let html = '<thead><tr>';
    preview.headers.forEach((h, i) => {
      html += `<th>${h}<br><small class="type-badge">${preview.columnTypes[i]}</small></th>`;
    });
    html += '</tr></thead><tbody>';

    preview.rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody>';

    table.innerHTML = html;
    container.classList.remove('hidden');
  }

  private renderColumnSelection(preview: DatasetPreview): void {
    const featureContainer = document.getElementById('featureCheckboxes')!;
    const labelContainer = document.getElementById('labelRadios')!;

    featureContainer.innerHTML = preview.headers.map((h, i) => `
      <label class="checkbox-label">
        <input type="checkbox" name="feature" value="${h}" data-type="${preview.columnTypes[i]}">
        ${h} <small>(${preview.columnTypes[i]})</small>
      </label>
    `).join('');

    labelContainer.innerHTML = preview.headers.map((h, i) => `
      <label class="radio-label">
        <input type="radio" name="label" value="${h}" data-type="${preview.columnTypes[i]}">
        ${h} <small>(${preview.columnTypes[i]})</small>
      </label>
    `).join('');

    // Listen for selection changes
    featureContainer.querySelectorAll('input').forEach(cb => {
      cb.addEventListener('change', () => this.updateColumnSelection());
    });
    labelContainer.querySelectorAll('input').forEach(rb => {
      rb.addEventListener('change', () => this.updateColumnSelection());
    });

    document.getElementById('columnSelection')!.classList.remove('hidden');
  }

  private updateColumnSelection(): void {
    const features = Array.from(document.querySelectorAll('input[name="feature"]:checked'))
      .map(cb => (cb as HTMLInputElement).value);
    const label = (document.querySelector('input[name="label"]:checked') as HTMLInputElement)?.value;

    this.state.selectedFeatures = features;
    this.state.selectedLabel = label || null;

    const confirmBtn = document.getElementById('btnConfirmColumns') as HTMLButtonElement;
    confirmBtn.disabled = features.length === 0 || !label;

    // Update selection summary
    const summaryEl = document.getElementById('selectionSummary');
    if (summaryEl) {
      if (features.length > 0 || label) {
        const parts: string[] = [];
        if (features.length > 0) {
          parts.push(`<span class="summary-item"><strong>Inputs:</strong> ${features.join(', ')}</span>`);
        }
        if (label) {
          parts.push(`<span class="summary-item"><strong>Predicting:</strong> ${label}</span>`);
        }
        summaryEl.innerHTML = parts.join('');
        summaryEl.classList.add('visible');
      } else {
        summaryEl.innerHTML = '';
        summaryEl.classList.remove('visible');
      }
    }
  }

  private confirmColumnSelection(): void {
    if (!this.state.datasetContent || this.state.selectedFeatures.length === 0 || !this.state.selectedLabel) {
      return;
    }

    // Load the dataset into tensors
    this.state.dataset = loadDataset({
      content: this.state.datasetContent,
      featureColumns: this.state.selectedFeatures,
      labelColumn: this.state.selectedLabel,
      validationSplit: 0.2,
      normalize: true
    });

    this.log(`Dataset loaded: ${this.state.dataset.stats.trainSamples} train, ${this.state.dataset.stats.valSamples} val`);
    this.log(`Label type: ${this.state.dataset.labelInfo.type}${
      this.state.dataset.labelInfo.numClasses ? ` (${this.state.dataset.labelInfo.numClasses} classes)` : ''
    }`);

    // Update model summary and enable training
    this.updateModelSummary();
    (document.getElementById('btnStartTraining') as HTMLButtonElement).disabled = false;

    // Switch to model tab
    this.switchTab('model');
  }

  private updateHyperparams(): void {
    this.state.hyperparams = {
      epochs: parseInt((document.getElementById('epochs') as HTMLInputElement).value),
      batchSize: parseInt((document.getElementById('batchSize') as HTMLInputElement).value),
      learningRate: parseFloat((document.getElementById('learningRate') as HTMLInputElement).value),
      optimizer: (document.getElementById('optimizer') as HTMLSelectElement).value as HyperParams['optimizer'],
      earlyStopping: (document.getElementById('earlyStopping') as HTMLInputElement).checked,
      patience: parseInt((document.getElementById('patience') as HTMLInputElement).value)
    };

    this.updateModelSummary();
  }

  private updateModelSummary(): void {
    if (!this.state.dataset) {
      document.getElementById('modelSummary')!.textContent = 'Load a dataset first';
      return;
    }

    // Dispose previous model
    this.state.model?.dispose();

    // Create new model
    const outputShape = this.state.dataset.labelInfo.type === 'classification'
      ? this.state.dataset.labelInfo.numClasses!
      : 1;

    this.state.model = createModel({
      preset: this.state.modelPreset,
      inputShape: this.state.dataset.featureCount,
      outputShape
    });

    compileModel(this.state.model, {
      preset: this.state.modelPreset,
      inputShape: this.state.dataset.featureCount,
      outputShape
    }, this.state.hyperparams);

    const summaryLines = getModelSummary(this.state.model);
    document.getElementById('modelSummary')!.textContent = summaryLines.join('\n');
  }

  private async startTraining(): Promise<void> {
    if (!this.state.model || !this.state.dataset) {
      this.log('No model or dataset loaded', 'error');
      this.showError('Please load a dataset and configure your model before training.');
      return;
    }

    // Update UI
    const startBtn = document.getElementById('btnStartTraining') as HTMLButtonElement;
    const stopBtn = document.getElementById('btnStopTraining') as HTMLButtonElement;
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    document.getElementById('trainingStatus')!.classList.remove('hidden');
    this.charts?.reset();

    // Set up callbacks
    trainer.setCallbacks(
      (state) => this.onTrainingStateChange(state),
      (result) => this.onEpochEnd(result)
    );

    this.log('Training started...');

    try {
      await trainer.train(this.state.model, this.state.dataset, this.state.hyperparams);

      // Training complete
      this.state.lastTrainingMetrics = await trainer.saveModel();
      this.enableExport();
      this.log('Training complete!');

      // Compute and display confusion matrix
      await this.computeAndDisplayConfusionMatrix();
    } catch (error) {
      const err = error as Error;
      this.log(`Training error: ${err.message}`, 'error');

      // Provide user-friendly error messages
      if (err.message.includes('out of memory') || err.message.includes('OOM')) {
        this.showError('Out of GPU memory. Try reducing batch size or model complexity.');
      } else if (err.message.includes('NaN')) {
        this.showError('Training diverged (NaN loss). Try reducing learning rate.');
      } else if (err.message.includes('abort')) {
        // Training was stopped by user, not an error
        this.log('Training stopped by user');
      } else {
        this.showError(`Training failed: ${err.message}`);
      }

      // Clean up tensors on error to prevent memory leaks
      try {
        if (this.state.model) {
          this.state.model.dispose();
        }
        this.state.model = null;
      } catch {
        // Ignore disposal errors
      }
    } finally {
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
    }
  }

  private stopTraining(): void {
    trainer.stop();
    this.log('Training stopped by user');
  }

  private onTrainingStateChange(state: TrainingState): void {
    const progress = (state.currentEpoch / state.totalEpochs) * 100;
    (document.getElementById('progressFill') as HTMLElement).style.width = `${progress}%`;

    const elapsed = Math.floor(state.elapsedMs / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    document.getElementById('statusText')!.textContent =
      `Epoch ${state.currentEpoch}/${state.totalEpochs} | Batch ${state.currentBatch}/${state.totalBatches} | ${mins}m ${secs}s`;
  }

  private onEpochEnd(result: EpochResult): void {
    const metrics = trainer.getMetrics();

    // Update charts
    this.charts?.updateLoss(
      metrics.epochs,
      metrics.loss,
      metrics.valLoss
    );

    if (metrics.accuracy.length > 0) {
      this.charts?.updateAccuracy(
        metrics.epochs,
        metrics.accuracy,
        metrics.valAccuracy
      );
    }

    // Log epoch result
    let logLine = `Epoch ${result.epoch}: loss=${result.loss.toFixed(4)}`;
    if (result.accuracy !== undefined) logLine += ` acc=${result.accuracy.toFixed(4)}`;
    if (result.valLoss !== undefined) logLine += ` val_loss=${result.valLoss.toFixed(4)}`;
    if (result.valAccuracy !== undefined) logLine += ` val_acc=${result.valAccuracy.toFixed(4)}`;
    this.log(logLine);
  }

  private enableExport(): void {
    document.getElementById('exportStatus')!.textContent = 'Model ready for export';
    (document.getElementById('btnSaveModel') as HTMLButtonElement).disabled = false;
    (document.getElementById('btnExportBundle') as HTMLButtonElement).disabled = false;

    // Also enable prediction tab
    this.enablePrediction();
  }

  private async computeAndDisplayConfusionMatrix(): Promise<void> {
    if (!this.state.model || !this.state.dataset) return;

    try {
      this.log('Computing confusion matrix...');

      // Use validation data if available, otherwise use training data
      const xData = this.state.dataset.valX ?? this.state.dataset.trainX;
      const yData = this.state.dataset.valY ?? this.state.dataset.trainY;

      // Generate class labels if we have them
      const classLabels = this.state.dataset.labelInfo.classLabels;

      // Compute confusion matrix
      const confusionData = await computeModelConfusionMatrix(
        this.state.model,
        xData,
        yData,
        classLabels
      );

      // Store for export
      this.state.confusionMatrix = confusionData;

      // Update visualization
      this.displayConfusionMatrix(confusionData);

      this.log(`Confusion matrix computed: ${(confusionData.accuracy * 100).toFixed(1)}% accuracy`);
    } catch (error) {
      const err = error as Error;
      this.log(`Failed to compute confusion matrix: ${err.message}`, 'error');
    }
  }

  private displayConfusionMatrix(data: ConfusionMatrixData): void {
    // Show the confusion matrix card
    const card = document.getElementById('confusionMatrixCard');
    card?.classList.remove('hidden');

    // Set up chart canvas if not already done
    const confusionCanvas = document.getElementById('confusionChart') as HTMLCanvasElement;
    if (confusionCanvas && this.charts) {
      this.charts.setConfusionCanvas(confusionCanvas);
      this.charts.updateConfusionMatrix(data);
    }

    // Display per-class metrics
    const metricsDiv = document.getElementById('classMetrics');
    if (metricsDiv) {
      metricsDiv.innerHTML = `
        <table class="metrics-table" aria-label="Per-class performance metrics">
          <thead>
            <tr>
              <th>Class</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1 Score</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            ${data.perClassMetrics.map(m => `
              <tr>
                <td>${m.label}</td>
                <td>${(m.precision * 100).toFixed(1)}%</td>
                <td>${(m.recall * 100).toFixed(1)}%</td>
                <td>${(m.f1Score * 100).toFixed(1)}%</td>
                <td>${m.support}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Overall</strong></td>
              <td colspan="3"><strong>Accuracy: ${(data.accuracy * 100).toFixed(1)}%</strong></td>
              <td><strong>${data.totalSamples}</strong></td>
            </tr>
          </tfoot>
        </table>
      `;
    }
  }

  private async handleSaveModel(): Promise<void> {
    if (!this.state.lastTrainingMetrics) {
      this.showError('No trained model to save. Please train a model first.');
      return;
    }

    const btn = document.getElementById('btnSaveModel') as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const result = await saveModel(
        this.state.lastTrainingMetrics.modelJson,
        this.state.lastTrainingMetrics.weightsBase64,
        `model_${Date.now()}`
      );
      this.log(`Model saved to: ${result.path}`);
      this.showLastExport(result.path);
    } catch (error) {
      const err = error as Error;
      this.log(`Save failed: ${err.message}`, 'error');
      this.showError(err.message || 'Failed to save model. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  private async handleExportBundle(): Promise<void> {
    if (!this.state.lastTrainingMetrics || !this.state.dataset) {
      this.showError('No trained model to export. Please train a model first.');
      return;
    }

    const btn = document.getElementById('btnExportBundle') as HTMLButtonElement;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Exporting...';

    try {
      const result = await exportBundle({
        ...this.state.lastTrainingMetrics,
        metrics: trainer.getMetrics(),
        config: {
          modelType: this.state.modelPreset,
          hyperparams: { ...this.state.hyperparams } as Record<string, unknown>,
          datasetInfo: {
            fileName: this.state.fileName || 'unknown',
            features: this.state.selectedFeatures,
            label: this.state.selectedLabel || '',
            trainSize: this.state.dataset.stats.trainSamples
          }
        }
      });
      this.log(`Bundle exported to: ${result.path}`);
      this.showLastExport(result.path);
    } catch (error) {
      const err = error as Error;
      this.log(`Export failed: ${err.message}`, 'error');
      this.showError(err.message || 'Failed to export bundle. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  private showLastExport(path: string): void {
    document.getElementById('lastExport')!.classList.remove('hidden');
    document.getElementById('lastExportPath')!.textContent = path;
  }

  private log(message: string, level: 'info' | 'error' = 'info'): void {
    const logEl = document.getElementById('trainingLog');
    if (logEl) {
      const time = new Date().toLocaleTimeString();
      const className = level === 'error' ? 'log-error' : 'log-info';
      logEl.innerHTML += `<div class="${className}">[${time}] ${message}</div>`;
      logEl.scrollTop = logEl.scrollHeight;
    }
    console.log(`[TrainingStudio] ${message}`);
  }

  private startMemoryMonitor(): void {
    setInterval(() => {
      const memory = tf.memory();
      document.getElementById('memoryUsage')!.textContent =
        `Memory: ${(memory.numBytes / 1024 / 1024).toFixed(1)} MB`;
      document.getElementById('tensorCount')!.textContent =
        `Tensors: ${memory.numTensors}`;
    }, 1000);
  }

  // ============== Prediction Methods ==============

  private enablePrediction(): void {
    if (!this.state.model || !this.state.selectedFeatures.length) return;

    document.getElementById('predictStatus')!.textContent = 'Enter feature values to make predictions.';
    document.getElementById('predictInputs')!.classList.remove('hidden');
    document.getElementById('predictActions')!.classList.remove('hidden');
    (document.getElementById('btnLoadBatchFile') as HTMLButtonElement).disabled = false;

    // Generate input fields for each feature
    this.generatePredictionInputs();
  }

  private generatePredictionInputs(): void {
    const container = document.getElementById('predictInputs')!;
    container.innerHTML = this.state.selectedFeatures.map(feature => `
      <div class="form-group predict-input-group">
        <label for="predict-${feature}">${feature}</label>
        <input type="number" id="predict-${feature}" step="any" placeholder="Enter value"
               aria-label="Value for ${feature} feature">
      </div>
    `).join('');
  }

  private clearPredictionInputs(): void {
    this.state.selectedFeatures.forEach(feature => {
      const input = document.getElementById(`predict-${feature}`) as HTMLInputElement;
      if (input) input.value = '';
    });
    document.getElementById('predictionResult')?.classList.add('hidden');
  }

  private async handleSinglePrediction(): Promise<void> {
    if (!this.state.model || !this.state.dataset) {
      this.showError('No model available for predictions.');
      return;
    }

    // Collect input values
    const values: number[] = [];
    for (const feature of this.state.selectedFeatures) {
      const input = document.getElementById(`predict-${feature}`) as HTMLInputElement;
      const value = parseFloat(input.value);
      if (isNaN(value)) {
        this.showError(`Please enter a valid number for ${feature}`);
        return;
      }
      values.push(value);
    }

    try {
      // Create tensor and predict
      const inputTensor = tf.tensor2d([values], [1, values.length]);
      const prediction = this.state.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.array() as number[][];

      // Display result
      this.displayPredictionResult(probabilities[0]);

      // Cleanup
      inputTensor.dispose();
      prediction.dispose();
    } catch (error) {
      const err = error as Error;
      this.showError(`Prediction failed: ${err.message}`);
    }
  }

  private displayPredictionResult(probabilities: number[]): void {
    const resultCard = document.getElementById('predictionResult')!;
    const outputDiv = document.getElementById('predictionOutput')!;
    resultCard.classList.remove('hidden');

    // Get class labels
    const labels = this.state.dataset?.labelInfo.classLabels ||
                   probabilities.map((_, i) => `Class ${i}`);

    // Find predicted class
    const predictedIndex = probabilities.indexOf(Math.max(...probabilities));
    const predictedLabel = labels[predictedIndex];
    const confidence = probabilities[predictedIndex] * 100;

    outputDiv.innerHTML = `
      <div class="prediction-main">
        <div class="predicted-class">
          <span class="label">Predicted:</span>
          <span class="value">${predictedLabel}</span>
        </div>
        <div class="confidence">
          <span class="label">Confidence:</span>
          <span class="value">${confidence.toFixed(1)}%</span>
        </div>
      </div>
      <div class="probability-bars" aria-label="Class probabilities">
        ${labels.map((label, i) => {
          const prob = probabilities[i] * 100;
          const isMax = i === predictedIndex;
          return `
            <div class="prob-bar ${isMax ? 'max' : ''}">
              <span class="prob-label">${label}</span>
              <div class="prob-fill-container">
                <div class="prob-fill" style="width: ${prob}%"></div>
              </div>
              <span class="prob-value">${prob.toFixed(1)}%</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  private async handleBatchPrediction(): Promise<void> {
    if (!this.state.model) {
      this.showError('No model available for predictions.');
      return;
    }

    try {
      // Open file for batch prediction
      const result = await openFile('csv');
      const lines = result.content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      // Validate features match
      const featureIndices = this.state.selectedFeatures.map(f => headers.indexOf(f));
      if (featureIndices.some(i => i === -1)) {
        this.showError('CSV file must contain all feature columns: ' + this.state.selectedFeatures.join(', '));
        return;
      }

      // Show progress
      document.getElementById('batchProgress')!.classList.remove('hidden');
      document.getElementById('batchStatusText')!.textContent = 'Processing...';

      // Process rows
      const dataRows = lines.slice(1).filter(line => line.trim());
      const predictions: { row: string[]; prediction: string; confidence: number }[] = [];

      // Get class labels
      const labels = this.state.dataset?.labelInfo.classLabels ||
                     Array.from({ length: (this.state.model.outputShape[1] as number) }, (_, i) => `Class ${i}`);

      // Batch process for efficiency
      const batchSize = 32;
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        const batchData = batch.map(line => {
          const cols = line.split(',');
          return featureIndices.map(idx => parseFloat(cols[idx]));
        });

        const inputTensor = tf.tensor2d(batchData);
        const predTensor = this.state.model.predict(inputTensor) as tf.Tensor;
        const probs = await predTensor.array() as number[][];

        probs.forEach((prob, j) => {
          const maxIdx = prob.indexOf(Math.max(...prob));
          predictions.push({
            row: batch[j].split(','),
            prediction: labels[maxIdx],
            confidence: prob[maxIdx] * 100
          });
        });

        inputTensor.dispose();
        predTensor.dispose();

        document.getElementById('batchStatusText')!.textContent =
          `Processed ${Math.min(i + batchSize, dataRows.length)} / ${dataRows.length} samples`;
      }

      // Display results
      this.displayBatchResults(headers, predictions);

      document.getElementById('batchProgress')!.classList.add('hidden');
      document.getElementById('btnExportPredictions')!.classList.remove('hidden');
    } catch (error) {
      const err = error as Error;
      document.getElementById('batchProgress')!.classList.add('hidden');
      this.showError(`Batch prediction failed: ${err.message}`);
    }
  }

  private displayBatchResults(
    headers: string[],
    predictions: { row: string[]; prediction: string; confidence: number }[]
  ): void {
    const resultsCard = document.getElementById('batchResults')!;
    const table = document.getElementById('batchResultsTable')!;
    resultsCard.classList.remove('hidden');

    const limitedResults = predictions.slice(0, 100); // Show first 100 for performance

    table.innerHTML = `
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
          <th>Prediction</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        ${limitedResults.map(p => `
          <tr>
            ${p.row.map(v => `<td>${v}</td>`).join('')}
            <td><strong>${p.prediction}</strong></td>
            <td>${p.confidence.toFixed(1)}%</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    if (predictions.length > 100) {
      table.innerHTML += `
        <tfoot>
          <tr>
            <td colspan="${headers.length + 2}" style="text-align: center">
              Showing first 100 of ${predictions.length} results. Export to see all.
            </td>
          </tr>
        </tfoot>
      `;
    }
  }
}

export function initApp(): void {
  new TrainingStudioApp();
}
