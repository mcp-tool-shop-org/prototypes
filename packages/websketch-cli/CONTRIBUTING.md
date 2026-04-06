# Contributing to websketch-cli

Thank you for your interest in contributing! This document provides guidelines for contributing to the websketch CLI project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/websketch-cli.git
   cd websketch-cli
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## Development Workflow

### Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Type Checking and Linting

```bash
# Type check
npm run typecheck

# Lint code
npm run lint

# Full validation (typecheck + lint + tests)
npm run validate
```

### Building

```bash
# Build the CLI
npm run build

# Test locally
node dist/index.js --help
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules (run `npm run lint`)
- Write tests for new features
- Keep functions small and focused
- Add JSDoc comments for public APIs

## Commit Guidelines

Use clear, descriptive commit messages:

```
feat: add --json flag to fingerprint command
fix: handle missing capture files gracefully
docs: update README with new examples
test: add tests for diff command
```

Prefix types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test changes
- `refactor`: Code refactoring
- `chore`: Maintenance tasks

## Submitting Changes

1. **Create a branch** for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feat/your-feature-name
   ```

4. **Open a Pull Request** on GitHub

### Pull Request Checklist

- [ ] Tests pass (`npm run test:run`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] CLI smoke tests work (`node dist/index.js --help`)
- [ ] Documentation updated if needed
- [ ] Commit messages are clear

## Testing CLI Commands

When adding new commands or flags:

1. Add unit tests in `tests/`
2. Test manually with sample captures
3. Verify help text and error messages
4. Check edge cases (missing files, invalid JSON, etc.)

### Test Quality

Placeholder tests are not allowed on `main`. If a feature needs tests but you can't write them yet, use `it.skip('description', ...)` with a link to a tracking issue. The CI will reject patterns like `expect(true).toBe(true)` or `expect(1 + 1).toBe(2)`.

## Adding New Commands

When adding a new command:

1. Add the command function in `src/index.ts`
2. Update `printUsage()` with new command help
3. Add switch case in `main()`
4. Write tests in `tests/`
5. Update README with examples

Example:
```typescript
function cmdNewCommand(args: string[]): void {
  // Parse args
  // Load capture(s)
  // Execute logic
  // Handle errors
}
```

## Questions or Issues?

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
