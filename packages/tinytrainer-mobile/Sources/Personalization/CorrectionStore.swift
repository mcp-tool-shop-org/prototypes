import Foundation

/// Persists user corrections to JSON in the app sandbox.
@Observable
final class CorrectionStore {
    private(set) var corrections: [Correction] = []

    private var fileURL: URL {
        FileManager.appSupportDirectory.appendingPathComponent("corrections.json")
    }

    var count: Int { corrections.count }

    func readyToTrain(minExamples: Int) -> Bool {
        count >= minExamples
    }

    init() {
        load()
    }

    func addCorrection(
        inputText: String,
        predictedLabel: String,
        correctedLabel: String,
        embeddingVector: [Float]? = nil
    ) {
        let correction = Correction(
            inputText: inputText,
            predictedLabel: predictedLabel,
            correctedLabel: correctedLabel,
            embeddingVector: embeddingVector
        )
        corrections.append(correction)
        save()
    }

    func clearAll() {
        corrections.removeAll()
        save()
    }

    /// Group corrections by corrected label for display.
    var groupedByLabel: [String: [Correction]] {
        Dictionary(grouping: corrections) { $0.correctedLabel }
    }

    // MARK: - Persistence

    private func load() {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        corrections = (try? JSONDecoder().decode([Correction].self, from: data)) ?? []
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(corrections) else { return }
        try? data.write(to: fileURL, options: .atomic)
    }
}
