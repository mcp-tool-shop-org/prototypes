# Contributing to ConsensusOS

Thank you for considering contributing to ConsensusOS! This document explains our development process, coding standards, and how to submit changes.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (preferred) or npm
- **Git**

### Setup

```bash
git clone https://github.com/mcp-tool-shop-org/ConsensusOS.git
cd ConsensusOS
npm install
npm test
```

All 295+ tests must pass before submitting changes.

## Development Workflow

### Branch Strategy

```
main    ← stable release (v1.0.0)
 └── feature/<name>   ← new features (via PR)
 └── fix/<name>       ← bug fixes (via PR)
 └── docs/<name>      ← documentation changes
```

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npm test` — all tests must pass
5. Submit a pull request

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new adapter for Solana
fix: correct token expiration logic
docs: update quickstart guide
test: add stress tests for event bus
refactor: simplify loader dependency resolution
chore: update devDependencies
harden: security/architecture improvements
```

## Architecture Rules

**These rules are enforced by `tests/architecture.test.ts` and must not be violated:**

1. **Core stays thin** — only `event-bus.ts`, `invariant-engine.ts`, `loader.ts`, `logger.ts`
2. **No module-to-module imports** — modules communicate via the event bus only
3. **No module-to-adapter imports** — adapters are independent
4. **Zero production dependencies** — all imports must be relative or `node:` builtins
5. **ESM only** — no `require()` calls
6. **Plugin API is FROZEN** — no breaking changes to `src/plugins/api.ts`

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full specification.

## Testing

### Running Tests

```bash
# All tests
npm test

# Specific test file
npx vitest run tests/architecture.test.ts

# Watch mode
npx vitest
```

### Test Categories

| Category | Files | Purpose |
|----------|-------|---------|
| Architecture | `architecture.test.ts` | Structural invariants |
| Security | `security-audit.test.ts` | Abuse resistance, determinism |
| Stress | `stress.test.ts` | Edge cases, throughput |
| Unit | `*.test.ts` | Component-level |

### Writing Tests

- Use **vitest** with `describe`/`it`/`expect`
- Place tests in `tests/` — never in `src/`
- Test file names match the pattern `<module>.test.ts`
- Architecture and security tests are mandatory — never skip them

## Adding a New Module

1. Create a directory under `src/modules/<name>/`
2. Implement the `Plugin` interface from `src/plugins/api.ts`
3. Export a factory function: `export function create<Name>(): Plugin`
4. Add exports to `src/index.ts`
5. Write tests in `tests/<name>.test.ts`
6. Update `ARCHITECTURE.md` module boundary table
7. Verify architecture tests still pass

## Adding a New Adapter

1. Create a directory under `src/adapters/<name>/`
2. Implement the `ChainAdapter` interface from `src/adapters/chain-adapter.ts`
3. Register with the `AdapterRegistry`
4. Write tests in `tests/<name>-adapter.test.ts`
5. Update `ARCHITECTURE.md` adapter table

## Versioning Policy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (2.0.0): Breaking changes to Plugin API or architecture
- **MINOR** (1.1.0): New features, new modules, new adapters (backward-compatible)
- **PATCH** (1.0.1): Bug fixes, documentation, test improvements

### Plugin API Versioning

- `PLUGIN_API_VERSION` in `src/plugins/api.ts` tracks the plugin contract version
- Incrementing `PLUGIN_API_VERSION` to `2.0` requires a package major version bump
- Adding optional fields to existing interfaces is a minor change

## Pull Request Checklist

- [ ] All tests pass (`npm test`)
- [ ] Architecture tests pass (`npx vitest run tests/architecture.test.ts`)
- [ ] No new production dependencies added
- [ ] Commit messages follow conventional commits
- [ ] Documentation updated if applicable
- [ ] No breaking changes to frozen Plugin API v1

## Reporting Issues

- **Bugs**: Open a GitHub issue with steps to reproduce
- **Security**: See [SECURITY.md](SECURITY.md) for responsible disclosure
- **Features**: Open a discussion or issue with a clear use case

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
