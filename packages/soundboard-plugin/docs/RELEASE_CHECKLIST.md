# Release Checklist

Before publishing a new version, verify all gates pass.

## Pre-Release Gates

- [ ] All tests pass: `pytest tests/ -v`
- [ ] Malicious input battery passes: `pytest tests/test_security.py -v`
- [ ] Dependency audit clean: `pip-audit` (no known vulnerabilities)
- [ ] No `FIXME` in security-critical paths (bridge, limits, retention, security/)
- [ ] CHANGELOG.md updated with release notes
- [ ] Version bumped in `pyproject.toml` and `voice_soundboard_plugin/__init__.py`
- [ ] SECURITY.md reviewed and current
- [ ] Lockfile regenerated if dependencies changed
- [ ] Manual smoke test: `/soundboard:speak "Hello world"` produces audio

## Release

- [ ] Git tag created: `git tag v{version}`
- [ ] Pushed: `git push origin main --tags`
- [ ] GitHub release published from tag with changelog excerpt

## Automated Gate

Run the ship gate script to automate the verifiable checks:

```bash
python scripts/ship_gate.py
```

This runs the test suite and dependency audit, exiting non-zero on any failure.
