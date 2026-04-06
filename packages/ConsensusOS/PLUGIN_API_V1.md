# Plugin API v1 Draft

Each plugin must implement:

- registerCapabilities()
- registerInvariants()
- registerEventHandlers()
- initialize(context)
- shutdown()

Plugins must declare:
- Required permissions
- Compatible adapters
- Version compatibility

All state mutations must pass through:
core.registerTransition()