---
title: Command Reference
description: All Portlight commands available through the npm wrapper
sidebar:
  order: 2
---

All Portlight commands work identically through the npm wrapper. Prefix with `npx @mcptoolshop/portlight` (or just `portlight` if installed globally).

## Game commands

| Group | Commands | Description |
|-------|----------|-------------|
| **Setup** | `new`, `captain-select`, `load`, `save` | Create captains (9 types), manage saves |
| **Trading** | `market`, `buy`, `sell`, `cargo` | Inspect prices, trade goods |
| **Navigation** | `routes`, `sail`, `advance`, `port`, `map` | Plan and execute voyages, view the world map |
| **Ship** | `provision`, `repair`, `hire`, `shipyard`, `fleet` | Maintain, upgrade, and manage vessels |
| **Contracts** | `contracts`, `accept`, `obligations`, `abandon` | Commercial agreements |
| **Finance** | `credit`, `repay`, `insure` | Credit, debt, and insurance |
| **Infrastructure** | `infra`, `warehouse`, `broker`, `license` | Build your trade house |
| **Career** | `captain`, `reputation`, `milestones`, `status`, `ledger` | Track progress and standing |
| **World** | `map` | ASCII world map with ports, routes, and regions |
| **Interface** | `tui` | Interactive terminal dashboard (Textual) |
| **Help** | `guide` | In-game command reference |

## Wrapper-specific behavior

The npm wrapper is transparent — it passes all arguments directly to the Portlight binary. There are no wrapper-specific flags or commands.

### Binary location

The cached binary lives at:

- **Linux/macOS:** `~/.cache/mcptoolshop/portlight/`
- **Windows:** `%LOCALAPPDATA%/mcptoolshop/portlight/`

### Updating

When a new Portlight release is published, update the npm package:

```bash
npm install -g @mcptoolshop/portlight@latest
```

The new version will download the updated binary on first run.

### Clearing the cache

If you need to force a fresh download (e.g., after a corrupted download), delete the cache directory for your platform:

```bash
# Linux/macOS
rm -rf ~/.cache/mcptoolshop/portlight/

# Windows (PowerShell)
Remove-Item -Recurse "$env:LOCALAPPDATA\mcptoolshop\portlight\"
```

The next run will re-download and re-verify the binary automatically.

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `Unsupported platform` error | Your OS/architecture is not supported. See the platform table above. On Apple Silicon, try `arch -x86_64 npx @mcptoolshop/portlight ...` |
| Download fails | Check your internet connection. The wrapper downloads from `github.com` — ensure it is not blocked by a firewall or proxy. |
| Checksum mismatch | The download may have been corrupted. Delete the cache directory (see above) and try again. |
| `EACCES` permission error | You may need to fix npm permissions. See the [npm docs on permissions](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally). |

## Security

- Downloads from `github.com` over HTTPS only
- SHA256 checksum verification on every download
- No telemetry, no tracking, no phone-home
- Binary runs with your user permissions — no elevated access needed
