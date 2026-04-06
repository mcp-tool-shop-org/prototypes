---
title: Beginner's Guide
description: A gentle introduction to Claude ToolStack for first-time users.
sidebar:
  order: 99
---

This page covers everything you need to know before your first deployment. If you have never used Claude ToolStack before, start here.

## What is this tool?

Claude ToolStack is a self-hosted execution environment that makes Claude Code effective on large, multi-language repositories without overwhelming your Linux workstation's memory.

The core problem it solves: when Claude Code works directly on a big codebase, it can saturate 64 GB of RAM with indexing, language servers, and build processes -- causing the machine to thrash and become unresponsive. ToolStack prevents this by:

1. Running all heavy tools (ripgrep, ctags, build runners) inside Docker containers
2. Enforcing per-category memory budgets through systemd cgroup v2 slices
3. Exposing a thin HTTP gateway that returns only the bounded evidence Claude needs, capped at 512 KB per response

The result is that Claude gets fast, focused answers while your SSH session, editor, and desktop remain responsive.

## Who is this for?

Claude ToolStack is designed for:

- **Solo developers** who run Claude Code on a Linux workstation with 64 GB RAM and work on repositories with 50k+ lines of code
- **Small teams** sharing a beefy Linux server where multiple people (or Claude sessions) need concurrent access to code intelligence
- **DevOps engineers** who want a repeatable, containerized code intelligence stack that can be version-controlled and deployed to new machines

You do **not** need Claude ToolStack if:

- Your repositories are small (under 10k lines) -- Claude Code handles these fine natively
- You work on macOS or Windows exclusively -- the systemd and cgroup integration requires Linux
- You do not use Docker -- the tool farm is container-based

## Prerequisites

Before starting, confirm you have:

| Requirement | Minimum | How to check |
|-------------|---------|-------------|
| OS | Ubuntu 22.04 or Fedora 38+ | `cat /etc/os-release` |
| RAM | 64 GB | `free -h` |
| Docker Engine | With Compose v2 | `docker compose version` |
| Python | 3.10+ | `python3 --version` |
| Git | Any recent version | `git --version` |
| cgroup v2 | Active (default on modern distros) | `mount \| grep cgroup2` |

**Important:** Docker Desktop is not supported. The cgroup integration requires native Linux Docker Engine. If `docker compose version` shows a Compose v2 line, you are good.

## Your first 5 minutes

### Minute 1 -- Clone and bootstrap

```bash
git clone https://github.com/mcp-tool-shop-org/claude-toolstack.git
cd claude-toolstack
sudo ./scripts/bootstrap.sh
```

The bootstrap script installs zram swap, sysctl tuning, systemd slices, and the Docker daemon config. It is idempotent -- running it twice is safe.

### Minute 2 -- Configure

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

- `API_KEY` -- a strong random string (32+ characters). This authenticates all gateway requests.
- `ALLOWED_REPOS` -- comma-separated glob patterns for which repositories the gateway can access, e.g. `myorg/*`.

### Minute 3 -- Place a repository

```bash
sudo mkdir -p /workspace/repos
sudo chown $USER:$USER /workspace/repos
git clone https://github.com/myorg/myrepo /workspace/repos/myorg/myrepo
```

Repos must live under `/workspace/repos/<org>/<repo>`. The gateway uses this path structure as a routing key.

### Minute 4 -- Start the stack

```bash
docker compose up -d --build
```

This launches five containers: the FastAPI gateway, a Docker socket proxy, the cts CLI container, a ctags indexer, and a build runner.

### Minute 5 -- Verify and search

```bash
# Run the smoke test
./scripts/smoke-test.sh "$API_KEY" myorg/myrepo

# Install the CLI
pip install -e .
export CLAUDE_TOOLSTACK_API_KEY=<your-key>

# Run your first search
cts search "main" --repo myorg/myrepo
```

If the smoke test passes and the search returns results, your stack is operational.

## Common mistakes

### Forgetting to set `ALLOWED_REPOS`

By default, `ALLOWED_REPOS` is empty, which means all repos are denied. If every search returns a 403, check your `.env` file and add the appropriate glob pattern.

### Using Docker Desktop instead of Docker Engine

Docker Desktop on Linux runs inside a VM, which breaks the cgroup v2 integration. Uninstall Docker Desktop and install Docker Engine directly from the Docker apt/dnf repositories.

### Using symlinks for `/workspace/repos`

The gateway validates all paths using `realpath`. If `/workspace/repos` is a symlink that resolves outside the expected directory, the path jail will reject your requests. Use a real directory, not a symlink.

### Skipping the bootstrap script

Without the bootstrap script, your systemd slices will not exist and Docker containers will have no memory governance. The stack will still start, but a heavy indexing job can consume all available RAM and freeze your machine.

### Setting `API_KEY` to something short or empty

An empty `API_KEY` means anyone on localhost can access the gateway. While the gateway only binds to 127.0.0.1, any process on the machine can reach it. Use a strong random key.

## Next steps

Once you have a working stack:

1. **Read the [Usage guide](/claude-toolstack/handbook/usage/)** to learn evidence bundles, semantic search, and all CLI commands
2. **Try an evidence bundle:** `cts search "auth" --repo myorg/myrepo --format claude` produces a paste-ready evidence pack for Claude
3. **Index for semantic search:** `cts semantic index --repo myorg/myrepo --root /workspace/repos/myorg/myrepo` enables conceptual similarity search
4. **Run diagnostics:** `cts doctor` checks every component of the stack and reports issues with remediation hints
5. **Check the [Reference](/claude-toolstack/handbook/reference/)** for the full API specification, environment variables, and security model

## Glossary

| Term | Definition |
|------|-----------|
| **Gateway** | The FastAPI HTTP server (port 8088) that accepts bounded queries and returns bounded evidence. All requests require an API key. |
| **Tool farm** | The set of Docker containers (ctags, build runner, optional language servers) that do the heavy work. The gateway delegates to them via `docker exec`. |
| **Slice** | A systemd cgroup v2 unit that enforces memory limits on a group of containers. There are five slices: `claude-gw`, `claude-index`, `claude-lsp`, `claude-build`, and `claude-vector`. |
| **Evidence bundle** | A compact, structured output format (`--format claude`) that includes ranked search matches, context slices, and metadata -- designed to be pasted directly into a Claude Code session. |
| **Path jail** | The security mechanism that prevents file access outside `/workspace/repos`. Uses `realpath` validation, null byte rejection, and symlink checks. |
| **Docker socket proxy** | A Tecnativa proxy that sits between the gateway and the Docker daemon, filtering API calls to allow only container inspect and exec operations. |
| **cts** | The zero-dependency Python CLI client that wraps all gateway endpoints. Installed via `pip install -e .` or `pipx install -e .` |
| **Semantic search** | Optional embedding-based code search using sentence-transformers. Stores vectors in a SQLite database and performs cosine similarity retrieval. |
| **Autopilot** | An iterative refinement mode that re-runs searches when initial confidence is low, adjusting the query between passes. |
| **MemoryHigh / MemoryMax** | cgroup v2 memory limits. MemoryHigh triggers kernel reclaim pressure (the process slows down). MemoryMax triggers an OOM kill (only the offending container dies). |
