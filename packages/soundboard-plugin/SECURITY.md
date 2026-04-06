# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Overview

This plugin is a **local stdio MCP server** that converts text to speech via
the voice-soundboard engine. It runs entirely on the user's machine with no
network access, no authentication, and no remote API calls.

## Threat Model Summary

The plugin accepts tool calls from Claude Code over stdio (JSON-RPC), processes
text through a speech pipeline (chunking, SSML parsing, emotion markup, dialogue
casting), delegates synthesis to a local voice engine, and plays the resulting
WAV file. See [docs/SECURITY_THREAT_MODEL.md](docs/SECURITY_THREAT_MODEL.md)
for the full threat model with trust boundaries, assets, and mitigations.

## Security Properties

- **Input validation**: All text inputs are bounded (10,000 chars max). SSML,
  emotion spans, dialogue lines, SFX tags, and chunk counts each have enforced
  limits. Speed is clamped to [0.5, 2.0].
- **Voice allowlist**: Only 12 pre-approved voices are accepted. Unknown voices
  are rejected with `VoiceRejectedError`.
- **No secrets in logs**: Logging contains no tokens, passwords, or credentials.
  The inner monologue subsystem redacts paths, API tokens, IPs, base64 blobs,
  and key=value secrets before storage.
- **No stack traces to client**: All exceptions are caught and returned as
  structured error objects with error codes and trace IDs. Full stack traces go
  to stderr only.
- **Path containment**: WAV output is sandboxed to a dedicated output root
  directory. Path traversal attempts are rejected.
- **Playback safety**: Single-thread playback queue with a 30-second watchdog
  timer prevents audio hangs.
- **Concurrency control**: Synthesis is serialized (max 1 concurrent operation)
  to prevent resource exhaustion.

## Scope Exclusions

This plugin does **not**:
- Handle authentication or authorization
- Make network requests or connect to remote services
- Process untrusted web input (input comes from Claude Code only)
- Store persistent user data beyond ephemeral WAV files

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **Preferred**: Open a [private Security Advisory](https://github.com/mcp-tool-shop-org/soundboard-plugin/security/advisories/new) on GitHub.
2. **Alternative**: Email security concerns to the maintainer via GitHub profile.

Please **do not** open public issues for security vulnerabilities.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation
plan within 7 days for confirmed vulnerabilities.
