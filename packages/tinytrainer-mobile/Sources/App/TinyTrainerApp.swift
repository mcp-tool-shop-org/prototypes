import SwiftUI

@main
struct TinyTrainerApp: App {
    @State private var kitStore = KitStore()
    @State private var correctionStore = CorrectionStore()
    @State private var personalizationEngine = PersonalizationEngine()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(kitStore)
                .environment(correctionStore)
                .environment(personalizationEngine)
        }
    }
}
