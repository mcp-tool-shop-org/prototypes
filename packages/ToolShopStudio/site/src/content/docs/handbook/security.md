---
title: Security
description: Security model and data scope for ToolShopStudio.
sidebar:
  order: 5
---

## Sandbox model

Every file operation is sandboxed with path traversal prevention. The `validateSandboxPath` function resolves each path and confirms it falls within the user's sandbox directory (`/data/sandbox/{userId}`). Attempts to escape via `../../` or symlinks are rejected before any I/O occurs. This check runs on every input path, output path, and thumbnail path.

## No user code

FreeCAD uses pre-baked Python one-liners — no `exec()`, no `eval()`, no arbitrary user code. Input and output paths are substituted into hardcoded templates via `$INPUT`/`$OUTPUT` placeholders. OpenSCAD renders `.scad` text files with no binary input execution; dangerous constructs (`import`, `surface`, `include`, `use`) are detected during preflight. Blender uses pre-baked Python expressions for GLB/STL export.

## Preflight validation

Every pipeline runs preflight checks before executing the external binary:

- **Zod schema validation** — rejects malformed requests with typed errors before any work begins
- **Input existence check** — verifies the input file exists and is accessible
- **Format compatibility** — detects mismatches (e.g., passing a raster to a vector preset in GDAL)
- **Output size estimation** — compares estimated output bytes against `maxOutputBytes` limits to reject oversized jobs early

## Cancellation

All pipelines propagate an `AbortController` signal through every checkpoint. Long-running operations (Blender Cycles renders, 4K transcodes) can be cancelled at any point. FFmpeg processes receive `SIGKILL` on abort. AbortError is never swallowed by the fallback loop — it always rethrows immediately.

## Context DI

All side effects (file I/O, process spawning, notifications) are injected via context objects. Nothing is implicit, everything is mockable and auditable. This makes security auditing straightforward: every external binary invocation flows through an injected runner function, never through implicit `child_process` calls.

## Docker isolation

The Docker image includes all six runtime binaries pre-installed. Mount a sandbox volume for file I/O — the container has no access to your host filesystem beyond the mounted volume.

## No telemetry

ToolShopStudio collects nothing and sends nothing. All operations are local.
