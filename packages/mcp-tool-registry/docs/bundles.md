# Bundle Rules

Bundles in this registry are **generated** from rule files, not maintained by hand.

## Rule Format

Rule files live in `bundles/rules/*.rules.json`.

```json
{
  "name": "agents",
  "description": "Agentic workflows and tools",
  "rules": [
    {
      "tags": ["agents", "ai"],
      "operator": "OR"
    }
  ],
  "exclude": {
    "deprecated": true
  }
}
```

## Logic

A tool is included in a bundle if it matches **ANY** of the rule blocks.

Within a rule block:

- **`tags`**: Tool must have ANY of these tags (if operator is OR) or ALL (if operator is AND).
- **`ids`**: Specific tool IDs to always include (whitelist).
- **`ecosystem`**: Matches specific ecosystem field.

Exclusion takes precedence:

- **`deprecated: true`**: Excludes the tool if it is deprecated.
- **`ids`**: Specific tool IDs to always exclude.

## Updating Bundles

1. **Modify the rule file** (`bundles/rules/*.rules.json`).
2. Run `npm run bundles:build`.
3. Commit the changes to the rule file AND the generated `.json` bundle.
