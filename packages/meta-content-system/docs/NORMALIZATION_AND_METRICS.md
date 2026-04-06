# Normalization and Metrics (Locked for parity)

Both platforms MUST produce identical output for identical input.
This document is the single source of truth. Changes require a version bump.

## Normalization (non-destructive)

- Read as UTF-8; if invalid, replace invalid sequences deterministically (lossy).
- Convert all `\r\n` to `\n`, then all remaining bare `\r` to `\n`.
- Do NOT trim lines, collapse spaces, or convert tabs to spaces.
- Ensure a trailing `\n` exists (append if missing). Do NOT collapse existing trailing newlines.
- Normalization is idempotent: normalizing already-normalized code produces the same output.

## Metrics

All metrics are computed from the normalized `code` string.

### lines (int)

`lines = count('\n') + 1`

- `""` (empty string) => `1`
- `"a\n"` => `2`
- `"a\nb\n"` => `3`

### characters (int)

Total character count of the normalized string, including all whitespace and the trailing newline.

### maxIndentDepth (int)

For each line, count leading indent columns:
- Tab (U+0009) = **4 columns**
- Space (U+0020) = **1 column**
- Mixed: count tabs first (each = 4 cols), then remaining spaces (each = 1 col)

`depth = floor(columns / 4)`

`maxIndentDepth` = maximum depth across all lines.

Empty lines (only `\n`) have depth 0 and do not affect the maximum.

### symbolDensity (float)

```
symbolDensity = symbolCharCount / nonWhitespaceCharCount
```

**nonWhitespaceCharCount** excludes: space (U+0020), tab (U+0009), newline (U+000A).

**symbolCharCount** counts characters from this exact frozen set (29 chars):

```
{ } [ ] ( ) < > ; : , . = + - * / % ! & | ^ ~ ? @ # \ " '
```

Edge case: if `nonWhitespaceCharCount == 0`, then `symbolDensity = 0.0`.

Store as `float`. Do not round for storage.
