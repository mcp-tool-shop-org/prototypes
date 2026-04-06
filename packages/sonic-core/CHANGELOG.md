# Changelog

## 1.0.1

### Added

- Version consistency test suite (semver, >= 1.0.0, aligned versions, CHANGELOG)
- `verify` script in root package.json
- SHA-pinned CI actions

## 1.0.0

### Changed

- All packages bumped to v1.0.0 and published to npm

## 0.1.0

### Service integration (v0.3.x bridge)

- SidecarBackend event consumption: strict envelope parsing (event + no id), safe callback wrapping
- SidecarBackend introspection: getHealth, getCapabilities, listVoices, preloadModel, getModelStatus
- bin.ts wired to SidecarBackend via SONIC_RUNTIME_PATH env var (NullBackend fallback when unset)
- Graceful shutdown: idempotent dispose on SIGINT/SIGTERM/exit
- Pre-spawn path validation with operator-facing diagnostic messages
- Runtime event logging to stderr
- Service-level integration test (SidecarBackend → SonicEngine → CommandRouter)
- 41 sidecar protocol tests, 3 service integration tests

### Sidecar hardening

- SidecarBackend: auto-restart on crash, consecutive timeout detection, handle map cleanup
- Protocol validation: handshake hard-fail on version mismatch
- Recovery semantics: request_timeout (retryable), runtime_exited (non-retryable)

### Engine

- SonicEngine: playback registry, gain/pan/fade, lease watcher, device enumeration
- CommandRouter: method dispatch to engine operations
- NullBackend for dev/test

### Service

- FastMCP server with 13 MCP tools over stdio
- Tools: play, pause, resume, stop, seek, set_volume, set_pan, set_spatial_position, get_devices, set_output_device, renew_lease, get_playback_state, replace_playback

### Docs

- ADR-0003 through ADR-0009
- Runtime contract status (protocol stability guarantees)
- Service runtime setup guide (operator configuration)
- llm-sync-drive.yaml (cross-repo coordination)
