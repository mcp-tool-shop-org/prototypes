# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| 0.x     | No        |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

Voice Soundboard is a VS Code extension that provides text-to-speech synthesis via a bundled MCP server and local/cloud TTS backends.

- **Data touched:** text entered by the user for synthesis, audio files written to temp directories, WebVTT dialogue exports to workspace
- **Data NOT touched:** no files outside the workspace and temp dirs, no OS credentials
- **Network:** local Python/Kokoro backend has no network egress; HTTP backend (optional) sends text to user-configured cloud TTS API (OpenAI/ElevenLabs)
- **Audio playback:** uses `spawn` with args array (no shell injection) — shell `exec` was replaced in v0.3.0
- **API keys:** stored in VS Code settings (encrypted by VS Code) — never logged or transmitted beyond the configured TTS endpoint
- **No telemetry** is collected or sent
- **No secrets** in source or diagnostics output
