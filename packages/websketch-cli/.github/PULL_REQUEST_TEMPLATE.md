## Description
<!-- Provide a clear and concise description of your changes -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code quality improvement

## Related Issues
<!-- Link to related issues using #issue_number -->
Fixes #
Related to #

## Testing
<!-- Describe how you tested your changes -->
- [ ] All tests pass (`npm run test:run`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Smoke tests work (`node dist/index.js --help`)
- [ ] Full validation passes (`npm run validate`)

## Manual Testing
<!-- List commands you ran to verify the changes -->
```bash
node dist/index.js render-ascii sample.json
node dist/index.js fingerprint sample.json
node dist/index.js diff before.json after.json
```

## Code Quality Checklist
- [ ] Code follows style guidelines
- [ ] Added/updated tests
- [ ] Updated documentation (README, CHANGELOG)
- [ ] No console errors or warnings
- [ ] Shebang preserved in dist/index.js

## Screenshots or Output Examples (if applicable)
<!-- Add examples of new command output or changes to existing output -->

**Before:**
```

```

**After:**
```

```

## Additional Notes
<!-- Any additional information that reviewers should know -->
