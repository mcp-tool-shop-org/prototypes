# Compatibility Fixtures

This directory contains minimal, valid registry snapshots used for contract testing.

- **registry.v1.minimal.json**: Smallest possible valid v1 registry.
- **registry.v1.deprecated.json**: Stubs for testing deprecation handling.
- **registry.v1.bundles.json**: Exercises bundle rules and tag parsing.

These fixtures are used by `test:compat` to ensure that even weird or obsolete but valid configurations do not break the build pipeline.
