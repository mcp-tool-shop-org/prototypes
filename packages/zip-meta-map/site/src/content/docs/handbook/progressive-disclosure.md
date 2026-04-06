---
title: Progressive Disclosure
description: Chunk maps, modules, excerpts, and risk flags.
sidebar:
  order: 4
---

Zip Meta Map goes beyond simple file listings with progressive disclosure features that help AI agents navigate large codebases efficiently.

## Chunk maps

Files larger than 32 KB are split into chunks with stable IDs, line ranges, and headings. This lets an agent request specific sections instead of reading entire files.

## Module summaries

Directory-level summaries show role distribution and key files per module. This gives agents a mid-level overview between the full index and individual files.

## Excerpts

The first few lines of high-value files are included directly in the index. Agents can triage files without opening them.

## Risk flags

Automatic detection of potentially dangerous patterns:

| Flag | What it detects |
|------|----------------|
| `exec_shell` | Shell command execution |
| `secrets_like` | Patterns resembling credentials or API keys |
| `network_io` | Network requests or socket operations |
| `path_traversal` | Directory traversal sequences |
| `binary_masquerade` | Binary content with text extensions |
| `binary_executable` | Executable binary files |

## Capabilities

The `capabilities[]` array in `META_ZIP_INDEX.json` advertises which optional features are populated. This is the official feature negotiation mechanism — older consumers that ignore unknown fields continue to work across minor version bumps.

## Custom roles

Profiles can define domain-specific roles beyond the built-in vocabulary. For example, the `dotnet_cli` profile adds `project_file` for .csproj files, and the `rust_cli` profile adds `bench` for benchmark files. Custom roles are assigned with their own confidence scores and appear in the `custom_roles` field of the index.

## Cross-repo comparison

The `compare` command measures structural similarity between indexes from different repos:

- **Role similarity** — cosine similarity on role distributions
- **Structure similarity** — Jaccard index on shared filenames and directory patterns
- **Plan similarity** — overlap between traversal plan names
- **Archetype classification** — `near_identical` (85%+), `same_archetype` (65%+), `related` (40%+), `different`

## Spec versioning

The spec follows semver-like rules: minor bumps add fields, major bumps break consumers. See the full contract in `docs/SPEC.md` in the repository.
