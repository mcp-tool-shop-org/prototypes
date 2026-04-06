# Snippet Pack Schema (JSON)

Each file in `assets/snippets/*.json` (built-in) or `~/.config/linux-dev-typer/packs/*.json` (user) is a JSON array of snippets.

## Required Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Non-empty, unique within pack |
| `language` | string | Non-empty, should match filename |
| `difficulty` | int | 1-7 |
| `code` | string | Non-empty |

## Optional Fields

| Field | Type | Default |
|-------|------|---------|
| `title` | string | `""` |
| `topics` | string[] | `[]` |
| `explain` | string[] | `[]` |
| `notes` | string[]? | `null` |
| `communityDifficulty` | double? | `null` |
| `scaffold` | string[]? | `null` |
| `variants` | string[]? | `null` |

### Notes

`notes` carries optional tips, alternatives, and perspectives from shared packs. Unlike `explain` (which is factual), notes represent multiple viewpoints that coexist without endorsement.

- Anonymous by design — no author or source metadata
- Travels in `.ldtpack` bundles (format v2+)
- Can be toggled off independently in the sidebar
- Uses neutral language: "Some prefer...", "An alternative approach..."

### Scaffold

`scaffold` provides progressive learning context for a snippet. Unlike `explain` (factual one-liners) or `notes` (community perspectives), scaffold layers offer observational depth that the user controls.

- Index 0: shallow hint — always visible when scaffolds are shown
- Index 1+: deeper context — behind a "More context" expander
- Observational language: "This pattern..." not "You should..."
- Travels in `.ldtpack` bundles (format v3)
- Can be toggled off independently in the sidebar

### Variants

`variants` provides alternative implementations of the same logic. Each entry is a self-contained code snippet showing a different valid approach. All variants are structural equals — no ranking, no "preferred" indicator.

- Demonstrates breadth: multiple ways to solve the same problem
- Displayed in monospace as code blocks
- Travels in `.ldtpack` bundles (format v3)
- Can be toggled off independently in the sidebar

## Recommendations

- Code should end with `\n`
- Use LF newlines in the `code` field
- Keep snippets 10-30 lines for optimal practice sessions
- Vary difficulty levels within a pack

## Example

```json
[
  {
    "id": "py-list-comp-001",
    "language": "python",
    "difficulty": 3,
    "title": "List comprehension with filter",
    "code": "evens = [x for x in range(20) if x % 2 == 0]\nprint(evens)\n",
    "topics": ["list-comprehension", "filter"],
    "explain": ["List comprehensions combine creation and filtering in one expression."],
    "notes": ["Some prefer generator expressions for large sequences.", "An alternative: filter(lambda x: x % 2 == 0, range(20))"],
    "scaffold": ["This uses a list comprehension with a conditional filter.", "List comprehensions evolved from set-builder notation in mathematics. The if clause acts as a filter, evaluated for each element."],
    "variants": ["evens = list(filter(lambda x: x % 2 == 0, range(20)))", "evens = []\nfor x in range(20):\n    if x % 2 == 0:\n        evens.append(x)"]
  }
]
```

See `docs/v0.6.0-authorship.md` for a complete guide to creating user packs.
