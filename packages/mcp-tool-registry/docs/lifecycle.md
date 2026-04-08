# Lifecycle Policy

We enforce strict lifecycle stages for tools to ensure reliable consumption.

## Stages

### 1. Active

Tools are considered **Active** by default. Consumers can rely on them being available and maintained (to the extent of the repo owner).

### 2. Deprecated

A tool is **Deprecated** when it is no longer recommended for new use, but still exists in the registry.

- **Why?** Replaced by a better tool, repo archived, or critical security flaw unpatched.
- **Consumer Action**: Warn users but allow install.

**How to deprecate:**
Add the following fields to the tool entry in `registry.json`:

```json
{
  "id": "old-tool",
  ...
  "deprecated": true,
  "deprecated_at": "2026-02-15T12:00:00Z",
  "sunset_at": "2027-02-15T12:00:00Z",
  "deprecation_reason": "Replaced by new-tool-v2"
}
```

Fields:

- `deprecated`: boolean (Required)
- `deprecation_reason`: string (Required)
- `deprecated_at`: ISO 8601 date (Required) - When the deprecation was effective.
- `sunset_at`: ISO 8601 date (Optional) - When the tool will be removed from the registry.

**Sunset Policy:**

- Deprecated tools remain in the registry indefinitely unless `sunset_at` is specified.
- If `sunset_at` is set, the tool is guaranteed to remain available until that date.
- After `sunset_at`, the tool may be moved to the `archived` list.

### 3. Removed (Archived)

A tool is **Removed** when it is deleted from the `tools` array.

- **Why?** Malware, legal takedown, or completely broken.
- **Consumer Action**: Tool is gone. `mcpt install` will fail.
- **Record**: Check `archived` array in `registry.json` (optional historical record).

## Policy Logic

Our CI enforces:

- If `"deprecated": true` is present, `"deprecation_reason"` is **required**.
- IDs of removed tools are permanently retired (do not reuse).
