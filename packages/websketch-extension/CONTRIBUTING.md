# Contributing to websketch-extension

Thank you for considering contributing!

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm
- Chrome or Edge browser
- Git

### Getting Started

1. **Fork and clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/websketch-extension.git
   cd websketch-extension
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` directory

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Start watch mode** for auto-rebuild
   ```bash
   npm run dev
   ```

3. **Make your changes** in `src/`

4. **Reload extension** in Chrome after each build
   - Go to `chrome://extensions/`
   - Click the reload icon on the extension card

5. **Test your changes** on real web pages

### Code Quality

Run all checks before committing:

```bash
npm run validate
```

This runs:
- Type checking (`npm run typecheck`)
- Linting (`npm run lint`)
- Tests (`npm run test:run`)
- Build (`npm run build`)

### Code Style

- **TypeScript**: Use strict mode, add types
- **Naming**: camelCase for variables/functions, PascalCase for types
- **Formatting**: Follow ESLint rules
- **Comments**: Add JSDoc for public APIs

Example:

```typescript
/**
 * Captures the current page as WebSketch IR
 * @returns Capture object with root and metadata
 */
function capturePage(): Capture {
  // Implementation
}
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for shadow DOM capture
fix: handle iframes correctly
docs: update installation instructions
style: fix code formatting
refactor: simplify capture logic
test: add tests for edge cases
chore: update dependencies
```

### Testing

Write tests for new features.

#### Test Quality

Placeholder tests are not allowed on `main`. If a feature needs tests but you can't write them yet, use `it.skip('description', ...)` with a link to a tracking issue. The CI will reject patterns like `expect(true).toBe(true)` or `expect(1 + 1).toBe(2)`.

Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('capturePage', () => {
  it('should capture basic DOM elements', () => {
    // Test implementation
  });
});
```

Run tests:
```bash
npm test              # Watch mode
npm run test:run      # Once
npm run test:coverage # With coverage
```

### Chrome Extension Guidelines

- Test on multiple websites
- Handle edge cases (iframes, shadow DOM, dynamic content)
- Keep extension lightweight (check bundle size)
- Follow Chrome Web Store policies
- Test privacy and permissions

## Pull Request Process

### Before Submitting

1. **Run all checks**:
   ```bash
   npm run validate
   ```

2. **Test manually**:
   - Load extension in Chrome
   - Test on various websites
   - Check console for errors

3. **Update documentation** if needed

4. **Add changelog entry** if user-facing

### PR Checklist

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Tested in Chrome
- [ ] Documentation updated
- [ ] Commit messages follow conventions

### PR Description

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Tested on multiple websites
- [ ] Checked browser console
- [ ] Added/updated tests

## Screenshots (if UI change)
Add screenshots here
```

## Reporting Bugs

### Before Reporting

- Check existing issues
- Test with latest version
- Test on clean browser profile

### Bug Report Template

```markdown
**Describe the bug**
Clear description

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Extension version: [e.g., 0.1.0]

**Screenshots**
If applicable

**Console errors**
Paste any errors from browser console
```

## Feature Requests

We welcome feature requests! Please:

1. Search existing issues
2. Describe the use case
3. Explain the benefit
4. Provide examples

## Code Review

1. A maintainer will review within a few days
2. Address feedback
3. Once approved, it will be merged
4. Your contribution will be in the next release

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others when you can
- Follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Development Tips

### Debugging

Use Chrome DevTools:
- Right-click extension icon → Inspect popup
- Check background page: `chrome://extensions/` → "Inspect views: background page"
- Check content script: Open DevTools on any page, check console

### Common Issues

**Extension not updating:**
- Reload extension in `chrome://extensions/`
- Clear browser cache
- Rebuild: `npm run clean && npm run build`

**Capture not working:**
- Check content script loaded (check page console)
- Verify permissions in manifest
- Test on different websites

**Build errors:**
- Check Node.js version: `node --version`
- Clean install: `rm -rf node_modules && npm ci`
- Check for TypeScript errors: `npm run typecheck`

### Testing on Real Sites

Test the extension on various types of websites:
- Static sites
- SPAs (React, Vue, etc.)
- Sites with iframes
- Sites with shadow DOM
- Dynamic content (AJAX loaded)

## Release Process

(For maintainers)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full validation: `npm run validate`
4. Build: `npm run build`
5. Test extension thoroughly
6. Create release tag
7. Package for Chrome Web Store (if publishing)

## Questions?

- Open an issue with `question` label
- Check existing documentation
- Review closed issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
