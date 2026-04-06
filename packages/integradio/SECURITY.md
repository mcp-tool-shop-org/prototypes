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

Integradio is a **local-first** Python library for vector-embedded Gradio components.

- **Data accessed:** Gradio component metadata, local Ollama embeddings (via nomic-embed-text), HNSW vector index stored in-process
- **Data NOT accessed:** No cloud sync. No telemetry. No analytics. No external API calls beyond local Ollama
- **Permissions:** Network to local Ollama only. No file system access beyond optional persistence. No elevated permissions required
- **No telemetry** is collected or sent
