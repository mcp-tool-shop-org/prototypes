# Architecture

## Layers
### LinuxDevTyper.Core (portable)
- Typing session engine
- Snippet model + selection
- Progression (XP/level)
- Interfaces (contracts):
  - IStorage
  - IAssetProvider

### LinuxDevTyper.App (Avalonia)
- UI + input
- JSON file persistence implementation
- Local asset discovery/loader
