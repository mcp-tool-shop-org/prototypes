# Context Window Manager - Security Documentation

> **Purpose**: Document security considerations, threat model, and mitigations for the Context Window Manager MCP.
> **Last Updated**: 2026-01-22

---

## 2026 Best Practices Applied

> **Sources**: [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/stable-en/02-checklist/05-checklist), [Security Journey 2026](https://www.securityjourney.com/post/best-practices-for-secure-coding), [Corgea Python Security](https://corgea.com/Learn/python-security-best-practices-a-comprehensive-guide-for-engineers)

This document follows 2026 Python and application security best practices:

1. **Allowlisting Over Denylisting**: Input validation uses strict allowlist patterns (regex for session IDs, window names). Denylisting SQL keywords is only a secondary defense layer.

2. **Server-Side Validation Only**: Client-side validation cannot be trusted. All validation happens in the MCP server before any processing.

3. **Parameterized Queries Everywhere**: Zero string interpolation in SQL. All database operations use parameterized queries to prevent injection.

4. **Avoid Dangerous Functions**: No use of `eval()`, `exec()`, or `pickle.loads()` on untrusted data. Serialization uses JSON only.

5. **Dependency Scanning**: Use `pip-audit` and Dependabot for continuous vulnerability scanning. Update dependencies within 24 hours for security patches.

6. **Static Analysis in CI**: Bandit and Pylint security rules run on every commit to catch issues before merge.

7. **Secrets Management**: No hardcoded secrets. Environment variables or external secrets managers (HashiCorp Vault) for sensitive configuration.

8. **Principle of Least Privilege**: MCP server requests only the permissions it needs. File permissions are restrictive (0o600/0o700).

---

## Security Philosophy

1. **Defense in Depth**: Multiple layers of protection
2. **Least Privilege**: Minimal permissions required
3. **Fail Secure**: Errors should not expose data
4. **Audit Everything**: Complete logging of security-relevant events
5. **Zero Trust**: Validate all inputs, trust no external data

---

## Threat Model

### Assets to Protect

| Asset | Sensitivity | Description |
|-------|-------------|-------------|
| KV Cache Data | HIGH | Contains encoded conversation content |
| Session Metadata | MEDIUM | Timestamps, token counts, model info |
| Configuration | MEDIUM | Server URLs, storage paths |
| Audit Logs | MEDIUM | Operation history |

### Threat Actors

| Actor | Capability | Motivation |
|-------|------------|------------|
| Malicious MCP Client | Can send arbitrary tool calls | Data exfiltration, DoS |
| Local User | File system access | Unauthorized access to other users' sessions |
| Network Attacker | Can intercept unencrypted traffic | Eavesdropping, MITM |
| Insider | Full system access | Data theft, sabotage |

### Attack Surface

```
┌─────────────────────────────────────────────────────────────┐
│                    Attack Surface Map                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [MCP Client] ──────┐                                       │
│                     │                                       │
│                     ▼                                       │
│  ┌──────────────────────────────┐                          │
│  │     MCP Server (stdio)       │◄── Input Validation      │
│  │  - Tool parameter parsing    │                          │
│  │  - Session ID handling       │                          │
│  │  - Window name handling      │                          │
│  └──────────────┬───────────────┘                          │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────┐                          │
│  │     Session Registry         │◄── Access Control        │
│  │  - SQLite database           │                          │
│  │  - Session state machine     │                          │
│  └──────────────┬───────────────┘                          │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────┐                          │
│  │     KV Store                 │◄── Storage Security      │
│  │  - CPU memory                │                          │
│  │  - Disk storage              │                          │
│  │  - Network (Redis/S3)        │                          │
│  └──────────────┬───────────────┘                          │
│                 │                                           │
│                 ▼                                           │
│  ┌──────────────────────────────┐                          │
│  │     vLLM Server              │◄── Network Security      │
│  │  - HTTP API                  │                          │
│  │  - KV Connector              │                          │
│  └──────────────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Controls

### 1. Input Validation

#### Session IDs
```python
# SECURITY: Session ID validation
SESSION_ID_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{1,64}$')

def validate_session_id(session_id: str) -> bool:
    """
    Session IDs must be:
    - 1-64 characters
    - Alphanumeric, underscore, or hyphen only
    - No path traversal characters
    """
    if not session_id:
        raise ValidationError("Session ID cannot be empty")
    if not SESSION_ID_PATTERN.match(session_id):
        raise ValidationError("Session ID contains invalid characters")
    return True
```

#### Window Names
```python
# SECURITY: Window name validation
WINDOW_NAME_PATTERN = re.compile(r'^[a-zA-Z0-9_-]{1,128}$')

def validate_window_name(name: str) -> bool:
    """
    Window names must be:
    - 1-128 characters
    - Alphanumeric, underscore, or hyphen only
    - No path traversal characters
    - No SQL injection vectors
    """
    if not name:
        raise ValidationError("Window name cannot be empty")
    if not WINDOW_NAME_PATTERN.match(name):
        raise ValidationError("Window name contains invalid characters")
    # Additional check for SQL keywords (belt and suspenders)
    sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', '--', ';']
    if any(kw in name.upper() for kw in sql_keywords):
        raise ValidationError("Window name contains reserved characters")
    return True
```

#### Path Validation
```python
# SECURITY: Path traversal prevention
def safe_path_join(base: Path, *parts: str) -> Path:
    """
    Safely join paths, preventing traversal attacks.
    """
    base = Path(base).resolve()
    result = base.joinpath(*parts).resolve()

    # Ensure result is under base
    if not str(result).startswith(str(base)):
        raise SecurityError("Path traversal detected")

    return result
```

### 2. Session Isolation

#### Cache Salt Isolation
```python
# SECURITY: Session isolation via cache_salt
def generate_cache_salt(session_id: str, user_id: str = None) -> str:
    """
    Generate a unique cache_salt for session isolation.

    The cache_salt ensures that:
    1. Sessions cannot access each other's KV cache
    2. Timing attacks cannot infer cached content
    3. Different users are fully isolated
    """
    components = [
        "cwm",  # Namespace prefix
        session_id,
        user_id or "default",
        secrets.token_hex(8)  # Random component
    ]
    return hashlib.sha256("_".join(components).encode()).hexdigest()[:32]
```

#### Session State Verification
```python
# SECURITY: Verify session ownership before operations
async def verify_session_access(
    session_id: str,
    operation: str,
    context: SecurityContext
) -> bool:
    """
    Verify the caller has permission to access this session.
    """
    session = await registry.get(session_id)
    if not session:
        audit_log.warning(f"Access attempt to non-existent session: {session_id}")
        return False

    # In multi-user scenarios, verify user ownership
    if context.user_id and session.owner_id != context.user_id:
        audit_log.warning(
            f"Unauthorized access attempt: user={context.user_id}, "
            f"session={session_id}, owner={session.owner_id}"
        )
        return False

    return True
```

### 3. Storage Security

#### Encryption at Rest
```python
# SECURITY: Optional encryption for stored KV blocks
class EncryptedStorage:
    """
    Wrapper that encrypts KV blocks before storage.
    Uses AES-256-GCM for authenticated encryption.
    """

    def __init__(self, backend: StorageBackend, key: bytes):
        self.backend = backend
        self.cipher_key = key  # 32 bytes for AES-256

    def encrypt_block(self, block: bytes) -> bytes:
        """Encrypt a KV block with authentication."""
        nonce = secrets.token_bytes(12)
        cipher = AESGCM(self.cipher_key)
        ciphertext = cipher.encrypt(nonce, block, None)
        return nonce + ciphertext

    def decrypt_block(self, encrypted: bytes) -> bytes:
        """Decrypt and verify a KV block."""
        nonce = encrypted[:12]
        ciphertext = encrypted[12:]
        cipher = AESGCM(self.cipher_key)
        return cipher.decrypt(nonce, ciphertext, None)
```

#### Secure File Permissions
```python
# SECURITY: Restrict file permissions on stored data
def secure_file_create(path: Path) -> None:
    """Create file with restrictive permissions."""
    path.touch(mode=0o600)  # Owner read/write only

def secure_directory_create(path: Path) -> None:
    """Create directory with restrictive permissions."""
    path.mkdir(mode=0o700, parents=True, exist_ok=True)
```

### 4. Network Security

#### TLS for vLLM Connection
```python
# SECURITY: Enforce TLS for vLLM connections
class SecureVLLMClient:
    def __init__(self, base_url: str, verify_ssl: bool = True):
        if base_url.startswith("http://") and not is_localhost(base_url):
            raise SecurityError(
                "Non-TLS connections only allowed for localhost. "
                "Use https:// for remote servers."
            )

        self.session = aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(ssl=verify_ssl)
        )
