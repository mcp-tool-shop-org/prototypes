import SwiftUI

struct PersonalizeView: View {
    @Environment(KitStore.self) private var kitStore
    @Environment(CorrectionStore.self) private var correctionStore
    @Environment(PersonalizationEngine.self) private var engine

    @State private var baselineEval: EvalSnapshot?
    @State private var latestEval: EvalSnapshot?
    @State private var isEvaluating = false

    private let classifier = ClassifierService()
    private let embedder = EmbeddingService()
    private let evalEngine = EvalEngine()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if !kitStore.isReady {
                        ContentUnavailableView(
                            "No Kit Loaded",
                            systemImage: "shippingbox",
                            description: Text("Import a kit first.")
                        )
                    } else {
                        correctionsSection
                        trainingSection
                        evalSection
                    }
                }
                .padding()
            }
            .navigationTitle("Personalize")
            .onAppear { loadModelAndBaseline() }
        }
    }

    // MARK: - Corrections Section

    private var correctionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Corrections")
                    .font(.headline)
                Spacer()
                Text("\(correctionStore.count)")
                    .font(.title3.bold())
                    .foregroundStyle(.blue)
            }

            if correctionStore.corrections.isEmpty {
                Text("No corrections yet. Classify errors and correct wrong predictions.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(correctionStore.corrections.suffix(5)) { correction in
                    CorrectionRow(correction: correction)
                }
                if correctionStore.count > 5 {
                    Text("+ \(correctionStore.count - 5) more")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    // MARK: - Training Section

    private var trainingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("On-Device Training")
                .font(.headline)

            if let kit = kitStore.currentKit, !kit.isUpdatable {
                Label("This model does not support on-device updates.", systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.orange)
                    .font(.callout)
            } else if engine.isTraining {
                TrainingProgressView(
                    progress: engine.progress,
                    epoch: engine.currentEpoch,
                    maxEpochs: kitStore.currentKit?.recipe.maxEpochs ?? 10
                )
            } else {
                let minNeeded = kitStore.currentKit?.recipe.minExamplesToRetrain ?? 5
                let ready = correctionStore.readyToTrain(minExamples: minNeeded)

                Button {
                    startTraining()
                } label: {
                    Label("Personalize Model", systemImage: "brain")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(!ready || kitStore.currentKit?.isUpdatable != true)

                if !ready {
                    Text("Need \(minNeeded - correctionStore.count) more correction(s)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if let error = engine.errorMessage {
                Text(error)
                    .font(.callout)
                    .foregroundStyle(.red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    // MARK: - Eval Section

    private var evalSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Evaluation")
                .font(.headline)

            if isEvaluating {
                ProgressView("Evaluating...")
            } else if let baseline = baselineEval {
                EvalComparisonView(baseline: baseline, latest: latestEval)
            } else if let kit = kitStore.currentKit, kit.evalExamples.isEmpty {
                Text("No eval examples bundled with this kit.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                Button("Run Baseline Eval") {
                    runEval(isBaseline: true)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 1)
    }

    // MARK: - Actions

    private func loadModelAndBaseline() {
        guard let kit = kitStore.currentKit else { return }
        try? classifier.loadModel(at: kit.modelURL, labelMap: kit.labelMap)
        if baselineEval == nil && !kit.evalExamples.isEmpty {
            runEval(isBaseline: true)
        }
    }

    private func startTraining() {
        guard let kit = kitStore.currentKit else { return }

        Task {
            do {
                let updatedURL = try await engine.train(
                    corrections: correctionStore.corrections,
                    modelURL: kit.modelURL,
                    recipe: kit.recipe,
                    labelMap: kit.labelMap,
                    embeddingDim: kit.tokenizerRef.embeddingDim
                )
                try classifier.updateModel(at: updatedURL)
                runEval(isBaseline: false)
            } catch {
                // Error displayed via engine.errorMessage
            }
        }
    }

    private func runEval(isBaseline: Bool) {
        guard let kit = kitStore.currentKit, !kit.evalExamples.isEmpty else { return }
        isEvaluating = true

        Task.detached(priority: .userInitiated) {
            let snapshot = evalEngine.evaluate(
                examples: kit.evalExamples,
                classifier: classifier,
                embedder: embedder,
                modelVersion: engine.modelVersion
            )
            await MainActor.run {
                if isBaseline {
                    baselineEval = snapshot
                } else {
                    latestEval = snapshot
                }
                isEvaluating = false
            }
        }
    }
}
