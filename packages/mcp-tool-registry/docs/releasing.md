# Release Process

This document outlines the workflow for releasing updates to the MCP Tool Registry.

## Release Policy

We follow a disciplined release process to ensure downstream consumers (like `mcpt` CLI or AI Agents) always receive valid, high-quality registry data.

## Automation & Gates

Every change pushed to `main` or tagged for release runs the following checks via GitHub Actions:

- **Validation**: Schema compliance (`npm run validate`).
- **Policy**: Linting for best practices (`npm run policy`).
- **Compatibility**: Backwards compatibility tests (`npm run check:compat`).
- **Quality Gates**: Health Report SLOs (`npm run report:health --check-slo`).

## Release Checklist

1. **Verify HEAD is Green**
   Ensure the latest commit on `main` has passed all CI checks.

   ```bash
   npm run test
   ```

2. **Update Metadata (Optional)**
   - If introducing schema changes, bump `schema_version` in `registry.json`.
   - Update `CHANGELOG.md` with new tools or policy changes.

3. **Bump Package Version**

   ```bash
   npm version patch  # or minor/major
   ```

4. **Publish**
   ```bash
   npm publish
   ```
   _Note: `prepack` script will automatically run the full test suite and build derived metadata before publishing. If tests fail, publish is aborted._

## Emergency Rollback

If a bad release occurs:

1. Revert the commit in `main`.
2. Bump patch version.
3. Publish new version immediately.
4. Deprecate the bad version in `npm`.

## Provenance

All releases include a `commit_sha` in `dist/derived.meta.json` linking the artifact to the git history.
