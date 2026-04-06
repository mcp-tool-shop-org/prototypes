# Setup Guide

## Quick Start (Users)

### Install from npm

```bash
# Global CLI installation
npm install -g @mikeyfrilot/training-studio

# Validate a bundle
training-studio validate ./my-bundle

# JSON output
training-studio validate --json ./my-bundle
```

### As a Library

```bash
npm install @mikeyfrilot/training-studio
```

## Development Environment (Contributors)

### Prerequisites

- **Node.js** 20+ - [Download](https://nodejs.org/)
- **npm** 10+ - Included with Node.js
- **Git** - Version control
- **VS Code** (recommended) or any text editor

### Optional Tools

- **Volta** - Node version management
- **pnpm** - Alternative package manager
- **commitlint** - Commit message linting

### Installation from Source

```bash
# Clone repository
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web

# Install dependencies
npm install

# Verify setup
npm test
npm run build
# Clone repository
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web

# Install dependencies
npm install

# Verify setup
npm test
npm run build
```

## Project Architecture

### Module Organization

```
src/
├── validation/          # Bundle validation core
│   ├── bundle-validator.ts
│   └── ...
├── cli/                 # Command-line interface
│   └── validate.ts
├── training/            # ML training logic
│   ├── model-factory.ts
│   ├── data-loader.ts
│   └── ...
├── bridge/              # Native/.NET integration
│   └── native-bridge.ts
├── types/               # TypeScript definitions
│   ├── bundle.ts
│   └── ...
├── ui/                  # Web UI components
└── tests/               # Test fixtures and tests
    ├── fixtures/
    └── *.test.ts
```

### Data Structures

**BundleManifest** - Top-level bundle metadata
```typescript
{
  bundle_version: "0.1",
  bundle_id: "uuid-v4",
  bundle_digest: "sha256-hash",
  artifacts: [{ path, sha256, size_bytes }],
  app, backend, dataset, model, training
}
```

**ValidationResult** - Validation output
```typescript
{
  valid: boolean,
  version: string,
  bundle_id: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  stats: { files_total, artifacts_listed, artifacts_verified }
}
```

**BundleAccess** - Abstract file interface
```typescript
{
  readFile(path: string): Promise<Uint8Array | null>,
  fileExists(path: string): Promise<boolean>,
  listFiles(): Promise<string[]>
}
```

### Data Flow

```
User Input (CLI args)
    ↓
Argument Parser
    ↓
Bundle Access (file system)
    ↓
Validation Pipeline
    ├─ Check manifest
    ├─ Validate schema
    ├─ Verify artifacts
    └─ Compute digest
    ↓
Validation Result
    ↓
Output (CLI text or JSON)
```

## Development Workflow

### Running the Application

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# CLI validation
npm run validate ./my-bundle
```

### Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm test:watch

# Run specific test file
npm test bundle-types.test.ts

# Run with coverage
npm test -- --coverage

# Run specific test by name
npm test -- -t "validates valid bundle"
```

### Building

```bash
# Build TypeScript to JavaScript
npm run build

# Build CLI only
npm run build:cli

# Build web app
npm run build

# Clean build
rm -rf dist/ && npm run build
```

## Bundle Format

### Directory Structure

```
bundle/
├── bundle.json           # Manifest (metadata)
├── model/
│   ├── model.json        # TensorFlow.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── summary.json      # Training summary
│   └── metrics.jsonl     # Per-epoch metrics
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature schema
```

### Manifest Example

```json
{
  "bundle_version": "0.1",
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "run_id": "11111111-1111-4111-8111-111111111111",
  "bundle_digest": "sha256hash...",
  "schema_uri": "https://...",
  "created_utc": "2024-01-15T14:30:22Z",
  "app": { "name": "Training Studio", "version": "0.1.0" },
  "backend": { "name": "TensorFlow.js", "version": "4.22.0" },
  "dataset": { "name": "iris", "rows": 150 },
  "model": { "type": "sequential", "layers": 4 },
  "training": { "epochs": 50, "batchSize": 32 },
  "artifacts": [
    {
      "path": "model/model.json",
      "sha256": "...",
      "size_bytes": 2048
    }
  ]
}
```

## Code Style

### Naming

- **Types/Interfaces**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_CASE`
- **Private**: `_camelCase` or `#private`

### TypeScript Patterns

1. **Strict typing**:
   ```typescript
   export async function validateBundle(access: BundleAccess): Promise<ValidationResult> {
       // Full type coverage
   }
   ```

2. **Union types for variants**:
   ```typescript
   type ValidationSeverity = 'error' | 'warning';
   ```

3. **JSDoc for public APIs**:
   ```typescript
   /**
    * Validate a training bundle
    * @param access - File system access interface
    * @returns Validation result with detailed errors
    */
   ```

4. **Async/await**:
   ```typescript
   const data = await access.readFile(path);
   if (data === null) { /* handle */ }
   ```

## Common Tasks

### Adding a Validation Rule

1. Add error code to `types/bundle.ts`
2. Implement validation in `validation/bundle-validator.ts`
3. Add test cases to `tests/validation.integration.test.ts`
4. Update error message documentation in SPEC.md

### Adding CLI Argument

1. Update argument parsing in `cli/validate.ts`
2. Add to `--help` output
3. Add tests to `tests/cli-validator.unit.test.ts`
4. Document in README.md

### Adding Test Fixture

1. Create bundle structure in `tests/fixtures/`
2. Add to `bundle-builder.ts` if reusable
3. Reference in test files
4. Document the fixture purpose

## Debugging

### TypeScript Checking

```bash
# Check for type errors
npx tsc --noEmit

# Strict mode
npx tsc --noEmit --strict

# Show unused variables
npx tsc --noEmit --noUnusedLocals
```

### Test Debugging

```bash
# Run tests with debugger
node --inspect-brk ./node_modules/.bin/vitest run

# Or use VS Code debugger
# .vscode/launch.json configured for debugging
```

### Bundle Validation Debugging

```bash
# Verbose validation output
npm run validate ./bundle -- --verbose

# JSON output for parsing
npm run validate ./bundle -- --json | jq .

# Check exit code
npm run validate ./bundle; echo "Exit: $?"
```

## Troubleshooting

### Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Issues

```bash
# Clean build
rm -rf dist/
npm run build

# Check TypeScript
npx tsc --noEmit

# List build artifacts
ls -la dist/
```

### Test Failures

```bash
# Run single test
npm test -- -t "test name"

# Verbose output
npm test -- --reporter=verbose

# Watch failing test
npm test -- --watch --reporter=verbose
```

## Performance Optimization

### Bundle Validation Performance

- **Typical bundle**: < 100ms
- **Large bundle (1k files)**: < 500ms
- **Very large (10k files)**: < 2 seconds

### Tips for Optimization

1. Validate file count before checking contents
2. Use streaming for large files
3. Cache hash computations
4. Parallel validation of independent checks

## Deployment

### NPM Package

```bash
# Publish to npm
npm version patch  # or minor/major
npm publish

# Verify package
npm info trainingstudio-web
```

### CLI Tool

```bash
# Install globally
npm install -g trainingstudio-web

# Use anywhere
trainingstudio-web validate ./bundle
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src
COPY tsconfig.json ./
RUN npm run build:cli
ENTRYPOINT ["node", "dist/cli/validate.js"]
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TensorFlow.js Docs](https://js.tensorflow.org/api/latest/)
- [Bundle Specification](SPEC.md)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/mcp-tool-shop-org/training-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mcp-tool-shop-org/training-studio/discussions)
- **Security**: [SECURITY.md](SECURITY.md)
