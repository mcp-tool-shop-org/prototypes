# Prototypes

**104 archived packages** from [MCP Tool Shop](https://mcp-tool-shop.github.io/) — consolidated during the April 2026 org reductions (175 to 51 repos across two rounds).

This is not a graveyard. It is a seed vault. Every package here solved a real problem, proved a concept, or taught us something that shaped the tools we ship today. Browse the source, steal patterns, revive what is useful.

## Quick start

```bash
git clone https://github.com/mcp-tool-shop-org/prototypes.git
cd prototypes
pnpm install
pnpm build
```

## Packages by category

<!-- GENERATED:seeds-by-category:start -->
<!-- The section below is hand-maintained today. Once Wave 2 backfills per-seed passports,
     `pnpm seed:index` will regenerate this region from passport.json files. -->

### Voice and Sound (10)

| Package | Description |
|---------|-------------|
| [voice-soundboard](packages/voice-soundboard) | TTS for AI agents — compiler/graph/engine architecture |
| [vscode-voice-soundboard](packages/vscode-voice-soundboard) | TTS synthesis with 48 voices, presets, and multi-speaker dialogue |
| [soundboard-plugin](packages/soundboard-plugin) | Claude Code plugin for voice synthesis |
| [soundboard-maui](packages/soundboard-maui) | SDK-first .NET 8+ soundboard client library |
| [mcp-voice-engine](packages/mcp-voice-engine) | Streaming prosody engine for expressive voice synthesis |
| [sonic-core](packages/sonic-core) | Audio control plane for TypeScript |
| [sonic-runtime](packages/sonic-runtime) | Native audio runtime sidecar — C# NativeAOT over ndjson-stdio |
| [soundweave](packages/soundweave) | Adaptive soundtrack studio for interactive game music |
| [vocal-synth-engine](packages/vocal-synth-engine) | Deterministic vocal instrument engine — additive synthesis, voice presets, real-time WebSocket streaming |
| [claude-sfx](packages/claude-sfx) | Procedural audio feedback for Claude Code — UX for agentic coding |

### Developer Tools (35)

| Package | Description |
|---------|-------------|
| [aspire-ai](packages/aspire-ai) | Adversarial Student-Professor Internalized Reasoning Engine |
| [brain-dev](packages/brain-dev) | MCP server for test generation, coverage analysis, and UX insights |
| [build-governor](packages/build-governor) | Memory-aware parallel C++ build governor preventing OOM |
| [claude-collaborate](packages/claude-collaborate) | Unified sandbox for real-time human-AI collaboration |
| [claude-hook-debug](packages/claude-hook-debug) | Diagnostic CLI for Claude Code hook issues |
| [claude-session-copilot](packages/claude-session-copilot) | Session copilot for Claude Code — decisions, timelines, patterns |
| [claude-toolstack](packages/claude-toolstack) | CLI client for bounded code intelligence gateway |
| [code-batch](packages/code-batch) | Content-addressed batch execution engine |
| [code-bearings](packages/code-bearings) | Source-grounded review and control for modern codebases |
| [code-covered](packages/code-covered) | Find coverage gaps and suggest missing tests |
| [context-window-manager](packages/context-window-manager) | MCP server for lossless LLM context restoration via KV cache |
| [control-room](packages/control-room) | Turn scripts into observable, repeatable operations |
| [deltamind](packages/deltamind) | Active context compaction for AI agents — typed deltas + reconciler |
| [flexiflow](packages/flexiflow) | Lightweight async component engine with events and state machines |
| [headless-wheel-builder](packages/headless-wheel-builder) | Universal Python wheel builder with headless GitHub ops |
| [integradio](packages/integradio) | Vector-embedded Gradio components for semantic codebase nav |
| [jam-session-plugin](packages/jam-session-plugin) | AI piano player with 100-song library and structured teaching |
| [mcp-app-builder](packages/mcp-app-builder) | Build MCP servers with interactive UI components |
| [mcp-aside](packages/mcp-aside) | MCP interjection inbox with TTL, rate-limit, and dedupe |
| [mcp-bouncer](packages/mcp-bouncer) | Health-check MCP servers, quarantine broken ones, auto-restore |
| [mcp-examples](packages/mcp-examples) | Example workspaces for MCP Tool Shop |
| [ai-ui](packages/ai-ui) | Automated design diagnostics for SPAs — crawl, diff, verify UI against docs |
| [artifact](packages/artifact) | Repo signature artifact decision system — Curator freshness driver |
| [claude-memories](packages/claude-memories) | MEMORY.md optimizer and dispatch table generator for Claude Code |
| [claude-rules](packages/claude-rules) | Dispatch table generator and instruction-file optimizer for Claude Code |
| [feature-reacher](packages/feature-reacher) | Adoption risk auditing — surface underutilized features before they become debt |
| [file-compass](packages/file-compass) | Semantic file search for AI workstations using HNSW indexing and Ollama |
| [mcp-file-forge](packages/mcp-file-forge) | MCP server for file operations and project scaffolding — Windows-first |
| [mcp-tool-registry](packages/mcp-tool-registry) | Metadata-only registry for MCP Tool Shop tools |
| [nullout](packages/nullout) | MCP server that finds and safely removes undeletable files on Windows |
| [repo-crawler-mcp](packages/repo-crawler-mcp) | MCP server that crawls GitHub repos and extracts structured data |
| [role-os-rollout](packages/role-os-rollout) | Org rollout control plane for Role OS — queue, decisions, audit records |
| [terminal-tutor](packages/terminal-tutor) | Situated terminal coaching — learn by doing inside Claude Code |
| [tool-scan](packages/tool-scan) | Security scanner for MCP (Model Context Protocol) tools |
| [websketch-ir](packages/websketch-ir) | Compiles web page HTML into 23 UI primitives for LLM reasoning |

### Desktop Apps (8)

| Package | Description |
|---------|-------------|
| [Attestia-Desktop](packages/Attestia-Desktop) | Financial intent verification for Windows — WinUI 3 |
| [InControl-Desktop](packages/InControl-Desktop) | Privacy-first local LLM chat — WinUI 3, GPU-accelerated |
| [ScalarScope-Desktop](packages/ScalarScope-Desktop) | Reproducible ML scalar comparison — .NET MAUI |
| [NextLedger](packages/NextLedger) | Envelope budgeting app for Windows |
| [pocket-ledger](packages/pocket-ledger) | Local-first personal finance and budget tracking |
| [runforge-desktop](packages/runforge-desktop) | Visual ML experiment tracker with live training charts |
| [studioflow](packages/studioflow) | Desktop creative workspace — Tauri v2, multi-claude proving ground |
| [anchor](packages/anchor) | Tauri v2 desktop application prototype |

### VS Code Extensions (3)

| Package | Description |
|---------|-------------|
| [polyglot-vscode](packages/polyglot-vscode) | VS Code extension for local GPU translation — TranslateGemma via Ollama |
| [registry-stats-vscode](packages/registry-stats-vscode) | Multi-registry download stats for VS Code — PDF, JSONL, and Markdown reports |
| [runforge-vscode](packages/runforge-vscode) | RunForge VS Code Extension — push-button ML training with presets |

### WebSketch (4)

| Package | Description |
|---------|-------------|
| [websketch-cli](packages/websketch-cli) | CLI for WebSketch IR — render, diff, and fingerprint web UI captures |
| [websketch-extension](packages/websketch-extension) | Chrome extension to capture web pages as WebSketch IR |
| [websketch-vscode](packages/websketch-vscode) | VS Code extension for grammar-based IR web capture |
| [websketch-mcp](packages/websketch-mcp) | MCP server exposing WebSketch IR tools for LLM agents |

### Mouse and Cursor (3)

| Package | Description |
|---------|-------------|
| [MouseTrainer](packages/MouseTrainer) | Deterministic mouse training game — .NET 10 MAUI |
| [DeterministicMouseTrainingEngine](packages/DeterministicMouseTrainingEngine) | Fixed-timestep simulation engine with composable blueprint mutators |
| [CursorAssist](packages/CursorAssist) | DSP-grounded tremor compensation with velocity-adaptive smoothing |

### Typing and Input (4)

| Package | Description |
|---------|-------------|
| [linux-dev-typer](packages/linux-dev-typer) | Practice typing real code from Python, Rust, JS, C#, and Java |
| [meta-content-system](packages/meta-content-system) | Portable content pipeline for typing practice apps |
| [dev-op-typer](packages/dev-op-typer) | Developer-focused typing practice for Windows — 6 languages, adaptive difficulty |
| [LoKey-Typer](packages/LoKey-Typer) | Calm typing practice with ambient soundscapes and personalized daily sets |

### ML and Training (3)

| Package | Description |
|---------|-------------|
| [edgepacks](packages/edgepacks) | Task-dataset foundry for training small models on narrow jobs |
| [tinytrainer](packages/tinytrainer) | Desktop training foundry + mobile personalization export pipeline |
| [tinytrainer-mobile](packages/tinytrainer-mobile) | iOS/iPadOS reference app for on-device ML personalization |

### Governance and Policy (7)

| Package | Description |
|---------|-------------|
| [civility-kernel](packages/civility-kernel) | Policy layer for preference-governed agent behavior |
| [datagates](packages/datagates) | Governed data promotion system — data earns trust through layered gates |
| [nexus-suite](packages/nexus-suite) | Governance, attestation, and routing infrastructure for MCP ecosystems |
| [Registrum](packages/Registrum) | Deterministic structural registrar — dual-witness state transitions |
| [taste-compiler](packages/taste-compiler) | Compile product taste into enforceable constraints for visual coherence |
| [ThrottleAI](packages/ThrottleAI) | Token-based lease governor for AI calls |
| [stresskit-mcp](packages/stresskit-mcp) | MCP Server health and security testing — trustable evidence |

### Games and Creative (3)

| Package | Description |
|---------|-------------|
| [ConsensusOS](packages/ConsensusOS) | Modular control plane for distributed consensus systems |
| [Trace](packages/Trace) | Deterministic cursor discipline game — .NET 10 MAUI |
| [game-dev-mcp](packages/game-dev-mcp) | MCP server giving LLMs control over game engines |

### Crypto and Provenance (4)

| Package | Description |
|---------|-------------|
| [prov-engine-js](packages/prov-engine-js) | Zero-dependency Node.js provenance engine for prov-spec |
| [prov-spec](packages/prov-spec) | Language-neutral specification for verifiable provenance |
| [receipt-factory](packages/receipt-factory) | Signed, timestamped, reproducible records of what happened |
| [payroll-engine](packages/payroll-engine) | US Payroll SaaS Engine — ledger, payment rails, settlement |

### Suites and Infrastructure (9)

| Package | Description |
|---------|-------------|
| [llm-sync-drive](packages/llm-sync-drive) | Compile llms.txt from a repo and sync to Google Drive |
| [training-studio](packages/training-studio) | TensorFlow.js ML training that runs entirely locally |
| [witness](packages/witness) | Local-first, append-only event journal for human-AI work |
| [zip-meta-map](packages/zip-meta-map) | Turn any ZIP or folder into an LLM-friendly metadata bundle |
| [codeteam-suite](packages/codeteam-suite) | CodeTeam implementation — .NET CLI for package verification and signing |
| [ledger-suite](packages/ledger-suite) | Unified monorepo for cryptographic provenance ledgers |
| [ToolShopStudio](packages/ToolShopStudio) | Six MCP tools + live Registry (FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, Blender) |
| [py-polyglot](packages/py-polyglot) | Local GPU translation Python library + MCP server |
| [venvkit](packages/venvkit) | Python virtual environment diagnostic toolkit for Windows ML workflows |

### Original Archive (11)

These were consolidated before the April 2026 reduction.

| Package | Description |
|---------|-------------|
| [mcpt](packages/mcpt) | CLI for discovering and running MCP Tool Shop tools |
| [pathway](packages/pathway) | Append-only journey engine where undo never erases learning |
| [physics-svg](packages/physics-svg) | Deterministic 2D physics engine with SVG rendering |
| [ai-music-sheets](packages/ai-music-sheets) | Piano sheet music in hybrid JSON + musical-language format |
| [websketch-demo](packages/websketch-demo) | Interactive demo site for WebSketch IR |
| [clearance-opinion-engine](packages/clearance-opinion-engine) | Deterministic name-availability and clearance-opinion engine |
| [nameops](packages/nameops) | Name clearance orchestrator — batch runs, publish, PR automation |
| [mcpt-link-fresh](packages/mcpt-link-fresh) | Evergreen link sync and drift fixer |
| [vector-caliper](packages/vector-caliper) | Geometrical debugger for learning dynamics |
| [mcpt-publishing-assets](packages/mcpt-publishing-assets) | Logo and icon asset generation for mcpt-publishing |
| [rippled-windows-debug](packages/rippled-windows-debug) | Windows debugging tools for XRPL rippled node |

<!-- GENERATED:seeds-by-category:end -->

## Why this exists

On April 6, 2026, we cut the MCP Tool Shop org from 175 repos to 88 — a 50% reduction. On April 8, 2026, we cut again from 88 to 51 — another 42%. Rather than delete working code, we preserved every prototype here. Some of these were stepping stones to products we still ship. Others were experiments that taught us what not to build.

If you are looking at one of these and thinking "this should be a real product" — you might be right. Pull it out, give it a repo, and ship it.

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
