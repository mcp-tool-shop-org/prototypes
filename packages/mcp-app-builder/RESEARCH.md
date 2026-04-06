# MCP App Builder - Research & Vision

## Executive Summary

**MCP App Builder** is a VS Code extension that enables developers to rapidly create MCP (Model Context Protocol) servers with interactive UI components using the new MCP Apps standard.

---

## Market Research (February 2026)

### MCP Ecosystem State

The Model Context Protocol has evolved significantly since Anthropic's November 2024 launch:

1. **Governance Transfer** - December 2025: Anthropic donated MCP to the Agentic AI Foundation (AAIF) under the Linux Foundation, co-founded with Block and OpenAI
2. **MCP Apps Launch** - January 2026: First official MCP extension enabling interactive UI components (dashboards, forms, visualizations, multi-step workflows)
3. **Streamable HTTP** - March 2025: Scalable bi-directional model supporting cloud deployment (AWS Lambda, etc.)
4. **Elicitation** - June 2025: Servers can define structured context schemas

### Key Statistics

- **40%** of enterprise apps predicted to include AI agents by end of 2026 (Gartner)
- **98%+ token savings** reported with Code Mode (Cloudflare)
- Major adopters: Replit, Sourcegraph, Claude, ChatGPT, VS Code

### Security Considerations (April 2025 Research)

- Prompt injection vulnerabilities
- Tool permission escalation risks
- Lookalike tool substitution attacks

---

## Target Environment

### Hardware Profile (Per CLAUDE.md)

| Component | Specification |
|-----------|---------------|
| GPU | RTX 5080 (16GB GDDR7 VRAM) |
| Architecture | Blackwell (SM 12.0) |
| Tensor Cores | 5th Generation |

### Performance Expectations

- **132 tokens/sec** on LLaMA 3 8B Q4_K_M
- **70 tokens/sec** on Deepseek-r1:14b (16k context)
- Optimal for 7B-24B models with quantization

### Local Tooling Stack

- **LM Studio** - CUDA 12.8 compatible, OpenAI-compatible API
- **Ollama** - Simple local LLM hosting
- **ChatRTX** - NVIDIA RAG demo with TensorRT-LLM

---

## Competitive Analysis

### Existing VS Code AI Extensions (2026)

| Extension | Strength | Gap |
|-----------|----------|-----|
| Roo Code | PR reviews, remote tasks | No MCP server creation |
| Claude Code | Deep codebase understanding | Consumer, not creator |
| GitHub Copilot | Inline completions, agent automation | General purpose |
| Tabnine | Privacy, on-prem | No MCP focus |
| Windsurf | Agentic flow | IDE replacement, not extension |

### Opportunity

**No existing tool helps developers BUILD MCP servers with the new MCP Apps UI components.**

---

## Product Vision

### Core Value Proposition

> Scaffold, develop, test, and publish MCP servers with interactive UI components - all from VS Code.

### Phase 1 Focus: Deterministic Foundation

Build the reliable, predictable layers:

1. **Project Scaffolding** - Templates for MCP server types
2. **Schema Validation** - JSON Schema for tool definitions
3. **Type Generation** - TypeScript types from schemas
4. **UI Component Library** - Pre-built MCP App components
5. **Local Testing Harness** - Simulate MCP client interactions

### Future Phases

- Phase 2: AI-assisted tool generation
- Phase 3: One-click publishing to MCP registries
- Phase 4: Visual UI builder

---

## Technical Architecture

### Stack Choices

```
┌─────────────────────────────────────────────┐
│              VS Code Extension              │
├─────────────────────────────────────────────┤
│  UI Layer: Webview (React + Tailwind)       │
├─────────────────────────────────────────────┤
│  Core Logic: TypeScript                     │
├─────────────────────────────────────────────┤
│  MCP SDK: @modelcontextprotocol/sdk         │
├─────────────────────────────────────────────┤
│  Schema: JSON Schema + Zod                  │
├─────────────────────────────────────────────┤
│  Testing: Vitest + MCP Test Client          │
└─────────────────────────────────────────────┘
```

### File Structure (Target)

```
mcp-app-builder/
├── src/
│   ├── extension.ts          # Entry point
│   ├── commands/             # VS Code commands
│   ├── providers/            # Tree views, webviews
│   ├── scaffolding/          # Project templates
│   ├── validation/           # Schema validation
│   ├── testing/              # Test harness
│   └── ui-components/        # MCP App components
├── templates/                # MCP server templates
├── schemas/                  # JSON Schemas
├── webview/                  # React UI
└── test/                     # Extension tests
```

---

## UX Principles

### Developer Experience First

1. **Zero-config start** - `Cmd+Shift+P` → "MCP: New Server" → working server
2. **Inline validation** - Errors shown as you type, not at build time
3. **Live preview** - See UI components render as you define them
4. **One-click test** - Run MCP client simulation without leaving VS Code

### Accessibility

- Full keyboard navigation
- Screen reader compatible
- High contrast theme support
- Reduced motion option

---

## Success Metrics (Phase 1)

| Metric | Target |
|--------|--------|
| Time to first working server | < 2 minutes |
| Schema validation accuracy | 100% |
| Test coverage | > 80% |
| Extension activation time | < 500ms |

---

## Sources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Apps Announcement](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [Anthropic MCP Introduction](https://www.anthropic.com/news/model-context-protocol)
- [LM Studio CUDA 12.8 Update](https://blogs.nvidia.com/blog/rtx-ai-garage-lmstudio-llamacpp-blackwell/)
- [RTX 5080 AI Benchmarks](https://www.microcenter.com/site/mc-news/article/benchmarking-ai-on-nvidia-5080.aspx)
- [Best VS Code Extensions 2026](https://www.builder.io/blog/best-vs-code-extensions-2026)

---

## Next Steps

Phase 1 commits will establish:
1. Repository structure and tooling
2. VS Code extension scaffold
3. MCP SDK integration
4. Schema system
5. Basic scaffolding commands
6. Type generation
7. UI component primitives
8. Test harness foundation
9. Webview infrastructure
10. Integration and documentation
