# Feature-Reacher Marketplace Submission Roadmap

## Current Status: 80% Complete

---

## Phase 1: Screenshots (IN PROGRESS)

### Completed
- [x] `screenshot-01-landing.png` - Landing page with hero
- [x] `screenshot-02-audit.png` - Demo audit summary (40 features, 17 high risk)
- [x] `screenshot-03-features.png` - Feature cards with "What's Next?"

### Remaining
- [ ] `screenshot-04-methodology.png` - Scoring methodology page
- [ ] `screenshot-05-teams.png` - Teams tab demo view

**Location:** `docs/marketplace/screenshots/`

**Quick capture:** On each page, press `F12` → `Ctrl+Shift+P` → "Capture screenshot"

| # | URL | Description |
|---|-----|-------------|
| 4 | `/methodology` | Scoring explanation page |
| 5 | `/teams/tab?view=demo` | Teams tab with audit |

---

## Phase 2: Icon Assets

### Required Files
- [ ] `color.png` (192x192) - Full color app icon
- [ ] `outline.png` (32x32) - Monochrome outline for Teams

### Source Files (already exist)
- `teams/icon-source.svg` - Color source
- `teams/outline-source.svg` - Outline source

### Conversion Command
```bash
# Using ImageMagick or online converter
magick teams/icon-source.svg -resize 192x192 teams/color.png
magick teams/outline-source.svg -resize 32x32 teams/outline.png
```

---

## Phase 3: Teams Package

### Build the ZIP
```bash
cd teams
zip -r ../feature-reacher-teams.zip manifest.json color.png outline.png
```

### Validate
1. Go to https://dev.teams.microsoft.com/apps
2. Click "Import app" → upload ZIP
3. Fix any validation errors

---

## Phase 4: Partner Center Submission

### SaaS App (AppSource)
1. [ ] Upload 5 screenshots to Store Listings
2. [ ] Set pricing (Free)
3. [ ] Complete age ratings
4. [ ] Submit for certification

### Teams Tab (Teams Store)
1. [ ] Upload Teams ZIP package
2. [ ] Add Teams-specific screenshots
3. [ ] Submit for Teams certification

---

## Phase 5: Post-Submission

- [ ] Monitor certification status (3-5 business days)
- [ ] Respond to any reviewer feedback
- [ ] Prepare v1.0.1 hotfix branch if needed

---

## Quick Actions Checklist

```
[ ] Capture screenshot-04-methodology.png
[ ] Capture screenshot-05-teams.png
[ ] Convert SVG icons to PNG
[ ] Build Teams ZIP
[ ] Upload to Partner Center
[ ] Submit
```

---

## Files Ready for Upload

| Asset | Path | Status |
|-------|------|--------|
| Privacy Policy | `/privacy` | ✅ Live |
| Terms of Service | `/terms` | ✅ Live |
| Support Page | `/support` | ✅ Live |
| Landing Page | `/landing` | ✅ Live |
| Demo | `/demo` | ✅ Live |
| Teams Tab | `/teams/tab` | ✅ Live |

---

## Estimated Time to Completion

| Task | Time |
|------|------|
| Remaining screenshots | 5 min |
| Icon conversion | 5 min |
| Teams ZIP build | 2 min |
| Partner Center upload | 15 min |
| **Total** | **~30 min** |
