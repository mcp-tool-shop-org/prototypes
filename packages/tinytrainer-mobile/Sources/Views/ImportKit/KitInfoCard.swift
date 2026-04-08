import SwiftUI

struct KitInfoCard: View {
    let kit: LoadedKit

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .font(.title2)
                Text("Kit Loaded")
                    .font(.title2.bold())
            }

            infoRow("Task", kit.manifest.taskType)
            infoRow("Pack", kit.manifest.packName ?? "Custom")
            infoRow("Labels", "\(kit.manifest.numLabels)")
            infoRow("Head", kit.manifest.headType)
            infoRow("Backbone", kit.manifest.backbone)
            infoRow("Updatable", kit.isUpdatable ? "Yes" : "No (inference only)")

            if !kit.manifest.evalScores.isEmpty {
                Divider()
                Text("Desktop Eval Scores")
                    .font(.headline)
                ForEach(Array(kit.manifest.evalScores.sorted(by: { $0.key < $1.key })),
                        id: \.key) { name, score in
                    infoRow(name, String(format: "%.3f", score))
                }
            }

            if !kit.manifest.labelSpace.isEmpty {
                Divider()
                Text("Label Space")
                    .font(.headline)
                FlowLayout(spacing: 6) {
                    ForEach(kit.manifest.labelSpace, id: \.self) { label in
                        Text(label)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 2)
        .padding(.horizontal)
    }

    private func infoRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// Simple flow layout for label tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, offset) in result.offsets.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + offset.x, y: bounds.minY + offset.y),
                                  proposal: .unspecified)
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, offsets: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var offsets: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            offsets.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), offsets)
    }
}
