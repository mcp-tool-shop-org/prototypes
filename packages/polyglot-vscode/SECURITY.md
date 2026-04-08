# Security Policy

## Reporting a Vulnerability

If you discover a security issue in this extension, please report it responsibly:

- **Report to:** [GitHub Issues](https://github.com/mcp-tool-shop-org/polyglot-vscode/issues) (for non-sensitive issues)
- **Response time:** We aim to acknowledge reports within 48 hours

## Scope

Polyglot VS Code is a local translation extension. Its threat model covers:

- **Data privacy** — all translation is local via Ollama, no data leaves the machine
- **Ollama communication** — connects only to localhost by default (`http://localhost:11434`)
- **File operations** — creates translated files alongside originals, never overwrites

## What This Extension Does NOT Do

- No cloud API calls (all processing is local GPU via Ollama)
- No data collection or telemetry
- No network requests except to local Ollama server
- No secrets or credentials in the codebase

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| 0.1.x   | No        |
