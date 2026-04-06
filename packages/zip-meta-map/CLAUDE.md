# zip-meta-map

## What This Does

Turns a ZIP or folder into a guided, LLM-friendly metadata bundle.
Creates deterministic metadata layers answering:
- What's in here?
- What matters first?
- How do I navigate without drowning in context?

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| `build_metadata` | Generate metadata bundle from directory/ZIP |
| `explain` | Get guided navigation plan with start-here list |
| `diff_metadata` | Compare two metadata indices |
| `compare_repos` | Cross-repo archetype matching |
| `validate_index` | Validate index against schema |

## Architecture

- **Role Classification**: File inventory with confidence scoring
- **Start-Here Lists**: Ranked files with excerpts and context budgets
- **Traversal Plans**: Navigation strategies respecting byte/token budgets
- **Multi-Profile Support**: Different analysis for different project types

## Supported Project Profiles

- python_cli, node_ts_tool, rust_cli
- go_cli, dotnet_cli, java_cli
- monorepo

## Dependencies

- Python >= 3.11
- mcp >= 1.0.0

## Key Notes

- Deterministic output (same input = same metadata)
- Profiles customize what "matters first"
- Metadata stored in META_ZIP_FRONT.md and META_ZIP_INDEX.json
- Byte budget planning for context window optimization
