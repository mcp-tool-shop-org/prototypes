# Upgrade & Rollback Playbook

How to upgrade each component safely and roll back if something breaks.

**Principle:** If something breaks, you can get back to yesterday in under 5 minutes.

---

## SDK upgrade

### Upgrade

```bash
# Update the package reference
dotnet add package Soundboard.Client --version 1.0.1

# Build and test your project
dotnet build
dotnet test
```

### Roll back

```bash
# Revert to the previous version
dotnet add package Soundboard.Client --version 1.0.0
dotnet build
```

### What can break

| SDK change | Risk | Detection |
|---|---|---|
| Patch (1.0.x) | None — bug fixes only | Contract tests pass |
| Minor (1.x.0) | Low — additive features | Contract tests pass, new APIs optional |
| Major (x.0.0) | High — breaking changes | Contract tests may fail, CHANGELOG documents migration |

---

## Engine upgrade

### Upgrade

```bash
cd voice-soundboard

# Note current version for rollback
git log --oneline -1 > .last-known-good

# Pull new version
git pull origin main
# Or checkout a specific tag
git checkout v1.2.0

# Restart
python main.py

# Verify
curl http://localhost:8765/api/health
dotnet test tests/Soundboard.IntegrationTests
```

### Roll back

```bash
cd voice-soundboard

# Restore previous version
git checkout $(cat .last-known-good | cut -d' ' -f1)

# Restart
python main.py
```

### What can break

| Engine change | Risk | Detection |
|---|---|---|
| New voices/presets added | None | SDK discovers at runtime |
| Voices/presets removed | Low — `SpeakAsync` may use unknown preset | App shows error, user picks different preset |
| API response format changed | High | Contract tests fail |
| Default port changed | Medium | SDK can't connect, `HttpRequestException` |

---

## MAUI reference client upgrade

### Upgrade

```bash
cd soundboard-maui
git pull origin main
dotnet build src/Soundboard.Maui
```

### Roll back

```bash
git checkout <previous-commit>
dotnet build src/Soundboard.Maui
```

### Version display

The MAUI app shows engine version and API version in the status bar after connecting. This makes it easy to verify which versions are running.

---

## Cross-component upgrade order

When upgrading multiple components, follow this order:

1. **Engine first.** Start the new engine version.
2. **Run contract tests.** `dotnet test tests/Soundboard.IntegrationTests`
3. **SDK second.** Update the package reference.
4. **Client last.** Rebuild the MAUI app or CLI.

This order ensures each layer is validated before the next depends on it.

---

## Emergency rollback (everything broken)

```bash
# 1. Roll back engine
cd voice-soundboard
git checkout <last-known-good-commit>
python main.py

# 2. Roll back SDK (in your project)
dotnet add package Soundboard.Client --version <previous-version>

# 3. Roll back client
cd soundboard-maui
git checkout <last-known-good-commit>
dotnet build src/Soundboard.Maui

# 4. Verify
curl http://localhost:8765/api/health
dotnet test tests/Soundboard.IntegrationTests
```

Total time: under 5 minutes.

---

## Version pinning summary

| Component | Pin mechanism | Location |
|---|---|---|
| SDK | NuGet package version | Your `.csproj` |
| Engine | Git commit or tag | `voice-soundboard/` directory |
| MAUI client | Git commit | `soundboard-maui/` directory |

**No silent upgrades. No auto-updates. Every version change is explicit.**
