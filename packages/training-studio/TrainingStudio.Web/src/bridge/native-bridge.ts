// Bridge between TypeScript and C# via HybridWebView

type BridgeCallback = (response: BridgeResponse) => void;

interface BridgeResponse {
  requestId: string;
  success: boolean;
  data?: unknown;
  error?: string;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeoutId?: ReturnType<typeof setTimeout>;
}

// Default timeout for bridge operations (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  openFile: 'Failed to open file. Please try again or select a different file.',
  saveModel: 'Failed to save model. Please check your destination folder permissions.',
  exportBundle: 'Failed to export bundle. Please ensure you have write access to the destination.',
  timeout: 'Operation timed out. The app may be unresponsive.',
  unknown: 'An unexpected error occurred. Please try again.'
};

class NativeBridge {
  private pendingRequests = new Map<string, PendingRequest>();
  private requestCounter = 0;

  constructor() {
    // Register global callback for C# responses
    (window as unknown as { bridgeCallback: BridgeCallback }).bridgeCallback =
      this.handleCallback.bind(this);
  }

  private handleCallback(response: BridgeResponse): void {
    const pending = this.pendingRequests.get(response.requestId);
    if (pending) {
      // Clear timeout if set
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      this.pendingRequests.delete(response.requestId);
      if (response.success) {
        pending.resolve(response.data);
      } else {
        pending.reject(new Error(response.error || 'Unknown error'));
      }
    }
  }

  private generateRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  async invoke<T>(action: string, payload?: unknown, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
    const requestId = this.generateRequestId();

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeoutId = setTimeout(() => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          this.pendingRequests.delete(requestId);
          const errorMessage = ERROR_MESSAGES[action] || ERROR_MESSAGES.timeout;
          reject(new BridgeTimeoutError(errorMessage, action, timeoutMs));
        }
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeoutId
      });

      const message = JSON.stringify({
        action,
        requestId,
        payload
      });

      // HybridWebView.SendRawMessage
      if ((window as unknown as { HybridWebView?: { SendRawMessage: (msg: string) => void } }).HybridWebView) {
        (window as unknown as { HybridWebView: { SendRawMessage: (msg: string) => void } })
          .HybridWebView.SendRawMessage(message);
      } else {
        // Fallback for development without MAUI
        console.warn('[Bridge] HybridWebView not available, using mock');
        this.mockResponse(requestId, action, payload);
      }
    });
  }

  /**
   * Cancel all pending requests (useful on app shutdown)
   */
  cancelAll(): void {
    for (const [requestId, pending] of this.pendingRequests) {
      if (pending.timeoutId) {
        clearTimeout(pending.timeoutId);
      }
      pending.reject(new Error('Request cancelled'));
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Check if there are pending requests
   */
  hasPendingRequests(): boolean {
    return this.pendingRequests.size > 0;
  }

  private mockResponse(requestId: string, action: string, payload?: unknown): void {
    setTimeout(() => {
      const mockData = this.getMockData(action, payload);
      this.handleCallback({
        requestId,
        success: true,
        data: mockData
      });
    }, 100);
  }

  private getMockData(action: string, _payload?: unknown): unknown {
    switch (action) {
      case 'openFile':
        // Use realistic iris-like demo data for development
        return {
          fileName: 'iris_sample.csv',
          filePath: 'C:/demo/iris_sample.csv',
          content: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
5.4,3.9,1.7,0.4,setosa
6.7,3.1,4.4,1.4,versicolor
6.9,3.1,5.4,2.1,virginica
5.0,3.4,1.5,0.2,setosa
6.5,2.8,4.6,1.5,versicolor
7.7,3.0,6.1,2.3,virginica`,
          preview: {
            headers: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
            rows: [
              ['5.1', '3.5', '1.4', '0.2', 'setosa'],
              ['4.9', '3.0', '1.4', '0.2', 'setosa'],
              ['7.0', '3.2', '4.7', '1.4', 'versicolor'],
              ['6.4', '3.2', '4.5', '1.5', 'versicolor']
            ],
            columnTypes: ['number', 'number', 'number', 'number', 'category'],
            totalRows: 12
          }
        };
      case 'saveModel':
        return { path: 'C:/mock/model' };
      case 'exportBundle':
        return { path: 'C:/mock/export.zip' };
      default:
        return {};
    }
  }
}

/**
 * Custom error class for bridge timeouts
 */
export class BridgeTimeoutError extends Error {
  constructor(
    message: string,
    public readonly action: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = 'BridgeTimeoutError';
  }
}

export const bridge = new NativeBridge();

// Convenience functions
export async function openFile(fileTypes: 'csv' | 'json' = 'csv') {
  return bridge.invoke<{
    fileName: string;
    filePath: string;
    content: string;
    preview: DatasetPreview;
  }>('openFile', { fileTypes });
}

export async function saveModel(modelJson: string, weightsBase64: string, fileName: string) {
  return bridge.invoke<{ path: string }>('saveModel', { modelJson, weightsBase64, fileName });
}

export async function exportBundle(bundle: ExportBundle) {
  return bridge.invoke<{ path: string }>('exportBundle', bundle as unknown as Record<string, unknown>);
}

export interface DatasetPreview {
  headers: string[];
  rows: string[][];
  columnTypes: string[];
  totalRows: number;
}

export interface ExportBundle {
  modelJson: string;
  weightsBase64: string;
  metrics: TrainingMetrics;
  config: TrainingConfig;
}

export interface TrainingMetrics {
  epochs: number[];
  loss: number[];
  accuracy?: number[];
  valLoss?: number[];
  valAccuracy?: number[];
}

export interface TrainingConfig {
  modelType: string;
  hyperparams: Record<string, unknown>;
  datasetInfo: {
    fileName: string;
    features: string[];
    label: string;
    trainSize: number;
  };
}
