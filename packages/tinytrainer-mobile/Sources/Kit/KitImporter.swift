import Foundation
import ZIPFoundation

/// Represents a fully parsed and validated training kit.
struct LoadedKit {
    let directory: URL
    let manifest: KitManifest
    let recipe: Recipe
    let tokenizerRef: TokenizerRef
    let labelMap: LabelMap
    let modelURL: URL          // path to compiled .mlmodelc or .mlpackage
    let isUpdatable: Bool      // true if model_updatable.mlmodel was found
    let evalExamples: [EvalExample]  // bundled demo eval data
}

/// A held-out example for evaluating the model.
struct EvalExample: Codable {
    let text: String
    let label: String
}

enum KitImportError: LocalizedError {
    case invalidZip
    case missingManifest
    case missingLabelMap
    case missingRecipe
    case missingModel
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidZip: return "Not a valid .kit.zip file"
        case .missingManifest: return "manifest.json not found in kit"
        case .missingLabelMap: return "label_map.json not found in kit"
        case .missingRecipe: return "recipe.json not found in kit"
        case .missingModel: return "No model file found in kit"
        case .decodingFailed(let file): return "Failed to decode \(file)"
        }
    }
}

/// Imports and parses .kit.zip files.
enum KitImporter {

    /// Import a kit from a URL (file picker or bundled resource).
    static func importKit(from sourceURL: URL) throws -> LoadedKit {
        let fm = FileManager.default
        let kitID = UUID().uuidString
        let destDir = FileManager.appSupportDirectory
            .appendingPathComponent("kits", isDirectory: true)
            .appendingPathComponent(kitID, isDirectory: true)

        try fm.createDirectory(at: destDir, withIntermediateDirectories: true)

        // Extract zip
        let accessing = sourceURL.startAccessingSecurityScopedResource()
        defer { if accessing { sourceURL.stopAccessingSecurityScopedResource() } }
        try fm.unzipItem(at: sourceURL, to: destDir)

        // Parse manifest
        let manifestData = try loadFile("manifest.json", in: destDir)
        let manifest = try decode(KitManifest.self, from: manifestData, file: "manifest.json")

        // Parse recipe
        let recipeData = try loadFile("recipe.json", in: destDir)
        let recipe = try decode(Recipe.self, from: recipeData, file: "recipe.json")

        // Parse tokenizer ref
        let tokData = try loadFile("tokenizer_ref.json", in: destDir)
        let tokenizerRef = try decode(TokenizerRef.self, from: tokData, file: "tokenizer_ref.json")

        // Parse label map
        let labelData = try loadFile("label_map.json", in: destDir)
        let labelMap = try LabelMap.load(from: labelData)

        // Find model file (priority: updatable > mlpackage > onnx)
        let (modelURL, isUpdatable) = try findModel(in: destDir)

        // Load eval examples if bundled
        let evalExamples = loadEvalExamples(in: destDir)

        return LoadedKit(
            directory: destDir,
            manifest: manifest,
            recipe: recipe,
            tokenizerRef: tokenizerRef,
            labelMap: labelMap,
            modelURL: modelURL,
            isUpdatable: isUpdatable,
            evalExamples: evalExamples
        )
    }

    /// Load a bundled demo kit from the app's Resources.
    static func loadBundledDemoKit() throws -> LoadedKit {
        guard let url = Bundle.main.url(forResource: "demo_error_triage.kit", withExtension: "zip",
                                         subdirectory: "DemoKit") else {
            // Try without subdirectory
            guard let url = Bundle.main.url(forResource: "demo_error_triage", withExtension: "kit.zip") else {
                throw KitImportError.invalidZip
            }
            return try importKit(from: url)
        }
        return try importKit(from: url)
    }

    // MARK: - Private

    private static func loadFile(_ name: String, in dir: URL) throws -> Data {
        let url = dir.appendingPathComponent(name)
        guard FileManager.default.fileExists(atPath: url.path) else {
            switch name {
            case "manifest.json": throw KitImportError.missingManifest
            case "label_map.json": throw KitImportError.missingLabelMap
            case "recipe.json": throw KitImportError.missingRecipe
            default: throw KitImportError.decodingFailed(name)
            }
        }
        return try Data(contentsOf: url)
    }

    private static func decode<T: Decodable>(_ type: T.Type, from data: Data, file: String) throws -> T {
        do {
            return try JSONDecoder().decode(type, from: data)
        } catch {
            throw KitImportError.decodingFailed(file)
        }
    }

    private static func findModel(in dir: URL) throws -> (URL, Bool) {
        let fm = FileManager.default

        // Check for updatable mlmodel first
        let updatablePath = dir.appendingPathComponent("model_updatable.mlmodel")
        if fm.fileExists(atPath: updatablePath.path) {
            return (updatablePath, true)
        }

        // Check for mlpackage directory
        let mlpackagePath = dir.appendingPathComponent("model.mlpackage")
        if fm.fileExists(atPath: mlpackagePath.path) {
            return (mlpackagePath, false)
        }

        // Check for onnx (inference-only, cannot use MLUpdateTask)
        let onnxPath = dir.appendingPathComponent("model.onnx")
        if fm.fileExists(atPath: onnxPath.path) {
            return (onnxPath, false)
        }

        throw KitImportError.missingModel
    }

    private static func loadEvalExamples(in dir: URL) -> [EvalExample] {
        let path = dir.appendingPathComponent("eval_examples.json")
        guard let data = try? Data(contentsOf: path),
              let examples = try? JSONDecoder().decode([EvalExample].self, from: data) else {
            return []
        }
        return examples
    }
}
