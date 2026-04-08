<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

Task-dataset foundry for training small models on narrow jobs.

## What this is

A library of narrow, well-structured, license-clean training packs for specific capabilities. Each pack includes generation rules, validation rules, eval sets, and export paths for common fine-tuning stacks.

## What this is NOT

- A generic dataset zoo
- A HuggingFace wrapper
- A training framework

## Install

```bash
pip install edgepacks
```

## Quick start

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## Launch packs

| Pack | Task | What it trains |
|------|------|---------------|
| `tool-routing` | Classification | NL request → correct tool + args |
| `structured-extraction` | Extraction | Messy text → structured JSON |
| `error-triage` | Classification | Error logs → cause + severity + next step |

## Architecture

Three layers:

1. **Schema** — formal spec for what a dataset pack IS
2. **Foundry** — machinery that creates, validates, and splits packs
3. **Delivery** — CLI + export to JSONL, HuggingFace, Unsloth, torchtune

## Each pack includes

- Task definition + canonical schema
- Train / val / test splits
- Positive and hard-negative examples
- Generation recipe (synthetic via Ollama)
- Validator that rejects malformed or low-signal rows
- Eval set that tests the actual skill after fine-tuning
- Export to formats that plug directly into common tooling

## Security and Trust

**Data touched:** Local `.json` / `.jsonl` files in user-specified output directories. Seed examples are bundled in the package. Generated examples are written to `./output/` or a path you specify.

**Network:** HTTP to local Ollama only (`localhost:11434`) for synthetic generation. No cloud APIs, no telemetry, no analytics. Runs fully offline once Ollama is available.

**Data NOT touched:** No credential files, no system files, no environment variables. Does not read or write outside the output directory you specify.

**No telemetry** is collected or sent.

## Platforms

- Python 3.11+
- Works on Linux, macOS, Windows
- Ollama required only for `generate`, `mutate`, and `build` commands

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
