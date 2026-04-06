# Soundboard MAUI — Feature Map

## Core Principle

The MAUI UI is a **control surface**, not a logic layer.
All behavior lives in:
- `Soundboard.Client`
- `Soundboard.Maui.Audio`
- `ViewModels`

---

## Features by Layer

### UI Layer (MAUI Views)

Responsibilities:
- Text input
- Preset selection
- Voice selection
- Speak / Stop buttons
- Status display (Ready / Streaming / Finished / Error)

Non-responsibilities:
- No networking
- No audio processing
- No engine assumptions

Files:
- `Views/MainPage.xaml`
- `Views/MainPage.xaml.cs`

---

### ViewModel Layer

Responsibilities:
- Command orchestration
- State tracking
- Binding UI -> Client -> Audio

Files:
- `ViewModels/SoundboardViewModel.cs`

---

### Client Layer

Responsibilities:
- HTTP + WebSocket
- Streaming audio chunks
- Engine state events

Files:
- `Soundboard.Client/*`

---

### Audio Layer

Responsibilities:
- Buffer PCM16
- Play / stop audio
- No engine knowledge

Files:
- `Soundboard.Maui.Audio/*`

---

## Feature Checklist (UI-visible)

| Feature         | UI | VM | Client | Audio |
|-----------------|----|----|--------|-------|
| Health check    |    | x  | x      |       |
| List presets    | x  | x  | x      |       |
| List voices     | x  | x  | x      |       |
| Speak           | x  | x  | x      | x     |
| Stop            | x  | x  | x      | x     |
| Streaming audio |    |    | x      | x     |
| Status display  | x  | x  |        |       |

---

## Explicit Non-Features

- Vocology controls
- Engine tuning
- Research flags
- Pipeline editing
- Settings drawer
- Multiple pages or tabs

---

## Rule

If a PR adds UI code that isn't represented here, it's wrong.
