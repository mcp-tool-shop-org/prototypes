# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting a Vulnerability

To report a vulnerability, please use GitHub's private vulnerability reporting feature: go to the Security tab of this repository and click "Report a vulnerability".

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Response timeline:**
- Acknowledgment: within 48 hours
- Assessment: within 7 days
- Fix (if confirmed): within 30 days

## Scope

Civility Kernel is a **policy layer library** for preference-governed agent behavior.
- **Data accessed:** Reads JSON policy files from local filesystem. Validates, canonicalizes, and diffs policy documents in-process. All operations are deterministic and side-effect free.
- **Data NOT accessed:** No network requests. No telemetry. No cloud services. No credential storage. No runtime data collection. The kernel evaluates policy constraints — it does not observe or log agent actions.
- **Permissions required:** File system read access for policy JSON files. No write access required for the library itself (policy-check CLI writes only when explicitly requested via `--apply`).
