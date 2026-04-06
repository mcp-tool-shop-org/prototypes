# Release Notes

## v0.6.2 (2026-01-23) - Beta Release

### Highlights

This is the first beta release of Context Window Manager, marking the completion of Phase 6 (Production Hardening) and Phase 7 (Integration & Polish). The system is now ready for testing in real-world environments.

### New Features

#### MCP Tools (12 total)
- **Core Operations**: `window_freeze`, `window_thaw`, `window_list`, `window_status`, `window_clone`, `window_delete`
- **Session Management**: `session_list`
- **Monitoring**: `cache_stats`, `health_check`, `get_metrics_data`
- **Auto-Freeze**: `auto_freeze_config`, `auto_freeze_check`

#### Production Hardening (Phase 6)
- **Error Handling**: Comprehensive error taxonomy (CWM-1xxx through CWM-9xxx) with retryable errors and exponential backoff
- **Monitoring**: Prometheus-compatible metrics, health checks, structured logging
- **Security**: Input sanitization (path traversal, shell injection, SQL injection prevention), session isolation, audit logging, rate limiting
- **Performance**: Connection pooling, concurrency limiting, async batching, in-memory caching

#### Documentation
- `USER_GUIDE.md`: Getting started, workflows, troubleshooting
- `API.md`: Complete API reference with all tools, error codes, session states
- `CLAUDE_CODE_INTEGRATION.md`: Claude Code setup, hooks, best practices
- `ARCHITECTURE.md`: System design deep-dive
- `SECURITY.md`: Security considerations and mitigations

### Test Coverage

- **366 tests** passing
- Full coverage of core modules, error handling, monitoring, security, and performance

### Breaking Changes

None - this is the first public beta release.

### Known Issues

- vLLM connection required for actual KV cache operations (standalone mode supports metadata operations only)
- Redis storage tier is stubbed (not fully implemented)
- Storage encryption at rest is deferred (requires key management)

### Upgrade Path

```bash
pip install --upgrade context-window-manager
```

### Configuration

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### Requirements

- Python 3.11+
- vLLM server with prefix caching enabled
- LMCache configured (for KV cache persistence)

### Contributors

- AI Development Lab

---

## Version History

| Version | Date | Summary |
|---------|------|---------|
| 0.6.2 | 2026-01-23 | Beta release - Documentation complete |
| 0.6.1 | 2026-01-23 | Production hardening - Error handling, monitoring, security, performance |
| 0.5.0 | 2026-01-23 | Clone, enhanced list/status, auto-freeze |
| 0.4.0 | 2026-01-23 | Thaw enhancements, model compatibility |
| 0.3.0 | 2026-01-23 | WindowManager, freeze/thaw implementation |
| 0.2.0 | 2026-01-23 | Core infrastructure + MCP server |
| 0.1.0 | 2026-01-22 | Initial project setup |
