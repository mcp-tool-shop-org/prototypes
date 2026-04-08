# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | :white_check_mark: Current |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

1. **Do NOT** open a public issue for security vulnerabilities
2. Email the address above with a detailed description
3. Include steps to reproduce if applicable

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

File Compass is a **local-first** semantic file search tool and MCP server.

- **Data accessed:** Local file contents for indexing, HNSW vector index stored locally, SQLite metadata database, Ollama embeddings (local inference)
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No external API calls beyond local Ollama
- **Permissions:** File system read for indexing directories, file system write for index storage. Path traversal protection enforced on all inputs
- **No telemetry** is collected or sent
