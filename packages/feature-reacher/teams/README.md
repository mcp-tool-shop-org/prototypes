# Feature-Reacher Teams App

This directory contains the Microsoft Teams app manifest and assets.

## Contents

- `manifest.json` - Teams app manifest (v1.16 schema)
- `color.png` - 192x192 color icon (to be created)
- `outline.png` - 32x32 outline icon (to be created)

## Configuration

Before deploying, replace these placeholders in `manifest.json`:

| Placeholder | Description |
|-------------|-------------|
| `{{TEAMS_APP_ID}}` | Unique GUID for the Teams app |
| `{{AAD_APP_ID}}` | Azure AD app registration ID |

## Generate App ID

```bash
# Generate a new GUID for Teams app
uuidgen  # or use online generator
```

## Icon Requirements

### color.png (192x192)
- Full-color app icon
- PNG format
- Used in Teams app gallery

### outline.png (32x32)
- Single-color (white) outline
- Transparent background
- PNG format
- Used in Teams activity bar

## Building the Package

```bash
cd teams
zip -r feature-reacher-teams.zip manifest.json color.png outline.png
```

## Deployment

1. Go to Teams Admin Center
2. Navigate to Teams apps > Manage apps
3. Click "Upload new app"
4. Select `feature-reacher-teams.zip`

Or for development:
1. Open Teams
2. Click Apps > Manage your apps
3. Click "Upload a custom app"
4. Select the zip file

## Tab URLs

| Tab | URL | Purpose |
|-----|-----|---------|
| Personal (Demo) | `/teams/tab?view=demo` | Auto-loads demo data |
| Personal (App) | `/teams/tab` | Full app experience |
| Configurable | `/teams/config` | Tab configuration page |

## Testing

1. Sideload the app in Teams
2. Add the personal tab
3. Verify demo loads automatically
4. Test audit workflow
5. Verify exports work in iframe context
