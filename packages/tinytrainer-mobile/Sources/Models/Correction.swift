import Foundation

/// A user correction: predicted label was wrong, user selected the correct one.
struct Correction: Codable, Identifiable {
    let id: UUID
    let inputText: String
    let predictedLabel: String
    let correctedLabel: String
    let timestamp: Date
    /// Cached embedding vector for training (avoids re-embedding)
    var embeddingVector: [Float]?

    init(
        inputText: String,
        predictedLabel: String,
        correctedLabel: String,
        embeddingVector: [Float]? = nil
    ) {
        self.id = UUID()
        self.inputText = inputText
        self.predictedLabel = predictedLabel
        self.correctedLabel = correctedLabel
        self.timestamp = Date()
        self.embeddingVector = embeddingVector
    }
}
