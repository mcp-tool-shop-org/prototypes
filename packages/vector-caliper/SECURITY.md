# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability in VectorCaliper:

1. **Do not** open a public issue
2. Email: 64996768+mcp-tool-shop@users.noreply.github.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

---

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 7 days
- **Fix timeline:** Depends on severity

---

## Scope

VectorCaliper is a visualization library. Security concerns may include:

- **Input validation:** Malformed state data causing crashes
- **Resource exhaustion:** Memory or CPU denial of service
- **Dependency vulnerabilities:** Issues in transitive dependencies

VectorCaliper does not:
- Handle authentication or authorization
- Store user data
- Connect to external services (except when adapters are used)

---

## Security Updates

Security patches are released as patch versions (1.0.x) and announced in:

- GitHub Releases
- CHANGELOG.md

---

## Dependencies

We monitor dependencies for known vulnerabilities and update as needed.

To check for known vulnerabilities:

```bash
npm audit
```
