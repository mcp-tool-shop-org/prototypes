# TinyTrainer Mobile

iOS/iPadOS reference app for on-device ML personalization.

Proves the full loop: **import kit** -> **classify locally** -> **correct predictions** -> **personalize on device** -> **measure improvement**.

## What this proves

- `.kit.zip` format is real and consumable
- Core ML inference works locally
- User correction capture works
- On-device personalization via MLUpdateTask works
- Before/after accuracy improvement is measurable
- Zero network dependency

## Prerequisites

- macOS with Xcode 15+
- [xcodegen](https://github.com/yonaskolb/XcodeGen) (`brew install xcodegen`)
- iOS 17+ device (MLUpdateTask requires physical device, not simulator)

## Build

```bash
# Generate Xcode project
xcodegen generate

# Open in Xcode
open TinyTrainerMobile.xcodeproj

# Build and run on device
```

## Golden Path Demo

1. Launch app on iPhone/iPad
2. **Import tab**: Tap "Load Demo Kit" (error-triage, 20 categories)
3. **Classify tab**: Paste an error message, tap "Classify"
4. If wrong, tap "Wrong?" and select the correct category
5. Repeat until you have 5+ corrections
6. **Personalize tab**: Tap "Personalize Model"
7. Watch training progress (runs entirely on device)
8. See before/after accuracy comparison

## Creating a Kit

On your desktop (requires Python + tinytrainer):

```bash
# Train from an edgepacks pack
tinytrainer train --pack error-triage --output ./model/ --epochs 20

# Export for mobile (Neural Network format for MLUpdateTask)
tinytrainer export ./model/ --format coreml --output ./export/

# Package into a kit
tinytrainer kit ./model/ --output error_triage.kit.zip
```

Transfer the `.kit.zip` to your device via AirDrop, Files, or share sheet.

## Architecture

```
Sources/
  App/           — SwiftUI app entry + TabView
  Models/        — Codable structs mirroring Python schemas
  Kit/           — .kit.zip import + parsing
  Inference/     — NLEmbedding + Core ML prediction
  Personalization/ — Corrections, MLUpdateTask, eval
  Views/         — All SwiftUI views (Import, Classify, Personalize)
  Utilities/     — FileManager + MLMultiArray helpers
```

## Stack

- **SwiftUI** — all views
- **Core ML** — inference + MLUpdateTask personalization
- **NaturalLanguage** — NLEmbedding for on-device text embeddings
- **ZIPFoundation** — .kit.zip extraction
- **No network** — everything runs locally

## Part of the TinyTrainer ecosystem

- [edgepacks](https://github.com/mcp-tool-shop-org/edgepacks) — task-dataset foundry
- [tinytrainer](https://github.com/mcp-tool-shop-org/tinytrainer) — desktop training + export
- **TinyTrainer Mobile** (this app) — on-device personalization

## License

MIT
