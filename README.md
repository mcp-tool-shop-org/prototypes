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

_104 seeds across 13 categories — all currently `dormant` — generated 2026-04-20_

### Voice and Sound (6)

| Seed | One-liner |
|------|-----------|
| [mcp-tool-registry](packages/mcp-tool-registry) | A CLI for generating high-quality voice synthesis from text. |
| [sonic-runtime](packages/sonic-runtime) | NativeAOT-compatible C# audio engine with playback, device routing, and synthesis over ndjson-stdio. |
| [soundboard-maui](packages/soundboard-maui) | A .NET MAUI desktop client for the Sound Board voice engine. |
| [soundweave](packages/soundweave) | Adaptive soundtrack studio for composing, arranging, scoring, and exporting interactive game music. |
| [vocal-synth-engine](packages/vocal-synth-engine) | Web UI for a TTS voice synthesis engine |
| [voice-soundboard](packages/voice-soundboard) | Just call engine.speak("Hello") and get audio. |

### Developer Tools (56)

| Seed | One-liner |
|------|-----------|
| [ai-ui](packages/ai-ui) | Yes, the package has a bin entry and can be run directly. |
| [brain-dev](packages/brain-dev) | Provides 9 MCP Tools for developer insights: coverage analysis, test generation, refactoring suggestions, security audits, and UX insights. |
| [build-governor](packages/build-governor) | A lightweight governor that automatically sits between your build system and the compiler to prevent parallel C++ builds from exhausting system memory. |
| [claude-collaborate](packages/claude-collaborate) | A unified sandbox environment for human-AI collaboration with WebSocket bridge. |
| [claude-hook-debug](packages/claude-hook-debug) | Diagnostic CLI for detecting issues in Claude Code hooks and plugins. |
| [claude-memories](packages/claude-memories) | MEMORY.md optimizer and dispatch-table generator for Claude Code. |
| [claude-rules](packages/claude-rules) | A dispatch table generator and instruction-file optimizer for Claude Code that splits bloated CLAUDE.md files into a tiny routing index and topic-specific rule files. |
| [claude-session-copilot](packages/claude-session-copilot) | A TypeScript CLI for extending the capabilities of a Claude Code server with session tracking, decision logging, and pattern detection. |
| [claude-sfx](packages/claude-sfx) | Procedural audio feedback for Claude Code CLI tool. |
| [claude-toolstack](packages/claude-toolstack) | A zero-dependency Python CLI that wraps all endpoints of a Docker + Claude Code workstation config for 64-GB Linux hosts. |
| [clearance-opinion-engine](packages/clearance-opinion-engine) | A server for managing and serving voice data using the MCP protocol. |
| [code-batch](packages/code-batch) | A filesystem-based execution substrate that snapshots code, shards work deterministically, and indexes every output for structured queries — no database required. |
| [code-bearings](packages/code-bearings) | Source-grounded control for modern codebases. |
| [code-covered](packages/code-covered) | Code coverage tool that suggests what tests to write. |
| [codeteam-suite](packages/codeteam-suite) | A .NET-based CLI and library for authoritative cryptographic verification of software packages. |
| [ConsensusOS](packages/ConsensusOS) | A Node.js CLI and library for managing multi-chain consensus systems. |
| [context-window-manager](packages/context-window-manager) | An MCP server that freezes and restores LLM session contexts with zero information loss using KV cache persistence |
| [deltamind](packages/deltamind) | A Node.js CLI for compacting active context in long-running AI conversations. |
| [feature-reacher](packages/feature-reacher) | Pastes release notes or documentation into a web UI to run an Adoption Risk Audit. |
| [file-compass](packages/file-compass) | A command-line tool for indexing and searching files semantically. |
| [flexiflow](packages/flexiflow) | A pure-Python async component engine with events and state machines. |
| [game-dev-mcp](packages/game-dev-mcp) | game-dev-mcp — MCP server for game engine control |
| [headless-wheel-builder](packages/headless-wheel-builder) | A universal Python wheel builder with CI/CD pipeline automation and GitHub operations for release management. |
| [integradio](packages/integradio) | Integradio adds semantic search to Gradio components. |
| [jam-session-plugin](packages/jam-session-plugin) | A plugin for the Claude Code environment that provides AI-assisted piano lessons and jam sessions. |
| [llm-sync-drive](packages/llm-sync-drive) | Compile your repository into a structured llms.txt file and auto-sync it to Google Drive — so LLMs like Gemini can pull fresh context via @Google Drive. |
| [mcp-app-builder](packages/mcp-app-builder) | A Node/JS CLI for scaffolding, developing, and testing Model Context Protocol (MCP) servers with interactive UI components. |
| [mcp-aside](packages/mcp-aside) | Maintains an in-memory interjection inbox for MCP conversations. |
| [mcp-bouncer](packages/mcp-bouncer) | .7, The README.md provides a detailed explanation of the package's functionality and usage. |
| [mcp-examples](packages/mcp-examples) | Example workspaces for [MCP Tool Shop](https://github.com/mcp-tool-shop-org). |
| [mcp-file-forge](packages/mcp-file-forge) | A Model Context Protocol server for secure file operations and project scaffolding. |
| [mcp-voice-engine](packages/mcp-voice-engine) | A Node.js library for deterministic, streaming-first voice synthesis and manipulation. |
| [mcpt](packages/mcpt) | npm install @mcptoolshop/mcpt |
| [mcpt-link-fresh](packages/mcpt-link-fresh) | .7, // README was clear on the core functionality but some details were inferred. |
| [mcpt-publishing-assets](packages/mcpt-publishing-assets) | A Node.js CLI for generating logo, icon, and image assets using sharp. |
| [meta-content-system](packages/meta-content-system) | One pipeline, every platform -- The same input files produce the same `library.index.json` on Windows, Linux, and macOS. No platform drift. |
| [nameops](packages/nameops) | Yeah, I'm not going to do that. The instructions are clear and specific about what should be emitted in the JSON object only, without any prose, markdown fencing or comments. I will not add anything,  |
| [nullout](packages/nullout) | MCP server that finds and safely removes hazardous files on Windows using a scan-plan-delete workflow. |
| [pathway](packages/pathway) | npm wrapper for Pathway Core, a workflow automation tool with append-only event log and unique undo behavior. |
| [py-polyglot](packages/py-polyglot) | Python library + MCP server for local GPU translation into 57 languages using TranslateGemma via Ollama. |
| [Registrum](packages/Registrum) | A governed, dual-witness, deterministic registrar with replayable history and optional external attestation. |
| [repo-crawler-mcp](packages/repo-crawler-mcp) | Extracts metadata, readme, commits, contributors from GitHub repos. |
| [rippled-windows-debug](packages/rippled-windows-debug) | Windows debugging toolkit for rippled (XRPL validator node). Automatic build protection and verbose crash diagnostics — preventing and debugging the memory issues that plague parallel C++ builds. |
| [sonic-core](packages/sonic-core) | Audio control plane for TypeScript, with a native runtime. |
| [soundboard-plugin](packages/soundboard-plugin) | A plugin for the Claude Code editor that uses TTS to narrate code walkthroughs and report build status. |
| [stresskit-mcp](packages/stresskit-mcp) | Health and security testing toolkit for MCP servers. |
| [taste-compiler](packages/taste-compiler) | A Node/JS CLI that compiles design taste into enforceable constraints for AI-generated code. |
| [terminal-tutor](packages/terminal-tutor) | A Node.js CLI for learning terminal skills through situated coaching. |
| [tool-scan](packages/tool-scan) | 0.9, {"patterns": [], "confidence": 0.9} |
| [ToolShopStudio](packages/ToolShopStudio) | Six schema-first, sandboxed tools for media processing and document conversion. |
| [venvkit](packages/venvkit) | Scan Python environments and visualize task runs. |
| [websketch-cli](packages/websketch-cli) | Yes, the package.json file is present. |
| [websketch-extension](packages/websketch-extension) | Chrome extension for capturing web pages as WebSketch IR data. |
| [websketch-mcp](packages/websketch-mcp) | A Node/JS CLI that implements the Model Context Protocol to expose tools for validating, rendering, diffing and fingerprinting WebSketch IR captures. |
| [witness](packages/witness) | Witness creates portable proof trails: Deterministic, Verifiable, Portable, Exact. |
| [zip-meta-map](packages/zip-meta-map) | zip-meta-map generates a deterministic metadata layer that answers three questions for AI agents: |

### Desktop Apps (12)

| Seed | One-liner |
|------|-----------|
| [anchor](packages/anchor) | A local-first Tauri desktop app that forces constitution-first, fully traceable project design. |
| [Attestia-Desktop](packages/Attestia-Desktop) | A WinUI 3 desktop app and .NET SDK for verifying financial intent before blockchain transactions, with typed intents, cryptographic proofs, and reconciliation. |
| [control-room](packages/control-room) | A local-first desktop app for managing scripts, multi-step workflows, and automated operations with full observability, alerting, and self-healing. |
| [DeterministicMouseTrainingEngine](packages/DeterministicMouseTrainingEngine) | Deterministic mouse training engine with fixed-timestep simulation, composable game modes and blueprint mutators. |
| [InControl-Desktop](packages/InControl-Desktop) | A privacy-first, GPU-accelerated chat application that runs large language models entirely on your machine. No cloud required. |
| [MouseTrainer](packages/MouseTrainer) | Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, composable blueprint mutators, and platform-stable run identity. Same seed produces the same level, the... |
| [NextLedger](packages/NextLedger) | A Windows-first personal finance app using envelope budgeting methodology. |
| [pocket-ledger](packages/pocket-ledger) | A personal finance app that keeps your financial data on your device. No cloud sync, no telemetry, no external connections. |
| [runforge-desktop](packages/runforge-desktop) | A Windows-native desktop application for creating, monitoring, and inspecting ML training runs. |
| [ScalarScope-Desktop](packages/ScalarScope-Desktop) | A .NET MAUI desktop app for comparing ML inference runs with scientific rigor. |
| [studioflow](packages/studioflow) | Desktop app for visual editing with domain-driven state management. |
| [training-studio](packages/training-studio) | A TypeScript/JavaScript powered ML training application that runs entirely locally in the browser. |

### VS Code Extensions (5)

| Seed | One-liner |
|------|-----------|
| [polyglot-vscode](packages/polyglot-vscode) | A VS Code extension that translates text, files and READMEs using TranslateGemma via Ollama on your local GPU in 55 languages with zero cloud dependency. |
| [registry-stats-vscode](packages/registry-stats-vscode) | The extension scans workspace for package manifests and pulls live download statistics from five registries. |
| [runforge-vscode](packages/runforge-vscode) | Provides deterministic, contract-driven ML training via VS Code. |
| [vscode-voice-soundboard](packages/vscode-voice-soundboard) | Text-to-speech extension for VS Code with 48 voices, presets, and multi-speaker dialogue — powered by MCP Voice Soundboard. |
| [websketch-vscode](packages/websketch-vscode) | A VS Code extension that captures web pages and renders them as LLM-ready IR trees. |

### WebSketch (2)

| Seed | One-liner |
|------|-----------|
| [websketch-demo](packages/websketch-demo) | Yes, the package.json file is present. |
| [websketch-ir](packages/websketch-ir) | A grammar-based representation of web UI for LLM consumption. |

### Mouse and Cursor (2)

| Seed | One-liner |
|------|-----------|
| [CursorAssist](packages/CursorAssist) | Deterministic assistive cursor control engine with NuGet packages for schemas, trace format, policy mapping, and transform pipeline. |
| [Trace](packages/Trace) | Built on .NET 10 MAUI (Windows-first), with a fully deterministic fixed-timestep simulation, a five-state motion state machine, and a parametric visual identity driven entirely by simulation state. |

### Typing and Input (3)

| Seed | One-liner |
|------|-----------|
| [dev-op-typer](packages/dev-op-typer) | A typing practice app that uses real code snippets from six languages. |
| [linux-dev-typer](packages/linux-dev-typer) | A typing practice tool with adaptive difficulty and Elo-inspired rating system for developers. |
| [LoKey-Typer](packages/LoKey-Typer) | A typing practice app with ambient soundscapes and personalized daily exercises. |

### ML and Training (5)

| Seed | One-liner |
|------|-----------|
| [aspire-ai](packages/aspire-ai) | Teaches AI to develop judgment through adversarial dialogue with internalized teacher models. |
| [edgepacks](packages/edgepacks) | A library of narrow, well-structured training packs for specific capabilities. |
| [tinytrainer](packages/tinytrainer) | Train tiny classifier heads on frozen sentence embeddings, then export to Core ML and ONNX for mobile deployment. |
| [tinytrainer-mobile](packages/tinytrainer-mobile) | Proves the full loop: import kit -> classify locally -> correct predictions -> personalize on device -> measure improvement. |
| [vector-caliper](packages/vector-caliper) | Visualizes model-state trajectories during training. |

### Governance and Policy (4)

| Seed | One-liner |
|------|-----------|
| [civility-kernel](packages/civility-kernel) | .7, // README was rich and specific. |
| [datagates](packages/datagates) | A Node.js CLI for a system that promotes data through trust 'gates' based on schema, semantic rules, batch metrics, and governance policies. |
| [role-os-rollout](packages/role-os-rollout) | Yes, the source code is available online. |
| [ThrottleAI](packages/ThrottleAI) | A token-based lease governor for AI calls — small enough to embed anywhere, strict enough to prevent stampedes. |

### Games and Creative (1)

| Seed | One-liner |
|------|-----------|
| [physics-svg](packages/physics-svg) | A physics engine for web games and simulations, with SVG rendering and React bindings. |

### Crypto and Provenance (5)

| Seed | One-liner |
|------|-----------|
| [ledger-suite](packages/ledger-suite) | A unified monorepo for cryptographic provenance ledgers — ClaimLedger and CreatorLedger. |
| [payroll-engine](packages/payroll-engine) | Deterministic append-only ledger. Explicit funding gates. Replayable events. |
| [prov-engine-js](packages/prov-engine-js) | A zero-dependency Node.js CLI for canonical JSON, SHA-256 digests, MCP envelope wrapping, and prov-spec Level 1 conformance. |
| [prov-spec](packages/prov-spec) | Defines stable, namespaced identifiers for provenance operations and structured JSON schemas for documenting tool invocations. |
| [receipt-factory](packages/receipt-factory) | A receipt is a signed, timestamped, reproducible record of what happened: |

### Suites and Infrastructure (1)

| Seed | One-liner |
|------|-----------|
| [nexus-suite](packages/nexus-suite) | Composable infrastructure for MCP ecosystems. |

### Original Archive (2)

| Seed | One-liner |
|------|-----------|
| [ai-music-sheets](packages/ai-music-sheets) | Provides a unified API to load and use AI models. |
| [artifact](packages/artifact) | Repo signature artifact decision system — checklist tree + Ollama-powered Curator freshness driver |

<!-- GENERATED:seeds-by-category:end -->

## Why this exists

On April 6, 2026, we cut the MCP Tool Shop org from 175 repos to 88 — a 50% reduction. On April 8, 2026, we cut again from 88 to 51 — another 42%. Rather than delete working code, we preserved every prototype here. Some of these were stepping stones to products we still ship. Others were experiments that taught us what not to build.

If you are looking at one of these and thinking "this should be a real product" — you might be right. Pull it out, give it a repo, and ship it.

## License

MIT — see [LICENSE](LICENSE) for details.

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
