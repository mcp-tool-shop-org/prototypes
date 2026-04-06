---
title: Profiles
description: 7 built-in project profiles, custom roles, and role classification.
sidebar:
  order: 3
---

Zip Meta Map auto-detects the project type from its file structure and assigns roles to every file.

## Built-in profiles

| Profile | Detected by | Custom Roles | Plans |
|---------|------------|--------------|-------|
| `python_cli` | `pyproject.toml`, `setup.py`, `setup.cfg` | — | overview, debug, add_feature, security_review, deep_dive |
| `node_ts_tool` | `package.json`, `tsconfig.json` | — | overview, debug, add_feature, security_review, deep_dive |
| `rust_cli` | `Cargo.toml` | `bench` | overview, debug, add_feature, security_review, deep_dive |
| `go_cli` | `go.mod` | `go_generate` | overview, debug, add_feature, security_review, deep_dive |
| `dotnet_cli` | `*.csproj`, `*.sln`, `Directory.Build.props` | `project_file`, `solution_file` | overview, debug, add_feature, security_review, deep_dive |
| `java_cli` | `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts` | `maven_config`, `gradle_config` | overview, debug, add_feature, security_review, deep_dive |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | — | overview, debug, add_feature, security_review, deep_dive |

Each profile defines traversal plans with byte budgets — so an AI agent knows how to navigate the codebase without reading everything.

Detection order: monorepo > Rust > Go > .NET > Java > Node/TS > Python (most specific markers first).

## Roles

Every file entry includes a **role** from a bounded vocabulary (entrypoint, config, doc, test, etc.), a **confidence** score (0.0–1.0), and a **reason** explaining the classification.

### Built-in roles

`entrypoint`, `public_api`, `source`, `internal`, `config`, `lockfile`, `ci`, `test`, `fixture`, `doc`, `doc_api`, `doc_architecture`, `schema`, `build`, `script`, `generated`, `vendor`, `asset`, `data`, `unknown`

### Custom roles

Profiles can define additional roles for domain-specific file types. Custom roles are defined with:
- **name** — lowercase identifier (e.g., `project_file`)
- **description** — what the role represents
- **patterns** — glob patterns to match (e.g., `*.csproj`)
- **confidence** — assignment confidence (default: 0.80)

Custom roles appear in the index output under `custom_roles` with their descriptions.

### Confidence bands

| Band | Range | Meaning |
|------|-------|---------|
| High | >= 0.9 | Strong structural signal (filename match, profile entrypoint) |
| Good | >= 0.7 | Pattern match (directory convention, extension + location) |
| Fair | >= 0.5 | Extension-only or weak positional signal |
| Low | < 0.5 | Assigned `unknown`; reason explains the ambiguity |

## Deterministic classification

Role assignment is purely rule-based — same input always produces the same output. No AI inference, no probabilistic models. This makes diffs meaningful and results reproducible across environments.
