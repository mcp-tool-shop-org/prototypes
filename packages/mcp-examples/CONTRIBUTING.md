# Contributing to MCP Examples

## The One Rule

**If this tool surprises you, that's a bug.**

Everything else follows from that.

## Tool Invariants

If a tool has side effects (network, filesystem, system calls), it **must** have:

1. **Disabled mode (default)** — Shows what would happen, does nothing
2. **Constrained mode** — Limited blast radius (sandbox, allowlist, dry-run)
3. **Full mode** — Clearly named, requires explicit opt-in

### Why Three Modes?

Users should be able to:
- Explore safely (disabled)
- Experiment safely (constrained)
- Act deliberately (full)

The progression teaches the safety model without documentation.

### Naming Convention

| Capability | Disabled | Constrained | Full |
|------------|----------|-------------|------|
| Network | (default) | `ALLOW_NETWORK=1` | — |
| Filesystem | (default) | `ALLOW_WRITE=1` | `ALLOW_WRITE=full` |
| Exec | (default) | `ALLOW_EXEC=1` | `ALLOW_EXEC=full` |

Use `=1` for constrained, `=full` for unrestricted. The word "full" should feel intentional.

## Adding an Example

1. Create a directory under the repo root (e.g., `hello-your-thing/`)
2. Include:
   - `mcp.yaml` pinned to a tagged registry release (not `main`)
   - `README.md` explaining what it teaches
   - `tools/` with at least one tool demonstrating the pattern
   - `scripts/verify.sh` and `scripts/verify.ps1` for sanity checks
3. Add your example to the CI workflow in `.github/workflows/validate.yml`
4. Add your example to the table in the root `README.md`

## CI Requirements

Every example must:
- Have `mcp.yaml` with `registry.ref` set to a tag (CI fails on `main`)
- Pass all verification scripts
- Test all three modes (disabled, constrained, full) where applicable

## Code Style

- Keep tools minimal — they teach a concept, not solve a problem
- Prefer clarity over cleverness
- Comments explain "why," not "what"
- Error messages should guide the user to the solution

## Questions?

Open an issue. We'd rather answer questions than fix bugs from unclear docs.
