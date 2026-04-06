# Hello Tools

Your first MCP workspace in 2 minutes.

## What You'll Learn

1. How to run a safe, deterministic tool (echo)
2. How stub-first safety works (http-get)
3. How to opt-in to capabilities when you're ready

## Quickstart

```bash
# 1. Run the always-safe echo tool
python -m tools.echo.main "Hello, MCP!"

# 2. Try http-get in stub mode (safe, no network)
python -m tools.http_get.main https://example.com

# 3. Enable network access explicitly
ALLOW_NETWORK=1 python -m tools.http_get.main https://example.com
```

## The Two Tools

### echo (always safe)

Pure function. No network, no file writes, no side effects.

```bash
python -m tools.echo.main "Hello"
python -m tools.echo.main --uppercase "hello"
```

### http-get (stub-first)

Network calls disabled by default. You decide when to enable.

```bash
# Stub mode - shows what WOULD happen
python -m tools.http_get.main https://httpbin.org/get

# Real mode - actually fetches
# Bash/Linux/macOS:
ALLOW_NETWORK=1 python -m tools.http_get.main https://httpbin.org/get

# PowerShell:
$env:ALLOW_NETWORK="1"; python -m tools.http_get.main https://httpbin.org/get

# CMD:
set ALLOW_NETWORK=1 && python -m tools.http_get.main https://httpbin.org/get
```

## Why Stub-First?

Tools should be **predictable by default**. You shouldn't wonder:
- "Will this write to disk?"
- "Will this make network calls?"
- "Will this modify my system?"

With stub-first:
1. Run any tool safely to see what it would do
2. Review the plan
3. Opt-in to real execution when ready

No surprises. You're always in control.

**If this tool surprises you, that's a bug.**

## What Changed?

This workspace pins to registry `v0.1.0`:

```yaml
registry:
  ref: "v0.1.0"  # Stable, reproducible
```

- **Tags** (v0.1.0, v0.2.0) are stable snapshots
- **main** is the moving development branch
- **Pin to tags** for reproducible builds

## Quick Reference

| Mode | Command | Effect |
|------|---------|--------|
| Disabled | `python -m tools.http_get.main URL` | Shows plan, no network |
| Enabled | `ALLOW_NETWORK=1 ...` | Real network calls |

## Next Steps

1. Explore more tools: `mcpt list --refresh`
2. Add tools to your workspace: `mcpt add <tool-id>`
3. Try [hello-filesystem](../hello-filesystem/) for file write safety
4. Build your own stub-first tool using this pattern
