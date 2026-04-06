<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sonic-core/readme.png" width="400" alt="Sonic-Core" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/sonic-core/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/sonic-core/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/sonic-core/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/sonic-core/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

Audio control plane for TypeScript. Playback, synthesis, routing, and device management — delegated to a native runtime over a strict protocol boundary.

sonic-core owns the control plane: what to play, when to stop, how loud, which device. The actual audio work happens in [sonic-runtime](https://github.com/mcp-tool-shop-org/sonic-runtime), a NativeAOT sidecar that sonic-core manages over ndjson-stdio-v1.

## Packages

| Package | Purpose |
|---|---|
| `@sonic-core/types` | Shared contract — command schemas, source models, playback state, device info, errors |
| `@sonic-core/engine` | Core playback engine — registry, gain/pan/fade, lease watcher, device enumeration, SidecarBackend |
| `@sonic-core/service` | Local service wrapper — FastMCP server with 13 audio tools over stdio |
| `@sonic-core/client` | Client SDK — typed command caller for TypeScript consumers |

## Architecture

```
┌─────────────────────────────────────────┐
│  Consumer (Stillpoint, MCP client, …)   │
└────────────────┬────────────────────────┘
                 │ TypeScript API
┌────────────────▼────────────────────────┐
│  @sonic-core/engine                     │
│  SonicEngine + SidecarBackend           │
└────────────────┬────────────────────────┘
                 │ ndjson-stdio-v1
┌────────────────▼────────────────────────┐
│  sonic-runtime (C# NativeAOT)           │
│  OpenAL Soft · Kokoro TTS · Device mgmt │
└─────────────────────────────────────────┘
```

SidecarBackend spawns the runtime binary, handles protocol negotiation, auto-restart on crash, consecutive timeout detection, and handle-to-playbackId mapping.

## Runtime Integration

Set `SONIC_RUNTIME_PATH` to the runtime binary for real audio. Omit it for NullBackend (no audio, useful for dev/test).

See [docs/service-runtime-setup.md](docs/service-runtime-setup.md) for the operator guide and [docs/runtime-contract-status.md](docs/runtime-contract-status.md) for protocol stability guarantees.

## Build

```bash
npm install
npm run build
npm test
```

Requires Node 20+. See [docs/adr/](docs/adr/) for architecture decision records.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
