# zip-meta-map Specification — v0.2

## Overview

zip-meta-map generates a set of metadata files that describe the contents of a ZIP archive or project directory. These files enable AI agents and automation tools to navigate codebases efficiently without reading every file.

## Generated Files

### Required

| File | Format | Purpose |
|------|--------|---------|
| `META_ZIP_FRONT.md` | Markdown | Human-readable summary for orientation |
| `META_ZIP_INDEX.json` | JSON | Machine-readable file inventory, roles, and traversal plans |

### Optional

| File | Format | Purpose |
|------|--------|---------|
| `META_ZIP_POLICY.json` | JSON | Access controls and agent behavior constraints |

## META_ZIP_FRONT.md

A Markdown document containing:

- **Title**: project name (derived from directory name or archive filename)
- **Summary**: profile, file count, spec version, role distribution
- **Start here**: ranked list of recommended entry-point files with reasons
- **Plans**: all traversal plans with descriptions, steps, and budgets
- **Modules**: directory-level summaries showing structure (v0.2+)
- **Guardrails**: warnings about generated code, low-confidence files, safety flags

This file is for humans. Agents should prefer `META_ZIP_INDEX.json`.

## META_ZIP_INDEX.json

The primary machine-readable manifest. Validated against `meta_zip_index.schema.json`.

### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `format` | string | yes | Always `"zip-meta-map"` |
| `version` | string | yes | Spec version, currently `"0.2"` |
| `generated_by` | string | yes | Tool identifier, e.g. `"zip-meta-map/0.1.0"` |
| `profile` | string | yes | Profile used for categorization (e.g. `"python_cli"`) |
| `start_here` | string[] | yes | Ordered list of files to read first |
| `ignore` | string[] | yes | Glob patterns that were excluded from indexing |
| `files` | FileEntry[] | yes | Complete inventory of indexed files |
| `plans` | object | yes | Named traversal plans (see below) |
| `modules` | Module[] | no | Folder-level module summaries (v0.2+) |
| `warnings` | string[] | no | Safety and integrity warnings (v0.2+) |
| `policy_applied` | boolean | no | Whether a META_ZIP_POLICY.json was applied |

### FileEntry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | yes | Relative path from archive/project root |
| `size_bytes` | integer | yes | File size in bytes |
| `sha256` | string | yes | SHA-256 hex digest of file contents |
| `role` | string | yes | Role from the vocabulary below |
| `confidence` | number | yes | Confidence in role assignment (0.0–1.0) |
| `reason` | string | no | Human-readable explanation of why this role was assigned |
| `tags` | string[] | no | Freeform tags for additional categorization |
| `chunks` | Chunk[] | no | Chunk map for large files (v0.2+) |
| `excerpt` | string | no | Safe micro-summary — first N lines of text (v0.2+) |
| `risk_flags` | string[] | no | Heuristic risk signals (v0.2+) |

### Chunk (v0.2)

For files larger than 32 KB, deterministic chunking produces a map of file regions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Stable chunk identifier (hash-based, deterministic) |
| `start_line` | integer | yes | First line of the chunk (1-indexed) |
| `end_line` | integer | yes | Last line of the chunk |
| `byte_len` | integer | yes | Byte length of the chunk content |
| `heading` | string | no | Nearest heading or section title (for markdown) |

**Chunking strategies:**
- **headings**: splits on markdown headings (for `.md` files with 2+ headings)
- **lines**: splits every 100 lines (for source code and plain text)
- **auto** (default): uses headings if markdown-like, else lines

### Module (v0.2)

Directory-level summaries grouping files by folder:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | yes | Directory path relative to root |
| `file_count` | integer | yes | Number of files in this directory |
| `total_bytes` | integer | no | Total size of all files in the directory |
| `primary_roles` | string[] | yes | Most common roles (top 3, excluding unknown) |
| `key_files` | string[] | no | Most important files (entrypoints, configs, READMEs) |
| `summary` | string | no | Heuristic description of what this module contains |

### Risk Flags (v0.2)

Heuristic signals detected per file:

| Flag | Meaning |
|------|---------|
| `path_traversal` | Path contains `..` components |
| `binary_executable` | File has a binary executable extension (.exe, .dll, etc.) |
| `binary_masquerade` | Text extension but contains null bytes (binary content) |
| `exec_shell` | Content contains shell execution patterns (subprocess, eval, etc.) |
| `secrets_like` | Content matches credential/secret patterns |
| `network_io` | Content contains network I/O patterns |

### Role Vocabulary (v0.1.1+)

**Tags are unbounded; roles are bounded.** The role vocabulary is fixed per spec version. Profiles may restrict which roles they use, but they cannot invent new ones. Use `tags` for project-specific categorization.

When confidence is low (< 0.5), the tool assigns `unknown` and includes a `reason` explaining what signals were ambiguous.

