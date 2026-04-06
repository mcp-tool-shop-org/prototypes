<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## What it does

zip-meta-map generates a deterministic metadata layer that answers three questions for AI agents:

- **What's in here?** — role-classified file inventory with confidence scores
- **What matters first?** — ranked start\_here list with excerpts
- **How do I navigate without drowning in context?** — traversal plans with byte budgets

## Quick demo

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

See the [golden demo output](examples/tiny_python_cli/) for a complete example.

## Install

```bash
pip install zip-meta-map
```

Or with [pipx](https://pipx.pypa.io/):

```bash
pipx install zip-meta-map
```

From source:

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## GitHub Action

Use zip-meta-map in CI with the composite action:

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v1
  with:
    path: .
```

This installs the tool, builds metadata, and writes a step summary. Outputs include `index-path`, `front-path`, `profile`, `file-count`, and `warnings-count`. Set `pr-comment: 'true'` to post the summary as a PR comment.

See [examples/github-action/](examples/github-action/) for a full workflow.

## What it generates

| File | Purpose |
|------|---------|
| `META_ZIP_FRONT.md` | Human-readable orientation page |
| `META_ZIP_INDEX.json` | Machine-readable index (roles, confidence, plans, chunks, excerpts, risk flags) |
| `META_ZIP_REPORT.md` | Detailed browseable report (with `--report md`) |

## CLI reference

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Cross-repo comparison (archetype matching)
zip-meta-map compare repo-a.json repo-b.json         # similarity scores
zip-meta-map compare repo-a.json repo-b.json --json   # JSON output

# Performance benchmarks
zip-meta-map benchmark path/to/repo --runs 3
zip-meta-map benchmark path/to/repo --cache --json

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Start the MCP server (requires pip install 'zip-meta-map[mcp]')
zip-meta-map serve

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## Profiles

Auto-detected by repo shape. Current built-ins:

| Profile | Detected by | Plans |
|---------|------------|-------|
| `python_cli` | `pyproject.toml`, `setup.py`, `setup.cfg` | overview, debug, add\_feature, security\_review, deep\_dive |
| `node_ts_tool` | `package.json`, `tsconfig.json` | overview, debug, add\_feature, security\_review, deep\_dive |
| `rust_cli` | `Cargo.toml` | overview, debug, add\_feature, security\_review, deep\_dive |
| `go_cli` | `go.mod` | overview, debug, add\_feature, security\_review, deep\_dive |
| `dotnet_cli` | `*.csproj`, `*.sln`, `Directory.Build.props` | overview, debug, add\_feature, security\_review, deep\_dive |
| `java_cli` | `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts` | overview, debug, add\_feature, security\_review, deep\_dive |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | overview, debug, add\_feature, security\_review, deep\_dive |

Profiles can also define **custom roles** — project-type-specific file classifications beyond the built-in vocabulary. For example, the `dotnet_cli` profile adds `project_file` and `solution_file` roles.

See [docs/PROFILES.md](docs/PROFILES.md).

## Roles and confidence

Every file entry includes a **role** (bounded vocabulary), **confidence** (0.0–1.0), and **reason**.

| Band | Range | Meaning |
|------|-------|---------|
| High | >= 0.9 | Strong structural signal (filename match, profile entrypoint) |
| Good | >= 0.7 | Pattern match (directory convention, extension + location) |
| Fair | >= 0.5 | Extension-only or weak positional signal |
| Low  | < 0.5 | Assigned `unknown`; reason explains the ambiguity |

## Progressive disclosure (v0.2+)

- **Chunk maps** for files > 32 KB — stable IDs, line ranges, headings
- **Module summaries** — directory-level role distribution and key files
- **Excerpts** — first few lines of high-value files
- **Risk flags** — exec\_shell, secrets\_like, network\_io, path\_traversal, binary\_masquerade, binary\_executable
- **Capabilities** — `capabilities[]` advertises which optional features are populated
- **Custom roles** — profiles can define domain-specific roles with glob patterns and confidence scores
- **Cross-repo comparison** — cosine similarity on role distributions, archetype matching (near\_identical / same\_archetype / related / different)

## MCP server (v1.1)

Expose zip-meta-map as MCP tools for AI agents:

```bash
pip install 'zip-meta-map[mcp]'
zip-meta-map serve
```

Provides 5 tools: `build_metadata`, `explain`, `diff_metadata`, `compare_repos`, `validate_index`.

## Stability

- Spec version follows semver-like rules: minor bumps add fields, major bumps break consumers
- `capabilities[]` is the official feature negotiation mechanism
- Older consumers that ignore unknown fields will continue to work across minor bumps
- See [docs/SPEC.md](docs/SPEC.md) for the full contract

## Repo structure

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, compare, benchmark, validate, serve)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  compare.py    # cross-repo archetype comparison
  benchmark.py  # performance benchmarking
  server.py     # MCP server (optional dependency)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning (sequential + parallel)
  roles.py      # role assignment heuristics + confidence + custom roles
  profiles.py   # 7 built-in profiles + custom role definitions
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # 7 tiny fixture repos (Python, Node, monorepo, Rust, Go, .NET, Java)
```

## Contributing

This project is small on purpose. If you contribute:

- keep heuristics deterministic
- keep roles bounded, push nuance into tags
- add tests for any new heuristic
- don't loosen schemas without updating docs/SPEC.md and goldens

```bash
pytest
```

## Documentation

- [Specification (v0.2)](docs/SPEC.md) — the contract for all generated files
- [Profiles](docs/PROFILES.md) — built-in project type profiles
- [Security](SECURITY.md) — vulnerability reporting

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | ZIP archives and directories (read-only), metadata output files (JSON/Markdown) |
| **Data NOT touched** | No telemetry, no analytics, no network calls, no code execution from archives |
| **Permissions** | Read: input files/archives. Write: output metadata files to user-specified paths |
| **Network** | None — fully offline CLI tool |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security features.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
