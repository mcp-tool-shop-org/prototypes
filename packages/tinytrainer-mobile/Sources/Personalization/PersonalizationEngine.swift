import CoreML
import Foundation

/// Orchestrates on-device model personalization via MLUpdateTask.
@Observable
final class PersonalizationEngine {
    var isTraining = false
    var progress: Double = 0
    var currentEpoch = 0
    var errorMessage: String?
    private(set) var modelVersion = 0

    /// Run on-device training using accumulated corrections.
    ///
    /// Requirements:
    /// - The model must be in Neural Network format (not ML Program)
    /// - At least `recipe.minExamplesToRetrain` corrections needed
    ///
    /// Returns the URL of the updated compiled model.
    func train(
        corrections: [Correction],
        modelURL: URL,
        recipe: Recipe,
        labelMap: LabelMap,
        embeddingDim: Int
    ) async throws -> URL {
        guard !isTraining else {
            throw PersonalizationError.alreadyTraining
        }

        guard corrections.count >= recipe.minExamplesToRetrain else {
            throw PersonalizationError.notEnoughCorrections(
                have: corrections.count, need: recipe.minExamplesToRetrain
            )
        }

        await MainActor.run {
            isTraining = true
            progress = 0
            currentEpoch = 0
            errorMessage = nil
        }

        do {
            // Build training data
            let batchProvider = try buildTrainingBatch(
                corrections: corrections,
                labelMap: labelMap,
                embeddingDim: embeddingDim
            )

            // Compile model if needed
            let compiledURL: URL
            if modelURL.pathExtension == "mlmodelc" {
                compiledURL = modelURL
            } else {
                compiledURL = try MLModel.compileModel(at: modelURL)
            }

            // Run MLUpdateTask
            let updatedURL = try await runUpdateTask(
                modelURL: compiledURL,
                trainingData: batchProvider,
                maxEpochs: recipe.maxEpochs,
                learningRate: recipe.learningRateMax
            )

            await MainActor.run {
                self.isTraining = false
                self.progress = 1.0
                self.modelVersion += 1
            }

            return updatedURL

        } catch {
            await MainActor.run {
                self.isTraining = false
                self.errorMessage = error.localizedDescription
            }
            throw error
        }
    }

    // MARK: - Private

    private func buildTrainingBatch(
        corrections: [Correction],
        labelMap: LabelMap,
        embeddingDim: Int
    ) throws -> MLArrayBatchProvider {
        var featureProviders: [MLFeatureProvider] = []

        for correction in corrections {
            guard let embedding = correction.embeddingVector else { continue }
            guard let labelIdx = labelMap.index(for: correction.correctedLabel) else { continue }

            // Input: embedding vector
            let inputArray = try MLMultiArray(
                shape: [1, NSNumber(value: embeddingDim)],
                dataType: .float32
            )
            for i in 0..<min(embedding.count, embeddingDim) {
                inputArray[[0, NSNumber(value: i)] as [NSNumber]] = NSNumber(value: embedding[i])
            }

            // Target: label index
            let targetArray = try MLMultiArray(shape: [1], dataType: .int32)
            targetArray[0] = NSNumber(value: labelIdx)

            let provider = try MLDictionaryFeatureProvider(dictionary: [
                "embeddings": MLFeatureValue(multiArray: inputArray),
                "target": MLFeatureValue(multiArray: targetArray),
            ])
            featureProviders.append(provider)
        }

        return MLArrayBatchProvider(array: featureProviders)
    }

    private func runUpdateTask(
        modelURL: URL,
        trainingData: MLBatchProvider,
        maxEpochs: Int,
        learningRate: Double
    ) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let config = MLModelConfiguration()
            config.computeUnits = .cpuOnly  // Training is CPU-only on most devices

            do {
                let updateTask = try MLUpdateTask(
                    forModelAt: modelURL,
                    trainingData: trainingData,
                    configuration: config,
                    progressHandlers: MLUpdateProgressHandlers(
                        forEvents: [.epochEnd, .trainingBegin],
                        progressHandler: { context in
                            Task { @MainActor in
                                let event = context.event
                                if event == .epochEnd {
                                    let epoch = context.metrics[.epochIndex] as? Int ?? 0
                                    self.currentEpoch = epoch
                                    self.progress = Double(epoch + 1) / Double(maxEpochs)
                                }
                            }
                        },
                        completionHandler: { context in
                            if context.task.state == .completed {
                                // Save updated model
                                let updatedDir = FileManager.appSupportDirectory
                                    .appendingPathComponent("updated_models", isDirectory: true)
                                let updatedURL = updatedDir
                                    .appendingPathComponent("model_v\(self.modelVersion + 1).mlmodelc")

                                do {
                                    try FileManager.default.createDirectory(
                                        at: updatedDir, withIntermediateDirectories: true
                                    )
                                    try context.model.write(to: updatedURL)
                                    continuation.resume(returning: updatedURL)
                                } catch {
                                    continuation.resume(throwing: error)
                                }
                            } else {
                                continuation.resume(
                                    throwing: PersonalizationError.trainingFailed(
                                        context.task.error?.localizedDescription ?? "Unknown"
                                    )
                                )
                            }
                        }
                    )
                )
                updateTask.resume()
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}

enum PersonalizationError: LocalizedError {
    case alreadyTraining
    case notEnoughCorrections(have: Int, need: Int)
    case trainingFailed(String)
    case modelNotUpdatable

    var errorDescription: String? {
        switch self {
        case .alreadyTraining:
            return "Training is already in progress"
        case .notEnoughCorrections(let have, let need):
            return "Need at least \(need) corrections to train (have \(have))"
        case .trainingFailed(let reason):
            return "Training failed: \(reason)"
        case .modelNotUpdatable:
            return "This model does not support on-device updates. Export with --updatable from tinytrainer."
        }
    }
}
