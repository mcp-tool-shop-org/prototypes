# Training Studio Bundle Compatibility

## Versioning Rules (v0.1)

1. **MAJOR** changes (0.x → 1.x): Breaking schema changes, removed fields
2. **MINOR** changes (0.1 → 0.2): New optional fields, additive changes only
3. Readers MUST reject bundles with unsupported major versions
4. Readers SHOULD accept bundles with higher minor versions (ignore unknown fields)
5. Writers MUST include all required fields for their declared version
6. `bundle_digest` changes when any artifact content or metadata changes
7. `bundle_id` is immutable once created; re-exports create new bundles
8. Validators exit 0 (valid), 2 (valid+warnings), 3 (invalid)

## Bundle Digest Canonicalization

The `bundle_digest` is a SHA-256 hash computed from a canonical string representation.

### Algorithm

```
canonical = "bundle_version:{version}\n"
for artifact in sorted(artifacts, key=path):
    canonical += "{artifact.path}\n{artifact.sha256}\n{artifact.size_bytes}\n"
bundle_digest = sha256(canonical)
```

### Rules

1. **Hash algorithm**: SHA-256 only (lowercase hex, 64 characters)
2. **Path normalization**: Forward slashes only (`/`), no leading `./`
3. **Path sorting**: Bytewise ASCII sort via `localeCompare()` (locale-free)
4. **Case sensitivity**: Paths are case-sensitive (no normalization)
5. **Forbidden paths**: No `..`, no absolute paths, no symlinks
6. **Manifest excluded**: `bundle.json` is NOT included in digest computation
7. **Line ending**: LF only (`\n`), no trailing newline after last artifact

### What Changes the Digest

- Any artifact content change (different sha256)
- Any artifact size change
- Adding or removing artifacts
- Renaming artifact paths
- Changing bundle_version

### What Does NOT Change the Digest

- Manifest metadata (created_utc, app info, training metrics)
- File modification times or filesystem ordering
- Compression or encoding differences (if content hash unchanged)

## Validation Edge Cases

| Condition | Result |
|-----------|--------|
| Symlinks in bundle | Error: `E_IO_READ` |
| Unreadable files | Error: `E_IO_READ` |
| Files not in manifest | Warning: `W_UNLISTED_FILE` |
| Files in manifest not on disk | Error: `E_ARTIFACT_MISSING` |
| Path traversal (`../`) | Error: `E_PATH_INVALID` |
| Digest mismatch | Error: `E_DIGEST_MISMATCH` |
