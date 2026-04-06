# Changelog

All notable changes to the Soundboard SDK and reference clients.

Format follows [Keep a Changelog](https://keepachangelog.com/). SDK versions follow [Semantic Versioning](https://semver.org/).

## [1.2.2] - 2026-03-25

### Fixed
- LICENSE file was empty — now contains MIT license text

### Added
- 3 version consistency tests (assembly version, csproj match, LICENSE check)

## [1.1.1] - 2026-02-27

### Added

- Shipcheck audit — SHIP_GATE.md, SCORECARD.md, SECURITY.md
- Security & Data Scope section in README

## [1.1.0] - 2026-02-12

### SDK (Soundboard.Client)
- **Multi-target:** net8.0, net9.0, net10.0 (widens consumer compatibility)
- **Fix:** `EngineInfo` now deserializes engine snake_case JSON (`engine_version`, `api_version`) correctly via `[JsonPropertyName]` attributes — previously only worked against camelCase test fakes
- **Fix:** `WsUri` uses `UriBuilder` instead of fragile `string.Replace("http", "ws")` — correctly handles `https` → `wss` and URLs containing "http" in hostnames
- **Fix:** `SpeakRequest.ResolvedRequestId` is now stable per instance (lazy-initialized) instead of generating a new GUID on every access
- **Fix:** `SpeakAsync` now gracefully closes the WebSocket with `CloseAsync` in a `finally` block instead of abandoning the connection on cancellation/error
- **Perf:** `ConfigureAwait(false)` on all internal `await` calls — eliminates unnecessary `SynchronizationContext` captures, improves throughput when called from UI threads
- **Deps:** `Microsoft.Extensions.Logging.Abstractions` version matched per TFM (8.0.2 / 9.0.0 / 10.0.0-preview)

### Tests
- All fake engine servers now return snake_case JSON matching real engine format
- Added `EngineInfo_DeserializesSnakeCase` unit test
- Added `WsUri_HttpsBecomesWss` unit test
- Updated `SpeakRequestTests` for stable `ResolvedRequestId` behavior

## [1.0.0] - 2026-02-05

### SDK (Soundboard.Client)
- Initial stable release
- `ISoundboardClient` interface with health, presets, voices, speak, stop
- Streaming audio via `IProgress<AudioChunk>` over WebSocket
- `CancellationToken` on every async method
- `SoundboardClientOptions` with environment variable support (`SOUNDBOARD_BASE_URL`)
- Runtime API version check with warning on mismatch (`SdkApiVersion` constant)
- XML documentation on all public types
- NuGet package metadata

### Reference clients
- MAUI desktop app with welcome flow, offline resilience, tap-to-reconnect
- CLI client (`soundboard-cli`) with health, presets, voices, speak commands

### Examples
- Quickstart: zero-config connect → speak → WAV
- AgentTool: SDK as callable tool in an agent pipeline

### Documentation
- API reference (v1.0 stability guarantees)
- API contract (engine ↔ SDK wire protocol)
- Compatibility & trust contract
- Getting started guide
- Streaming model
- Error model
- Engine distribution guide
- Upgrade/rollback playbooks

### Tests
- 27 unit tests
- 17 integration + contract tests
