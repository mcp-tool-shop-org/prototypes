import SwiftUI

struct EvalComparisonView: View {
    let baseline: EvalSnapshot
    let latest: EvalSnapshot?

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Accuracy comparison
            HStack(spacing: 24) {
                accuracyColumn(title: "Before", snapshot: baseline)
                if let latest {
                    accuracyColumn(title: "After", snapshot: latest)
                    deltaIndicator
                }
            }

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text("Baseline: \(baseline.correctCount)/\(baseline.totalExamples) correct (v\(baseline.modelVersion))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let latest {
                    Text("Updated: \(latest.correctCount)/\(latest.totalExamples) correct (v\(latest.modelVersion))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func accuracyColumn(title: String, snapshot: EvalSnapshot) -> some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(String(format: "%.0f%%", snapshot.accuracy * 100))
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(snapshot.accuracy > 0.7 ? .green : snapshot.accuracy > 0.4 ? .orange : .red)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var deltaIndicator: some View {
        if let latest {
            let delta = latest.accuracy - baseline.accuracy
            VStack(spacing: 4) {
                Text("Delta")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                HStack(spacing: 2) {
                    Image(systemName: delta >= 0 ? "arrow.up" : "arrow.down")
                    Text(String(format: "%.1f%%", abs(delta * 100)))
                }
                .font(.title3.bold())
                .foregroundStyle(delta >= 0 ? .green : .red)
            }
        }
    }
}
