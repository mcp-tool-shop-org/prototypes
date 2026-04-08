import SwiftUI

struct ContentView: View {
    @Environment(KitStore.self) private var kitStore

    var body: some View {
        TabView {
            ImportKitView()
                .tabItem {
                    Label("Import", systemImage: "square.and.arrow.down")
                }

            ClassifyView()
                .tabItem {
                    Label("Classify", systemImage: "text.magnifyingglass")
                }

            PersonalizeView()
                .tabItem {
                    Label("Personalize", systemImage: "brain")
                }
        }
    }
}
