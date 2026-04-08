# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in tool-scan, please report it responsibly.

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

**What to include:**
- Description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Potential impact

**Response timeline:**
- Acknowledgement within 48 hours
- Assessment within 7 days
- Fix or mitigation within 30 days for confirmed issues

**Please do NOT:**
- Open a public GitHub issue for security vulnerabilities
- Exploit the vulnerability against other users

## Scope

tool-scan is a **local-only** security scanner for MCP tool definitions. Its attack surface is limited to:

- **Data touched:** JSON tool definitions passed as CLI arguments or stdin. Parsed in-memory only — no files written, no state persisted.
- **Data NOT touched:** no network requests, no filesystem writes, no OS credentials, no telemetry, no user data collection.
- **No code execution:** scanned tool definitions are parsed as JSON — no code from tool definitions is ever executed.
- **Permissions required:** read access to JSON files passed as arguments. No elevated privileges needed.

### Relevant security considerations

- **Pattern accuracy:** false negatives (missed threats) and false positives are both bugs
- **Grading fairness:** scoring weights must not penalize safe tools or pass unsafe ones
- **Input handling:** malformed JSON, adversarial inputs, and encoding edge cases
