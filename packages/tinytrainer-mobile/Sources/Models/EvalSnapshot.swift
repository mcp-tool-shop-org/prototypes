import Foundation

/// A snapshot of model accuracy at a point in time.
struct EvalSnapshot: Codable, Identifiable {
    let id: UUID
    let timestamp: Date
    let modelVersion: Int
    let accuracy: Double
    let totalExamples: Int
    let correctCount: Int
    let perClassAccuracy: [String: Double]

    init(
        modelVersion: Int,
        accuracy: Double,
        totalExamples: Int,
        correctCount: Int,
        perClassAccuracy: [String: Double] = [:]
    ) {
        self.id = UUID()
        self.timestamp = Date()
        self.modelVersion = modelVersion
        self.accuracy = accuracy
        self.totalExamples = totalExamples
        self.correctCount = correctCount
        self.perClassAccuracy = perClassAccuracy
    }
}
