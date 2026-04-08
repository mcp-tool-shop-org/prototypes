import Foundation

/// The result of classifying an error text.
struct PredictionResult {
    let label: String
    let confidence: Double
    let severity: String
    let nextStep: String
    let allProbabilities: [String: Double]

    /// Formatted confidence as percentage
    var confidencePercent: String {
        String(format: "%.1f%%", confidence * 100)
    }
}