| Role | Meaning |
|------|---------|
| `entrypoint` | Primary entry point (main script, index file, CLI command) |
| `public_api` | Exported API surface (public modules, `__init__.py` re-exports) |
| `source` | Application/library source code |
| `internal` | Internal/private modules (prefixed with `_`, nested deeply) |
| `config` | Configuration file (pyproject.toml, package.json, tsconfig, etc.) |
| `lockfile` | Dependency lock files (package-lock.json, poetry.lock, Cargo.lock) |
| `ci` | CI/CD pipeline definitions (.github/workflows/, .circleci/) |
| `test` | Test files |
| `fixture` | Test fixtures and sample data used by tests |
| `doc` | General documentation (README, guides, markdown) |
| `doc_api` | API reference documentation (generated or handwritten) |
| `doc_architecture` | Architecture/design docs (ADRs, ARCHITECTURE.md) |
| `schema` | Schema definitions (JSON Schema, protobuf, GraphQL, OpenAPI) |
| `build` | Build scripts and Makefiles |
| `script` | Utility/dev scripts (not part of the main application) |
| `generated` | Generated/compiled output (dist/, build artifacts) |
| `vendor` | Vendored third-party code |
| `asset` | Static assets (images, fonts, CSS, HTML templates) |
| `data` | Data files (JSON data, CSV, databases) |
| `unknown` | Could not determine role (confidence < 0.5) |

### Confidence Bands

| Band | Range | Meaning |
|------|-------|---------|
| High | 0.9–1.0 | Strong structural signal (filename match, profile entrypoint) |
| Good | 0.7–0.89 | Pattern match (directory convention, extension + location) |
| Fair | 0.5–0.69 | Extension-only or weak positional signal |
| Low | 0.0–0.49 | Assigned `unknown`; reason explains the ambiguity |

### Plans

Plans are named traversal strategies that tell an agent how to navigate the archive for a specific goal. Each plan is an object with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | yes | What this plan helps accomplish |
| `steps` | string[] | yes | Ordered instructions (natural language) |
| `budget_bytes` | integer | no | Suggested max bytes to read per step |
| `stop_after` | string[] | no | Files/patterns — stop traversal after reading these |
| `max_total_bytes` | integer | no | Hard cap on total bytes to read across all steps |

Plans are advisory. Agents may deviate based on their own judgment. However, `max_total_bytes` is a strong hint — exceeding it means the agent is likely reading more than necessary for the stated goal.

**Standard plan names** (profiles should define at least `overview`):

- `overview` — quick orientation, understand what the project is
- `debug` — find and fix a bug
- `add_feature` — understand where to add new functionality
- `security_review` — identify security-sensitive code paths
- `deep_dive` — read all source to understand full implementation (v0.2+)

**Step verbs** (v0.2):

Steps may use these verbs as prefixes:
- `READ` — read the specified file(s)
- `LIST` — list directory contents
- `SCAN` — search for patterns across files
- `CHECK` — verify a specific condition
- `IDENTIFY` — determine which component is relevant
- `TRACE` — follow dependencies or imports
- `SUMMARIZE_THEN_CHOOSE_NEXT` — pause after reading, decide what to explore next

## META_ZIP_POLICY.json

Optional file that constrains agent behavior. Validated against `meta_zip_policy.schema.json`.

### Top-level fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `format` | string | yes | Always `"zip-meta-policy"` |
| `version` | string | yes | Spec version, currently `"0.1"` |
| `read_only` | string[] | no | Glob patterns for files agents should not modify |
| `no_execute` | string[] | no | Glob patterns for files agents should not execute |
| `sensitive` | string[] | no | Glob patterns for files containing secrets or PII |
| `ignore_extra` | string[] | no | Additional glob patterns to exclude from indexing |
| `never_read` | string[] | no | Files agents should never read (stronger than ignore) |
| `plan_budgets` | object | no | Override `max_total_bytes` per plan name |
| `notes` | string | no | Freeform guidance for agents |

## Trust Model

The index is **advisory, not authoritative**. Consumers should:

1. **Validate** the index against the JSON Schema before trusting it
2. **Cross-check** the `files` array against the actual archive listing — missing or extra files indicate the index is stale
3. **Verify hashes** — if a file's actual SHA-256 doesn't match the index, the entry is stale
4. **Treat roles as hints** — role assignment is heuristic; consumers may reclassify
5. **Check risk_flags** — files with risk flags deserve extra scrutiny
6. **Read warnings** — index-level warnings highlight safety concerns

The index is a map, not a lock. It helps you navigate; it doesn't prevent you from looking elsewhere.

## Capabilities (v0.2)

The top-level `capabilities` array advertises which optional features are populated in the index:

| Capability | Present when |
|------------|-------------|
| `chunks` | At least one file has a `chunks` array |
| `excerpts` | At least one file has an `excerpt` field |
| `modules` | The `modules` array is present and non-empty |
| `risk_flags` | At least one file has a `risk_flags` array |
| `warnings` | The `warnings` array is present and non-empty |

Consumers should check `capabilities` to decide which features to use. This is the official feature negotiation mechanism.

## Stability Promise

The spec version follows semver-like rules:

- **Minor version bumps** (e.g. 0.2 -> 0.3) add new optional fields. Existing consumers that ignore unknown fields will continue to work.
- **Major version bumps** (e.g. 0.x -> 1.0) may remove or rename required fields. These are breaking changes.
- **New roles** are always a minor bump — the `role` enum may grow, but existing values are never removed.
- **New capabilities** are always a minor bump — the `capabilities` array may gain new values.

Consumers should:
- Parse `version` to check compatibility
- Use `capabilities` for feature detection
- Ignore unknown top-level fields gracefully (forward compatibility)

## Incremental Mode (v0.2)

For directories (not ZIPs), the tool supports incremental scanning:

- A hash cache stores `{path, sha256, size, mtime}` per file
- On subsequent scans, files with unchanged `size + mtime` reuse the cached hash
- Changed files are re-hashed and the cache is updated
- The cache uses a version number; incompatible caches are discarded

This significantly speeds up re-scanning large directories.
