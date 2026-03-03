# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

**Email:** 64996768+mcp-tool-shop@users.noreply.github.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

ai-music-sheets is a **TypeScript library** of piano sheet music in hybrid JSON format.
- **Data accessed:** Reads MIDI files and JSON configs from local filesystem during song ingestion. Ships built-in song data as static TypeScript modules.
- **Data NOT accessed:** No network requests. No telemetry. No user data storage. No credentials or tokens.
- **Permissions required:** Read access to MIDI/JSON source files during build. No runtime permissions needed — library exports are pure functions over static data.
