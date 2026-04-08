import Foundation

/// Mirrors Python `KitManifest` from tinytrainer/schema/kit.py
struct KitManifest: Codable {
    let kitVersion: String
    let taskType: String
    let labelSpace: [String]
    let numLabels: Int
    let backbone: String
    let headType: String
    let trainingConfig: [String: AnyCodable]
    let packName: String?
    let packVersion: String?
    let trainedAt: String
    let evalScores: [String: Double]
    let deviceTargets: [String]

    enum CodingKeys: String, CodingKey {
        case kitVersion = "kit_version"
        case taskType = "task_type"
        case labelSpace = "label_space"
        case numLabels = "num_labels"
        case backbone
        case headType = "head_type"
        case trainingConfig = "training_config"
        case packName = "pack_name"
        case packVersion = "pack_version"
        case trainedAt = "trained_at"
        case evalScores = "eval_scores"
        case deviceTargets = "device_targets"
    }
}

// MARK: - AnyCodable for flexible JSON values

struct AnyCodable: Codable {
    let value: Any

    init(_ value: Any) { self.value = value }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intVal = try? container.decode(Int.self) { value = intVal }
        else if let doubleVal = try? container.decode(Double.self) { value = doubleVal }
        else if let boolVal = try? container.decode(Bool.self) { value = boolVal }
        else if let strVal = try? container.decode(String.self) { value = strVal }
        else { value = "unknown" }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let v = value as? Int { try container.encode(v) }
        else if let v = value as? Double { try container.encode(v) }
        else if let v = value as? Bool { try container.encode(v) }
        else if let v = value as? String { try container.encode(v) }
        else { try container.encode(String(describing: value)) }
    }
}
