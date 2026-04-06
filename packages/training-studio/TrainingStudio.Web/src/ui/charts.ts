import { Chart, registerables, TooltipItem, ChartConfiguration } from 'chart.js';
import { ConfusionMatrixData } from '../training/confusion-matrix';

Chart.register(...registerables);

export class TrainingCharts {
  private lossChart: Chart<'line'> | null = null;
  private accuracyChart: Chart<'line'> | null = null;
  private confusionChart: Chart<'bar'> | null = null;
  private lossCanvas: HTMLCanvasElement;
  private accuracyCanvas: HTMLCanvasElement;
  private confusionCanvas: HTMLCanvasElement | null = null;

  constructor(
    lossCanvas: HTMLCanvasElement,
    accuracyCanvas: HTMLCanvasElement,
    confusionCanvas?: HTMLCanvasElement
  ) {
    this.lossCanvas = lossCanvas;
    this.accuracyCanvas = accuracyCanvas;
    this.confusionCanvas = confusionCanvas ?? null;
    this.initCharts();
  }

  private initCharts(): void {
    this.lossChart = new Chart(this.lossCanvas, {
      type: 'line',
      data: {
        labels: [] as number[],
        datasets: [
          {
            label: 'Training Loss',
            data: [] as number[],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Validation Loss',
            data: [] as number[],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          x: {
            title: { display: true, text: 'Epoch' }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Loss' }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });

    this.accuracyChart = new Chart(this.accuracyCanvas, {
      type: 'line',
      data: {
        labels: [] as number[],
        datasets: [
          {
            label: 'Training Accuracy',
            data: [] as number[],
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.1,
            fill: true
          },
          {
            label: 'Validation Accuracy',
            data: [] as number[],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            tension: 0.1,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          x: {
            title: { display: true, text: 'Epoch' }
          },
          y: {
            beginAtZero: true,
            max: 1,
            title: { display: true, text: 'Accuracy' }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  updateLoss(epochs: number[], trainLoss: number[], valLoss: number[]): void {
    if (!this.lossChart) return;

    this.lossChart.data.labels = epochs;
    this.lossChart.data.datasets[0].data = trainLoss;
    this.lossChart.data.datasets[1].data = valLoss;
    this.lossChart.update('none');
  }

  updateAccuracy(epochs: number[], trainAcc: number[], valAcc: number[]): void {
    if (!this.accuracyChart) return;

    this.accuracyChart.data.labels = epochs;
    this.accuracyChart.data.datasets[0].data = trainAcc;
    this.accuracyChart.data.datasets[1].data = valAcc;
    this.accuracyChart.update('none');
  }

  reset(): void {
    if (this.lossChart) {
      this.lossChart.data.labels = [];
      this.lossChart.data.datasets.forEach(ds => ds.data = []);
      this.lossChart.update('none');
    }
    if (this.accuracyChart) {
      this.accuracyChart.data.labels = [];
      this.accuracyChart.data.datasets.forEach(ds => ds.data = []);
      this.accuracyChart.update('none');
    }
  }

  /**
   * Update confusion matrix visualization
   * Uses a stacked bar chart to show per-class predictions
   */
  updateConfusionMatrix(data: ConfusionMatrixData): void {
    if (!this.confusionCanvas) return;

    // Destroy existing chart if any
    if (this.confusionChart) {
      this.confusionChart.destroy();
    }

    const { matrix, labels } = data;
    const numClasses = labels.length;

    // Generate color palette for classes
    const colors = this.generateColorPalette(numClasses);

    // Create datasets for stacked bar chart
    // Each dataset represents predictions for one class
    const datasets = labels.map((predLabel, predIdx) => ({
      label: `Predicted: ${predLabel}`,
      data: matrix.map(row => row[predIdx]),
      backgroundColor: colors[predIdx],
      borderColor: colors[predIdx].replace('0.7', '1'),
      borderWidth: 1
    }));

    this.confusionChart = new Chart(this.confusionCanvas, {
      type: 'bar',
      data: {
        labels: labels.map(l => `Actual: ${l}`),
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', // Horizontal bars
        scales: {
          x: {
            stacked: true,
            title: { display: true, text: 'Count' }
          },
          y: {
            stacked: true,
            title: { display: true, text: 'Actual Class' }
          }
        },
        plugins: {
          title: {
            display: true,
            text: `Confusion Matrix (Accuracy: ${(data.accuracy * 100).toFixed(1)}%)`
          },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'bar'>) => {
                const value = ctx.raw as number;
                const total = matrix[ctx.dataIndex].reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (value / total * 100).toFixed(1) : '0';
                return `${ctx.dataset.label}: ${value} (${pct}%)`;
              }
            }
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /**
   * Set the confusion matrix canvas (for lazy initialization)
   */
  setConfusionCanvas(canvas: HTMLCanvasElement): void {
    this.confusionCanvas = canvas;
  }

  /**
   * Generate a color palette for chart datasets
   */
  private generateColorPalette(count: number): string[] {
    const baseColors = [
      'rgba(99, 102, 241, 0.7)',   // Indigo
      'rgba(34, 197, 94, 0.7)',    // Green
      'rgba(239, 68, 68, 0.7)',    // Red
      'rgba(249, 115, 22, 0.7)',   // Orange
      'rgba(6, 182, 212, 0.7)',    // Cyan
      'rgba(168, 85, 247, 0.7)',   // Purple
      'rgba(236, 72, 153, 0.7)',   // Pink
      'rgba(234, 179, 8, 0.7)',    // Yellow
      'rgba(20, 184, 166, 0.7)',   // Teal
      'rgba(59, 130, 246, 0.7)'    // Blue
    ];

    // If we need more colors than base, generate them
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate additional colors by adjusting hue
    const result = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle for good distribution
      result.push(`hsla(${hue}, 70%, 60%, 0.7)`);
    }
    return result;
  }

  destroy(): void {
    this.lossChart?.destroy();
    this.accuracyChart?.destroy();
    this.confusionChart?.destroy();
    this.lossChart = null;
    this.accuracyChart = null;
    this.confusionChart = null;
  }
}
