import Foundation

/// Mirrors Python `TokenizerRef` from tinytrainer/schema/kit.py
struct TokenizerRef: Codable {
    let modelName: String
    let embeddingDim: Int
    let maxSeqLength: Int

    enum CodingKeys: String, CodingKey {
        case modelName = "model_name"
        case embeddingDim = "embedding_dim"
        case maxSeqLength = "max_seq_length"
    }
}
