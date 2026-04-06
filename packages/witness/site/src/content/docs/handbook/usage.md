---
title: Usage
description: Event journaling patterns and real-world workflows with Witness.
sidebar:
  order: 3
---

Witness records events and generates proof trails. This page covers practical patterns for working with the journal.

## Recording events

Every event requires an action and an intent:

```bash
witness record --action "deploy.production" --intent "Ship v2.1.0 to prod"
```

The action is a dot-separated identifier describing what happened. The intent is a human-readable explanation of why.

### Action naming conventions

Use dot-separated namespaces that read naturally:

- `deploy.production` -- a production deployment
- `review.approve` -- a code review approval
- `config.update` -- a configuration change
- `audit.export` -- an audit package export

## Generating testimony

Testimony is the portable output of Witness. It bundles events into a verifiable report.

### Output formats

| Format | Command | Best for |
|--------|---------|----------|
| Markdown | `witness testify --format md` | Human reading, pull requests, tickets |
| JSON | `witness testify --format json` | Machine processing, schema validation |
| Text | `witness testify --format text` | Quick summaries, terminal output |

### Deterministic output

For CI pipelines or snapshot testing, pin the generation timestamp:

```bash
witness testify --format json --generated-at 2026-01-01T00:00:00Z
```

Same inputs with the same timestamp produce identical output bytes.

### Artifact emission

To create standalone files with an integrity manifest:

```bash
witness testify --emit-artifact ./output
```

This produces three files:

- `testimony.json` -- full testimony in JSON format
- `testimony.md` -- human-readable Markdown
- `testimony.manifest.json` -- SHA-256 digests and file sizes

The manifest lets anyone verify the artifacts without Witness installed.

### Deep audits

For forensic or compliance use, embed the exact stored JSON:

```bash
witness testify --format json --include-events
```

This includes `raw_event.bytes_base64` with byte-for-byte SQLite content. Every event in the testimony contains the exact data that was signed.

:::caution
The `--include-events` flag embeds exact stored JSON, which may contain sensitive fields if they were recorded. Use only when appropriate for audit or forensic purposes.
:::

### Grep-able citations

All testimony formats include citation lines:

```
CITE: <event_id> <digest>
```

These let you trace any statement in a testimony report back to its source event.

## Verification

### Basic verification

```bash
witness verify
```

Recomputes every digest and checks every signature in the journal.

### File verification

```bash
witness testify --check-files --format md
```

When generating testimony, `--check-files` verifies that referenced file artifacts exist and their SHA-256 digests still match.

| Flag | Meaning |
|------|---------|
| `MISSING_FILE` | A referenced file was not found at its locator |
| `DIGEST_MISMATCH_FILE` | A file exists but its hash has changed |

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | All verified, no flags |
| 2 | All crypto-valid, but at least one flag was raised |
| 3 | At least one cryptographic failure |

## Integration patterns

### Wrap an existing tool

Witness works by wrapping other tools. A standalone script calls `witness record` via subprocess after a tool operation completes.

Witness must not depend on the wrapped tool's libraries. The integration boundary is the CLI.

### CI/CD pipelines

Record deployment events in your pipeline and emit testimony artifacts:

```bash
witness record --action "ci.deploy" --intent "Deploy from CI pipeline"
witness testify --format json --emit-artifact ./artifacts
```

The artifacts can be attached to releases or stored alongside build outputs.
