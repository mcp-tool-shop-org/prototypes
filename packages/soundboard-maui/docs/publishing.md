# Publishing the SDK

How to release `Soundboard.Client` to NuGet.

## Prerequisites

- NuGet API key with push permissions for `Soundboard.Client`
- All tests passing: `dotnet test`
- CHANGELOG.md updated with release notes

## Publish gate

A release is blocked unless:

1. `dotnet test tests/Soundboard.Client.Tests` passes (27 unit tests)
2. `dotnet test tests/Soundboard.IntegrationTests` passes (17 contract tests)
3. `SoundboardClient.SdkApiVersion` matches the contract version in `docs/api-contract.md`
4. `CHANGELOG.md` has an entry for the new version
5. Compatibility matrix in `docs/compatibility.md` is updated

## Release steps

```bash
# 1. Verify tests pass
dotnet test

# 2. Build the package
dotnet pack src/Soundboard.Client --configuration Release

# 3. Inspect the package
dotnet nuget verify src/Soundboard.Client/bin/Release/Soundboard.Client.*.nupkg

# 4. Push to NuGet
dotnet nuget push src/Soundboard.Client/bin/Release/Soundboard.Client.*.nupkg \
  --api-key YOUR_API_KEY \
  --source https://api.nuget.org/v3/index.json

# 5. Tag the release
git tag v1.0.0
git push origin v1.0.0

# 6. Create GitHub release
gh release create v1.0.0 --title "Soundboard SDK v1.0.0" --notes-file CHANGELOG.md
```

## Version bumping

| Change type | Version bump | Example |
|---|---|---|
| Bug fix, no API change | Patch: 1.0.0 → 1.0.1 | Fix WebSocket reconnect edge case |
| New optional feature, no breaking change | Minor: 1.0.0 → 1.1.0 | Add `SpeakAsync` overload with emotion parameter |
| Breaking API change | Major: 1.0.0 → 2.0.0 | Change `ISoundboardClient` interface shape |

Update version in:
- `src/Soundboard.Client/Soundboard.Client.csproj` (`<Version>`)
- `docs/api.md` (header)
- `CHANGELOG.md` (new section)
- `docs/compatibility.md` (matrix row)

## What NOT to do

- Never publish without passing contract tests
- Never skip the CHANGELOG entry
- Never publish a major version without updating the compatibility matrix
- Never publish from a dirty working tree
