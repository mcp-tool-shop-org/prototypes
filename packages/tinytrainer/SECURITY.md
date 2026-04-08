# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

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

This tool operates **locally only**.
- **Data touched:** training data (text + labels), model checkpoints (.pt, .onnx, .mlpackage), configuration JSON files. All written to user-specified `--output` directory.
- **Network:** Downloads sentence-transformers backbone model on first use (from Hugging Face Hub). No other network egress.
- **No secrets handling** — does not read, store, or transmit credentials
- **No telemetry** is collected or sent
