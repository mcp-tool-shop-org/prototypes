import Foundation

/// Evaluates model accuracy on held-out examples.
final class EvalEngine {

    /// Run evaluation on a set of labeled examples.
    func evaluate(
        examples: [EvalExample],
        classifier: ClassifierService,
        embedder: EmbeddingService,
        modelVersion: Int
    ) -> EvalSnapshot {
        var correct = 0
        var perClassCorrect: [String: Int] = [:]
        var perClassTotal: [String: Int] = [:]

        for example in examples {
            guard let embedding = embedder.embed(example.text) else { continue }

            perClassTotal[example.label, default: 0] += 1

            guard let result = try? classifier.predict(embedding: embedding) else { continue }

            if result.label == example.label {
                correct += 1
                perClassCorrect[example.label, default: 0] += 1
            }
        }

        let total = examples.count
        let accuracy = total > 0 ? Double(correct) / Double(total) : 0

        var perClassAccuracy: [String: Double] = [:]
        for (label, count) in perClassTotal {
            let labelCorrect = perClassCorrect[label, default: 0]
            perClassAccuracy[label] = Double(labelCorrect) / Double(count)
        }

        return EvalSnapshot(
            modelVersion: modelVersion,
            accuracy: accuracy,
            totalExamples: total,
            correctCount: correct,
            perClassAccuracy: perClassAccuracy
        )
    }
}