```

#### Redis TLS (when applicable)
```python
# SECURITY: TLS for Redis connections
redis_config = {
    "host": "redis.example.com",
    "port": 6379,
    "ssl": True,
    "ssl_cert_reqs": "required",
    "ssl_ca_certs": "/path/to/ca.crt"
}
```

### 5. Audit Logging

#### Security Events
```python
# SECURITY: Comprehensive audit logging
class AuditLogger:
    """Log all security-relevant events."""

    SECURITY_EVENTS = {
        "SESSION_CREATE",
        "SESSION_DELETE",
        "WINDOW_FREEZE",
        "WINDOW_THAW",
        "WINDOW_DELETE",
        "ACCESS_DENIED",
        "VALIDATION_FAILURE",
        "CONFIG_CHANGE",
    }

    def log(
        self,
        event: str,
        session_id: str = None,
        details: dict = None,
        severity: str = "INFO"
    ):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event,
            "session_id": session_id,
            "details": details or {},
            "severity": severity,
        }

        # Write to audit log (append-only, tamper-evident)
        self._write_audit_entry(entry)
```

---

## Vulnerability Mitigations

### SQL Injection

| Vector | Mitigation |
|--------|------------|
| Session ID in query | Parameterized queries only |
| Window name in query | Parameterized queries only |
| Filter parameters | Whitelist allowed values |

```python
# CORRECT: Parameterized query
cursor.execute(
    "SELECT * FROM sessions WHERE id = ?",
    (session_id,)
)

