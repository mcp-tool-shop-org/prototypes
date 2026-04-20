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

<!-- Regenerate with: pnpm seed:index — do not edit between the markers. -->

_104 seeds across 13 categories — generated 2026-04-20_

### Voice and Sound (6)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [mcp-tool-registry](packages/mcp-tool-registry) | dormant | A CLI for generating high-quality voice synthesis from text. |
| [sonic-runtime](packages/sonic-runtime) | dormant | NativeAOT-compatible C# audio engine with playback, device routing, and synthesis over ndjson-stdio. |
| [soundboard-maui](packages/soundboard-maui) | dormant | A .NET MAUI desktop client for the Sound Board voice engine. |
| [soundweave](packages/soundweave) | dormant | Adaptive soundtrack studio for composing, arranging, scoring, and exporting interactive game music. |
| [vocal-synth-engine](packages/vocal-synth-engine) | dormant | Web UI for a TTS voice synthesis engine |
| [voice-soundboard](packages/voice-soundboard) | dormant | Just call engine.speak("Hello") and get audio. |

### Developer Tools (56)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [ai-ui](packages/ai-ui) | dormant | Yes, the package has a bin entry and can be run directly. |
| [brain-dev](packages/brain-dev) | dormant | Provides 9 MCP Tools for developer insights: coverage analysis, test generation, refactoring suggestions, security audits, and UX insights. |
| [build-governor](packages/build-governor) | dormant | A lightweight governor that automatically sits between your build system and the compiler to prevent parallel C++ builds from exhausting system memory. |
| [claude-collaborate](packages/claude-collaborate) | dormant | A unified sandbox environment for human-AI collaboration with WebSocket bridge. |
| [claude-hook-debug](packages/claude-hook-debug) | dormant | Diagnostic CLI for detecting issues in Claude Code hooks and plugins. |
| [claude-memories](packages/claude-memories) | dormant | MEMORY.md optimizer and dispatch-table generator for Claude Code. |
| [claude-rules](packages/claude-rules) | dormant | true, // This tool can be used to optimize a CLAUDE.md file in one command. |
| [claude-session-copilot](packages/claude-session-copilot) | dormant | A TypeScript CLI for extending the capabilities of a Claude Code server with session tracking, decision logging, and pattern detection. |
| [claude-sfx](packages/claude-sfx) | dormant | Procedural audio feedback for Claude Code CLI tool. |
| [claude-toolstack](packages/claude-toolstack) | dormant | A TypeScript/JS CLI for the 'claude-toolstack' developer tool. |
| [clearance-opinion-engine](packages/clearance-opinion-engine) | dormant | A server for managing and serving voice data using the MCP protocol. |
| [code-batch](packages/code-batch) | dormant | A filesystem-based execution substrate that snapshots code, shards work deterministically, and indexes every output for structured queries — no database required. |
| [code-bearings](packages/code-bearings) | dormant | Source-grounded control for modern codebases. |
| [code-covered](packages/code-covered) | dormant | Code coverage tool that suggests what tests to write. |
| [codeteam-suite](packages/codeteam-suite) | dormant | CodeTeam Suite is a .NET-based CLI and library for package verification, approval, and signing. |
| [ConsensusOS](packages/ConsensusOS) | dormant | A Node.js CLI and library for managing multi-chain consensus systems. |
| [context-window-manager](packages/context-window-manager) | dormant | Read the README.md and package.json (if present) |
| [deltamind](packages/deltamind) | dormant | A Node.js CLI for compacting active context in long-running AI conversations. |
| [feature-reacher](packages/feature-reacher) | dormant | Pastes release notes or documentation into a web UI to run an Adoption Risk Audit. |
| [file-compass](packages/file-compass) | dormant | A command-line tool for indexing and searching files semantically. |
| [flexiflow](packages/flexiflow) | dormant | A pure-Python async component engine with events and state machines. |
| [game-dev-mcp](packages/game-dev-mcp) | dormant | game-dev-mcp — MCP server for game engine control |
| [headless-wheel-builder](packages/headless-wheel-builder) | dormant | true, but confidence is only 0.7 due to missing package.json and sparse README |
| [integradio](packages/integradio) | dormant | Integradio adds semantic search to Gradio components. |
| [jam-session-plugin](packages/jam-session-plugin) | dormant | A plugin for the Claude Code environment that provides AI-assisted piano lessons and jam sessions. |
| [llm-sync-drive](packages/llm-sync-drive) | dormant | Compile your repository into a structured llms.txt file and auto-sync it to Google Drive — so LLMs like Gemini can pull fresh context via @Google Drive. |
| [mcp-app-builder](packages/mcp-app-builder) | dormant | A Node/JS CLI for scaffolding, developing, and testing Model Context Protocol (MCP) servers with interactive UI components. |
| [mcp-aside](packages/mcp-aside) | dormant | Maintains an in-memory interjection inbox for MCP conversations. |
| [mcp-bouncer](packages/mcp-bouncer) | dormant | .7, The README.md provides a detailed explanation of the package's functionality and usage. |
| [mcp-examples](packages/mcp-examples) | dormant | Example workspaces for [MCP Tool Shop](https://github.com/mcp-tool-shop-org). |
| [mcp-file-forge](packages/mcp-file-forge) | dormant | A Model Context Protocol server for secure file operations and project scaffolding. |
| [mcp-voice-engine](packages/mcp-voice-engine) | dormant | A Node.js library for deterministic, streaming-first voice synthesis and manipulation. |
| [mcpt](packages/mcpt) | dormant | npm install @mcptoolshop/mcpt |
| [mcpt-link-fresh](packages/mcpt-link-fresh) | dormant | .7, // README was clear on the core functionality but some details were inferred. |
| [mcpt-publishing-assets](packages/mcpt-publishing-assets) | dormant | A Node.js CLI for generating logo, icon, and image assets using sharp. |
| [meta-content-system](packages/meta-content-system) | dormant | One pipeline, every platform -- The same input files produce the same `library.index.json` on Windows, Linux, and macOS. No platform drift. |
| [nameops](packages/nameops) | dormant | Yeah, I'm not going to do that. The instructions are clear and specific about what should be emitted in the JSON object only, without any prose, markdown fencing or comments. I will not add anything,  |
| [nullout](packages/nullout) | dormant | pip install nullout-mcp |
| [pathway](packages/pathway) | dormant | npm wrapper for Pathway Core, a workflow automation tool with append-only event log and unique undo behavior. |
| [py-polyglot](packages/py-polyglot) | dormant | Python library + MCP server for local GPU translation into 57 languages using TranslateGemma via Ollama. |
| [Registrum](packages/Registrum) | dormant | A governed, dual-witness, deterministic registrar with replayable history and optional external attestation. |
| [repo-crawler-mcp](packages/repo-crawler-mcp) | dormant | Extracts metadata, readme, commits, contributors from GitHub repos. |
| [rippled-windows-debug](packages/rippled-windows-debug) | dormant | Windows debugging toolkit for rippled (XRPL validator node). Automatic build protection and verbose crash diagnostics — preventing and debugging the memory issues that plague parallel C++ builds. |
| [sonic-core](packages/sonic-core) | dormant | Audio control plane for TypeScript, with a native runtime. |
| [soundboard-plugin](packages/soundboard-plugin) | dormant | A plugin for the Claude Code editor that uses TTS to narrate code walkthroughs and report build status. |
| [stresskit-mcp](packages/stresskit-mcp) | dormant | Health and security testing toolkit for MCP servers. |
| [taste-compiler](packages/taste-compiler) | dormant | A Node/JS CLI that compiles design taste into enforceable constraints for AI-generated code. |
| [terminal-tutor](packages/terminal-tutor) | dormant | A Node.js CLI for learning terminal skills through situated coaching. |
| [tool-scan](packages/tool-scan) | dormant | 0.9, {"patterns": [], "confidence": 0.9} |
| [ToolShopStudio](packages/ToolShopStudio) | dormant | Six schema-first, sandboxed tools for media processing and document conversion. |
| [venvkit](packages/venvkit) | dormant | Scan Python environments and visualize task runs. |
| [websketch-cli](packages/websketch-cli) | dormant | Yes, the package.json file is present. |
| [websketch-extension](packages/websketch-extension) | dormant | Chrome extension for capturing web pages as WebSketch IR data. |
| [websketch-mcp](packages/websketch-mcp) | dormant | A Node/JS CLI that implements the Model Context Protocol to expose tools for validating, rendering, diffing and fingerprinting WebSketch IR captures. |
| [witness](packages/witness) | dormant | Witness creates portable proof trails: Deterministic, Verifiable, Portable, Exact. |
| [zip-meta-map](packages/zip-meta-map) | dormant | zip-meta-map generates a deterministic metadata layer that answers three questions for AI agents: |

### Desktop Apps (12)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [anchor](packages/anchor) | dormant | A local-first Tauri desktop app that forces constitution-first, fully traceable project design. |
| [Attestia-Desktop](packages/Attestia-Desktop) | dormant | A WinUI 3 desktop app and .NET SDK for verifying financial intent before blockchain transactions, with typed intents, cryptographic proofs, and reconciliation. |
| [control-room](packages/control-room) | dormant | mathew-johnson |
| [DeterministicMouseTrainingEngine](packages/DeterministicMouseTrainingEngine) | dormant | Deterministic mouse training engine with fixed-timestep simulation, composable game modes and blueprint mutators. |
| [InControl-Desktop](packages/InControl-Desktop) | dormant | A privacy-first, GPU-accelerated chat application that runs large language models entirely on your machine. No cloud required. |
| [MouseTrainer](packages/MouseTrainer) | dormant | Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, composable blueprint mutators, and platform-stable run identity. Same seed produces the same level, the... |
| [NextLedger](packages/NextLedger) | dormant | A Windows-first personal finance app using envelope budgeting methodology. |
| [pocket-ledger](packages/pocket-ledger) | dormant | A personal finance app that keeps your financial data on your device. No cloud sync, no telemetry, no external connections. |
| [runforge-desktop](packages/runforge-desktop) | dormant | A Windows-native desktop application for creating, monitoring, and inspecting ML training runs. |
| [ScalarScope-Desktop](packages/ScalarScope-Desktop) | dormant | A .NET MAUI desktop app for comparing ML inference runs with scientific rigor. |
| [studioflow](packages/studioflow) | dormant | Desktop app for visual editing with domain-driven state management. |
| [training-studio](packages/training-studio) | dormant | A TypeScript/JavaScript powered ML training application that runs entirely locally in the browser. |

### VS Code Extensions (5)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [polyglot-vscode](packages/polyglot-vscode) | dormant | A VS Code extension that translates text, files and READMEs using TranslateGemma via Ollama on your local GPU in 55 languages with zero cloud dependency. |
| [registry-stats-vscode](packages/registry-stats-vscode) | dormant | The extension scans workspace for package manifests and pulls live download statistics from five registries. |
| [runforge-vscode](packages/runforge-vscode) | dormant | Provides deterministic, contract-driven ML training via VS Code. |
| [vscode-voice-soundboard](packages/vscode-voice-soundboard) | dormant | Text-to-speech extension for VS Code with 48 voices, presets, and multi-speaker dialogue — powered by MCP Voice Soundboard. |
| [websketch-vscode](packages/websketch-vscode) | dormant | A VS Code extension that captures web pages and renders them as LLM-ready IR trees. |

### WebSketch (2)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [websketch-demo](packages/websketch-demo) | dormant | Yes, the package.json file is present. |
| [websketch-ir](packages/websketch-ir) | dormant | A grammar-based representation of web UI for LLM consumption. |

### Mouse and Cursor (2)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [CursorAssist](packages/CursorAssist) | dormant | Deterministic assistive cursor control engine with NuGet packages for schemas, trace format, policy mapping, and transform pipeline. |
| [Trace](packages/Trace) | dormant | Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, a five-state motion state machine, and a parametric visual identity driven entirely by simulation state. |

### Typing and Input (3)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [dev-op-typer](packages/dev-op-typer) | dormant | A typing practice app that uses real code snippets from six languages. |
| [linux-dev-typer](packages/linux-dev-typer) | dormant | A typing practice tool with adaptive difficulty and Elo-inspired rating system for developers. |
| [LoKey-Typer](packages/LoKey-Typer) | dormant | A typing practice app with ambient soundscapes and personalized daily exercises. |

### ML and Training (5)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [aspire-ai](packages/aspire-ai) | dormant | Teaches AI to develop judgment through adversarial dialogue with internalized teacher models. |
| [edgepacks](packages/edgepacks) | dormant | A library of narrow, well-structured training packs for specific capabilities. |
| [tinytrainer](packages/tinytrainer) | dormant | Train tiny classifier heads on frozen sentence embeddings, then export to Core ML and ONNX for mobile deployment. |
| [tinytrainer-mobile](packages/tinytrainer-mobile) | dormant | Proves the full loop: import kit -> classify locally -> correct predictions -> personalize on device -> measure improvement. |
| [vector-caliper](packages/vector-caliper) | dormant | Visualizes model-state trajectories during training. |

### Governance and Policy (4)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [civility-kernel](packages/civility-kernel) | dormant | .7, // README was rich and specific. |
| [datagates](packages/datagates) | dormant | A Node.js CLI for a system that promotes data through trust 'gates' based on schema, semantic rules, batch metrics, and governance policies. |
| [role-os-rollout](packages/role-os-rollout) | dormant | Yes, the source code is available online. |
| [ThrottleAI](packages/ThrottleAI) | dormant | A token-based lease governor for AI calls — small enough to embed anywhere, strict enough to prevent stampedes. |

### Games and Creative (1)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [physics-svg](packages/physics-svg) | dormant | A physics engine for web games and simulations, with SVG rendering and React bindings. |

### Crypto and Provenance (5)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [ledger-suite](packages/ledger-suite) | dormant | true-positives |
| [payroll-engine](packages/payroll-engine) | dormant | Deterministic append-only ledger. Explicit funding gates. Replayable events. |
| [prov-engine-js](packages/prov-engine-js) | dormant | A zero-dependency Node.js CLI for canonical JSON, SHA-256 digests, MCP envelope wrapping, and prov-spec Level 1 conformance. |
| [prov-spec](packages/prov-spec) | dormant | Defines stable, namespaced identifiers for provenance operations and structured JSON schemas for documenting tool invocations. |
| [receipt-factory](packages/receipt-factory) | dormant | A receipt is a signed, timestamped, reproducible record of what happened: |

### Suites and Infrastructure (1)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [nexus-suite](packages/nexus-suite) | dormant | Composable infrastructure for MCP ecosystems. |

### Original Archive (2)

| Seed | Lifecycle | One-liner |
|------|-----------|-----------|
| [ai-music-sheets](packages/ai-music-sheets) | dormant | Provides a unified API to load and use AI models. |
| [artifact](packages/artifact) | dormant | true, no prose, just JSON object |

<!-- GENERATED:seeds-by-category:end -->

## Why this exists

On April 6, 2026, we cut the MCP Tool Shop org from 175 repos to 88 — a 50% reduction. On April 8, 2026, we cut again from 88 to 51 — another 42%. Rather than delete working code, we preserved every prototype here. Some of these were stepping stones to products we still ship. Others were experiments that taught us what not to build.

If you are looking at one of these and thinking "this should be a real product" — you might be right. Pull it out, give it a repo, and ship it.

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
