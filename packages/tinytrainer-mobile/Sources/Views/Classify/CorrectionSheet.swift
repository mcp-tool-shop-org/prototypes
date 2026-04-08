import SwiftUI

struct CorrectionSheet: View {
    @Environment(CorrectionStore.self) private var correctionStore
    @Environment(\.dismiss) private var dismiss

    let labels: [String]
    let predictedLabel: String
    let inputText: String
    let embedding: [Float]?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Text("Predicted:")
                        Spacer()
                        Text(predictedLabel)
                            .foregroundStyle(.red)
                            .fontWeight(.bold)
                    }
                }

                Section("Select correct label") {
                    ForEach(labels.filter { $0 != predictedLabel }, id: \.self) { label in
                        Button {
                            correctionStore.addCorrection(
                                inputText: inputText,
                                predictedLabel: predictedLabel,
                                correctedLabel: label,
                                embeddingVector: embedding
                            )
                            dismiss()
                        } label: {
                            HStack {
                                Text(label)
                                    .foregroundStyle(.primary)
                                Spacer()
                                let cat = ErrorCategory.lookup(label)
                                Text(cat.severity)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Correct Prediction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
