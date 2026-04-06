# Contributing to Training Studio

Thank you for considering contributing to Training Studio! We welcome contributions to improve this ML training bundle validator and TensorFlow.js bridge.

**Training Studio is available on npm** at [@mikeyfrilot/training-studio](https://www.npmjs.com/package/@mikeyfrilot/training-studio)!

## Code of Conduct

Before contributing, please read and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Installation (Users)

```bash
# Install from npm
npm install @mikeyfrilot/training-studio

# Or use globally
npm install -g @mikeyfrilot/training-studio
training-studio validate ./my-bundle
```

### Development Setup (Contributors)

#### Prerequisites

- **Node.js** 20+ - [Download](https://nodejs.org/)
- **npm** 10+ - Included with Node.js
- **TypeScript** - Installed via npm
- **Vitest** - Test framework

#### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev

# Build for production
npm run build
```

## How to Contribute

### Reporting Bugs

1. **Search existing issues** - Avoid duplicates
2. **Create detailed issue** with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Bundle structure or test case if relevant
   - Your environment (Node.js version, OS)

### Suggesting Features

1. **Discuss the use case** - Open an issue to discuss
2. **Explain the problem** - What does this solve?
3. **Provide examples** - How would users interact with it?

### Submitting Pull Requests

#### Before You Start

1. **Fork and branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow code style**:
   - Use 2-space indentation
   - Follow [Google TypeScript Style Guide](https://google.github.io/styleguide/tsconfig.json)
   - Use meaningful variable names
   - Add JSDoc for public functions

3. **Organize code by module**:
   - `src/validation/` - Bundle validation logic
   - `src/cli/` - Command-line interface
   - `src/training/` - ML training logic
   - `src/bridge/` - Native bridge integration
   - `src/types/` - Type definitions
   - `src/tests/` - Test files

#### Making Changes

1. **Create focused commits**:
   ```bash
   git commit -m "feat: add bundle digest verification

   - Implement SHA-256 digest computation
   - Add manifest artifact ordering
   - Update validation pipeline"
   ```

2. **Write tests** for your changes:
   - Add tests to `src/tests/`
   - Run locally: `npm test`
   - Aim for >= 80% coverage on new code

3. **Add JSDoc documentation** for public APIs:
   ```typescript
   /**
    * Validates a bundle against the contract.
    * @param access - Bundle file access interface
    * @returns Validation result with detailed errors/warnings
    */
   export async function validateBundle(access: BundleAccess): Promise<ValidationResult>
   ```

#### Submitting

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** with:
   - Clear title: "feat: describe your change"
   - Description of changes and rationale
   - Reference related issue: "Fixes #123"
   - Checklist (see below)

3. **PR Checklist**:
   - [ ] Tests pass locally (`npm test`)
   - [ ] No TypeScript errors (`tsc --noEmit`)
   - [ ] Changes follow [code style](#code-style)
   - [ ] JSDoc documentation added
   - [ ] No security vulnerabilities introduced
   - [ ] Bundle format spec unchanged (or documented)

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test:watch

# Run specific test file
npm test -- bundle-types.test.ts

# Run with coverage
npm test -- --coverage
```

### Building

```bash
# Build TypeScript
npm run build

# Build CLI
npm run build:cli

# Build all (web + CLI)
npm run build
```

### Validation Testing

```bash
# Test with golden bundle
npm run validate src/tests/fixtures/golden-v1

# JSON output
npm run validate src/tests/fixtures/golden-v1 --json

# Test with custom bundle
npm run validate ./my-bundle/
```

### Project Structure

```
TrainingStudio.Web/
├── src/
│   ├── validation/           # Bundle validation
│   │   ├── bundle-validator.ts
│   │   └── ...
│   ├── cli/                  # Command-line interface
│   │   ├── validate.ts
│   │   └── ...
│   ├── training/             # ML training logic
│   │   ├── model-factory.ts
│   │   ├── data-loader.ts
│   │   └── ...
│   ├── bridge/               # Native bridge
│   │   └── native-bridge.ts
│   ├── types/                # Type definitions
│   │   ├── bundle.ts
│   │   └── ...
│   ├── tests/                # Tests
│   │   ├── fixtures/
│   │   ├── *.test.ts
│   │   └── ...
│   └── ui/                   # Web UI components
├── dist/                     # Built output
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── SPEC.md                   # Bundle format spec
```

## Code Style

### Naming Conventions

- **Types/Interfaces**: `PascalCase` - `BundleManifest`, `ValidationResult`
- **Functions/Variables**: `camelCase` - `validateBundle`, `isValidUUID`
- **Constants**: `UPPER_CASE` - `BUNDLE_VERSION`, `REQUIRED_FIELDS`
- **Private functions**: `_camelCase` or `#private` - `_computeHash`

### Patterns

1. **Type-safe validation**:
   ```typescript
   interface ValidationIssue {
       code: ValidationErrorCode;
       message: string;
   }

   export function validateManifest(data: unknown): ValidationIssue[] {
       const issues: ValidationIssue[] = [];
       // Validation logic
       return issues;
   }
   ```

2. **Async operations with proper error handling**:
   ```typescript
   export async function validateBundle(access: BundleAccess): Promise<ValidationResult> {
       try {
           const manifestData = await access.readFile('bundle.json');
           if (!manifestData) {
               return { valid: false, errors: [...] };
           }
           // Process
       } catch (error) {
           return { valid: false, errors: [{ code: 'E_IO_ERROR', message: String(error) }] };
       }
   }
   ```

3. **JSDoc for public APIs**:
   ```typescript
   /**
    * Compute SHA-256 hash of data
    * @param data - Uint8Array or string to hash
    * @returns Lowercase hex string (64 chars)
    */
   async function sha256(data: Uint8Array | string): Promise<string>
   ```

## Commit Message Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat** - New feature
- **fix** - Bug fix
- **docs** - Documentation
- **test** - Test additions/changes
- **refactor** - Code refactoring without feature changes
- **perf** - Performance improvements
- **chore** - Dependency updates, tooling

### Examples

```
feat(validation): add bundle digest verification

- Implement deterministic digest computation
- Handle artifact reordering
- Add tests for digest stability

Fixes #42
```

```
fix(cli): handle paths with spaces

Use proper argument quoting to support paths like "my model/bundle".

Fixes #89
```

## Documentation

### README Updates

Update [README.md](README.md) if your changes affect:
- Bundle format structure
- Validation rules
- CLI usage
- Quick start instructions

### SPEC.md Updates

For changes to bundle format:
1. Update [SPEC.md](SPEC.md) with new structure
2. Update version if needed
3. Include migration path for old versions
4. Update tests to match new spec

### Adding Examples

Create example bundles in `src/tests/fixtures/`:
```
golden-v1/
├── bundle.json
├── model/
├── metrics/
├── config/
└── data/
```

## Review Process

1. **Automated checks**:
   - Tests pass
   - TypeScript compiles
   - Code coverage maintained

2. **Code review**:
   - Architecture and design
   - Type safety
   - Error handling
   - Test coverage
   - Security

3. **Approval and merge** by maintainers

## Testing Requirements

### Test Coverage Goals

- **Validation module**: >= 90% coverage
- **CLI module**: >= 85% coverage
- **Type definitions**: >= 95% coverage
- **Overall**: >= 80% coverage

### Test Organization

```
src/tests/
├── validation.integration.test.ts    # Full validation pipeline
├── cli-validator.unit.test.ts        # CLI arg parsing
├── bundle-types.test.ts              # Type contracts
├── bridge.unit.test.ts               # Bridge communication
├── validation-edge-cases.test.ts     # Error scenarios
└── fixtures/
    ├── bundle-builder.ts             # Test helpers
    ├── golden-v1/                    # Golden bundle
    └── invalid-*/                    # Invalid test cases
```

## Security Considerations

### Bundle Validation Security

- ✅ Reject absolute paths
- ✅ Reject path traversal (`../`)
- ✅ Reject Windows drive letters
- ✅ Validate SHA-256 format (64 hex chars)
- ✅ Validate UUIDs (v4 format)

### CLI Security

- ✅ Validate input paths
- ✅ Prevent symlink attacks
- ✅ Handle untrusted JSON safely
- ✅ Sanitize error messages

## Performance Considerations

### Validation Performance

- **Validation**: < 100ms for typical bundle
- **Large bundle (10k files)**: < 500ms
- **SHA-256 hash (1MB file)**: < 50ms

### Testing Performance

- **All tests**: < 5 seconds
- **Unit tests**: < 2 seconds
- **Integration tests**: < 3 seconds

## Recognition

Contributors recognized in:
- CHANGELOG.md - For features/fixes
- GitHub contributors page - Automatically updated

## Questions?

- **General**: Open a Discussion on GitHub
- **Issues**: Create an issue with context
- **Security**: See [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Training Studio! 🚀
