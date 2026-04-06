---
title: For Beginners
description: New to Zip Meta Map? Start here for a gentle introduction.
sidebar:
  order: 99
---

New to Zip Meta Map? This guide walks through every core concept and gets you productive in minutes.

## What is this tool?

When you open an unfamiliar codebase, the first question is always: where do I start reading? Zip Meta Map answers that question automatically. Point it at any project folder or ZIP archive and it produces a metadata bundle that describes every file's purpose, ranks the most important files to read first, and gives you navigation plans with byte budgets so you (or an AI agent) know exactly how to explore the code without getting lost.

The output is deterministic (same input always produces the same metadata), fully offline (no network calls), and collects no telemetry.

## Who is this for?

- **AI agent developers** who need their agents to understand new codebases quickly without reading every file.
- **Developer tool builders** who want structured, machine-readable project maps for code analysis, onboarding tools, or IDE extensions.
- **Anyone onboarding onto unfamiliar code** who wants a ranked reading list and navigation plan instead of guessing where to start.

You do not need AI experience to use Zip Meta Map. It works as a standalone CLI for humans and as an MCP server for AI agents.

## Prerequisites

- **Python 3.11 or later** -- check with `python --version`
- **pip** -- the standard Python package installer (bundled with Python)
- **Basic terminal skills** -- you will run commands in a terminal (Command Prompt, PowerShell, Bash, or similar)

No accounts, API keys, or cloud services are needed. Zip Meta Map is a pure-Python CLI with a single runtime dependency (`jsonschema`).

## Your First 5 Minutes

### Step 1: Install

```bash
pip install zip-meta-map
```

Verify it worked:

```bash
zip-meta-map --version
```

### Step 2: Pick a project and run explain

Choose any project folder on your machine and run:

```bash
zip-meta-map explain my-project/
```

This prints the detected profile, a ranked list of files to read first (with confidence scores), and a navigation plan with byte budgets. Nothing is written to disk.

### Step 3: Build the full metadata bundle

```bash
zip-meta-map build my-project/ -o output/
```

Two files appear in `output/`:

| File | What it is |
|------|-----------|
| `META_ZIP_FRONT.md` | Human-readable orientation page with summary, start-here list, and traversal plans |
| `META_ZIP_INDEX.json` | Machine-readable index with roles, confidence scores, chunks, excerpts, and risk flags |

### Step 4: Read the results

Open `output/META_ZIP_FRONT.md` in any text editor for a quick overview. Open `output/META_ZIP_INDEX.json` to see the full structured data. Key fields:

- `profile` -- detected project type (e.g. `python_cli`, `node_ts_tool`)
- `start_here` -- ordered list of the most important files
- `files[]` -- every file with its `role`, `confidence`, and `reason`
- `plans` -- navigation strategies with byte budgets

### Step 5: Try it on a ZIP

Zip Meta Map works on ZIP archives without extracting them first:

```bash
zip-meta-map build archive.zip -o output/
```

## Common Mistakes

1. **Forgetting the `-o` flag.** Without `-o`, the build command prints to stdout instead of writing files. If you want files on disk, always pass `-o output/`.

2. **Running on a `node_modules` or `venv` directory.** The tool ignores common dependency directories by default, but pointing it directly at `node_modules/` will produce unhelpful results. Point it at the project root instead.

3. **Expecting AI-powered classification.** Role assignment is purely rule-based (filename patterns, directory conventions, profile markers). It is deterministic and reproducible, not probabilistic. If a file is classified wrong, use `-p` to force the correct profile or add a `META_ZIP_POLICY.json` for custom overrides.

4. **Not installing the MCP extra for agent use.** The base install does not include the MCP server. If you want to expose tools to AI agents, install with `pip install 'zip-meta-map[mcp]'` and then run `zip-meta-map serve`.

5. **Confusing `diff` and `compare`.** The `diff` command compares two indices from the *same* repo over time (detecting structural changes). The `compare` command compares indices from *different* repos (archetype matching and similarity scores).

## Next Steps

- [Getting Started](/zip-meta-map/handbook/getting-started/) -- deeper walkthrough with MCP server and GitHub Action setup
- [CLI Reference](/zip-meta-map/handbook/cli-reference/) -- every command, flag, and output format
- [Profiles](/zip-meta-map/handbook/profiles/) -- how auto-detection works and how to define custom roles
- [Progressive Disclosure](/zip-meta-map/handbook/progressive-disclosure/) -- chunk maps, excerpts, risk flags, and cross-repo comparison

## Glossary

| Term | Definition |
|------|-----------|
| **Profile** | A project type template (e.g. `python_cli`, `rust_cli`) that controls which files are treated as entrypoints, what gets ignored, and which traversal plans are available. Auto-detected from marker files like `pyproject.toml` or `Cargo.toml`. |
| **Role** | A classification label assigned to each file from a bounded vocabulary (e.g. `entrypoint`, `config`, `test`, `doc`, `unknown`). Each assignment includes a confidence score and a reason. |
| **Confidence** | A score from 0.0 to 1.0 indicating how certain the tool is about a file's role. Scores above 0.9 come from strong structural signals; below 0.5 means the file was assigned `unknown`. |
| **Traversal plan** | A named sequence of reading steps with a byte budget. Each profile provides 5 plans: `overview`, `debug`, `add_feature`, `security_review`, and `deep_dive`. |
| **Byte budget** | The maximum number of bytes a traversal plan recommends reading. Helps AI agents stay within context window limits. |
| **Start-here list** | The ranked list of files an agent or human should read first for a given project. Found in `start_here` in the JSON index and at the top of `META_ZIP_FRONT.md`. |
| **Chunk map** | For files larger than 32 KB, a breakdown into sections with stable IDs and line ranges so agents can request specific parts instead of reading the whole file. |
| **Risk flag** | An automatic detection of potentially dangerous patterns in source files: `exec_shell`, `secrets_like`, `network_io`, `path_traversal`, `binary_masquerade`, `binary_executable`. |
| **MCP server** | A Model Context Protocol server that exposes Zip Meta Map's functionality as tools for AI agents. Installed with `pip install 'zip-meta-map[mcp]'`. |
| **META_ZIP_POLICY.json** | An optional configuration file that lets you customize ignore patterns, role overrides, and plan byte budgets for a specific project. |
