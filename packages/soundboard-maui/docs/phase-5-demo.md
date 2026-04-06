# Phase 5 Demo Flow — Soundboard MAUI

## Goal

Demonstrate that Soundboard is:
- Real-time streaming (not batch)
- API-driven (contract-first)
- Cross-platform capable (client is net8.0)
- Not UI-coupled (ViewModel drives everything)

## Demo Sequence (3-5 minutes)

### 1. Health and Discovery
- App launches, connects to engine
- Shows: engine version, API version, connection status
- Presets and voices populate from live engine

### 2. Live Speak
- Enter text in input field
- Select preset (assistant, narrator, whisper)
- Press Speak
- Audio streams immediately — no waiting for full generation

### 3. Stop and Restart
- Stop mid-stream — audio halts, buffer flushes
- Enter different text, speak again
- Demonstrates clean cancellation and restart

### 4. Observability
- Chunk count displayed during streaming
- Status transitions visible: Connecting → Speaking → Done
- RequestId visible in logs for correlation

## What This Proves

- Streaming WebSocket pipeline works end-to-end
- API contract is honored by both sides
- Client library is reusable (no MAUI dependency in core)
- UI is a thin binding layer over ViewModel
- Stop/cancel semantics are correct

## What We Do NOT Show

- Vocology or research features
- Internal engine controls
- Feature flags or experimental APIs
- Multi-speaker or dialogue synthesis
