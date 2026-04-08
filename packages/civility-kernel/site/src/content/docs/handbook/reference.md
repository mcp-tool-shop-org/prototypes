---
title: CLI & Security Reference
description: Complete CLI reference, exit codes, npm scripts, and security model for Civility Kernel.
sidebar:
  order: 4
---

## CLI: policy-check

The `policy-check` script is the command-line interface for the human governance loop. It operates on JSON policy files and provides lint, diff, explain, and apply operations.

### Usage

```bash
npx tsx scripts/policy-check.ts <policy-file> [options]
```

Or through the npm scripts defined in `package.json`:

```bash
npm run policy:check         # Lint policies/default.json (strict mode)
npm run policy:explain       # Print human-readable policy summary
npm run policy:propose       # Lint + diff + approval prompt
npm run policy:canonicalize  # Normalize policy in place
```

### Options

| Flag | Description |
|------|-------------|
| `--explain` | Print a human-readable summary of the policy |
| `--format <text\|markdown>` | Output format for `--explain` (default: `text`) |
| `--propose <file>` | Lint the proposed file, canonicalize it, show a diff, and prompt for approval |
| `--apply` | Rewrite the policy file in canonical form |
| `--write-prev <file>` | Back up the current canonical policy before overwriting |
| `--diff <short\|full>` | Diff mode: `short` shows headline changes, `full` shows every field |
| `--prev <file>` | Deterministic CI diff mode (compare against a known previous policy) |
| `--strict` | Treat warnings as errors (used in CI) |

### Governance workflow

The intended workflow for policy changes:

1. **Preview** -- `npm run policy:explain` to see what the current policy does
2. **Edit** -- Modify the policy file (or create a new one)
3. **Propose** -- `npm run policy:propose` to see a lint report and diff
4. **Approve** -- The CLI prompts for explicit `y/n` consent
5. **Apply** -- The previous policy is backed up, and the new canonical policy is written

### Automatic rollback

When applying changes with `--write-prev`, the old policy is saved before overwriting:

```bash
npx tsx scripts/policy-check.ts policies/default.json \
  --propose policies/proposed.json \
  --write-prev policies/previous.json
```

To restore the previous policy, simply copy it back:

```bash
cp policies/previous.json policies/default.json
```

---

## npm scripts reference

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all tests with Vitest |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run verify` | Build + test (CI equivalent) |
| `npm run example:basic` | Run the basic constraint evaluation example |
| `npm run example:parameterized` | Run the parameterized constraints example |
| `npm run example:explain` | Run the policy explanation example |
| `npm run policy:check` | Lint the default policy in strict mode |
| `npm run policy:explain` | Print a human-readable policy summary |
| `npm run policy:propose` | Propose a policy change with diff and approval |
| `npm run policy:canonicalize` | Normalize the default policy in place |
| `npm run clean` | Remove the `dist/` directory |

---

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success -- all checks passed |
| `1` | User error -- lint failures, invalid policy, or rejected proposal |
| `2` | Runtime error -- file not found, parse failure, or unexpected exception |

---

## CI integration

The CI pipeline runs:

1. All examples (smoke test)
2. Full test suite
3. TypeScript build
4. `policy-check` against fixtures (`policies/default.json` vs `policies/previous.json`)

This prevents shipping broken policies or misleading diffs. The `--strict` flag promotes lint warnings to errors so CI catches issues that the linter would otherwise only warn about.

Example CI step:

```bash
npm run verify && npm run policy:check
```

---

## Security model

Civility Kernel is a **pure library** with a deliberately minimal security surface.

### Data access

| Category | Details |
|----------|---------|
| **Data accessed** | Reads JSON policy files from the local filesystem. Validates, canonicalizes, and diffs policy documents in-process. All operations are deterministic. |
| **Data NOT accessed** | No network requests. No telemetry. No credential storage. No cloud services. The kernel evaluates policy constraints -- it does not observe or log agent actions. |
| **Permissions required** | Filesystem read for policy JSON files. Write only when explicitly requested via `--apply`. |

### Threat model

| Threat | Mitigation |
|--------|------------|
| Malformed policy bypasses constraints | Fail-closed design: unknown constraints and invalid parameters block plans, never silently allow them |
| Silent policy updates | The governance loop requires explicit human approval before any policy change is written to disk |
| Policy rollback loss | `--write-prev` creates an automatic backup before every overwrite |
| Constraint parameter injection | Zod schemas validate all constraint parameters at lint time and evaluation time |
| Noisy diffs hiding real changes | Canonicalization ensures equivalent policies produce byte-identical output |

### No side effects

The library:
- Makes **zero** network requests
- Collects **no** telemetry
- Stores **no** credentials
- Has **no** filesystem writes unless the operator explicitly passes `--apply`
- Is fully deterministic -- same input always produces the same output

### Vulnerability reporting

To report a vulnerability, use GitHub's private vulnerability reporting: go to the [Security tab](https://github.com/mcp-tool-shop-org/civility-kernel/security) of this repository and click **"Report a vulnerability"**.

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

See [SECURITY.md](https://github.com/mcp-tool-shop-org/civility-kernel/blob/main/SECURITY.md) for full details.
