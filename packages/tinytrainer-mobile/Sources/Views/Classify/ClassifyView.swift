import SwiftUI

struct ClassifyView: View {
    @Environment(KitStore.self) private var kitStore
    @Environment(CorrectionStore.self) private var correctionStore

    @State private var inputText = ""
    @State private var result: PredictionResult?
    @State private var lastEmbedding: [Float]?
    @State private var showCorrection = false
    @State private var isClassifying = false

    private let embedder = EmbeddingService()
    private let classifier = ClassifierService()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if !kitStore.isReady {
                        ContentUnavailableView(
                            "No Kit Loaded",
                            systemImage: "shippingbox",
                            description: Text("Import a .kit.zip on the Import tab first.")
                        )
                    } else {
                        // Input area
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Paste error / stack trace:")
                                .font(.headline)
                            TextEditor(text: $inputText)
                                .frame(minHeight: 120, maxHeight: 200)
                                .font(.system(.body, design: .monospaced))
                                .padding(8)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.secondary.opacity(0.3))
                                )
                        }

                        Button {
                            classify()
                        } label: {
                            if isClassifying {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                            } else {
                                Label("Classify", systemImage: "text.magnifyingglass")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                  || isClassifying)

                        // Result
                        if let result {
                            PredictionCard(result: result)

                            Button {
                                showCorrection = true
                            } label: {
                                Label("Wrong? Correct it", systemImage: "pencil")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                            .tint(.orange)
                        }

                        if correctionStore.count > 0 {
                            HStack {
                                Image(systemName: "checkmark.circle")
                                    .foregroundStyle(.green)
                                Text("\(correctionStore.count) correction(s) saved")
                                    .font(.callout)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Classify")
            .sheet(isPresented: $showCorrection) {
                if let kit = kitStore.currentKit, let result {
                    CorrectionSheet(
                        labels: kit.manifest.labelSpace,
                        predictedLabel: result.label,
                        inputText: inputText,
                        embedding: lastEmbedding
                    )
                }
            }
            .onAppear {
                loadModelIfNeeded()
            }
        }
    }

    private func loadModelIfNeeded() {
        guard let kit = kitStore.currentKit else { return }
        try? classifier.loadModel(at: kit.modelURL, labelMap: kit.labelMap)
    }

    private func classify() {
        guard let kit = kitStore.currentKit else { return }
        isClassifying = true

        // Reload model if needed
        if classifier.currentModelURL == nil {
            try? classifier.loadModel(at: kit.modelURL, labelMap: kit.labelMap)
        }

        Task.detached(priority: .userInitiated) {
            let embedding = embedder.embed(inputText)
            let prediction: PredictionResult?
            if let embedding {
                prediction = try? classifier.predict(embedding: embedding)
            } else {
                prediction = nil
            }

            await MainActor.run {
                self.lastEmbedding = embedding
                self.result = prediction
                self.isClassifying = false
            }
        }
    }
}
