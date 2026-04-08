import Foundation
import NaturalLanguage

/// Produces embedding vectors from text using Apple's NaturalLanguage framework.
///
/// Uses NLEmbedding word vectors (512-dim) with mean pooling, then projects/truncates
/// to the target dimension (384-dim for MiniLM-compatible models).
final class EmbeddingService {
    private let embedding: NLEmbedding?
    private let targetDim: Int

    init(targetDim: Int = 384) {
        self.embedding = NLEmbedding.wordEmbedding(for: .english)
        self.targetDim = targetDim
    }

    /// Whether the embedding model is available on this device.
    var isAvailable: Bool { embedding != nil }

    /// Embed text into a fixed-size float vector.
    func embed(_ text: String) -> [Float]? {
        guard let embedding else { return nil }

        let tokenizer = NLTokenizer(unit: .word)
        tokenizer.string = text

        var vectors: [[Double]] = []
        tokenizer.enumerateTokens(in: text.startIndex..<text.endIndex) { range, _ in
            let token = String(text[range]).lowercased()
            if let vector = embedding.vector(for: token) {
                vectors.append(vector)
            }
            return true
        }

        guard !vectors.isEmpty else {
            // Fallback: return zero vector if no tokens have embeddings
            return [Float](repeating: 0, count: targetDim)
        }

        // Mean pool all token vectors
        let dim = vectors[0].count  // NLEmbedding is 512-dim
        var pooled = [Double](repeating: 0, count: dim)
        for vec in vectors {
            for i in 0..<min(dim, vec.count) {
                pooled[i] += vec[i]
            }
        }
        let n = Double(vectors.count)
        for i in 0..<dim {
            pooled[i] /= n
        }

        // Project to target dimension (truncate if larger, pad if smaller)
        var result = [Float](repeating: 0, count: targetDim)
        for i in 0..<min(targetDim, dim) {
            result[i] = Float(pooled[i])
        }

        // L2 normalize
        let norm = sqrt(result.reduce(0) { $0 + $1 * $1 })
        if norm > 0 {
            for i in 0..<result.count {
                result[i] /= norm
            }
        }

        return result
    }
}
