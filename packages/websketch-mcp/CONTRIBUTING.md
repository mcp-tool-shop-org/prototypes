# Contributing to websketch-mcp

Thank you for considering contributing to websketch-mcp!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm
- Git

### Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/websketch-mcp.git
   cd websketch-mcp
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Write tests** in the `tests/` directory

4. **Run quality checks**
   ```bash
   npm run typecheck    # Type checking
   npm run lint         # Linting
   npm test             # Tests
   npm run build        # Build
   ```

### Code Style

- **TypeScript**: Use strict mode (already configured)
- **Naming**: Use camelCase for variables/functions, PascalCase for types/classes
- **Comments**: Add JSDoc comments for public APIs
- **Formatting**: Code is linted with ESLint

Example:

```typescript
/**
 * Renders a WebSketch IR capture to ASCII wireframe
 * @param capture - The WebSketch IR capture object
 * @returns ASCII representation of the capture
 */
function renderToAscii(capture: Capture): string {
  // Implementation
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add support for nested frame rendering"
git commit -m "fix: handle empty captures gracefully"
git commit -m "docs: update API documentation"
```

### Testing

- Write tests for all new features
- Update tests when modifying existing features
- Aim for high code coverage
- Tests use Vitest

#### Test Quality

Placeholder tests are not allowed on `main`. If a feature needs tests but you can't write them yet, use `it.skip('description', ...)` with a link to a tracking issue. The CI will reject patterns like `expect(true).toBe(true)` or `expect(1 + 1).toBe(2)`.

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { fingerprint } from '../src/utils';

describe('fingerprint', () => {
  it('should generate deterministic fingerprints', () => {
    const capture = { root: { type: 'Frame', id: 'r1' } };
    const fp1 = fingerprint(capture);
    const fp2 = fingerprint(capture);
    expect(fp1).toBe(fp2);
  });

  it('should generate different fingerprints for different captures', () => {
    const capture1 = { root: { type: 'Frame', id: 'r1' } };
    const capture2 = { root: { type: 'Frame', id: 'r2' } };
    expect(fingerprint(capture1)).not.toBe(fingerprint(capture2));
  });
});
```

### Before Submitting

1. **Ensure all checks pass**:
   ```bash
   npm run typecheck
   npm run lint
   npm run test:run
   npm run build
   ```

2. **Update documentation** if you changed APIs

3. **Add entries to CHANGELOG.md** for user-facing changes

4. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Added tests for new functionality
- [ ] Updated documentation
- [ ] Updated CHANGELOG.md
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Related Issues
Fixes #123
```

## Reporting Bugs

### Before Reporting

- Check existing issues for duplicates
- Test with the latest version
- Gather relevant information

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. With input '...'
3. See error

**Expected behavior**
What you expected to happen

**Environment**
- Node.js version: [e.g., 20.10.0]
- OS: [e.g., Ubuntu 22.04]
- websketch-mcp version: [e.g., 0.1.0]

**Additional context**
Any other relevant information
```

## Feature Requests

We welcome feature requests! Please:

1. Search existing issues first
2. Describe the use case clearly
3. Explain how it benefits users
4. Provide examples if possible

## Code Review Process

1. A maintainer will review your PR within a few days
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others when you can
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Development Tips

### Local Testing

Test the MCP server locally:

```bash
# Build
npm run build

# Run server
node dist/index.js

# In another terminal, send test MCP protocol messages
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

### Debugging

Use Node.js debugging:

```bash
node --inspect dist/index.js
```

Then attach a debugger (VS Code, Chrome DevTools, etc.).

### Watch Mode

For active development:

```bash
npm run dev
```

This will rebuild on file changes.

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run prepublishOnly` to verify all checks pass
4. Commit: `git commit -m "chore: release v0.x.y"`
5. Tag: `git tag v0.x.y`
6. Push: `git push --follow-tags`
7. Publish: `npm publish`

## Questions?

- Open an issue with the `question` label
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
