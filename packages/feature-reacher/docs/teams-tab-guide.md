# Feature-Reacher Teams Tab Guide

This guide covers how to install, configure, and use Feature-Reacher as a Microsoft Teams tab.

---

## Overview

Feature-Reacher integrates with Microsoft Teams as a tab application, allowing teams to:
- Run adoption risk audits directly in Teams
- Share audit results in channels
- Access demo mode for instant demonstration

---

## Installation

### For Administrators (Org-wide)

1. Go to **Teams Admin Center**
2. Navigate to **Teams apps** > **Manage apps**
3. Click **Upload new app**
4. Select `feature-reacher-teams.zip`
5. Configure app permissions and availability

### For Users (Sideload)

1. Open Microsoft Teams
2. Click **Apps** in the sidebar
3. Click **Manage your apps** (bottom left)
4. Click **Upload a custom app**
5. Select `feature-reacher-teams.zip`

---

## Tab Types

### Personal Tab (Demo Audit)

- **Location**: Personal app bar
- **URL**: `/teams/tab?view=demo`
- **Purpose**: Quick demo with pre-loaded sample data
- **Best for**: First-time users, demonstrations

### Personal Tab (Full App)

- **Location**: Personal app bar
- **URL**: `/teams/tab`
- **Purpose**: Full Feature-Reacher experience
- **Best for**: Regular use, custom audits

### Configurable Tab (Channels)

- **Location**: Channel tab bar
- **URL**: `/teams/config` (configuration)
- **Purpose**: Team-shared audit workspace
- **Best for**: Collaborative documentation review

---

## User Guide

### Running a Demo Audit

1. Open the **Demo Audit** tab
2. Sample data loads automatically
3. View the top 5 at-risk features
4. Click a feature to see evidence
5. Use **Export** for shareable reports

### Using the Full App

1. Open the **Feature-Reacher** tab
2. Click **Try Demo** for sample data, or
3. Click **Open Full App** for complete features
4. Full app opens in new browser tab

### Adding a Channel Tab

1. Go to the target channel
2. Click **+** to add a tab
3. Search for "Feature-Reacher"
4. Configure:
   - Tab name (default: "Feature-Reacher")
   - Start with demo data (recommended for new channels)
5. Click **Save**

---

## Features in Teams Context

### Available in Tab

- Demo audit with sample data
- View top at-risk features (limited to 5)
- Expand features for evidence
- Export to text/HTML

### Requires Full App

- Upload custom documentation
- Audit history and saved sets
- Compare audits
- Trend visualization
- Settings and data management

---

## Themes

Feature-Reacher automatically adapts to Teams themes:

| Teams Theme | App Appearance |
|-------------|----------------|
| Light | White background, dark text |
| Dark | Dark background, light text |
| High Contrast | Black background, high contrast colors |

Theme changes apply immediately without page refresh.

---

## Privacy in Teams

- **No data sharing**: All audits are stored locally in each user's browser
- **No team sync**: Audit data is not shared between team members
- **Export control**: Users decide what to share via exports
- **No telemetry**: No usage data collected

---

## Troubleshooting

### Tab doesn't load

1. Check internet connection
2. Verify app is installed and enabled
3. Try refreshing the tab
4. Clear browser cache

### Demo data doesn't appear

1. Wait for "Loading..." to complete
2. Check browser console for errors
3. Try the "Try Demo" button

### Export doesn't work

1. Check popup blocker settings
2. Try right-click > "Save as" for exports
3. Use "Open Full App" for more export options

### Theme doesn't match Teams

1. Refresh the tab
2. Check if browser supports CSS variables
3. Report issue if persistent

---

## For Reviewers

### Quick Verification Steps

1. **Install**: Sideload the app
2. **Add personal tab**: Verify both Demo and Full tabs appear
3. **Run demo**: Confirm audit runs automatically
4. **Check evidence**: Expand a feature, verify citations
5. **Test export**: Export to text, verify content
6. **Theme test**: Switch Teams theme, verify app adapts
7. **Add channel tab**: Configure in a channel
8. **Privacy check**: Verify no data leaves the browser

### Expected Behavior

| Action | Expected Result |
|--------|-----------------|
| Open Demo tab | Sample audit loads in ~2 seconds |
| Expand feature | Evidence panel shows citations |
| Click Export | Text/HTML options appear |
| Switch theme | App colors update immediately |
| Open Full App | Browser tab opens to main app |

### Known Limitations

- Full audit history not available in Teams tab
- Custom uploads require full app
- Compare/Trends require full app
- Tab shows max 5 features (link to full app for more)

---

## Support

- **Documentation**: https://feature-reacher.example/support
- **Issues**: https://github.com/mcp-tool-shop-org/feature-reacher/issues
- **Email**: support@feature-reacher.example

---

*Feature-Reacher for Microsoft Teams — Evidence-backed adoption insights, right where your team works.*
