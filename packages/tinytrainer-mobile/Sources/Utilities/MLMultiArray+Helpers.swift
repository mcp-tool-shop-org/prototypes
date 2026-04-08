import CoreML
import Foundation

extension MLMultiArray {
    /// Convert MLMultiArray to a flat [Float] array.
    func toFloatArray() -> [Float] {
        var result = [Float](repeating: 0, count: count)
        for i in 0..<count {
            result[i] = self[i].floatValue
        }
        return result
    }

    /// Create an MLMultiArray from a [Float] array with given shape.
    static func from(_ array: [Float], shape: [Int]) throws -> MLMultiArray {
        let nsShape = shape.map { NSNumber(value: $0) }
        let mlArray = try MLMultiArray(shape: nsShape, dataType: .float32)
        for i in 0..<array.count {
            mlArray[i] = NSNumber(value: array[i])
        }
        return mlArray
    }
}
