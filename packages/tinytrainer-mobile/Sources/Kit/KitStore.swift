import Foundation
import SwiftUI

/// Observable state for the currently loaded training kit.
@Observable
final class KitStore {
    var currentKit: LoadedKit?
    var isLoading = false
    var errorMessage: String?

    /// Whether a kit is loaded and ready for inference
    var isReady: Bool { currentKit != nil }

    /// Load a kit from a file URL (user-picked .kit.zip)
    func loadKit(from url: URL) {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let kit = try KitImporter.importKit(from: url)
                await MainActor.run {
                    self.currentKit = kit
                    self.isLoading = false
                    // Remember last kit path
                    UserDefaults.standard.set(kit.directory.path, forKey: "lastKitPath")
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }

    /// Load the bundled demo kit
    func loadDemoKit() {
        isLoading = true
        errorMessage = nil

        Task {
            do {
                let kit = try KitImporter.loadBundledDemoKit()
                await MainActor.run {
                    self.currentKit = kit
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = error.localizedDescription
                    self.isLoading = false
                }
            }
        }
    }

    /// Unload the current kit
    func unloadKit() {
        currentKit = nil
        UserDefaults.standard.removeObject(forKey: "lastKitPath")
    }
}
