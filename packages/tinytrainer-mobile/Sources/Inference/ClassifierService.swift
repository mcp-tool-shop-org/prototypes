import CoreML
import Foundation

/// Runs Core ML inference on embedding vectors.
final class ClassifierService {
    private var model: MLModel?
    private var labelMap: LabelMap?
    private var compiledModelURL: URL?

    /// Load and compile a Core ML model.
    func loadModel(at url: URL, labelMap: LabelMap) throws {
        self.labelMap = labelMap

        // Compile the model if needed
        let compiledURL: URL
        if url.pathExtension == "mlmodelc" {
            compiledURL = url
        } else {
            compiledURL = try MLModel.compileModel(at: url)
        }
        self.compiledModelURL = compiledURL

        let config = MLModelConfiguration()
        config.computeUnits = .cpuAndGPU
        self.model = try MLModel(contentsOf: compiledURL, configuration: config)
    }

    /// Replace the loaded model (after personalization).
    func updateModel(at compiledURL: URL) throws {
        let config = MLModelConfiguration()
        config.computeUnits = .cpuAndGPU
        self.model = try MLModel(contentsOf: compiledURL, configuration: config)
        self.compiledModelURL = compiledURL
    }

    /// The URL of the currently compiled model (needed for MLUpdateTask).
    var currentModelURL: URL? { compiledModelURL }

    /// Run inference on an embedding vector.
    func predict(embedding: [Float]) throws -> PredictionResult {
        guard let model, let labelMap else {
            throw ClassifierError.notLoaded
        }

        let inputDim = embedding.count

        // Create MLMultiArray input
        let inputArray = try MLMultiArray(shape: [1, NSNumber(value: inputDim)], dataType: .float32)
        for i in 0..<inputDim {
            inputArray[[0, NSNumber(value: i)] as [NSNumber]] = NSNumber(value: embedding[i])
        }

        let inputFeatures = try MLDictionaryFeatureProvider(
            dictionary: ["embeddings": MLFeatureValue(multiArray: inputArray)]
        )

        let output = try model.prediction(from: inputFeatures)

        // Extract logits from output
        guard let logitsFeature = output.featureValue(for: "logits"),
              let logitsArray = logitsFeature.multiArrayValue else {
            // Try "output" as fallback name
            guard let outFeature = output.featureValue(for: "output"),
                  let outArray = outFeature.multiArrayValue else {
                // Last resort: try first available feature
                guard let firstName = output.featureNames.first,
                      let firstFeature = output.featureValue(for: firstName),
                      let firstArray = firstFeature.multiArrayValue else {
                    throw ClassifierError.invalidOutput
                }
                return buildResult(from: firstArray, labelMap: labelMap)
            }
            return buildResult(from: outArray, labelMap: labelMap)
        }

        return buildResult(from: logitsArray, labelMap: labelMap)
    }

    // MARK: - Private

    private func buildResult(from logits: MLMultiArray, labelMap: LabelMap) -> PredictionResult {
        let numLabels = logits.count
        var rawLogits = [Float](repeating: 0, count: numLabels)
        for i in 0..<numLabels {
            rawLogits[i] = logits[i].floatValue
        }

        // Softmax
        let maxLogit = rawLogits.max() ?? 0
        var expLogits = rawLogits.map { exp($0 - maxLogit) }
        let sumExp = expLogits.reduce(0, +)
        let probs = expLogits.map { $0 / sumExp }

        // Argmax
        var bestIdx = 0
        var bestProb: Float = 0
        for i in 0..<probs.count {
            if probs[i] > bestProb {
                bestProb = probs[i]
                bestIdx = i
            }
        }

        let label = labelMap.label(for: bestIdx) ?? "unknown"
        let category = ErrorCategory.lookup(label)

        // Build probability map
        var allProbs: [String: Double] = [:]
        for i in 0..<numLabels {
            if let lbl = labelMap.label(for: i) {
                allProbs[lbl] = Double(probs[i])
            }
        }

        return PredictionResult(
            label: label,
            confidence: Double(bestProb),
            severity: category.severity,
            nextStep: category.nextStep,
            allProbabilities: allProbs
        )
    }
}

enum ClassifierError: LocalizedError {
    case notLoaded
    case invalidOutput

    var errorDescription: String? {
        switch self {
        case .notLoaded: return "Model not loaded"
        case .invalidOutput: return "Model produced invalid output"
        }
    }
}
