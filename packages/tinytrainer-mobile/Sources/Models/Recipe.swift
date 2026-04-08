import Foundation

/// Mirrors Python `Recipe` from tinytrainer/schema/kit.py
/// On-device personalization recipe — what's trainable and bounds.
struct Recipe: Codable {
    let updatableLayers: [String]
    let learningRateMin: Double
    let learningRateMax: Double
    let maxEpochs: Int
    let minExamplesToRetrain: Int

    enum CodingKeys: String, CodingKey {
        case updatableLayers = "updatable_layers"
        case learningRateMin = "learning_rate_min"
        case learningRateMax = "learning_rate_max"
        case maxEpochs = "max_epochs"
        case minExamplesToRetrain = "min_examples_to_retrain"
    }
}
