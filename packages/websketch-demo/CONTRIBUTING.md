# Contributing to websketch-demo

Thank you for considering contributing to websketch-demo! We welcome contributions from the community.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/websketch-demo.git
   cd websketch-demo
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

## Development Workflow

### Before Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

2. Make sure all tests pass:
   ```bash
   npm test
   ```

### While Developing

- **Run type checking**: `npm run typecheck`
- **Run linting**: `npm run lint`
- **Format code**: `npm run format`
- **Run tests in watch mode**: `npm test`

### Before Submitting

1. **Ensure all checks pass**:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test -- --run
   npm run build
   ```

2. **Write clear commit messages**:
   ```bash
   git commit -m "feat: add visualization feature"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding or updating tests
   - `chore:` - Maintenance tasks

3. **Push your changes**:
   ```bash
   git push origin feature/my-awesome-feature
   ```

4. **Open a Pull Request** on GitHub

## Code Standards

### TypeScript

- Use TypeScript strict mode (already configured)
- Add type annotations for function parameters and return types
- Avoid `any` types when possible
- Use meaningful variable and function names

### Code Style

- **Line length**: Maximum 100 characters
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Formatting**: Use Prettier (runs automatically)

Example:

```typescript
function processData(input: string): { result: string; valid: boolean } {
  const trimmed = input.trim();
  return {
    result: trimmed,
    valid: trimmed.length > 0,
  };
}
```

### Testing

- Write tests for new features
- Update tests when modifying existing features
- Tests should be in `src/__tests__/` directory
- Use descriptive test names

#### Test Quality

Placeholder tests are not allowed on `main`. If a feature needs tests but you can't write them yet, use `it.skip('description', ...)` with a link to a tracking issue. The CI will reject patterns like `expect(true).toBe(true)` or `expect(1 + 1).toBe(2)`.

Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('processData', () => {
  it('should trim input and validate', () => {
    const result = processData('  hello  ');
    expect(result.result).toBe('hello');
    expect(result.valid).toBe(true);
  });

  it('should mark empty input as invalid', () => {
    const result = processData('   ');
    expect(result.valid).toBe(false);
  });
});
```

## Pull Request Guidelines

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] All tests pass locally
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Code is formatted with Prettier
- [ ] Added/updated tests for changes
- [ ] Updated documentation if needed
- [ ] Commit messages are clear and follow conventions
- [ ] PR description explains the changes

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)
Add screenshots for UI changes
```

## Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant information (browser, Node version, error messages)

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Environment**
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
- OS: [e.g., macOS 14.0]

**Screenshots**
If applicable, add screenshots
```

## Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** first
2. **Describe the use case** clearly
3. **Explain how it benefits users**
4. **Provide examples** if possible

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

## Questions?

- Open an issue with the `question` label
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to websketch-demo! 🎉
