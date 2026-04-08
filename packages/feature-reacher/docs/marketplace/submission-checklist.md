# Feature-Reacher Marketplace Submission Checklist

**Last updated:** February 2026
**Target:** Microsoft AppSource / Azure Marketplace (SaaS + Teams offer)

---

## Pre-Submission Requirements

### 1. Partner Center Account

- [ ] Microsoft Partner Network (MPN) ID registered
- [ ] Partner Center account verified
- [ ] Commercial marketplace program enrolled
- [ ] Bank/tax information on file

### 2. Offer Configuration

- [ ] Offer type: SaaS + Teams app
- [ ] Offer alias: `feature-reacher`
- [ ] Primary category: Productivity > Content & Files
- [ ] Secondary category: IT & Management > Analytics
- [ ] Teams app ID: Generate new GUID
- [ ] Azure AD app registration (for Teams SSO if needed)

---

## Listing Content

### Required Images

| Asset | Dimensions | File | Status |
|-------|------------|------|--------|
| Logo (216×216) | 216×216 px PNG | `logo-216.png` | [ ] Created |
| Logo (48×48) | 48×48 px PNG | `logo-48.png` | [ ] Created |
| Hero image | 1280×720 px PNG | `hero-1280x720.png` | [ ] Created |
| Screenshot 1 | 1280×720 px | `screenshot-01-landing.png` | [ ] Created |
| Screenshot 2 | 1280×720 px | `screenshot-02-audit.png` | [ ] Created |
| Screenshot 3 | 1280×720 px | `screenshot-03-detail.png` | [ ] Created |
| Screenshot 4 | 1280×720 px | `screenshot-04-compare.png` | [ ] Created |
| Screenshot 5 | 1280×720 px | `screenshot-05-trends.png` | [ ] Created |

### Listing Copy

| Field | Character Limit | File Reference | Status |
|-------|-----------------|----------------|--------|
| Short description | 100 chars | `listing-copy.md` | [x] Written |
| Long description | 3000 chars | `listing-copy.md` | [x] Written |
| Keywords | 3 minimum | `listing-copy.md` | [x] Listed |

### Supporting Documents (PDF)

| Document | Purpose | File | Status |
|----------|---------|------|--------|
| Product overview | 1-page summary | `01-overview.md` → PDF | [x] Written |
| Sample audit | Example output | `02-sample-audit.md` → PDF | [x] Written |
| Security brief | Privacy/security | `03-security-privacy.md` → PDF | [x] Written |

---

## Legal & Support

### Required Pages

| Page | URL | Purpose | Status |
|------|-----|---------|--------|
| Privacy Policy | `/privacy` | Data handling disclosure | [x] Live |
| Terms of Service | `/terms` | Usage terms | [x] Live |
| Support | `/support` | Contact info, FAQ | [x] Live |

### Support Configuration

- [ ] Support email: `support@feature-reacher.example`
- [ ] Support URL: `https://feature-reacher.example/support`
- [ ] Response time SLA documented (2-3 business days)

---

## Technical Validation

### Application URLs

| URL | Purpose | Status |
|-----|---------|--------|
| `/landing` | Public landing page | [x] Live |
| `/demo` | Demo with auto-loaded data | [x] Live |
| `/methodology` | Scoring explanation | [x] Live |
| `/settings` | Data handling controls | [x] Live |
| `/teams/tab` | Teams tab (full app) | [x] Live |
| `/teams/tab?view=demo` | Teams tab (demo) | [x] Live |
| `/teams/config` | Teams tab configuration | [x] Live |

### Functionality Checklist

- [x] Demo loads without authentication
- [x] Audit completes successfully
- [x] Export functions work
- [x] History/compare/trends functional
- [x] Error boundaries catch failures
- [x] Onboarding tour shows on first visit
- [x] Teams tab loads in iframe
- [x] Teams demo auto-runs audit
- [x] Teams theme adaptation works

### Performance

- [ ] Lighthouse score > 90 (Performance)
- [ ] Lighthouse score > 90 (Accessibility)
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s

---

## Test Account / Demo Instructions

**For certification reviewers:**

