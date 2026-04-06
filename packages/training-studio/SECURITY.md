# Security Policy

## Reporting Security Vulnerabilities

**Do not** open public issues for security vulnerabilities. Instead:

1. **Email security@mcp-tool-shop.dev** (or contact maintainers if unavailable)
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

3. **What to expect**:
   - Acknowledgment within 48 hours
   - Updates on progress every week
   - Credit in security advisory (if desired)

## Supported Versions

| Version | Supported          | Status          |
|---------|------------------|-----------------|
| 0.1.x   | ✅ Yes            | Current release |
| 0.0.x   | 🚫 No             | Beta only       |

Security updates are provided for the latest version. We recommend always using the latest version.

## Security Considerations

### Bundle Validation Security

Training Studio validates ML training bundles with security focus:

- **Path Validation** - Rejects absolute paths and directory traversal
- **Hash Verification** - Validates SHA-256 hashes against manifest
- **Manifest Validation** - Enforces schema and required fields
- **No Execution** - Pure validation, never executes code

### Input Validation

- ✅ Rejects paths with `..` (directory traversal)
- ✅ Rejects absolute paths (`/path` or `C:\path`)
- ✅ Rejects Windows drive letters
- ✅ Validates SHA-256 format (64 hex characters)
- ✅ Validates UUIDs (v4 format)
- ✅ Validates JSON schema

### CLI Security

- ✅ Validates all command-line arguments
- ✅ Prevents symlink attacks
- ✅ Handles untrusted JSON safely
- ✅ Sanitizes error messages
- ✅ No write access to bundle files

### Known Limitations

- **Bundle Extraction**: Currently doesn't extract bundles, only validates
- **Code Execution**: No ML model training/execution in this component
- **Network**: Validation is local-only, no remote requests

## Recommended Practices

1. **Always validate bundles** before trusting them
2. **Use exit codes** to detect validation failures (0=valid, 2=warnings, 3=invalid)
3. **Review error messages** for detailed issue descriptions
4. **Keep Node.js updated** - Regular security patches released
5. **Audit dependencies** - Run `npm audit` regularly

### Using Training Studio Securely

```bash
# Validate a bundle
npm run validate ./my-bundle

# Check exit code
echo $?  # 0 = valid, 3 = invalid

# Get machine-readable output
npm run validate ./my-bundle --json > result.json

# Check for errors/warnings programmatically
cat result.json | jq '.ok'  # true/false
cat result.json | jq '.errors'  # Array of issues
```

## Security Updates

- **Critical vulnerabilities** (RCE, data corruption): Patch within 24 hours
- **High vulnerabilities** (DoS, information leak): Patch within 1 week
- **Medium/Low**: Included in next regular release

## Dependency Management

Training Studio minimizes dependencies:

- **@tensorflow/tfjs** - Official TensorFlow.js library
- **chart.js** - Official charting library
- **Vitest** - Testing framework
- **Vite** - Build tooling
- **TypeScript** - Type checking

All dependencies:
- ✅ Monitored for vulnerabilities via npm audit
- ✅ Updated regularly
- ✅ Audited before release

### Running Security Audits

```bash
# Check dependencies
npm audit

# Fix known vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## Responsible Disclosure

We appreciate responsible disclosure! Please:

1. ✅ **DO** - Report privately and give us time to respond
2. ✅ **DO** - Be specific about the vulnerability
3. ✅ **DO** - Include reproduction steps
4. 🚫 **DON'T** - Create public issues for vulnerabilities
5. 🚫 **DON'T** - Exploit vulnerabilities
6. 🚫 **DON'T** - Share details before we release a fix

## Security Advisories

Once fixed, vulnerabilities are published as:
- GitHub Security Advisories
- Release notes with "SECURITY" tag
- Detailed technical explanation (post-disclosure)

## Questions?

Contact the maintainers with security questions or concerns.
