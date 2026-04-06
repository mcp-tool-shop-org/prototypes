# Hello Filesystem

Learn how MCP handles irreversible side effects safely.

## What You'll Learn

1. How stub-first prevents accidental writes
2. How sandbox mode limits blast radius
3. How full mode requires explicit, informed consent

## Quickstart

```bash
# 1. Stub mode - see what WOULD happen (no actual write)
python -m tools.file_write.main output.txt "Hello, filesystem!"

# 2. Sandbox mode - write to ./sandbox/ only
ALLOW_WRITE=1 python -m tools.file_write.main output.txt "Hello!"
cat sandbox/output.txt

# 3. Full mode - write anywhere (use with caution)
ALLOW_WRITE=full python -m tools.file_write.main /tmp/test.txt "Hello!"
```

## The Three Modes

### Disabled (default)

No writes happen. You see exactly what would be written.

```bash
python -m tools.file_write.main secret.txt "password123"
# Output shows the plan, but nothing is written
```

### Sandbox (`ALLOW_WRITE=1`)

Writes are allowed, but only to `./sandbox/`. Path traversal is blocked.

```bash
# Bash/Linux/macOS:
ALLOW_WRITE=1 python -m tools.file_write.main ../../../etc/passwd "hacked"

# PowerShell:
$env:ALLOW_WRITE="1"; python -m tools.file_write.main ../../../etc/passwd "hacked"

# CMD:
set ALLOW_WRITE=1 && python -m tools.file_write.main ../../../etc/passwd "hacked"

# All three write to: ./sandbox/passwd (not /etc/passwd)
```

### Full (`ALLOW_WRITE=full`)

Writes anywhere. You're fully in control.

```bash
# Bash/Linux/macOS:
ALLOW_WRITE=full python -m tools.file_write.main /tmp/real.txt "This really writes"

# PowerShell:
$env:ALLOW_WRITE="full"; python -m tools.file_write.main C:\temp\real.txt "This really writes"

# CMD:
set ALLOW_WRITE=full && python -m tools.file_write.main C:\temp\real.txt "This really writes"
```

## Why Three Modes?

File writes are **irreversible**. Once you overwrite a file, the old content is gone.

| Mode | Risk | Use Case |
|------|------|----------|
| Disabled | Zero | Exploring, planning, testing |
| Sandbox | Contained | Development, learning |
| Full | Real | Production (with informed consent) |

The progression teaches the safety model:
1. First, see what would happen
2. Then, try it in a safe space
3. Finally, do it for real when you're ready

**If this tool surprises you, that's a bug.**

## The Sandbox Directory

All sandbox writes go to `./sandbox/`. This directory:
- Is gitignored (your experiments don't pollute commits)
- Can be safely deleted at any time
- Contains a `.gitkeep` so the directory exists in the repo

```bash
# Clean up sandbox
rm -rf sandbox/*
```

## Quick Reference

| Mode | Env Var | Effect |
|------|---------|--------|
| Disabled | (none) | Shows plan, no write |
| Sandbox | `ALLOW_WRITE=1` | Writes to `./sandbox/` only |
| Full | `ALLOW_WRITE=full` | Writes anywhere |

## Next Steps

1. Try [hello-tools](../hello-tools/) for network opt-in
2. Build your own stub-first tool using this pattern
3. Explore more tools: `mcpt list --refresh`