```
1. Navigate to https://feature-reacher.example/demo
2. Demo data loads automatically
3. Audit runs within 2 seconds
4. Review results:
   - Expand HIGH risk feature to see evidence
   - Click "Export" → "Executive Summary"
5. Navigate to /history to see saved audits
6. Navigate to /compare to see audit diff
7. Navigate to /methodology to understand scoring
8. Navigate to /settings to see data controls
```

**No account required. No authentication flow.**

---

## Teams App Submission

### Teams Package

| Asset | Location | Status |
|-------|----------|--------|
| Manifest | `teams/manifest.json` | [x] Created |
| Color icon (192×192) | `teams/color.png` | [ ] Create from SVG |
| Outline icon (32×32) | `teams/outline.png` | [ ] Create from SVG |
| Icon source | `teams/icon-source.svg` | [x] Created |

### Teams Configuration

- [ ] Replace `{{TEAMS_APP_ID}}` with generated GUID
- [ ] Replace `{{AAD_APP_ID}}` with Azure AD app ID
- [ ] Update `validDomains` with production domain
- [ ] Update URLs in manifest to production

### Teams Build

```bash
cd teams
# Convert SVGs to PNGs (use tool of choice)
# Create zip package
zip -r feature-reacher-teams.zip manifest.json color.png outline.png
```

### Teams Submission

1. Go to **Partner Center** > **Marketplace offers**
2. Select your SaaS offer
3. Go to **Teams app integration**
4. Upload `feature-reacher-teams.zip`
5. Complete Teams-specific listing details

### Teams Reviewer Notes

```
1. Install app in Teams (sideload or admin upload)
2. Add personal tab "Demo Audit"
3. Verify demo loads automatically (~2 seconds)
4. Expand a feature to see evidence
5. Test Export functionality
6. Switch Teams theme (dark/light) - verify app adapts
7. Add configurable tab to a channel
8. Verify configuration UI works
```

---

## Certification Policies

### Microsoft Requirements (SaaS offers)

| Requirement | How We Meet It | Status |
|-------------|----------------|--------|
| Accurate listing | Copy reviewed for accuracy | [x] |
| Supportable offer | Support page + email | [x] |
| Functional app | Demo works without auth | [x] |
| Privacy policy | /privacy page | [x] |
| Terms of service | /terms page | [x] |
| Supporting docs | 3 PDF documents | [x] |

### Data Handling Disclosures

- [x] Data stored locally (IndexedDB)
- [x] No external transmission
- [x] User can delete data
- [x] No account/authentication required
- [x] Export is user-initiated

---

## Post-Submission

### After Certification

- [ ] Monitor for certification feedback
- [ ] Respond to any reviewer questions within 48 hours
- [ ] Update screenshots if UI changes
- [ ] Publish when approved

### Ongoing Maintenance

- [ ] Review listing copy quarterly
- [ ] Update supporting PDFs with major releases
- [ ] Monitor support email for issues
- [ ] Track listing analytics in Partner Center

---

## Quick Reference

### Partner Center Links

- Offer overview: Partner Center > Commercial Marketplace > Overview
- Offer setup: Partner Center > Commercial Marketplace > Offer setup
- Offer listing: Partner Center > Commercial Marketplace > Offer listing

### Asset Locations

```
/docs/marketplace/
├── 01-overview.md          # One-pager
├── 02-sample-audit.md      # Sample report
├── 03-security-privacy.md  # Security brief
├── listing-copy.md         # Listing text
└── submission-checklist.md # This file

/docs/
└── teams-tab-guide.md      # Teams tab user guide

/teams/
├── manifest.json           # Teams app manifest
├── icon-source.svg         # Color icon source
├── outline-source.svg      # Outline icon source
└── README.md               # Teams package docs
```

### Key Contacts

- Technical: [GitHub Issues](https://github.com/mcp-tool-shop-org/feature-reacher/issues)
- Support: support@feature-reacher.example
- Listing: [Partner Center](https://partner.microsoft.com/)

---

### Dual Listing Benefits

Submitting both SaaS and Teams offers:
- Increased discoverability (AppSource + Teams store)
- Native Teams experience for enterprise users
- Signals ecosystem alignment to Microsoft
- Gives reviewers a familiar surface to test

---

*Feature-Reacher — Ready for Marketplace (SaaS + Teams)*
