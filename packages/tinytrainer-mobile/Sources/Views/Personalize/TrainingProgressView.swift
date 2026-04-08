import SwiftUI

struct TrainingProgressView: View {
    let progress: Double
    let epoch: Int
    let maxEpochs: Int

    var body: some View {
        VStack(spacing: 12) {
            ProgressView(value: progress) {
                Text("Training on device...")
                    .font(.callout)
            }

            Text("Epoch \(epoch + 1) / \(maxEpochs)")
                .font(.caption)
                .foregroundStyle(.secondary)

            Image(systemName: "brain")
                .font(.title)
                .symbolEffect(.pulse)
                .foregroundStyle(.blue)
        }
        .padding()
    }
}
