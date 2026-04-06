# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |
| < 1.0   | ❌ None   |

## Reporting a Vulnerability

If you discover a security vulnerability in ConsensusOS, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email: **security@mcp-tool-shop.org** (or use GitHub's private vulnerability reporting feature).
3. Include:
   - A clear description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Any suggested fix (optional)

We will acknowledge receipt within **48 hours** and aim to provide a fix or mitigation within **7 days** for critical issues.

## Security Model

### Trust Boundaries

ConsensusOS is a **plugin-based control plane**. The trust model is:

| Component | Trust Level | Notes |
|-----------|------------|-------|
| Core (loader, event bus, invariant engine) | **Trusted** | Minimal surface; no external I/O |
| Plugin API | **Frozen contract** | v1.0 — no breaking changes |
| Built-in modules (health, verifier, config, sandbox, governor) | **Trusted** | Ship with the core |
| Third-party plugins | **Untrusted** | Must be validated via Plugin SDK |
| Chain adapters (XRPL, Ethereum, Cosmos) | **Semi-trusted** | Isolated behind `ChainAdapter` interface |

### Security Properties

1. **Zero production dependencies** — no supply chain attack surface from npm packages.
2. **ESM-only** — no `require()` calls; all imports are statically analyzable.
3. **Fail-closed invariant engine** — if an invariant check throws, the transition is rejected.
4. **Append-only audit log** — all governor actions (token issuance, revocation, policy evaluation) are immutably logged.
5. **Plugin isolation** — plugins communicate only via the event bus; no direct function calls between modules.
6. **Resource-bounded tokens** — execution tokens have CPU, memory, and time limits.
7. **Token expiration** — expired tokens are auto-revoked on validation.

### Known Limitations

1. **No cryptographic signing** — audit log entries are not cryptographically signed. Integrity depends on runtime trust.
2. **In-memory state** — all state is in-memory; a process crash loses state. Persistence is a v2 concern.
3. **No sandboxing of plugin code** — plugins run in the same Node.js process. Malicious plugins could bypass the event bus. This is mitigated by the Plugin SDK's `validatePlugin()` function but is not a hard security boundary.
4. **Module-level counters** — `tokenCounter` and `auditCounter` are module-level `let` variables. They reset on process restart but are monotonic within a session.
5. **Date-based expiration** — token expiration uses `new Date()`, which is system-clock-dependent and not monotonic.

### Hardening Recommendations

- Run ConsensusOS behind a reverse proxy if exposed to network traffic.
- Use the Plugin SDK's `validatePlugin()` before loading third-party plugins.
- Monitor the audit log for unusual token issuance patterns.
- Set conservative `ResourceLimits` in production.
- Review policy rules regularly — the policy engine evaluates highest-priority rules first.

## Disclosure Policy

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure). Vulnerabilities will be publicly disclosed **90 days** after a fix is available, or immediately if a fix cannot be produced.
