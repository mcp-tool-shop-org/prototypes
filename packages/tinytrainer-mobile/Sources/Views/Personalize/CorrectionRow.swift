import SwiftUI

struct CorrectionRow: View {
    let correction: Correction

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(correction.inputText.prefix(80) + (correction.inputText.count > 80 ? "..." : ""))
                .font(.caption)
                .lineLimit(2)

            HStack {
                Text(correction.predictedLabel)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .strikethrough()
                Image(systemName: "arrow.right")
                    .font(.caption2)
                Text(correction.correctedLabel)
                    .font(.caption2)
                    .foregroundStyle(.green)
                    .fontWeight(.bold)
                Spacer()
                Text(correction.timestamp, style: .relative)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}