# WRONG: String interpolation (vulnerable)
cursor.execute(f"SELECT * FROM sessions WHERE id = '{session_id}'")
```

### Path Traversal

| Vector | Mitigation |
|--------|------------|
| Window name as filename | Validate, then use UUID internally |
| Storage path | Use safe_path_join() |
| Config file paths | Validate against whitelist |

### Denial of Service

| Vector | Mitigation |
|--------|------------|
| Large context freeze | Size limits, quota enforcement |
| Many concurrent operations | Rate limiting, queue depth limits |
| Memory exhaustion | Tiered storage, automatic eviction |

```python
# SECURITY: Resource limits
class ResourceLimits:
    MAX_CONTEXT_TOKENS = 128_000
    MAX_SESSIONS_PER_USER = 100
    MAX_CONCURRENT_OPERATIONS = 10
    MAX_STORAGE_PER_USER_GB = 10

    @classmethod
    def check_limits(cls, operation: str, context: SecurityContext) -> None:
        """Raise if operation would exceed limits."""
        # Implementation
```

### Information Disclosure

| Vector | Mitigation |
|--------|------------|
| Error messages | Generic messages, details in logs only |
| Timing attacks | cache_salt isolation |
| Storage enumeration | Random UUIDs for internal IDs |

```python
# SECURITY: Safe error handling
def safe_error_response(error: Exception) -> dict:
    """Return user-safe error without internal details."""

    if isinstance(error, ValidationError):
        return {"error": str(error), "code": "VALIDATION_ERROR"}
    elif isinstance(error, NotFoundError):
        return {"error": "Resource not found", "code": "NOT_FOUND"}
    else:
        # Log full error internally
        logger.exception("Internal error")
        # Return generic message
        return {"error": "An internal error occurred", "code": "INTERNAL_ERROR"}
```

---

## Security Configuration

### Recommended Settings

```yaml
# config.yaml - Security settings
security:
  # Enable encryption at rest for stored KV blocks
  encryption_at_rest: true

  # Key derivation (use a secure key management solution in production)
  encryption_key_file: "/secure/path/cwm.key"

  # Require TLS for remote connections
  require_tls: true

  # Session isolation
  enable_cache_salt: true

  # Audit logging
  audit_log_path: "/var/log/cwm/audit.log"
  audit_log_retention_days: 90

  # Resource limits
  max_context_tokens: 128000
  max_sessions: 100
  max_storage_gb: 10

  # Rate limiting
  rate_limit_per_minute: 60
```

### Environment Variables

```bash
# Security-sensitive environment variables
CWM_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
CWM_VLLM_API_KEY=<api-key-if-required>
CWM_REDIS_PASSWORD=<redis-password>
```

---

## Security Checklist

### Before Release

- [ ] All inputs validated against allowlists
- [ ] Parameterized queries for all database operations
- [ ] Path traversal prevention verified
- [ ] TLS required for non-localhost connections
- [ ] Encryption at rest implemented and tested
- [ ] Audit logging complete and tamper-evident
- [ ] Rate limiting implemented
- [ ] Resource quotas enforced
- [ ] Error messages don't leak internal details
- [ ] Dependencies scanned for vulnerabilities
- [ ] Security tests passing

### Periodic Review

- [ ] Review audit logs for anomalies
- [ ] Update dependencies for security patches
- [ ] Rotate encryption keys
- [ ] Review and update threat model
- [ ] Penetration testing

---

## Incident Response

### If a Security Issue is Discovered

1. **Contain**: Disable affected functionality if necessary
2. **Assess**: Determine scope and impact
3. **Notify**: Inform affected users if data was exposed
4. **Remediate**: Fix the vulnerability
5. **Review**: Post-incident analysis and documentation

### Contact

For security issues, please report to: [security contact to be determined]

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-22 | Initial security documentation |
