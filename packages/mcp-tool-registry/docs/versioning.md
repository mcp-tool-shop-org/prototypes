# Versioning Policy

## Registry Schema Versioning

The `registry.json` file contains a `schema_version` field (e.g., `"0.2"`). This version dictates the structure of the registry data.

### When to Bump

| Change Type | Action             | Example                                                       |
| :---------- | :----------------- | :------------------------------------------------------------ |
| **Patch**   | No bump            | adding a tool, fixing a typo                                  |
| **Minor**   | Bump `0.x` → `0.y` | Adding an optional field, non-breaking schema relaxation      |
| **Major**   | Bump `x.0` → `y.0` | Renaming required fields, removing fields, structural changes |

## Tool Versioning

Tools listed in the registry are versioned independently. The registry points to a `default_ref` (branch or tag) for each tool.

- We recommend pinning tools to specific tags in your local environment for stability.
- The registry strives to point to stable default branches (`main`) by default.
