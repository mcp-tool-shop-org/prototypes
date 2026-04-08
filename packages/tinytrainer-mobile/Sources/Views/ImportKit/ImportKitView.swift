import SwiftUI
import UniformTypeIdentifiers

struct ImportKitView: View {
    @Environment(KitStore.self) private var kitStore
    @State private var showFilePicker = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    if kitStore.isLoading {
                        ProgressView("Loading kit...")
                            .padding()
                    } else if let kit = kitStore.currentKit {
                        KitInfoCard(kit: kit)
                        Button("Unload Kit", role: .destructive) {
                            kitStore.unloadKit()
                        }
                        .buttonStyle(.bordered)
                    } else {
                        Image(systemName: "shippingbox")
                            .font(.system(size: 60))
                            .foregroundStyle(.secondary)
                            .padding(.top, 40)

                        Text("No kit loaded")
                            .font(.title2)
                            .foregroundStyle(.secondary)

                        VStack(spacing: 12) {
                            Button {
                                kitStore.loadDemoKit()
                            } label: {
                                Label("Load Demo Kit", systemImage: "star.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)

                            Button {
                                showFilePicker = true
                            } label: {
                                Label("Import .kit.zip", systemImage: "folder")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                        }
                        .padding(.horizontal, 40)
                    }

                    if let error = kitStore.errorMessage {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.callout)
                            .padding()
                    }
                }
                .padding()
            }
            .navigationTitle("TinyTrainer")
            .fileImporter(
                isPresented: $showFilePicker,
                allowedContentTypes: [.zip, UTType(filenameExtension: "zip")!],
                allowsMultipleSelection: false
            ) { result in
                if case .success(let urls) = result, let url = urls.first {
                    kitStore.loadKit(from: url)
                }
            }
        }
    }
}
