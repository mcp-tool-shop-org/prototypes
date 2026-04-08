# Feature-Reacher Security & Privacy Brief

**Document Version:** 1.0
**Last Updated:** February 2026

---

## Overview

Feature-Reacher is designed with privacy-first principles. This document outlines our security posture and data handling practices for enterprise evaluation.

---

## Architecture

### Client-Side Processing

Feature-Reacher operates entirely in the user's browser. All analysis is performed client-side using JavaScript, with no server-side processing required for core functionality.

```
User Browser
├── IndexedDB (local storage)
├── Analysis Engine (client-side)
└── Export (user-initiated)
```

### No Backend Dependency

- No authentication servers
- No database servers
- No API calls for analysis
- No telemetry collection

---

## Data Handling

### What Data Is Processed

| Data Type | Description | Storage Location |
|-----------|-------------|------------------|
| Artifact Content | Text pasted or uploaded by user | Browser IndexedDB |
| Audit Results | Extracted features, scores, diagnoses | Browser IndexedDB |
| User Preferences | Auto-save toggle, UI settings | Browser IndexedDB |

### What Data Is NOT Collected

- Personal information
- Usage analytics
- Session recordings
- Advertising identifiers
- Cross-site tracking data

---

## Data Retention

### Default Behavior

Data persists in browser IndexedDB until explicitly deleted by the user. There is no automatic expiration or cloud sync.

### User Controls

Users can:
- Delete individual audits from History
- Delete individual artifact sets
- Purge all local data from Settings
- Clear browser data (removes all app data)

### No Remote Access

Feature-Reacher developers have no access to user data. Data cannot be recovered once deleted.

---

## Third-Party Services

### Runtime Dependencies

| Service | Purpose | Data Shared |
|---------|---------|-------------|
| Google Fonts | Typography (Geist) | Standard font request headers |

### No Analytics or Tracking

Feature-Reacher does not use:
- Google Analytics
- Mixpanel
- Amplitude
- Segment
- Any advertising SDK

---

## Export Security

### User-Initiated Only

Reports are only generated when the user explicitly clicks an export button. No automatic transmission of data occurs.

### Export Formats

- **Plain Text**: No embedded metadata
- **HTML**: Self-contained, no external requests
- **PDF**: User-generated via browser print

### Sharing Responsibility

Once exported, the user is responsible for the security of the report file. Feature-Reacher has no visibility into how exports are shared.

---

## Browser Security Model

Feature-Reacher relies on standard browser security mechanisms:

### IndexedDB Isolation

- Data is origin-bound (same-origin policy)
- Other websites cannot access Feature-Reacher data
- Data is not shared across browser profiles

### Content Security Policy

The application implements CSP headers to prevent:
- Cross-site scripting (XSS)
- Clickjacking
- Mixed content attacks

---

## Compliance Considerations

### GDPR

- **Data Minimization**: Only processes data explicitly provided by user
- **Storage Limitation**: User controls retention via delete functions
- **Right to Erasure**: Full data purge available in Settings

### SOC 2

Not applicable—no server infrastructure to audit.

### HIPAA

Feature-Reacher is not intended for processing protected health information (PHI). Users should not upload documents containing PHI.

---

## Vulnerability Reporting

Security issues can be reported to:
- GitHub Issues: [mcp-tool-shop-org/feature-reacher](https://github.com/mcp-tool-shop-org/feature-reacher/issues)
- Email: security@feature-reacher.example

We aim to acknowledge reports within 48 hours.

---

## License

Feature-Reacher is open source under the MIT License. Source code is available for security review at:

[https://github.com/mcp-tool-shop-org/feature-reacher](https://github.com/mcp-tool-shop-org/feature-reacher)

---

*Feature-Reacher — Your data stays yours*
