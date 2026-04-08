import SwiftUI

struct PredictionCard: View {
    let result: PredictionResult

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Prediction")
                    .font(.headline)
                Spacer()
                Text(result.confidencePercent)
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }

            // Category
            HStack {
                Text(result.label)
                    .font(.title3.bold())
                    .foregroundStyle(severityColor)
                Spacer()
            }

            Divider()

            // Severity
            HStack {
                Label("Severity", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.secondary)
                Spacer()
                Text(result.severity.uppercased())
                    .font(.callout.bold())
                    .foregroundStyle(severityColor)
            }

            // Next step
            HStack {
                Label("Next Step", systemImage: "arrow.right.circle")
                    .foregroundStyle(.secondary)
                Spacer()
                Text(result.nextStep.replacingOccurrences(of: "_", with: " "))
                    .font(.callout)
            }

            // Top probabilities
            if result.allProbabilities.count > 1 {
                Divider()
                Text("Top Predictions")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)

                let sorted = result.allProbabilities.sorted { $0.value > $1.value }.prefix(5)
                ForEach(Array(sorted), id: \.key) { label, prob in
                    HStack {
                        Text(label)
                            .font(.caption)
                        Spacer()
                        ProgressView(value: prob)
                            .frame(width: 80)
                        Text(String(format: "%.1f%%", prob * 100))
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .frame(width: 45, alignment: .trailing)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    private var severityColor: Color {
        switch result.severity {
        case "critical": return .red
        case "high": return .orange
        case "medium": return .yellow
        case "low": return .green
        default: return .gray
        }
    }
}
