import Foundation

/// Label index mapping loaded from label_map.json
struct LabelMap {
    let labelToIndex: [String: Int]
    let indexToLabel: [Int: String]

    init(from dictionary: [String: Int]) {
        self.labelToIndex = dictionary
        self.indexToLabel = Dictionary(uniqueKeysWithValues: dictionary.map { ($1, $0) })
    }

    func index(for label: String) -> Int? {
        labelToIndex[label]
    }

    func label(for index: Int) -> String? {
        indexToLabel[index]
    }

    var labels: [String] {
        labelToIndex.keys.sorted { labelToIndex[$0]! < labelToIndex[$1]! }
    }

    var count: Int { labelToIndex.count }

    static func load(from data: Data) throws -> LabelMap {
        let dict = try JSONDecoder().decode([String: Int].self, from: data)
        return LabelMap(from: dict)
    }
}
